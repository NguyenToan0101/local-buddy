import React, { useEffect, useRef, useState } from 'react';
import { Camera, Circle, Square, Video, X } from 'lucide-react';

export type VerificationCaptureMode =
  | { type: 'id-card'; side: 'front' | 'back' }
  | { type: 'selfie-video' };

interface VerificationCaptureModalProps {
  mode: VerificationCaptureMode | null;
  onClose: () => void;
  onIdCardCaptured: (side: 'front' | 'back', file: File) => void | Promise<void>;
  onSelfieRecorded: (file: File) => void | Promise<void>;
}

const recorderMimeTypes = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm'
];

const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach(track => track.stop());
};

const VerificationCaptureModal: React.FC<VerificationCaptureModalProps> = ({
  mode,
  onClose,
  onIdCardCaptured,
  onSelfieRecorded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!mode) return;

    let cancelled = false;
    setError('');
    setIsRecording(false);
    chunksRef.current = [];

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.');
        return;
      }

      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode.type === 'id-card' ? { ideal: 'environment' } : { ideal: 'user' }
          },
          audio: false
        });

        if (cancelled) {
          stopStream(nextStream);
          return;
        }

        streamRef.current = nextStream;
        setStream(nextStream);
      } catch {
        setError('Unable to access camera. Check browser permissions and try again.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      stopStream(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
      setStream(null);
    };
  }, [mode]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      setError('Unable to start camera preview.');
    });
  }, [stream]);

  if (!mode) return null;

  const captureIdCard = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0 || mode.type !== 'id-card') {
      setError('Camera preview is not ready yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Unable to capture image.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) {
        setError('Unable to capture image.');
        return;
      }
      const file = new File([blob], `id-card-${mode.side}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onClose();
      void onIdCardCaptured(mode.side, file);
    }, 'image/jpeg', 0.92);
  };

  const startRecording = () => {
    if (!streamRef.current) {
      setError('Camera preview is not ready yet.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setError('Video recording is not supported in this browser.');
      return;
    }

    const mimeType = recorderMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
      chunksRef.current = [];
      if (blob.size === 0) {
        setError('Recorded video is empty. Please try again.');
        setIsRecording(false);
        return;
      }
      const file = new File([blob], `selfie-verification-${Date.now()}.webm`, { type: blob.type || 'video/webm' });
      onClose();
      void onSelfieRecorded(file);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancel = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    onClose();
  };

  const title = mode.type === 'id-card'
    ? `Capture ${mode.side === 'front' ? 'front' : 'back'} ID`
    : 'Record face video';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {mode.type === 'id-card' ? <Camera size={18} /> : <Video size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-secondary">{title}</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-secondary/35">
                Use a clear, steady camera view
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancel}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-surface text-secondary/40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-black">
          {error ? (
            <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-xs font-bold text-white/70">
              {error}
            </div>
          ) : (
            <video ref={videoRef} className="aspect-[4/3] w-full object-cover" autoPlay muted playsInline />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {mode.type === 'id-card' ? (
            <button
              type="button"
              onClick={captureIdCard}
              disabled={Boolean(error)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              <Camera size={14} />
              Capture Photo
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 text-[10px] font-black uppercase tracking-widest text-white"
            >
              <Square size={13} fill="currentColor" />
              Stop Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={Boolean(error)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              <Circle size={13} fill="currentColor" />
              Start Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationCaptureModal;
