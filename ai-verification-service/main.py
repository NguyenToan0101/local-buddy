import os
import re
import tempfile
from functools import lru_cache
from typing import Optional
from urllib.parse import urlparse

import cv2
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


app = FastAPI(title="Local Buddy AI Verification Service")

DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("DOWNLOAD_TIMEOUT_SECONDS", "20"))
MAX_DOWNLOAD_MB = int(os.getenv("MAX_DOWNLOAD_MB", "35"))
ALLOWED_MEDIA_HOSTS = {
    host.strip().lower()
    for host in os.getenv("ALLOWED_MEDIA_HOSTS", "res.cloudinary.com").split(",")
    if host.strip()
}
PADDLEOCR_LANG = os.getenv("PADDLEOCR_LANG", "vi")
ANTISPOOF_MODEL_PATH = os.getenv("ANTISPOOF_MODEL_PATH", "models/minifasnet_v2.onnx")


class OcrRequest(BaseModel):
    imageUrl: str


class OcrResponse(BaseModel):
    success: bool
    fullName: Optional[str] = None
    idNumber: Optional[str] = None
    dateOfBirth: Optional[str] = None
    rawText: str = ""
    ocrScore: float = 0.0
    message: str = ""


class FaceMatchRequest(BaseModel):
    idCardImageUrl: str
    selfieImageUrl: str


class FaceMatchResponse(BaseModel):
    success: bool
    score: float
    matched: bool
    message: str


class QualityRequest(BaseModel):
    imageUrl: str


class QualityResponse(BaseModel):
    qualityPassed: bool
    qualityScore: float
    details: dict


class LivenessRequest(BaseModel):
    mediaUrl: str
    challenge: list[str] = ["blink", "left", "right"]


class LivenessResponse(BaseModel):
    livenessPassed: bool
    livenessScore: float
    details: dict


class AntiSpoofRequest(BaseModel):
    mediaUrl: str


class AntiSpoofResponse(BaseModel):
    isSpoof: bool
    spoofScore: float
    details: dict


@lru_cache(maxsize=1)
def get_ocr_engine():
    from paddleocr import PaddleOCR

    return PaddleOCR(use_angle_cls=True, lang=PADDLEOCR_LANG)


@lru_cache(maxsize=1)
def get_face_app():
    try:
        from insightface.app import FaceAnalysis

        app_model = FaceAnalysis(name=os.getenv("INSIGHTFACE_MODEL", "buffalo_l"))
        app_model.prepare(ctx_id=int(os.getenv("INSIGHTFACE_CTX_ID", "-1")))
        return app_model
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_face_mesh():
    import mediapipe as mp

    return mp.solutions.face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )


@lru_cache(maxsize=1)
def get_antispoof_session():
    if ANTISPOOF_MODEL_PATH and os.path.exists(ANTISPOOF_MODEL_PATH):
        import onnxruntime as ort

        return ort.InferenceSession(ANTISPOOF_MODEL_PATH, providers=["CPUExecutionProvider"])
    return None


def download_to_temp(url: str, suffix: str = ".bin") -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Media URL must be an absolute HTTP(S) URL.")

    host = parsed.hostname.lower() if parsed.hostname else ""
    if "*" not in ALLOWED_MEDIA_HOSTS and host not in ALLOWED_MEDIA_HOSTS:
        raise HTTPException(status_code=400, detail=f"Media host is not allowed: {host}")

    max_bytes = MAX_DOWNLOAD_MB * 1024 * 1024
    try:
        response = requests.get(url, timeout=DOWNLOAD_TIMEOUT_SECONDS, stream=True)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Could not download media: {exc}") from exc

    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(fd, "wb") as file:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                downloaded += len(chunk)
                if downloaded > max_bytes:
                    raise HTTPException(status_code=413, detail=f"Media exceeds {MAX_DOWNLOAD_MB}MB limit.")
                file.write(chunk)
    except Exception:
        if os.path.exists(path):
            os.remove(path)
        raise
    return path


def read_image(path: str):
    image = cv2.imread(path)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")
    return image


