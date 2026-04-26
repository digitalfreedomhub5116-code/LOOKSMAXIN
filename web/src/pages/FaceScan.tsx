import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { analyzeFace } from '../lib/api';
import type { FaceScores } from '../lib/api';

type Stage = 'camera' | 'analyzing' | 'results' | 'error' | 'no_face';

interface FaceScanProps {
  onClose: () => void;
  onResults?: (scores: FaceScores, faceImage: string) => void;
}

function getBarColor(s: number) {
  if (s >= 85) return '#22C55E';
  if (s >= 70) return '#C8A84E';
  if (s >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function FaceScan({ onClose, onResults }: FaceScanProps) {
  const [stage, setStage] = useState<Stage>('camera');
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions and reload.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startCamera]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    streamRef.current?.getTracks().forEach(t => t.stop());

    setStage('analyzing');
    setError('');

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      setCapturedImage(base64);

      const result = await analyzeFace(base64, 'image/jpeg');
      setScores(result);
      setStage('results');
      if (onResults) onResults(result, base64);
    } catch (e: any) {
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

  // ─── NO FACE DETECTED ───
  if (stage === 'no_face') {
    return (
      <div className="analyzing-overlay">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="#EF4444" strokeWidth="2" />
          </svg>
        </div>
        <div className="h2" style={{ color: '#F59E0B', marginBottom: 6 }}>No Face Detected</div>
        <div className="label" style={{ maxWidth: 260, textAlign: 'center', lineHeight: 1.6 }}>
          Make sure your face is clearly visible, well-lit, and centered.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={handleClose}><ArrowLeft size={14} /> Back</button>
          <button className="btn btn-primary" onClick={() => { setStage('camera'); startCamera(); }}>Try Again</button>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (stage === 'error') {
    return (
      <div className="analyzing-overlay">
        <AlertTriangle size={48} color="#EF4444" />
        <div className="h2" style={{ color: '#EF4444' }}>Analysis Failed</div>
        <div className="label" style={{ maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>{error}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={handleClose}><ArrowLeft size={14} /> Back</button>
          <button className="btn btn-primary" onClick={() => { setStage('camera'); startCamera(); }}>Try Again</button>
        </div>
      </div>
    );
  }

  // ─── ANALYZING ───
  if (stage === 'analyzing') {
    return (
      <div className="analyzing-overlay">
        <div className="pulse-ring" />
        <div className="h2">Analyzing your features...</div>
        <div className="label">Lynx AI is scanning your facial structure</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  RESULTS — FULL LYNX REPORT (matching ref)
  // ═══════════════════════════════════════════
  if (stage === 'results' && scores) {
    const tier = scores.overall_rating || (
      scores.overall >= 90 ? 'Gigachad' : scores.overall >= 80 ? 'Chad' :
      scores.overall >= 65 ? 'Above Average' : scores.overall >= 50 ? 'Average' : 'Below Average'
    );
    const tierColor = scores.overall >= 80 ? '#C8A84E' : scores.overall >= 65 ? '#22C55E' :
      scores.overall >= 50 ? '#F59E0B' : '#EF4444';

    const TRAIT_LIST = scores.traits ? Object.entries(scores.traits).map(([key, t]) => ({
      key, label: key.charAt(0).toUpperCase() + key.slice(1), ...t,
    })) : [];

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200, background: '#000',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Scrollable report body */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 0 24px' }}>

            {/* ── Header ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
              background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
            }}>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                <ArrowLeft size={18} /> Back
              </button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Lynx Report</div>
              <button onClick={() => { setStage('camera'); startCamera(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <RefreshCw size={16} color="var(--text-muted)" />
              </button>
            </div>

            {/* ── B&W Face Photo ── */}
            {capturedImage && (
              <div style={{ width: '100%', aspectRatio: '3/4', maxHeight: 360, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={`data:image/jpeg;base64,${capturedImage}`}
                  alt="Your face"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', display: 'block' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #000)' }} />
              </div>
            )}

            {/* ── Overall Score ── */}
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 8 }}>
                OVERALL LYNX SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: tierColor, lineHeight: 1 }}>{scores.overall}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: tierColor, marginBottom: 12 }}>{tier}</div>

              {scores.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
                  {scores.description}
                </p>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 24 }}>
                Potential: {scores.potential}/100
              </div>
            </div>

            {/* ── Trait Breakdown ── */}
            {TRAIT_LIST.length > 0 && (
              <div style={{ padding: '0 24px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
                  Trait Breakdown
                </div>
                {TRAIT_LIST.map(t => (
                  <div key={t.key} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                    </div>
                    {/* Colored progress bar */}
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${t.score}%`, background: getBarColor(t.score), transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: getBarColor(t.score), marginBottom: 10 }}>
                      {t.rating}
                    </div>
                    {t.holding_back && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 3 }}>What's holding you back</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>{t.holding_back}</p>
                      </>
                    )}
                    {t.fix_it && (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 3 }}>Fix it</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{t.fix_it}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Top Recommendations ── */}
            {(scores.recommendations || scores.tips)?.length > 0 && (
              <div style={{ padding: '8px 24px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
                  Top Recommendations
                </div>
                {(scores.recommendations || scores.tips).map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, marginBottom: 16, paddingLeft: 14,
                    borderLeft: '3px solid var(--primary)',
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', minWidth: 20 }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky bottom: Rescan + Continue ── */}
        <div style={{
          padding: '16px 24px', paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          background: 'rgba(0,0,0,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: 12, maxWidth: 430, margin: '0 auto', width: '100%',
        }}>
          <button
            className="btn btn-outline"
            onClick={() => { setStage('camera'); startCamera(); }}
            style={{ flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 12 }}
          >
            Rescan
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClose}
            style={{ flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 12 }}
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
      <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button className="close-btn" onClick={handleClose}><X size={20} /></button>
      <div className="scanner-hud">
        <div className="scan-frame">
          <div className="scan-corner tl" /><div className="scan-corner tr" />
          <div className="scan-corner bl" /><div className="scan-corner br" />
          <div className="scan-line" />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 16px), 16px)', left: 0, right: 0, textAlign: 'center', paddingTop: 48 }}>
        <div className="h3" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Position your face</div>
        <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Center within the frame</div>
      </div>
      {error && (
        <div style={{ position: 'absolute', bottom: 120, left: 20, right: 20, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>
          {error}
        </div>
      )}
      <button className="capture-btn" onClick={capture} />
    </div>
  );
}
