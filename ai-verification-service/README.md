# AI Verification Service

FastAPI service for OCR and face matching. Spring Boot calls this service over REST, so PaddleOCR and DeepFace stay outside the Java process.

## Run locally

```bash
cd ai-verification-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

Configure Spring Boot:

```env
AI_SERVICE_BASE_URL=http://localhost:8001
```

Optional:

```env
PADDLEOCR_LANG=vi
DOWNLOAD_TIMEOUT_SECONDS=20
MAX_DOWNLOAD_MB=35
ALLOWED_MEDIA_HOSTS=res.cloudinary.com
ANTISPOOF_MODEL_PATH=models/minifasnet_v2.onnx
```

Keep this service on an internal network in production. It downloads media from
URLs supplied by the backend, so do not expose it publicly unless you add an
authentication layer and a strict media host allowlist.

## APIs

- `GET /health`
- `POST /ocr`

```json
{ "imageUrl": "https://res.cloudinary.com/.../front.jpg" }
```

- `POST /face-match`

```json
{
  "idCardImageUrl": "https://res.cloudinary.com/.../front.jpg",
  "selfieImageUrl": "https://res.cloudinary.com/.../selfie.jpg"
}
```

The first run can be slow because PaddleOCR and DeepFace may download model weights.

- `POST /quality`
- `POST /liveness`
- `POST /anti-spoof`

## Anti-spoofing model

The repository includes `models/minifasnet_v2.onnx`, an Apache-2.0 ONNX export
of MiniFASNet-V2 from `minivision-ai/Silent-Face-Anti-Spoofing`.

Source:
`https://huggingface.co/garciafido/minifasnet-v2-anti-spoofing-onnx`

Downloaded files:

- `models/minifasnet_v2.onnx`
- `models/MINIFASNET_LICENSE`
- `models/MINIFASNET_MODEL_CARD.md`

Expected SHA-256:

```text
d7b3cd9ba8a7ceb13baa8c4720902e27ca3112eff52f926c08804af6b6eecc7b
```

Docker Compose mounts `./ai-verification-service/models` to `/models` and sets
`ANTISPOOF_MODEL_PATH=/models/minifasnet_v2.onnx`. If the model path is missing,
the service falls back to a conservative texture/motion heuristic so Spring can
still route risky cases to manual review.