def parse_cccd(raw_text: str):
    id_match = re.search(r"\b\d{12}\b", raw_text)
    dob_match = re.search(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b", raw_text)
    ignored_keywords = {
        "identity", "citizen", "card", "socialist", "republic", "vietnam",
        "nationality", "date", "birth", "sex", "place", "origin", "residence",
        "expiry", "no", "căn", "cước", "công", "dân", "quốc", "tịch", "sinh",
    }
    full_name = None
    for line in raw_text.splitlines():
        normalized = line.strip()
        if len(normalized) < 5 or re.search(r"\d", normalized):
            continue
        lower = normalized.lower()
        if any(keyword in lower for keyword in ignored_keywords):
            continue
        if normalized.upper() == normalized or len(normalized.split()) >= 2:
            full_name = normalized
            break
    return full_name, id_match.group(0) if id_match else None, dob_match.group(0) if dob_match else None


def image_quality_metrics(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = float(np.mean(gray))
    too_dark = brightness < 55
    too_bright = brightness > 210
    blurry = blur < 80

    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = gray.shape
    largest_area_ratio = 0.0
    skew_degrees = 0.0
    corners_detected = False
    if contours:
        contour = max(contours, key=cv2.contourArea)
        largest_area_ratio = cv2.contourArea(contour) / float(w * h)
        rect = cv2.minAreaRect(contour)
        skew_degrees = abs(float(rect[-1]))
        if skew_degrees > 45:
            skew_degrees = abs(90 - skew_degrees)
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * peri, True)
        corners_detected = len(approx) >= 4 and largest_area_ratio > 0.25

    score = 100.0
    if blurry:
        score -= 30
    if too_dark or too_bright:
        score -= 25
    if skew_degrees > 15:
        score -= 15
    if not corners_detected:
        score -= 20

    return max(0.0, min(100.0, score)), {
        "blurVariance": round(float(blur), 2),
        "brightness": round(brightness, 2),
        "blurry": blurry,
        "tooDark": too_dark,
        "tooBright": too_bright,
        "skewDegrees": round(skew_degrees, 2),
        "cornersDetected": corners_detected,
        "largestDocumentAreaRatio": round(largest_area_ratio, 3),
    }


def extract_frames(path: str, max_frames: int = 90):
    capture = cv2.VideoCapture(path)
    frames = []
    if capture.isOpened():
        total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        step = max(1, total // max_frames) if total else 5
        idx = 0
        while len(frames) < max_frames:
            ok, frame = capture.read()
            if not ok:
                break
            if idx % step == 0:
                frames.append(frame)
            idx += 1
        capture.release()
    if not frames:
        image = cv2.imread(path)
        if image is not None:
            frames.append(image)
    return frames


def point(landmarks, idx, width, height):
    lm = landmarks[idx]
    return np.array([lm.x * width, lm.y * height])


def eye_aspect_ratio(landmarks, width, height, ids):
    p = [point(landmarks, idx, width, height) for idx in ids]
    vertical = np.linalg.norm(p[1] - p[5]) + np.linalg.norm(p[2] - p[4])
    horizontal = 2.0 * np.linalg.norm(p[0] - p[3])
    return vertical / horizontal if horizontal else 0.0


def liveness_from_frames(frames, challenge):
    mesh = get_face_mesh()
    blink_count = 0
    eye_closed = False
    left_turn = False
    right_turn = False
    face_frames = 0
    last_yaw = 0.0

    for frame in frames:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = mesh.process(rgb)
        if not result.multi_face_landmarks:
            continue
        face_frames += 1
        landmarks = result.multi_face_landmarks[0].landmark
        h, w = frame.shape[:2]
        left_ear = eye_aspect_ratio(landmarks, w, h, [33, 160, 158, 133, 153, 144])
        right_ear = eye_aspect_ratio(landmarks, w, h, [362, 385, 387, 263, 373, 380])
        ear = (left_ear + right_ear) / 2.0
        if ear < 0.19 and not eye_closed:
            eye_closed = True
        elif ear > 0.24 and eye_closed:
            blink_count += 1
            eye_closed = False

        nose = point(landmarks, 1, w, h)
        left_cheek = point(landmarks, 234, w, h)
        right_cheek = point(landmarks, 454, w, h)
        center_x = (left_cheek[0] + right_cheek[0]) / 2.0
        face_width = max(1.0, abs(right_cheek[0] - left_cheek[0]))
        last_yaw = (nose[0] - center_x) / face_width
        left_turn = left_turn or last_yaw > 0.12
        right_turn = right_turn or last_yaw < -0.12

    required = {
        "blink": "blink" in challenge,
        "left": "left" in challenge,
        "right": "right" in challenge,
    }
    blink_pass = blink_count >= 2 if required["blink"] else True
    left_pass = left_turn if required["left"] else True
    right_pass = right_turn if required["right"] else True
    score = 0.0
    score += 35.0 if blink_pass else min(blink_count * 12.0, 24.0)
    score += 25.0 if left_pass else 0.0
    score += 25.0 if right_pass else 0.0
    score += 15.0 if face_frames >= max(3, len(frames) * 0.3) else 0.0
    return max(0.0, min(100.0, score)), {
        "blinkDetected": blink_pass,
        "blinkCount": blink_count,
        "leftTurnDetected": left_pass,
        "rightTurnDetected": right_pass,
        "faceFrames": face_frames,
        "sampledFrames": len(frames),
        "lastYaw": round(last_yaw, 3),
    }


def crop_face_for_antispoof(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = get_face_mesh().process(rgb)
    if not result.multi_face_landmarks:
        return None, {"faceDetected": False}

    h, w = frame.shape[:2]
    landmarks = result.multi_face_landmarks[0].landmark
    xs = [lm.x * w for lm in landmarks]
    ys = [lm.y * h for lm in landmarks]
    x1, x2 = min(xs), max(xs)
    y1, y2 = min(ys), max(ys)
    box_w = max(1.0, x2 - x1)
    box_h = max(1.0, y2 - y1)
    side = max(box_w, box_h) * 2.7
    cx = (x1 + x2) / 2.0
    cy = (y1 + y2) / 2.0

    left = max(0, int(cx - side / 2.0))
    top = max(0, int(cy - side / 2.0))
    right = min(w, int(cx + side / 2.0))
    bottom = min(h, int(cy + side / 2.0))
    if right <= left or bottom <= top:
        return None, {"faceDetected": True, "cropValid": False}

    return frame[top:bottom, left:right], {
        "faceDetected": True,
        "cropValid": True,
        "cropBox": [left, top, right, bottom],
        "scale": 2.7,
    }


def antispoof_heuristic(frames):
    if not frames:
        return 100.0, {"reason": "No frames decoded", "model": "heuristic"}
    gray_values = []
    blur_values = []
    for frame in frames[:30]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_values.append(float(np.mean(gray)))
        blur_values.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))
    motion = float(np.std(gray_values))
    avg_blur = float(np.mean(blur_values))
    spoof_score = 50.0
    if motion < 2.0:
        spoof_score += 25.0
    if avg_blur < 60.0:
        spoof_score += 15.0
    if len(frames) <= 1:
        spoof_score += 10.0
    spoof_score = max(0.0, min(100.0, spoof_score))
    return spoof_score, {
        "model": "heuristic",
        "motionStd": round(motion, 2),
        "avgBlur": round(avg_blur, 2),
        "note": "Set ANTISPOOF_MODEL_PATH to use a mounted MiniFASNet/Silent-Face ONNX model.",
    }


def antispoof_score(frames):
    session = get_antispoof_session()
    if session and frames:
        frame = frames[len(frames) // 2]
        face_crop, crop_details = crop_face_for_antispoof(frame)
        if face_crop is None:
            return 100.0, {
                "model": "minifasnet_v2_onnx",
                "modelPath": ANTISPOOF_MODEL_PATH,
                "reason": "Face not detected for anti-spoofing.",
                **crop_details,
            }

        resized = cv2.resize(face_crop, (80, 80))
        input_tensor = resized.astype(np.float32) / 255.0
        input_tensor = np.transpose(input_tensor, (2, 0, 1))[np.newaxis, :]
        input_name = session.get_inputs()[0].name
        output = session.run(None, {input_name: input_tensor})[0].flatten()
        exp = np.exp(output - np.max(output))
        probs = exp / np.sum(exp)
        live_probability = float(probs[0])
        print_probability = float(probs[1]) if probs.size > 1 else 0.0
        replay_probability = float(probs[2]) if probs.size > 2 else 0.0
        spoof_probability = print_probability + replay_probability
        return spoof_probability * 100.0, {
            "model": "minifasnet_v2_onnx",
            "modelPath": ANTISPOOF_MODEL_PATH,
            "liveProbability": round(live_probability, 4),
            "printProbability": round(print_probability, 4),
            "replayProbability": round(replay_probability, 4),
            "rawOutput": output.tolist(),
            **crop_details,
        }
    return antispoof_heuristic(frames)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr", response_model=OcrResponse)
def ocr(request: OcrRequest):
    image_path = download_to_temp(request.imageUrl, ".jpg")
    try:
        result = get_ocr_engine().ocr(image_path, cls=True)
        lines = []
        for page in result or []:
            for item in page or []:
                if len(item) >= 2 and item[1]:
                    lines.append(str(item[1][0]).strip())
        raw_text = "\n".join(line for line in lines if line)
        full_name, id_number, date_of_birth = parse_cccd(raw_text)
        ocr_score = 0.0
        ocr_score += 40.0 if id_number else 0.0
        ocr_score += 30.0 if full_name else 0.0
        ocr_score += 30.0 if date_of_birth else 0.0
        return OcrResponse(
            success=bool(raw_text),
            fullName=full_name,
            idNumber=id_number,
            dateOfBirth=date_of_birth,
            rawText=raw_text,
            ocrScore=ocr_score,
            message="OCR completed" if raw_text else "No text detected",
        )
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)


@app.post("/face-match", response_model=FaceMatchResponse)
def face_match(request: FaceMatchRequest):
    id_card_path = download_to_temp(request.idCardImageUrl, ".jpg")
    selfie_path = download_to_temp(request.selfieImageUrl, ".jpg")
    try:
        app_model = get_face_app()
        if app_model:
            img1 = cv2.imread(id_card_path)
            img2 = cv2.imread(selfie_path)
            faces1 = app_model.get(img1)
            faces2 = app_model.get(img2)
            if not faces1 or not faces2:
                return FaceMatchResponse(success=False, score=0.0, matched=False, message="Face not detected.")
            emb1 = faces1[0].embedding
            emb2 = faces2[0].embedding
            similarity = float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2)))
            score = max(0.0, min(100.0, (similarity + 1.0) * 50.0))
            return FaceMatchResponse(
                success=True,
                score=round(score, 2),
                matched=score >= 70.0,
                message=f"InsightFace cosine_similarity={similarity:.4f}",
            )

        from deepface import DeepFace

        result = DeepFace.verify(img1_path=id_card_path, img2_path=selfie_path, enforce_detection=True)
        verified = bool(result.get("verified"))
        distance = float(result.get("distance", 1.0))
        threshold = float(result.get("threshold", 0.4))
        score = max(0.0, min(100.0, (1.0 - (distance / max(threshold * 2.0, 0.001))) * 100.0))
        return FaceMatchResponse(
            success=True,
            score=round(score, 2),
            matched=verified,
            message=f"DeepFace distance={distance:.4f}, threshold={threshold:.4f}",
        )
    except Exception as exc:
        return FaceMatchResponse(success=False, score=0.0, matched=False, message=f"Face matching failed: {exc}")
    finally:
        for path in (id_card_path, selfie_path):
            if os.path.exists(path):
                os.remove(path)


