import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { analyzeFace } from '../lib/api';
import type { FaceScores } from '../lib/api';

type Stage = 'camera' | 'analyzing' | 'results' | 'error' | 'no_face';

interface FaceScanProps {
  onClose: () => void;
  onResults?: (scores: FaceScores, faceImage: string) => void;
}

export default function FaceScan({ onClose, onResults }: FaceScanProps) {
  const [stage, setStage] = useState<Stage>('camera');
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera — low constraints to avoid zoom on mobile
  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions and reload.');
    }
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  // Capture photo and send to Gemini
  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Use the actual video dimensions
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop camera stream
    streamRef.current?.getTracks().forEach(t => t.stop());

    setStage('analyzing');
    setError('');

    try {
      // Convert canvas to base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];

      console.log('Sending image to AI. Base64 length:', base64.length);

      // Call the real Gemini API via server proxy
      const result = await analyzeFace(base64, 'image/jpeg');

      console.log('AI Result received:', result);

      setScores(result);
      setStage('results');

      // Pass results + face image back to parent (Dashboard)
      if (onResults) onResults(result, base64);
    } catch (e: any) {
      console.error('Analysis error:', e);
      if (e.message?.includes('No face detected')) {
        setStage('no_face');
      } else {
        setError(e.message || 'AI analysis failed. Please try again.');
        setStage('error');
      }
    }
  };

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  // ─── NO FACE DETECTED STAGE ───
  if (stage === 'no_face') {
    return (
      <div className="analyzing-overlay">
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="#EF4444" strokeWidth="2" />
          </svg>
        </div>
        <div className="h2" style={{ color: '#F59E0B', marginBottom: 6 }}>No Face Detected</div>
        <div className="label" style={{ maxWidth: 260, textAlign: 'center', lineHeight: 1.6 }}>
          We couldn't find a face in the image. Make sure your face is clearly visible, well-lit, and centered in the frame.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={handleClose}>
            <ArrowLeft size={14} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => { setStage('camera'); startCamera(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── ERROR STAGE ───
  if (stage === 'error') {
    return (
      <div className="analyzing-overlay">
        <AlertTriangle size={48} color="#EF4444" />
        <div className="h2" style={{ color: '#EF4444' }}>Analysis Failed</div>
        <div className="label" style={{ maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
          {error}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={handleClose}>
            <ArrowLeft size={14} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => { setStage('camera'); startCamera(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── ANALYZING STAGE ───
  if (stage === 'analyzing') {
    return (
      <div className="analyzing-overlay">
        <div className="pulse-ring" />
        <div className="h2">Analyzing your features...</div>
        <div className="label">Lynx AI is scanning your facial structure</div>
      </div>
    );
  }

  // ─── RESULTS STAGE ───
  if (stage === 'results' && scores) {
    const tier = scores.overall >= 90 ? 'Gigachad' : scores.overall >= 80 ? 'Chad' :
      scores.overall >= 65 ? 'Above Average' : scores.overall >= 50 ? 'Average' : 'Below Average';
    const tierColor = scores.overall >= 80 ? '#C8A84E' : scores.overall >= 65 ? '#22C55E' :
      scores.overall >= 50 ? '#F59E0B' : '#EF4444';

    return (
      <div className="analyzing-overlay" style={{ padding: 32 }}>
        {/* Score circle */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          border: `3px solid ${tierColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, boxShadow: `0 0 30px ${tierColor}33`,
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: tierColor }}>{scores.overall}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5 }}>/100</span>
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
          {scores.overall_rating || tier}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          Your Lynx Report is ready. View the full breakdown on your dashboard.
        </div>

        {/* Two buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
          <button
            className="btn btn-outline"
            onClick={() => { setStage('camera'); startCamera(); }}
            style={{ flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 700 }}
          >
            Rescan
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClose}
            style={{ flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 700 }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── CAMERA STAGE ───
  return (
    <div className="scanner-view">
      <video
        ref={videoRef}
        className="scanner-video"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <button className="close-btn" onClick={handleClose}>
        <X size={20} />
      </button>

      {/* HUD Overlay */}
      <div className="scanner-hud">
        <div className="scan-frame">
          <div className="scan-corner tl" />
          <div className="scan-corner tr" />
          <div className="scan-corner bl" />
          <div className="scan-corner br" />
          <div className="scan-line" />
        </div>
      </div>

      {/* Info text */}
      <div style={{
        position: 'absolute', top: 'max(env(safe-area-inset-top, 16px), 16px)',
        left: 0, right: 0, textAlign: 'center', paddingTop: 48,
      }}>
        <div className="h3" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          Position your face
        </div>
        <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          Center within the frame
        </div>
      </div>

      {error && (
        <div style={{
          position: 'absolute', bottom: 120, left: 20, right: 20,
          background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 12, padding: '10px 16px', textAlign: 'center', color: '#EF4444',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <button className="capture-btn" onClick={capture} />
    </div>
  );
}
