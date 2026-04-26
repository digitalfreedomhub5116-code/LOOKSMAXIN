import { useState, useEffect } from 'react';
import { ScanLine, Clock, Check, Plus } from 'lucide-react';
import type { FaceScores } from '../lib/api';

interface DashboardProps {
  onScan: () => void;
  scores: FaceScores | null;
}

// ─── SVG Ring constants ───
const RING_SIZE = 160;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type TimeFilter = 'Morning' | 'Afternoon' | 'Night';

interface Task {
  id: string;
  title: string;
  duration: string;
  xp: number;
}

const TASKS: Record<TimeFilter, Task[]> = {
  Morning: [
    { id: 'm1', title: 'Rice Water Face Mask', duration: '10 mins', xp: 15 },
    { id: 'm2', title: 'Brush Lips (Exfoliate)', duration: '3 mins', xp: 10 },
    { id: 'm3', title: 'Morning Skincare Routine', duration: '8 mins', xp: 20 },
    { id: 'm4', title: 'Cold Water Splash (Face)', duration: '2 mins', xp: 10 },
    { id: 'm5', title: 'Drink Lemon Water', duration: '1 min', xp: 5 },
  ],
  Afternoon: [
    { id: 'a1', title: 'Posture Check & Correct', duration: '5 mins', xp: 10 },
    { id: 'a2', title: 'Jawline Exercises', duration: '10 mins', xp: 20 },
    { id: 'a3', title: 'Mewing Practice', duration: '5 mins', xp: 15 },
    { id: 'a4', title: 'Hydrate (2L Target)', duration: '—', xp: 10 },
  ],
  Night: [
    { id: 'n1', title: 'Night Skincare Routine', duration: '10 mins', xp: 20 },
    { id: 'n2', title: 'Apply Under-Eye Cream', duration: '2 mins', xp: 10 },
    { id: 'n3', title: 'Face Massage (Gua Sha)', duration: '8 mins', xp: 15 },
    { id: 'n4', title: 'Sleep 8 Hours', duration: '8 hrs', xp: 25 },
  ],
};

const METRICS = [
  { key: 'jawline', label: 'Jawline', color: '#8ea1bc' },
  { key: 'skin_quality', label: 'Skin', color: '#7B2CBF' },
  { key: 'eyes', label: 'Eyes', color: '#5CE1E6' },
  { key: 'facial_symmetry', label: 'Symmetry', color: '#22C55E' },
  { key: 'lips', label: 'Lips', color: '#F59E0B' },
  { key: 'hair_quality', label: 'Hair', color: '#EF4444' },
];

