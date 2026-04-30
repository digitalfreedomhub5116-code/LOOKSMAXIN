import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Check, Dumbbell, Timer, Zap, X, SkipForward, RotateCcw } from 'lucide-react';
import type { PlanDay, ExerciseItem } from '../data/exercisePlans';

/* ═══ Mission Overview — Exercise list + ENTER PROGRAM ═══ */
export function MissionOverview({ planName, dayData, completedExIds, onEnterProgram, onBack }: {
  planName: string; dayData: PlanDay; completedExIds: string[];
  onEnterProgram: () => void; onBack: () => void;
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#000', animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ChevronLeft size={24} color="#fff" />
            </button>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--primary)', textTransform: 'uppercase' }}>MISSION GATE</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>DAY {dayData.day} — {dayData.phase}</div>
            </div>
          </div>
          <button onClick={onBack} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1,
          }}>[ ESCAPE ]</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{planName}</div>
      </div>

      {/* Hero */}
      <div style={{
        margin: '16px 20px', height: 100, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(200,168,78,0.12) 0%, rgba(200,168,78,0.03) 100%)',
        border: '1px solid rgba(200,168,78,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>DAY {dayData.day}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{dayData.phase} · {dayData.exercises.length} exercises · ~{Math.ceil(dayData.exercises.reduce((a, e) => a + e.duration, 0) / 60)} min</div>
        </div>
      </div>

      {/* Exercise List */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)' }}>PROTOCOL SEQUENCE</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{dayData.exercises.length} EXERCISES</div>
        </div>

        {dayData.exercises.map((ex) => {
          const done = completedExIds.includes(ex.id);
          const isHold = ex.reps === 0;
          return (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderRadius: 14, marginBottom: 8,
              background: done ? 'rgba(200,168,78,0.06)' : 'var(--surface)',
              border: `1px solid ${done ? 'rgba(200,168,78,0.2)' : 'var(--border)'}`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: done ? 'rgba(200,168,78,0.15)' : 'rgba(200,168,78,0.08)',
                border: `1.5px solid ${done ? 'var(--primary)' : 'rgba(200,168,78,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                <Dumbbell size={20} color="var(--primary)" />
                {done && (
                  <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: done ? 'var(--text-muted)' : '#fff', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>{isHold ? 'HOLD' : 'REPS'}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{'⭐'.repeat(ex.difficulty)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{ex.sets} SETS</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  {isHold ? `${Math.floor(ex.duration / 60)}:${(ex.duration % 60).toString().padStart(2, '0')}` : `${ex.reps} reps`}
                </div>
              </div>
            </div>
          );
        })}

        {dayData.milestone && (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
            🏆 {dayData.milestone} {dayData.bonusXP && `(+${dayData.bonusXP} XP)`}
          </div>
        )}
      </div>

      {/* ENTER PROGRAM */}
      <div style={{ padding: '16px 20px 40px', position: 'sticky', bottom: 0, background: 'linear-gradient(transparent, #000 30%)' }}>
        <button onClick={onEnterProgram} style={{
          width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
          background: 'var(--primary)', color: '#000', fontSize: 16, fontWeight: 900, letterSpacing: 1.5,
          cursor: 'pointer', boxShadow: '0 0 24px rgba(200,168,78,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Zap size={18} fill="#000" /> ENTER PROGRAM
        </button>
      </div>
    </div>
  );
}

/* ═══ Exercise Runner ═══ */
export function ExerciseRunner({ dayData, completedExIds, onCompleteExercise, onCompleteDay, onBack }: {
  dayData: PlanDay; completedExIds: string[];
  onCompleteExercise: (exId: string) => void;
  onCompleteDay: () => void; onBack: () => void;
}) {
  const remaining = dayData.exercises.filter(ex => !completedExIds.includes(ex.id));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const exercise = remaining[currentIdx];

  const handleExerciseDone = () => {
    onCompleteExercise(exercise.id);
    if (currentIdx < remaining.length - 1) {
      // Show rest screen before next exercise
      setShowRest(true);
    }
    // If last exercise, re-render will show "all done"
  };

  const handleRestDone = () => {
    setShowRest(false);
    setCurrentIdx(prev => prev + 1);
  };

  // All exercises completed
  if (!exercise || remaining.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.3s',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>MISSION COMPLETE!</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>Day {dayData.day} — All exercises done</div>
        {dayData.bonusXP && <div style={{ fontSize: 13, color: 'var(--primary)', marginBottom: 32 }}>+{dayData.bonusXP + 20} XP earned</div>}
        <button onClick={onCompleteDay} style={{
          padding: '16px 48px', borderRadius: 12, border: 'none', background: 'var(--primary)',
          color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', letterSpacing: 1,
          boxShadow: '0 0 20px rgba(200,168,78,0.3)',
        }}>✓ COMPLETE DAY</button>
        <button onClick={onBack} style={{
          marginTop: 16, padding: '12px 32px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Back to Map</button>
      </div>
    );
  }

  // Rest screen between exercises
  if (showRest) {
    return <RestScreen duration={20} onDone={handleRestDone} onSkip={handleRestDone} nextExercise={remaining[currentIdx + 1]?.name || 'Next'} />;
  }

  return (
    <ExerciseView
      key={exercise.id}
      exercise={exercise}
      exerciseNum={dayData.exercises.indexOf(exercise) + 1}
      totalExercises={dayData.exercises.length}
      onComplete={handleExerciseDone}
      onSkip={() => {
        onCompleteExercise(exercise.id);
        if (currentIdx < remaining.length - 1) { setShowRest(true); }
      }}
      onBack={onBack}
    />
  );
}

/* ═══ Rest Screen ═══ */
function RestScreen({ duration, onDone, onSkip, nextExercise }: {
  duration: number; onDone: () => void; onSkip: () => void; nextExercise: string;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) { onDone(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pct = ((duration - timeLeft) / duration) * 100;

  return (
    <div style={{
      minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>REST</div>
      <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', marginBottom: 24 }}>
        {timeLeft}
      </div>

      {/* Circular progress */}
      <svg width="120" height="120" style={{ marginBottom: 24 }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary)" strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 54}`}
          strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>NEXT UP</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 32 }}>{nextExercise}</div>

      <button onClick={onSkip} style={{
        padding: '12px 32px', borderRadius: 10, border: 'none',
        background: 'var(--primary)', color: '#000', fontSize: 14, fontWeight: 800,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <SkipForward size={16} /> SKIP REST
      </button>
    </div>
  );
}

/* ═══ Exercise View ═══ */
function ExerciseView({ exercise, exerciseNum, totalExercises, onComplete, onSkip, onBack }: {
  exercise: ExerciseItem; exerciseNum: number; totalExercises: number;
  onComplete: () => void; onSkip: () => void; onBack: () => void;
}) {
  const isHold = exercise.reps === 0;
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(isHold ? exercise.duration : 0);
  const [running, setRunning] = useState(false);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [repCount, setRepCount] = useState(0);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Timer for holds
  useEffect(() => {
    if (!running || isHold === false) return;
    if (timeLeft <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft, isHold]);

  // Rest timer between sets
  useEffect(() => {
    if (!resting) return;
    if (restTime <= 0) { setResting(false); return; }
    const t = setTimeout(() => setRestTime(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resting, restTime]);

  const handleCompleteSet = () => {
    if (currentSet >= exercise.sets) {
      // All sets done — complete exercise
      onComplete();
    } else {
      // Start rest between sets
      setCurrentSet(s => s + 1);
      setRepCount(0);
      if (isHold) setTimeLeft(exercise.duration);
      setRunning(false);
      setRestTime(15);
      setResting(true);
    }
  };

  const handleRepTap = () => {
    const next = repCount + 1;
    setRepCount(next);
    // Auto-complete set when all reps done
    if (next >= exercise.reps) {
      setTimeout(() => handleCompleteSet(), 300);
    }
  };

  // Rest between sets overlay
  if (resting) {
    const pct = ((15 - restTime) / 15) * 100;
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 8 }}>REST BETWEEN SETS</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', marginBottom: 16 }}>{restTime}s</div>
        <div style={{ width: 200, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 24 }}>
          <div style={{ height: '100%', borderRadius: 2, background: 'var(--primary)', width: `${pct}%`, transition: 'width 1s linear' }} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Set {currentSet} of {exercise.sets} coming up</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24 }}>{exercise.name}</div>
        <button onClick={() => { setResting(false); setRestTime(0); }} style={{
          padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--primary)',
          color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer',
        }}>SKIP REST</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '48px 16px 12px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 8 }}>
          {exerciseNum}/{totalExercises}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Timer size={12} /> {fmt(exercise.duration)}
          </div>
          <button onClick={onBack} style={{
            background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} color="#fff" /></button>
        </div>
      </div>

      {/* Exercise Animation / Illustration */}
      <div style={{
        flex: 1, minHeight: '50vh',
        background: 'linear-gradient(180deg, rgba(200,168,78,0.05) 0%, rgba(0,0,0,0) 40%), #000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {exercise.frames && exercise.frames.length > 0 ? (
          <ExerciseAnimation frames={exercise.frames} description={exercise.description} frameTiming={(exercise as any).frameTiming} />
        ) : (
          <>
            <Dumbbell size={48} color="rgba(200,168,78,0.25)" />
            <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 12 }}>Follow the description below</div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ background: '#000', padding: '20px 20px 36px' }}>
        {/* Exercise name */}
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontStyle: 'italic', marginBottom: 6 }}>
          {exercise.name.toUpperCase()}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          {exercise.description}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Badge>{exercise.sets} SETS</Badge>
          <Badge>{isHold ? `${fmt(exercise.duration)} HOLD` : `${exercise.reps} REPS`}</Badge>
          <Badge>SET {currentSet}/{exercise.sets}</Badge>
        </div>

        {isHold ? (
          /* ── HOLD MODE ── */
          <>
            {/* Timer display */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginRight: 16 }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 1s linear',
                  background: timeLeft <= 0 ? '#22C55E' : 'var(--primary)',
                  width: `${((exercise.duration - timeLeft) / exercise.duration) * 100}%`,
                }} />
              </div>
              <div style={{
                fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                color: timeLeft <= 0 ? '#22C55E' : 'var(--primary)', minWidth: 70, textAlign: 'right',
              }}>
                {fmt(timeLeft)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setRunning(!running)} style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {running ? <Pause size={22} color="var(--primary)" /> : <Play size={22} color="var(--primary)" fill="var(--primary)" />}
              </button>
              <button onClick={handleCompleteSet} disabled={timeLeft > 0 && !running} style={{
                flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
                background: timeLeft <= 0 ? 'var(--primary)' : 'rgba(200,168,78,0.2)',
                color: timeLeft <= 0 ? '#000' : 'var(--primary)', fontSize: 15, fontWeight: 900,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: timeLeft <= 0 ? '0 0 20px rgba(200,168,78,0.3)' : 'none',
              }}>
                <Check size={18} strokeWidth={3} />
                {timeLeft <= 0 ? (currentSet >= exercise.sets ? 'COMPLETE EXERCISE' : 'COMPLETE SET') : 'HOLDING...'}
              </button>
            </div>
          </>
        ) : (
          /* ── REPS MODE ── */
          <>
            {/* Rep counter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginRight: 16 }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.3s ease',
                  background: repCount >= exercise.reps ? '#22C55E' : 'var(--primary)',
                  width: `${(repCount / exercise.reps) * 100}%`,
                }} />
              </div>
              <div style={{
                fontSize: 32, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                color: repCount >= exercise.reps ? '#22C55E' : 'var(--primary)', minWidth: 70, textAlign: 'right',
              }}>
                {repCount}/{exercise.reps}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* TAP button for counting reps */}
              <button onClick={handleRepTap} disabled={repCount >= exercise.reps} style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                border: '2px solid var(--primary)',
                background: repCount >= exercise.reps ? 'rgba(34,197,94,0.15)' : 'rgba(200,168,78,0.1)',
                cursor: repCount >= exercise.reps ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'var(--primary)',
              }}>
                {repCount >= exercise.reps ? <Check size={22} color="#22C55E" /> : '+1'}
              </button>

              <button onClick={handleCompleteSet} style={{
                flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
                background: repCount >= exercise.reps ? 'var(--primary)' : 'rgba(200,168,78,0.15)',
                color: repCount >= exercise.reps ? '#000' : 'var(--primary)',
                fontSize: 15, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: repCount >= exercise.reps ? '0 0 20px rgba(200,168,78,0.3)' : 'none',
              }}>
                <Check size={18} strokeWidth={3} />
                {repCount >= exercise.reps
                  ? (currentSet >= exercise.sets ? 'COMPLETE EXERCISE' : 'COMPLETE SET')
                  : `TAP TO COUNT (${repCount}/${exercise.reps})`}
              </button>
            </div>
          </>
        )}

        {/* Skip */}
        <button onClick={onSkip} style={{
          width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 10,
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <SkipForward size={14} /> Skip Exercise
        </button>
      </div>
    </div>
  );
}

