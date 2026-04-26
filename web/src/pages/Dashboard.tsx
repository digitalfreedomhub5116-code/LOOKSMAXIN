import { useState, useEffect } from 'react';
import { ScanLine, ChevronRight, Sparkles, RefreshCw, Dumbbell, Smile, Triangle } from 'lucide-react';
import type { FaceScores } from '../lib/api';

interface DashboardProps {
  onScan: () => void;
  scores: FaceScores | null;
  faceImage?: string | null;
}

// ─── Score tier helpers ───
function getTier(s: number) {
  if (s >= 90) return { label: 'Gigachad', color: '#C8A84E' };
  if (s >= 80) return { label: 'Chad', color: '#22C55E' };
  if (s >= 65) return { label: 'Above Average', color: '#22C55E' };
  if (s >= 50) return { label: 'Average', color: '#F59E0B' };
  return { label: 'Below Average', color: '#EF4444' };
}

function getBarColor(s: number) {
  if (s >= 85) return '#22C55E';
  if (s >= 70) return '#C8A84E';
  if (s >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function Dashboard({ onScan, scores, faceImage }: DashboardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!scores) return;
    let frame = 0;
    const target = scores.overall;
    const step = () => {
      frame++;
      const progress = Math.min(frame / 40, 1);
      setAnimatedScore(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [scores]);

  const tier = scores ? getTier(scores.overall) : null;

  const TRAIT_LIST = scores?.traits ? Object.entries(scores.traits).map(([key, t]) => ({
    key, label: key.charAt(0).toUpperCase() + key.slice(1), ...t,
  })) : [];

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>LYNX AI</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Welcome back</div>
        </div>
        {scores && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>⚡ {scores.potential || 0} XP</span>
          </div>
        )}
      </div>

      {/* ═══ SECTION 1: GET RATED / LYNX REPORT ═══ */}
      {!scores ? (
        /* ── No scan yet: Hero CTA ── */
        <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 8 }}>FIRST SCAN</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Get rated</div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={22} color="#000" />
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Take your first face scan to unlock your personalized Lynx Report and improvement roadmap.
          </p>
          <button className="btn btn-primary" onClick={onScan} style={{ width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ScanLine size={16} /> Start Face Scan
          </button>
        </div>
      ) : (
        /* ── Has scores: Lynx Report Summary ── */
        <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          {/* B&W face photo */}
          {faceImage && (
            <div style={{ width: '100%', height: 220, overflow: 'hidden', position: 'relative' }}>
              <img
                src={faceImage.startsWith('http') ? faceImage : `data:image/jpeg;base64,${faceImage}`}
                alt="Face scan"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #111)' }} />
            </div>
          )}

          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5 }}>OVERALL LYNX SCORE</div>
              <button onClick={onScan} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <RefreshCw size={16} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: tier!.color, lineHeight: 1 }}>{animatedScore}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: tier!.color, marginBottom: 12 }}>
              {scores.overall_rating || tier!.label}
            </div>

            {scores.description && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                {scores.description}
              </p>
            )}

            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
              Potential: {scores.potential}/100
            </div>
          </div>

          {/* ── Trait Breakdown ── */}
          {TRAIT_LIST.length > 0 && (
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Trait Breakdown</div>
              {TRAIT_LIST.map(t => (
                <div key={t.key} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${t.score}%`, background: getBarColor(t.score), transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: getBarColor(t.score), marginBottom: 8 }}>{t.rating}</div>
                  {t.holding_back && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>What's holding you back</div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{t.holding_back}</p>
                    </>
                  )}
                  {t.fix_it && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>Fix it</div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.fix_it}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Top Recommendations ── */}
          {(scores.recommendations || scores.tips)?.length > 0 && (
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Top Recommendations</div>
              {(scores.recommendations || scores.tips).map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, paddingLeft: 12, borderLeft: '3px solid var(--primary)' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', minWidth: 18 }}>{i + 1}</span>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ GENERATE REPORT CTA ═══ */}
      {!scores && (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 24, cursor: 'pointer' }} onClick={onScan}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ScanLine size={20} color="#000" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Generate Your First Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan your face to unlock</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      )}

      {/* ═══ ROADMAP SECTION ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Roadmap</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View all</span>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🏔️</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Your Looksmax Journey</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step-by-step path to Lynx Mode</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </div>

      {/* ═══ EXERCISES SECTION ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Exercises</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View all</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { icon: <Dumbbell size={24} color="var(--primary)" />, label: 'Jawline' },
            { icon: <Smile size={24} color="var(--primary)" />, label: 'Facial' },
            { icon: <Triangle size={24} color="var(--primary)" />, label: 'Nose' },
          ].map(ex => (
            <div key={ex.label} className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px', cursor: 'pointer' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,168,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ex.icon}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{ex.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ LYNXMAXING COURSES ═══ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Lynxmaxing Courses</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View all</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { title: 'Skincare Ascension', emoji: '🧴' },
            { title: 'Hairstyle', emoji: '💇' },
            { title: 'Posture Fix', emoji: '🧍' },
          ].map(c => (
            <div key={c.title} className="glass-card" style={{ minWidth: 150, padding: 0, overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: '100%', height: 110, background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 40 }}>{c.emoji}</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{c.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
