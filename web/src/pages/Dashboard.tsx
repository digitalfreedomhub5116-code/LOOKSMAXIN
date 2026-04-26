import { useState, useEffect } from 'react';
import { Flame, Plus, ScanLine, TrendingUp, Droplets, Eye, Smile } from 'lucide-react';
import type { FaceScores } from '../lib/api';

interface DashboardProps {
  onScan: () => void;
  scores: FaceScores | null;
}

const METRICS = [
  { key: 'jawline', label: 'Jawline', color: '#8ea1bc' },
  { key: 'skin_quality', label: 'Skin', color: '#7B2CBF' },
  { key: 'eyes', label: 'Eyes', color: '#5CE1E6' },
  { key: 'facial_symmetry', label: 'Symmetry', color: '#22C55E' },
  { key: 'lips', label: 'Lips', color: '#F59E0B' },
  { key: 'hair_quality', label: 'Hair', color: '#EF4444' },
];

const TASKS = [
  { title: 'Morning Skincare Routine', time: '7:00 AM', done: true, icon: <Droplets size={16} color="#5CE1E6" /> },
  { title: 'Mewing Exercise (5 min)', time: '8:00 AM', done: true, icon: <Smile size={16} color="#7B2CBF" /> },
  { title: 'Cold Water Splash', time: '9:00 AM', done: false, icon: <Droplets size={16} color="#8ea1bc" /> },
  { title: 'Eye Area Massage', time: '12:00 PM', done: false, icon: <Eye size={16} color="#F59E0B" /> },
];

export default function Dashboard({ onScan, scores }: DashboardProps) {
  const [overall, setOverall] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Night';

  // Animate score on mount or score change
  useEffect(() => {
    if (!scores) { setOverall(0); return; }
    let frame: number;
    let start = 0;
    const target = scores.overall || 0;
    const step = () => {
      start += 1.5;
      if (start >= target) { setOverall(target); return; }
      setOverall(Math.round(start));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [scores]);

  return (
    <div className="page">
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="label-xs" style={{ marginBottom: 4 }}>GOOD {greeting.toUpperCase()}</div>
          <div className="h1">Champion</div>
        </div>
        <div className="streak-badge">
          <Flame size={14} /> 3
        </div>
      </div>

      {/* ─── Lynx Score Ring ─── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div className="score-ring">
          <span className="value">{overall || '—'}</span>
          <span className="label">LYNX SCORE</span>
        </div>
      </div>

      {/* ─── Face Analysis Card ─── */}
      <div className="glass-card" style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={14} color="#8ea1bc" /> Face Analysis
            </div>
            <div className="label" style={{ marginTop: 2 }}>
              {scores ? 'AI-powered scan results' : 'Scan your face to start'}
            </div>
          </div>
          <button className="btn btn-primary" onClick={onScan} style={{ fontSize: 11 }}>
            <Plus size={14} /> SCAN
          </button>
        </div>

        {scores ? (
          <div>
            {METRICS.map(m => (
              <div className="metric-row" key={m.key}>
                <span className="metric-label">{m.label}</span>
                <div className="metric-track">
                  <div
                    className="metric-fill"
                    style={{ width: `${(scores as any)[m.key] || 0}%`, background: m.color }}
                  />
                </div>
                <span className="metric-score" style={{ color: m.color }}>
                  {(scores as any)[m.key] || '—'}
                </span>
              </div>
            ))}

            {/* Tips preview */}
            {scores.tips && scores.tips.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(92,225,230,0.06)', borderRadius: 10, border: '1px solid rgba(92,225,230,0.12)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5CE1E6', marginBottom: 6, letterSpacing: 0.5 }}>
                  💡 TOP TIP
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  {scores.tips[0]}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Tap <strong>+ SCAN</strong> to analyze your face with Gemini AI
          </div>
        )}
      </div>

      {/* ─── Daily Routine ─── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} color="#8ea1bc" /> Daily Routine
          </div>
          <span className="label">{TASKS.filter(t => t.done).length}/{TASKS.length}</span>
        </div>

        {TASKS.map((t, i) => (
          <div className="glass task-card" key={i}>
            <div className={`task-icon ${t.done ? 'done' : ''}`}>
              {t.done ? <span style={{ color: '#22C55E', fontSize: 16 }}>✓</span> : t.icon}
            </div>
            <div className="task-content">
              <div className={`task-title ${t.done ? 'done' : ''}`}>{t.title}</div>
              <div className="task-time">{t.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
