import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowLeft, AlertTriangle, RefreshCw, ChevronRight, Camera, RotateCcw } from 'lucide-react';
import { analyzeFace } from '../lib/api';
import type { FaceScores } from '../lib/api';

type Stage = 'front_camera' | 'front_review' | 'side_camera' | 'side_review' | 'analyzing' | 'results' | 'error' | 'no_face';

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
  const [stage, setStage] = useState<Stage>('front_camera');
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
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

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    return dataUrl.split(',')[1];
  };

  const captureFront = () => {
    const img = capturePhoto();
    if (!img) return;
    setFrontImage(img);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStage('front_review');
  };

  const captureSide = () => {
    const img = capturePhoto();
    if (!img) return;
    setSideImage(img);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setStage('side_review');
  };

  const retakeFront = () => {
    setFrontImage(null);
    setStage('front_camera');
    startCamera();
  };

  const retakeSide = () => {
    setSideImage(null);
    setStage('side_camera');
    startCamera();
  };

  const proceedToSide = () => {
    setStage('side_camera');
    startCamera();
  };

  const startAnalysis = async () => {
    if (!frontImage || !sideImage) return;
    setStage('analyzing');
    setError('');

    try {
      const result = await analyzeFace(frontImage, sideImage, 'image/jpeg');
      setScores(result);
      setStage('results');
      if (onResults) onResults(result, frontImage);
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

  const restartScan = () => {
    setFrontImage(null);
    setSideImage(null);
    setScores(null);
    setStage('front_camera');
    startCamera();
  };

  // Step indicator
  const currentStep = stage.startsWith('front') ? 1 : stage.startsWith('side') ? 2 : stage === 'analyzing' ? 3 : 0;

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
          <button className="btn btn-primary" onClick={restartScan}>Try Again</button>
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
          <button className="btn btn-primary" onClick={restartScan}>Try Again</button>
        </div>
      </div>
    );
  }

  // ─── ANALYZING ───
  if (stage === 'analyzing') {
    return (
      <div className="analyzing-overlay">
        {/* Show both captured photos */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {frontImage && (
            <div style={{ width: 80, height: 100, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--primary)' }}>
              <img src={`data:image/jpeg;base64,${frontImage}`} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
            </div>
          )}
          {sideImage && (
            <div style={{ width: 80, height: 100, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--primary)' }}>
              <img src={`data:image/jpeg;base64,${sideImage}`} alt="Side" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} />
            </div>
          )}
        </div>
        <div className="pulse-ring" />
        <div className="h2">Analyzing your features...</div>
        <div className="label" style={{ maxWidth: 260, textAlign: 'center' }}>Lynx AI is scanning both angles for maximum accuracy</div>
      </div>
    );
  }

  // ─── FRONT REVIEW ───
  if (stage === 'front_review' && frontImage) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <StepBar step={1} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--primary)', marginBottom: 8 }}>FRONT PHOTO</div>
          <div style={{ width: 200, height: 260, borderRadius: 16, overflow: 'hidden', border: '2px solid var(--primary)', marginBottom: 24 }}>
            <img src={`data:image/jpeg;base64,${frontImage}`} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Looking good! ✓</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, textAlign: 'center' }}>Now let's capture your side profile for better accuracy</div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
            <button onClick={retakeFront} style={{
              flex: 1, padding: '14px 0', borderRadius: 12, border: '1px solid var(--border)',
              background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <RotateCcw size={16} /> Retake
            </button>
            <button onClick={proceedToSide} style={{
              flex: 2, padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'var(--primary)', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 0 20px rgba(200,168,78,0.3)',
            }}>
              Side Profile <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SIDE REVIEW ───
  if (stage === 'side_review' && sideImage) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <StepBar step={2} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--primary)', marginBottom: 8 }}>BOTH ANGLES CAPTURED</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 130, height: 170, borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(200,168,78,0.3)' }}>
                <img src={`data:image/jpeg;base64,${frontImage}`} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginTop: 6 }}>FRONT</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 130, height: 170, borderRadius: 14, overflow: 'hidden', border: '2px solid var(--primary)' }}>
                <img src={`data:image/jpeg;base64,${sideImage}`} alt="Side" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginTop: 6 }}>SIDE</div>
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Ready for analysis</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Both angles captured successfully</div>
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
            <button onClick={retakeSide} style={{
              flex: 1, padding: '14px 0', borderRadius: 12, border: '1px solid var(--border)',
              background: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <RotateCcw size={16} /> Retake
            </button>
            <button onClick={startAnalysis} style={{
              flex: 2, padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'var(--primary)', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 0 20px rgba(200,168,78,0.3)',
            }}>
              Analyze Now ⚡
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  RESULTS — FULL LYNX REPORT
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
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 0 24px' }}>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10,
              background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
            }}>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                <ArrowLeft size={18} /> Back
              </button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Lynx Report</div>
              <button onClick={restartScan} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <RefreshCw size={16} color="var(--text-muted)" />
              </button>
            </div>

            {/* Both photos side by side */}
            {frontImage && sideImage && (
              <div style={{ display: 'flex', gap: 0, width: '100%', maxHeight: 280, overflow: 'hidden', position: 'relative' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <img src={`data:image/jpeg;base64,${frontImage}`} alt="Front" style={{ width: '100%', height: 280, objectFit: 'cover', filter: 'grayscale(100%)', display: 'block' }} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <img src={`data:image/jpeg;base64,${sideImage}`} alt="Side" style={{ width: '100%', height: 280, objectFit: 'cover', filter: 'grayscale(100%)', display: 'block' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #000)' }} />
                {/* Labels */}
                <div style={{ position: 'absolute', bottom: 12, left: 16, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--primary)' }}>FRONT</div>
                <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--primary)' }}>SIDE</div>
              </div>
            )}

            {/* Overall Score */}
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 8 }}>OVERALL LYNX SCORE</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 900, color: tierColor, lineHeight: 1 }}>{scores.overall}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: tierColor, marginBottom: 12 }}>{tier}</div>

              {scores.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{scores.description}</p>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 24 }}>Potential: {scores.potential}/100</div>
            </div>

            {/* Trait Breakdown */}
            {TRAIT_LIST.length > 0 && (
              <div style={{ padding: '0 24px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Trait Breakdown</div>
                {TRAIT_LIST.map(t => (
                  <div key={t.key} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${t.score}%`, background: getBarColor(t.score), transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: getBarColor(t.score), marginBottom: 10 }}>{t.rating}</div>
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

            {/* Recommendations */}
            {(scores.recommendations || scores.tips)?.length > 0 && (
              <div style={{ padding: '8px 24px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Top Recommendations</div>
                {(scores.recommendations || scores.tips).map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingLeft: 14, borderLeft: '3px solid var(--primary)' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', minWidth: 20 }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          padding: '16px 24px', paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          background: 'rgba(0,0,0,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: 12, maxWidth: 430, margin: '0 auto', width: '100%',
        }}>
          <button className="btn btn-outline" onClick={restartScan}
            style={{ flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 12, justifyContent: 'center', textAlign: 'center' }}>
            Rescan
          </button>
          <button className="btn btn-primary" onClick={handleClose}
            style={{ flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700, borderRadius: 12, justifyContent: 'center', textAlign: 'center' }}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── CAMERA STAGES ───
  const isFrontCamera = stage === 'front_camera';
  const isSideCamera = stage === 'side_camera';

  return (
    <div className="scanner-view">
      <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button className="close-btn" onClick={handleClose}><X size={20} /></button>

      {/* Step progress */}
      <StepBar step={isFrontCamera ? 1 : 2} />

      <div className="scanner-hud">
        <div className="scan-frame">
          <div className="scan-corner tl" /><div className="scan-corner tr" />
          <div className="scan-corner bl" /><div className="scan-corner br" />
          <div className="scan-line" />
        </div>
      </div>

      {/* Instructions */}
      <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top, 16px), 16px)', left: 0, right: 0, textAlign: 'center', paddingTop: 80 }}>
        <div className="h3" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          {isFrontCamera ? 'Front Photo' : 'Side Profile'}
        </div>
        <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          {isFrontCamera ? 'Look straight at the camera' : 'Turn your head to the side'}
        </div>
      </div>

      {/* Side profile hint icon */}
      {isSideCamera && (
        <div style={{
          position: 'absolute', top: '50%', left: 20, transform: 'translateY(-50%)',
          fontSize: 13, fontWeight: 700, color: 'var(--primary)', writingMode: 'vertical-rl',
          letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}>
          SIDE VIEW →
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', bottom: 120, left: 20, right: 20, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      <button className="capture-btn" onClick={isFrontCamera ? captureFront : captureSide} />

      {/* Front thumbnail when taking side */}
      {isSideCamera && frontImage && (
        <div style={{
          position: 'absolute', bottom: 100, left: 20,
          width: 52, height: 68, borderRadius: 10, overflow: 'hidden',
          border: '2px solid var(--primary)', boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          <img src={`data:image/jpeg;base64,${frontImage}`} alt="Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 7, fontWeight: 700, color: 'var(--primary)' }}>✓ FRONT</div>
        </div>
      )}
    </div>
  );
}

/* Step progress bar */
function StepBar({ step }: { step: number }) {
  return (
    <div style={{
      position: 'absolute', top: 'max(env(safe-area-inset-top, 10px), 10px)', left: 60, right: 60,
      zIndex: 20, display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <div style={{
        flex: 1, height: 3, borderRadius: 2,
        background: step >= 1 ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
        transition: 'background 0.3s',
      }} />
      <div style={{
        flex: 1, height: 3, borderRadius: 2,
        background: step >= 2 ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
        transition: 'background 0.3s',
      }} />
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--primary)', minWidth: 30, textAlign: 'right',
      }}>{step}/2</div>
    </div>
  );
}
