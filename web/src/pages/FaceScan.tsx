import { useState, useRef, useCallback } from 'react';
import { X, ArrowLeft, Lightbulb } from 'lucide-react';
import { analyzeFace } from '../lib/api';
import type { FaceScores } from '../lib/api';

type Stage = 'camera' | 'analyzing' | 'results';

const METRICS = [
  { key: 'jawline', label: 'Jawline', color: '#8ea1bc' },
  { key: 'skin_quality', label: 'Skin Quality', color: '#7B2CBF' },
  { key: 'eyes', label: 'Eyes', color: '#5CE1E6' },
  { key: 'facial_symmetry', label: 'Symmetry', color: '#22C55E' },
  { key: 'lips', label: 'Lips', color: '#F59E0B' },
  { key: 'hair_quality', label: 'Hair', color: '#EF4444' },
];

export default function FaceScan({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('camera');
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  // Capture photo
  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    // Stop camera
    streamRef.current?.getTracks().forEach(t => t.stop());

    setStage('analyzing');

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      const result = await analyzeFace(base64);
      setScores(result);
      setStage('results');
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
      setStage('camera');
      startCamera();
    }
  };

  // Initialize camera on mount
  useState(() => { startCamera(); });

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  };

  if (stage === 'analyzing') {
    return (
      <div className="analyzing-overlay">
        <div className="pulse-ring" />
        <div className="h2">Analyzing your features...</div>
        <div className="label">AI is scanning facial structure</div>
      </div>
    );
  }

  if (stage === 'results' && scores) {
    return (
      <div className="results-page">
        <div className="results-header">
          <div className="score-ring" style={{ margin: '0 auto 20px' }}>
            <span className="value">{scores.overall}</span>
            <span className="label">OVERALL</span>
          </div>
          <div className="h1" style={{ marginBottom: 4 }}>Analysis Complete</div>
          <div className="label">Your personalized facial assessment</div>
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

  // Camera stage
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
