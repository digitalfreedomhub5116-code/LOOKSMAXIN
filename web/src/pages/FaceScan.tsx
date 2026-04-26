import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowLeft, Lightbulb, AlertTriangle } from 'lucide-react';
import { analyzeFace } from '../lib/api';
import type { FaceScores } from '../lib/api';

type Stage = 'camera' | 'analyzing' | 'results' | 'error' | 'no_face';

const METRICS = [
  { key: 'jawline', label: 'Jawline', color: '#8ea1bc' },
  { key: 'skin_quality', label: 'Skin Quality', color: '#7B2CBF' },
  { key: 'eyes', label: 'Eyes', color: '#5CE1E6' },
  { key: 'facial_symmetry', label: 'Symmetry', color: '#22C55E' },
  { key: 'lips', label: 'Lips', color: '#F59E0B' },
  { key: 'hair_quality', label: 'Hair', color: '#EF4444' },
];

interface FaceScanProps {
  onClose: () => void;
  onResults?: (scores: FaceScores) => void;
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

      // Pass results back to parent (Dashboard)
      if (onResults) onResults(result);
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
    return (
      <div className="results-page">
        <div className="results-header">
          <div className="score-ring" style={{ margin: '0 auto 20px' }}>
            <span className="value">{scores.overall}</span>
            <span className="label">OVERALL</span>
          </div>
          <div className="h1" style={{ marginBottom: 4 }}>Analysis Complete</div>
          <div className="label">Powered by Gemini AI • Personalized assessment</div>
        </div>

        {/* Metrics */}
        <div className="glass-card" style={{ padding: 18, marginBottom: 20 }}>
          {METRICS.map(m => (
            <div className="metric-row" key={m.key}>
              <span className="metric-label">{m.label}</span>
              <div className="metric-track">
                <div
                  className="metric-fill"
                  style={{ width: `${(scores as any)[m.key]}%`, background: m.color }}
                />
              </div>
              <span className="metric-score" style={{ color: m.color }}>
                {(scores as any)[m.key]}
              </span>
            </div>
          ))}
        </div>

        {/* Potential */}
        <div className="glass" style={{ padding: 16, marginBottom: 20 }}>
          <div className="label-xs" style={{ marginBottom: 8 }}>POTENTIAL GAIN</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22C55E' }}>
            +{scores.potential} pts
          </div>
          <div className="label" style={{ marginTop: 4 }}>with consistent improvement</div>
        </div>

        {/* Tips */}
        {scores.tips && scores.tips.length > 0 && (
          <div className="glass-card" style={{ padding: 18, marginBottom: 20 }}>
            <div className="h3" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={14} color="#5CE1E6" /> AI Recommendations
            </div>
            {scores.tips.map((tip, i) => (
              <div className="tip-row" key={i}>
                <span className="tip-icon">→</span>
                <span className="tip-text">{tip}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={handleClose} style={{ flex: 1 }}>
            <ArrowLeft size={14} /> Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => { setStage('camera'); startCamera(); }} style={{ flex: 1 }}>
            Scan Again
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
