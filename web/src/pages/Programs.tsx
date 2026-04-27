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

/* ═══ Mission Map (Vertical) ═══ */
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
  return (
    <div style={{ position: 'relative', marginTop: 12, paddingBottom: 20 }}>
      {/* Vertical glowing line */}
      <div style={{
        position: 'absolute', left: 28, top: 0, bottom: 0, width: 3,
        background: 'linear-gradient(180deg, var(--primary) 0%, rgba(200,168,78,0.15) 100%)',
        borderRadius: 2, zIndex: 0,
        boxShadow: '0 0 12px rgba(200,168,78,0.2), 0 0 4px rgba(200,168,78,0.3)',
      }} />

      {plan.days.map((dayData) => {
        const d = dayData.day;
        const done = completedDays.includes(d);
        const isCurrent = d === currentDay && !done;
        const locked = d > currentDay;
        const isMilestone = !!dayData.milestone;
        const isExpanded = expandedDay === d;
        const nodeSize = isMilestone ? 56 : 48;

        return (
          <div key={d} style={{ position: 'relative', marginBottom: isExpanded ? 0 : 6 }}>
            {/* Node row */}
            <div
              onClick={() => !locked && onToggleDay(d)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: locked ? 'default' : 'pointer',
                padding: '8px 0',
              }}
            >
              {/* Circle node */}
              <div style={{
                width: nodeSize, height: nodeSize, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 2,
                background: done
                  ? 'radial-gradient(circle, rgba(200,168,78,0.3) 0%, rgba(200,168,78,0.08) 70%)'
                  : isCurrent
                    ? 'radial-gradient(circle, rgba(200,168,78,0.2) 0%, rgba(200,168,78,0.05) 70%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 70%)',
                border: done
                  ? '2.5px solid var(--primary)'
                  : isCurrent
                    ? '2.5px solid var(--primary)'
                    : '2px solid rgba(255,255,255,0.1)',
                boxShadow: done
                  ? '0 0 20px rgba(200,168,78,0.35), inset 0 0 12px rgba(200,168,78,0.1)'
                  : isCurrent
                    ? '0 0 24px rgba(200,168,78,0.4), 0 0 8px rgba(200,168,78,0.2), inset 0 0 12px rgba(200,168,78,0.1)'
                    : 'none',
                opacity: locked ? 0.35 : 1,
                transition: 'all 0.3s ease',
                animation: isCurrent ? 'missionPulse 2.5s ease-in-out infinite' : 'none',
                marginLeft: nodeSize === 56 ? -4 : 0,
              }}>
                {done ? (
                  <Check size={20} color="var(--primary)" strokeWidth={3} />
                ) : isMilestone ? (
                  <Trophy size={22} color={locked ? 'var(--text-disabled)' : 'var(--primary)'} />
                ) : isCurrent ? (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--primary)',
                    boxShadow: '0 0 10px rgba(200,168,78,0.5)',
                  }} />
                ) : locked ? (
                  <Lock size={16} color="var(--text-disabled)" />
                ) : (
                  <Check size={18} color="var(--primary)" strokeWidth={2.5} />
                )}
              </div>

              {/* Day info card */}
              <div style={{
                flex: 1, padding: '14px 16px', borderRadius: 14,
                background: isExpanded
                  ? 'rgba(200,168,78,0.06)'
                  : isCurrent
                    ? 'rgba(200,168,78,0.04)'
                    : 'var(--surface)',
                border: isExpanded
                  ? '1.5px solid rgba(200,168,78,0.3)'
                  : isCurrent
                    ? '1.5px solid rgba(200,168,78,0.2)'
                    : '1px solid var(--border)',
                opacity: locked ? 0.4 : 1,
                transition: 'all 0.25s ease',
                boxShadow: isCurrent ? '0 0 20px rgba(200,168,78,0.08)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                      color: done ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 3,
                    }}>
                      DAY {d} {isMilestone && '· MILESTONE'}
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 800, color: done ? 'var(--primary)' : '#fff',
                      letterSpacing: 0.3,
                    }}>
                      {dayData.phase}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {done ? (
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: '#22C55E',
                        padding: '3px 10px', borderRadius: 20,
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                      }}>✓ DONE</div>
                    ) : isCurrent ? (
                      <div style={{
                        fontSize: 11, fontWeight: 800, color: '#000',
                        padding: '6px 14px', borderRadius: 8,
                        background: 'var(--primary)',
                        boxShadow: '0 0 12px rgba(200,168,78,0.3)',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <Play size={12} fill="#000" color="#000" />
                        START
                      </div>
                    ) : locked ? (
                      <Lock size={14} color="var(--text-disabled)" />
                    ) : (
                      <ChevronDown size={16} color="var(--text-muted)"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    )}
                  </div>
                </div>
                {/* Exercise count preview */}
                {!locked && (
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)', marginTop: 6,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span>{dayData.exercises.length} exercises</span>
                    {(completedExercises[d]?.length || 0) > 0 && !done && (
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        {completedExercises[d]?.length}/{dayData.exercises.length}
                      </span>
                    )}
                    {isMilestone && dayData.bonusXP && (
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>+{dayData.bonusXP} XP</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Expanded exercise list */}
            {isExpanded && (
              <div style={{ marginLeft: 64, marginBottom: 12 }}>
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