export default function Dashboard({ onScan, scores }: DashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Night';
  });
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lynx_tasks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [ringOffset, setRingOffset] = useState(CIRCUMFERENCE);
  const [animatedScore, setAnimatedScore] = useState(0);

  const currentTasks = TASKS[timeFilter];
  const doneTasks = currentTasks.filter(t => completed.has(t.id)).length;
  const routinePct = currentTasks.length > 0 ? Math.round((doneTasks / currentTasks.length) * 100) : 0;
  const totalXP = currentTasks.filter(t => completed.has(t.id)).reduce((s, t) => s + t.xp, 0);
  const lynxScore = scores?.overall || 0;

  // Persist tasks
  useEffect(() => {
    localStorage.setItem('lynx_tasks', JSON.stringify([...completed]));
  }, [completed]);

  // Animate ring for Lynx Score
  useEffect(() => {
    const pct = lynxScore; // 0-100 score
    const target = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
    setRingOffset(target);
    // Animate number
    let frame: number;
    let current = 0;
    const step = () => {
      const diff = lynxScore - current;
      if (Math.abs(diff) < 0.5) { setAnimatedScore(lynxScore); return; }
      current += diff * 0.06;
      setAnimatedScore(Math.round(current));
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [lynxScore]);

  const toggleTask = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filterIcons: Record<TimeFilter, string> = {
    Morning: '☀️', Afternoon: '🌤️', Night: '🌙',
  };

  return (
    <div className="page">

      {/* ═══ HEADER ═══ */}
      <div className="dash-header">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-subtitle">Track your glow-up progress</div>
        </div>
        <div className="dash-streak">
          <span>🔥</span>
          <span>12 Day Streak</span>
        </div>
      </div>

      {/* ═══ SECTION 1: LYNX SCORE RING ═══ */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ScanLine size={14} color="#8ea1bc" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Lynx Score</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={onScan} style={{ fontSize: 10, padding: '5px 12px' }}>
            <Plus size={12} /> {scores ? 'RESCAN' : 'SCAN'}
          </button>
        </div>

        {scores ? (
          <>
            {/* Big Score Ring */}
            <div className="ring-section">
              <div className="ring-wrap">
                <svg width={RING_SIZE} height={RING_SIZE} className="ring-svg">
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                    fill="transparent" stroke="rgba(142,161,188,0.1)" strokeWidth={STROKE}
                  />
                  <circle
                    cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                    fill="transparent" stroke="#8ea1bc" strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,0.46,0.45,0.94)', filter: 'drop-shadow(0 0 6px rgba(142,161,188,0.5))' }}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </svg>
                <div className="ring-center">
                  <div className="ring-pct">{animatedScore}</div>
                  <div className="ring-label">LYNX SCORE</div>
                </div>
              </div>
            </div>

            {/* Individual Metrics */}
            <div style={{ marginTop: 4 }}>
              {METRICS.map(m => (
                <div className="metric-row" key={m.key}>
                  <span className="metric-label">{m.label}</span>
                  <div className="metric-track">
                    <div className="metric-fill" style={{ width: `${(scores as any)[m.key] || 0}%`, background: m.color }} />
                  </div>
                  <span className="metric-score" style={{ color: m.color }}>{(scores as any)[m.key] || '—'}</span>
                </div>
              ))}
            </div>

            {/* Tip */}
            {scores.tips && scores.tips.length > 0 && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(92,225,230,0.06)', borderRadius: 10, border: '1px solid rgba(92,225,230,0.12)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#5CE1E6', marginBottom: 5, letterSpacing: 0.5 }}>💡 TOP TIP</div>
                <div style={{ fontSize: 12, color: '#D0D6E0', lineHeight: 1.5 }}>{scores.tips[0]}</div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.3 }}>📷</div>
            Tap <strong>+ SCAN</strong> to get your AI face analysis
          </div>
        )}
      </div>

      {/* ═══ SECTION 2: TODAY'S ROUTINE ═══ */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        {/* Routine Header + Progress Bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Today's Routine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doneTasks}/{currentTasks.length}</span>
              <span className="routine-xp earned" style={{ fontSize: 9, padding: '2px 6px' }}>+{totalXP} XP</span>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="routine-progress-track">
            <div
              className="routine-progress-fill"
              style={{ width: `${routinePct}%` }}
            />
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="filter-row" style={{ marginBottom: 14 }}>
          {(['Morning', 'Afternoon', 'Night'] as TimeFilter[]).map(f => (
            <button
              key={f}
              className={`filter-pill ${f === timeFilter ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              <span>{filterIcons[f]}</span>
              <span>{f}</span>
            </button>
          ))}
        </div>

        {/* Task Cards */}
        <div className="task-list">
          {currentTasks.map(task => {
            const done = completed.has(task.id);
            return (
              <div className={`routine-card ${done ? 'completed' : ''}`} key={task.id}>
                <button
                  className={`routine-check ${done ? 'checked' : ''}`}
                  onClick={() => toggleTask(task.id)}
                >
                  {done && <Check size={14} strokeWidth={3} />}
                </button>
                <div className="routine-body">
                  <div className={`routine-title ${done ? 'done' : ''}`}>{task.title}</div>
                  <div className="routine-duration">
                    <Clock size={10} /> {task.duration}
                  </div>
                </div>
                <div className={`routine-xp ${done ? 'earned' : ''}`}>
                  +{task.xp} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
