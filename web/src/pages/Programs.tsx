import { useState, useEffect, useCallback } from 'react';
import { Check, Lock, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { PLANS } from '../data/exercisePlans';
import type { ExercisePlan, ExerciseItem, PlanDay } from '../data/exercisePlans';
import * as progress from '../data/planProgress';

export default function Programs() {
  const [userProgress, setUserProgress] = useState(progress.getProgress());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [activeExercise, setActiveExercise] = useState<ExerciseItem | null>(null);

  const activePlan = PLANS.find(p => p.id === userProgress.activePlanId) || null;
  const planProgress = activePlan ? userProgress.plans[activePlan.id] : null;
  const currentDay = planProgress?.currentDay || 1;

  const handleStartPlan = (planId: string) => {
    setUserProgress(progress.startPlan(planId));
    setExpandedDay(null);
    setActiveExercise(null);
  };

  const handleSwitchPlan = (planId: string) => {
    if (planId === userProgress.activePlanId) return;
    if (!userProgress.plans[planId]) {
      setUserProgress(progress.startPlan(planId));
    } else {
      setUserProgress(progress.switchPlan(planId));
    }
    setExpandedDay(null);
    setActiveExercise(null);
  };

  const handleCompleteExercise = (exId: string, day: number) => {
    if (!activePlan) return;
    setUserProgress(progress.completeExercise(activePlan.id, day, exId));
    setActiveExercise(null);
  };

  const handleCompleteDay = (day: number, bonusXP?: number) => {
    if (!activePlan) return;
    const xp = 20 + (bonusXP || 0);
    setUserProgress(progress.completeDay(activePlan.id, day, xp));
    setExpandedDay(null);
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Programs</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>30-day face exercise plans</div>
      </div>

      {/* Plan Carousel */}
      <PlanCarousel
        plans={PLANS}
        activePlanId={userProgress.activePlanId}
        userPlans={userProgress.plans}
        onSelect={activePlan ? handleSwitchPlan : handleStartPlan}
      />

      {/* Journey Map or Empty State */}
      {activePlan && planProgress ? (
        <>
          {/* Plan Progress Header */}
          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{activePlan.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                Day {Math.min(currentDay, 30)}/30
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{
                height: '100%', borderRadius: 2, width: `${(planProgress.completedDays.length / 30) * 100}%`,
                background: 'var(--primary)', transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{planProgress.completedDays.length} days done</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>⚡ {planProgress.totalXP} XP</span>
            </div>
          </div>

          {/* Exercise Detail Modal */}
          {activeExercise && (
            <ExerciseTimer
              exercise={activeExercise}
              onComplete={() => handleCompleteExercise(activeExercise.id, expandedDay!)}
              onClose={() => setActiveExercise(null)}
            />
          )}

          {/* Journey Map */}
          <JourneyMap
            plan={activePlan}
            completedDays={planProgress.completedDays}
            completedExercises={planProgress.completedExercises}
            currentDay={currentDay}
            expandedDay={expandedDay}
            onToggleDay={(d) => setExpandedDay(expandedDay === d ? null : d)}
            onStartExercise={setActiveExercise}
            onCompleteDay={handleCompleteDay}
          />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Pick a Plan</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Choose a 30-day program above to start your transformation journey
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Plan Carousel ═══ */
function PlanCarousel({ plans, activePlanId, userPlans, onSelect }: {
  plans: ExercisePlan[];
  activePlanId: string | null;
  userPlans: Record<string, progress.PlanProgress>;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, margin: '0 -20px', padding: '0 20px 8px' }}>
      {plans.map(plan => {
        const isActive = plan.id === activePlanId;
        const pp = userPlans[plan.id];
        const pct = pp ? Math.round((pp.completedDays.length / 30) * 100) : 0;
        return (
          <div
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            style={{
              minWidth: 140, flexShrink: 0, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
              boxShadow: isActive ? '0 0 20px rgba(200,168,78,0.2)' : 'none',
              background: 'var(--surface)', transition: 'all 0.2s',
            }}
          >
            <div style={{ width: '100%', height: 100, overflow: 'hidden', position: 'relative' }}>
              <img
                src={plan.image}
                alt={plan.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) brightness(0.7)' }}
              />
              {isActive && (
                <div style={{
                  position: 'absolute', top: 6, right: 6, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--primary)', fontSize: 9, fontWeight: 800, color: '#000', letterSpacing: 0.5,
                }}>ACTIVE</div>
              )}
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>{plan.name}</div>
              {pp ? (
                <>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: 'var(--primary)' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pct}% complete</div>
                </>
              ) : (
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>30 Day Plan</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Mission Map (Zigzag with SVG Track) ═══ */
function JourneyMap({ plan, completedDays, completedExercises, currentDay, expandedDay, onToggleDay, onStartExercise, onCompleteDay }: {
  plan: ExercisePlan;
  completedDays: number[];
  completedExercises: Record<number, string[]>;
  currentDay: number;
  expandedDay: number | null;
  onToggleDay: (d: number) => void;
  onStartExercise: (ex: ExerciseItem) => void;
  onCompleteDay: (d: number, bonusXP?: number) => void;
}) {
  // Irregular X positions for nodes (% from left) — zigzag pattern
  const xPattern = [35, 65, 50, 25, 70, 45, 30, 60, 50, 40,
                     65, 35, 55, 25, 70, 45, 60, 30, 50, 65,
                     35, 55, 40, 70, 30, 60, 45, 35, 55, 50];
  const NODE_SIZE = 52;
  const MILESTONE_SIZE = 60;
  const ROW_H = 140; // vertical spacing between nodes
  const EXPANDED_EXTRA = 220; // extra space for expanded card

  // Calculate node positions
  const nodes = plan.days.map((dayData, i) => {
    const isMilestone = !!dayData.milestone;
    const size = isMilestone ? MILESTONE_SIZE : NODE_SIZE;
    const xPct = xPattern[i % xPattern.length];
    // Accumulate Y with extra space for expanded days above this one
    let y = 0;
    for (let j = 0; j < i; j++) {
      y += ROW_H;
      if (expandedDay === plan.days[j].day) y += EXPANDED_EXTRA;
    }
    return { dayData, x: xPct, y, size, isMilestone };
  });

  const totalH = nodes.length > 0
    ? nodes[nodes.length - 1].y + ROW_H
    : 0;

  // Build SVG path through all nodes
  const buildPath = () => {
    if (nodes.length < 2) return '';
    const W = 100; // viewbox percentage width
    const pts = nodes.map(n => ({ x: (n.x / 100) * W, y: n.y + n.size / 2 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const svgW = 400;
  const pathD = buildPath();
  // Scale SVG coords: x is 0-100 mapped to svgW, y is direct pixels
  const scaledPath = (() => {
    if (nodes.length < 2) return '';
    const pts = nodes.map(n => ({ x: (n.x / 100) * svgW, y: n.y + n.size / 2 }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
    }
    return d;
  })();

  return (
    <div style={{ position: 'relative', marginTop: 16, height: totalH, overflow: 'visible' }}>
      {/* SVG curved track */}
      <svg
        viewBox={`0 0 ${svgW} ${totalH}`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: totalH, zIndex: 0, overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="trackGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Glow layer */}
        <path d={scaledPath} fill="none" stroke="rgba(200,168,78,0.15)" strokeWidth="10" filter="url(#trackGlow)" />
        {/* Main track */}
        <path d={scaledPath} fill="none" stroke="rgba(200,168,78,0.35)" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Nodes */}
      {nodes.map(({ dayData, x, y, size, isMilestone }) => {
        const d = dayData.day;
        const done = completedDays.includes(d);
        const isCurrent = d === currentDay && !done;
        const locked = d > currentDay;
        const isExpanded = expandedDay === d;
        const completedExCount = completedExercises[d]?.length || 0;

        // Card goes on opposite side of node; if node is left of center, card goes right and vice versa
        const cardOnRight = x < 50;

        return (
          <div key={d} style={{ position: 'absolute', top: y, left: 0, right: 0, height: isExpanded ? ROW_H + EXPANDED_EXTRA : ROW_H }}>
            {/* Node circle */}
            <div
              onClick={() => !locked && onToggleDay(d)}
              style={{
                position: 'absolute',
                left: `calc(${x}% - ${size / 2}px)`,
                top: 0,
                width: size, height: size, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: locked ? 'default' : 'pointer',
                zIndex: 3,
                background: done
                  ? 'radial-gradient(circle, rgba(200,168,78,0.35) 0%, #111 70%)'
                  : isCurrent
                    ? 'radial-gradient(circle, rgba(200,168,78,0.2) 0%, #0a0a0a 70%)'
                    : '#111',
                border: done
                  ? '2.5px solid var(--primary)'
                  : isCurrent
                    ? '2.5px solid var(--primary)'
                    : '2px solid rgba(255,255,255,0.12)',
                boxShadow: done
                  ? '0 0 20px rgba(200,168,78,0.3)'
                  : isCurrent
                    ? '0 0 28px rgba(200,168,78,0.45), 0 0 8px rgba(200,168,78,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.5)',
                opacity: locked ? 0.3 : 1,
                animation: isCurrent ? 'missionPulse 2.5s ease-in-out infinite' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {done ? (
                <Check size={22} color="var(--primary)" strokeWidth={3} />
              ) : isMilestone ? (
                <Trophy size={24} color={locked ? 'var(--text-disabled)' : 'var(--primary)'} />
              ) : isCurrent ? (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 12px rgba(200,168,78,0.6)',
                }} />
              ) : locked ? (
                <Lock size={18} color="var(--text-disabled)" />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{d}</span>
              )}
            </div>

            {/* Info card — positioned near node */}
            <div
              onClick={() => !locked && onToggleDay(d)}
              style={{
                position: 'absolute',
                top: size + 8,
                left: cardOnRight ? `calc(${Math.min(x + 5, 55)}%)` : undefined,
                right: !cardOnRight ? `calc(${Math.min(100 - x + 5, 55)}%)` : undefined,
                width: '55%',
                maxWidth: 220,
                padding: isCurrent ? '14px 16px' : '10px 14px',
                borderRadius: 12,
                cursor: locked ? 'default' : 'pointer',
                zIndex: 2,
                background: isCurrent
                  ? 'rgba(200,168,78,0.06)'
                  : 'rgba(17,17,17,0.85)',
                border: isCurrent
                  ? '1.5px solid rgba(200,168,78,0.35)'
                  : isExpanded
                    ? '1.5px solid rgba(200,168,78,0.25)'
                    : '1px solid rgba(255,255,255,0.08)',
                opacity: locked ? 0.3 : 1,
                transition: 'all 0.25s ease',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                color: done ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 2,
              }}>
                DAY {d}
              </div>
              <div style={{
                fontSize: 17, fontWeight: 800,
                color: done ? 'var(--primary)' : '#fff',
                letterSpacing: 0.3, marginBottom: isCurrent ? 10 : 0,
              }}>
                {dayData.phase}
              </div>
              {!locked && !isCurrent && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {done ? '✓ Completed' : `${dayData.exercises.length} exercises`}
                </div>
              )}
              {/* START MISSION button for current day */}
              {isCurrent && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 8,
                  background: 'var(--primary)',
                  boxShadow: '0 0 16px rgba(200,168,78,0.3)',
                  fontSize: 12, fontWeight: 800, color: '#000',
                  letterSpacing: 1,
                }}>
                  <Play size={13} fill="#000" color="#000" />
                  START MISSION
                </div>
              )}
            </div>

            {/* Expanded exercise detail */}
            {isExpanded && (
              <div style={{
                position: 'absolute', top: size + (isCurrent ? 110 : 80), left: '5%', right: '5%', zIndex: 4,
              }}>
                <DayDetail
                  dayData={dayData}
                  completedExIds={completedExercises[d] || []}
                  onStartExercise={onStartExercise}
                  onCompleteDay={() => onCompleteDay(d, dayData.bonusXP)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══ Day Detail ═══ */
function DayDetail({ dayData, completedExIds, onStartExercise, onCompleteDay }: {
  dayData: PlanDay;
  completedExIds: string[];
  onStartExercise: (ex: ExerciseItem) => void;
  onCompleteDay: () => void;
}) {
  const allDone = dayData.exercises.every(ex => completedExIds.includes(ex.id));

  return (
    <div style={{
      padding: 14, borderRadius: 14,
      background: 'var(--surface)', border: '1px solid var(--border)',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {dayData.exercises.map(ex => {
        const done = completedExIds.includes(ex.id);
        return (
          <div
            key={ex.id}
            onClick={() => !done && onStartExercise(ex)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10, marginBottom: 6, cursor: done ? 'default' : 'pointer',
              background: done ? 'rgba(200,168,78,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${done ? 'rgba(200,168,78,0.15)' : 'var(--border-subtle)'}`,
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${done ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`,
              background: done ? 'rgba(200,168,78,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {done ? <Check size={14} color="var(--primary)" /> : <Play size={12} color="var(--text-muted)" fill="var(--text-muted)" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--text-muted)' : '#fff', textDecoration: done ? 'line-through' : 'none' }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {ex.reps > 0 ? `${ex.sets}×${ex.reps} reps` : `${Math.floor(ex.duration / 60)}min hold`}
                {' · '}{'⭐'.repeat(ex.difficulty)}
              </div>
            </div>
          </div>
        );
      })}

      {dayData.milestone && (
        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
          🏆 {dayData.milestone} {dayData.bonusXP && `(+${dayData.bonusXP} XP)`}
        </div>
      )}

      <button
        onClick={onCompleteDay}
        disabled={!allDone}
        style={{
          width: '100%', padding: '12px 0', marginTop: 8, borderRadius: 10, border: 'none',
          background: allDone ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
          color: allDone ? '#000' : 'var(--text-disabled)',
          fontSize: 14, fontWeight: 700, cursor: allDone ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
      >
        {allDone ? '✓ Complete Day' : `Complete all exercises first`}
      </button>
    </div>
  );
}

/* ═══ Exercise Timer ═══ */
function ExerciseTimer({ exercise, onComplete, onClose }: {
  exercise: ExerciseItem;
  onComplete: () => void;
  onClose: () => void;
}) {
  const isTimedHold = exercise.reps === 0;
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);

  useEffect(() => {
    if (!running || !isTimedHold) return;
    if (timeLeft <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft, isTimedHold]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const timerDone = isTimedHold && timeLeft <= 0;
  const repsDone = !isTimedHold && currentSet > exercise.sets;

  const handleRepTap = () => {
    if (repsDone) return;
    const nextRep = currentRep + 1;
    if (nextRep >= exercise.reps) {
      setCurrentSet(prev => prev + 1);
      setCurrentRep(0);
    } else {
      setCurrentRep(nextRep);
    }
  };

  const canFinish = timerDone || repsDone;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
        color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer',
      }}>✕</button>

      {/* Exercise Name */}
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>{exercise.name}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
        {exercise.description}
      </div>

      {/* Video Placeholder */}
      <div style={{
        width: '100%', maxWidth: 300, height: 160, borderRadius: 16,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, gap: 8,
      }}>
        <Play size={32} color="var(--text-disabled)" />
        <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>Video coming soon</span>
      </div>

      {isTimedHold ? (
        /* Timer Mode */
        <>
          <div style={{ fontSize: 56, fontWeight: 900, color: timerDone ? '#22C55E' : 'var(--primary)', marginBottom: 24, fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {!timerDone && (
              <>
                <button onClick={() => setRunning(!running)} style={{
                  width: 64, height: 64, borderRadius: '50%', border: '2.5px solid var(--primary)',
                  background: 'rgba(200,168,78,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {running ? <Pause size={24} color="var(--primary)" /> : <Play size={24} color="var(--primary)" fill="var(--primary)" />}
                </button>
                <button onClick={() => { setTimeLeft(exercise.duration); setRunning(false); }} style={{
                  width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--border)',
                  background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RotateCcw size={20} color="var(--text-muted)" />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        /* Reps Mode */
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
              {repsDone ? 'All sets complete!' : `Set ${Math.min(currentSet, exercise.sets)} of ${exercise.sets}`}
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: repsDone ? '#22C55E' : 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {repsDone ? '✓' : `${currentRep}/${exercise.reps}`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>reps</div>
          </div>
          {!repsDone && (
            <button onClick={handleRepTap} style={{
              width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--primary)',
              background: 'rgba(200,168,78,0.1)', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, color: 'var(--primary)',
            }}>TAP</button>
          )}
        </>
      )}

      {/* Done Button */}
      {canFinish && (
        <button onClick={onComplete} style={{
          marginTop: 32, padding: '14px 48px', borderRadius: 12, border: 'none',
          background: 'var(--primary)', color: '#000', fontSize: 16, fontWeight: 800,
          cursor: 'pointer', animation: 'fadeIn 0.3s ease-out',
        }}>Done ✓</button>
      )}
    </div>
  );
}