@app.post("/quality", response_model=QualityResponse)
def quality(request: QualityRequest):
    path = download_to_temp(request.imageUrl, ".jpg")
    try:
        score, details = image_quality_metrics(read_image(path))
        return QualityResponse(qualityPassed=score >= 70.0, qualityScore=round(score, 2), details=details)
    finally:
        if os.path.exists(path):
            os.remove(path)


@app.post("/liveness", response_model=LivenessResponse)
def liveness(request: LivenessRequest):
    path = download_to_temp(request.mediaUrl, ".mp4")
    try:
        frames = extract_frames(path)
        score, details = liveness_from_frames(frames, request.challenge)
        return LivenessResponse(livenessPassed=score >= 70.0, livenessScore=round(score, 2), details=details)
    finally:
        if os.path.exists(path):
            os.remove(path)


@app.post("/anti-spoof", response_model=AntiSpoofResponse)
def anti_spoof(request: AntiSpoofRequest):
    path = download_to_temp(request.mediaUrl, ".mp4")
    try:
        frames = extract_frames(path)
        spoof_score, details = antispoof_score(frames)
        return AntiSpoofResponse(isSpoof=spoof_score >= 65.0, spoofScore=round(spoof_score, 2), details=details)
    finally:
        if os.path.exists(path):
            os.remove(path)