/* ── Exercise Animation — frame-by-frame player with admin-managed timing ── */
function ExerciseAnimation({ frames, description, frameTiming }: { frames: string[]; description: string; frameTiming?: { url: string; duration_ms: number }[] }) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  // Use admin-managed frameTiming if available, otherwise fall back to old logic
  const hasAdminFrames = frameTiming && frameTiming.length > 0;
  const displayFrames = hasAdminFrames ? frameTiming!.map(f => f.url) : frames;

  // Extract hold time from description as fallback
  const fallbackMs = (() => {
    const match = description.match(/hold\s+(\d+)\s*(?:seconds?|s)/i);
    return match ? parseInt(match[1]) * 1000 : 3000;
  })();

  useEffect(() => {
    if (displayFrames.length <= 1) return;
    let ms: number;
    if (hasAdminFrames) {
      // Use per-frame timing from admin panel
      ms = frameTiming![idx % frameTiming!.length]?.duration_ms || 2000;
    } else {
      // Legacy: frame 0 = brief, others = hold time
      ms = idx === 0 ? 1500 : fallbackMs;
    }
    const timeout = setTimeout(() => setIdx(i => (i + 1) % displayFrames.length), ms);
    return () => clearTimeout(timeout);
  }, [idx, displayFrames.length, hasAdminFrames, fallbackMs]);

  // Preload all frames
  useEffect(() => {
    displayFrames.forEach((src, i) => {
      const img = new Image();
      img.onload = () => setLoaded(prev => new Set(prev).add(i));
      img.src = src;
    });
  }, [displayFrames]);

  const currentMs = hasAdminFrames
    ? (frameTiming![idx % (frameTiming!.length || 1)]?.duration_ms || 2000)
    : (idx === 0 ? 1500 : fallbackMs);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#000' }}>
      {/* Skeleton placeholder while loading */}
      {loaded.size < displayFrames.length && (
        <div className="skeleton" style={{ position: 'absolute', width: '75%', height: '75%', borderRadius: 12 }} />
      )}
      {displayFrames.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          style={{
            position: i === 0 ? 'relative' : 'absolute',
            maxWidth: '85%',
            maxHeight: '85%',
            objectFit: 'contain',
            opacity: i === (idx % displayFrames.length) ? 1 : 0,
            transition: 'opacity 0.4s ease-in-out',
            borderRadius: 12,
            filter: 'brightness(0.82) contrast(1.3) saturate(1.3)',
            background: '#000',
          }}
        />
      ))}
      {/* Frame indicator dots + timing label */}
      {displayFrames.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1 }}>
            {hasAdminFrames ? `${(currentMs / 1000).toFixed(1)}s` : (idx > 0 ? `HOLD ${fallbackMs / 1000}s` : '')}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {displayFrames.map((_, i) => (
              <div key={i} style={{
                width: i === (idx % displayFrames.length) ? 18 : 6, height: 6, borderRadius: 3,
                background: i === (idx % displayFrames.length) ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Badge helper ── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: 'rgba(200,168,78,0.1)', border: '1px solid rgba(200,168,78,0.2)', color: 'var(--primary)',
    }}>{children}</div>
  );
}
