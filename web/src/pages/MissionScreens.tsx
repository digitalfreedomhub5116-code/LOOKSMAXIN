import { useState, useEffect } from 'react';
import { ChevronLeft, Play, Pause, Check, Dumbbell, Timer, Zap, X } from 'lucide-react';
import type { PlanDay, ExerciseItem } from '../data/exercisePlans';

/* ═══ Mission Overview — Exercise list + ENTER PROGRAM ═══ */
export function MissionOverview({ planName, dayData, completedExIds, onEnterProgram, onBack }: {
  planName: string;
  dayData: PlanDay;
  completedExIds: string[];
  onEnterProgram: () => void;
  onBack: () => void;
}) {
  const doneCount = completedExIds.length;
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
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--primary)', textTransform: 'uppercase' }}>
                MISSION GATE
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>
                DAY {dayData.day} — {dayData.phase}
              </div>
            </div>
          </div>
          <button onClick={onBack} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
            padding: '6px 14px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1,
          }}>
            [ ESCAPE ]
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{planName}</div>
      </div>

      {/* Hero banner placeholder */}
      <div style={{
        margin: '16px 20px', height: 120, borderRadius: 14, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, rgba(200,168,78,0.12) 0%, rgba(200,168,78,0.03) 100%)',
        border: '1px solid rgba(200,168,78,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>DAY {dayData.day}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{dayData.phase} Phase · {dayData.exercises.length} exercises</div>
        </div>
      </div>

      {/* Exercise Sequence */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            PROTOCOL SEQUENCE
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
            {dayData.exercises.length} EXERCISES
          </div>
        </div>

        {dayData.exercises.map((ex, i) => {
          const done = completedExIds.includes(ex.id);
          const isHold = ex.reps === 0;
          return (
            <div key={ex.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderRadius: 14, marginBottom: 8,
              background: done ? 'rgba(200,168,78,0.06)' : 'var(--surface)',
              border: `1px solid ${done ? 'rgba(200,168,78,0.2)' : 'var(--border)'}`,
            }}>
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: done ? 'rgba(200,168,78,0.15)' : 'rgba(200,168,78,0.08)',
                border: `1.5px solid ${done ? 'var(--primary)' : 'rgba(200,168,78,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                <Dumbbell size={20} color="var(--primary)" />
                {done && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
                    background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: done ? 'var(--text-muted)' : '#fff',
                  textDecoration: done ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{ex.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isHold ? 'HOLD' : 'REPS'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {'⭐'.repeat(ex.difficulty)}
                  </span>
                </div>
              </div>
              {/* Sets/Reps */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{ex.sets} SETS</div>
                <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  {isHold ? `${Math.floor(ex.duration / 60)}m hold` : `${ex.reps}`}
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

      {/* ENTER PROGRAM Button */}
      <div style={{ padding: '16px 20px 40px', position: 'sticky', bottom: 0, background: 'linear-gradient(transparent, #000 30%)' }}>
        <button onClick={onEnterProgram} style={{
          width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
          background: 'var(--primary)', color: '#000',
          fontSize: 16, fontWeight: 900, letterSpacing: 1.5, cursor: 'pointer',
          boxShadow: '0 0 24px rgba(200,168,78,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Zap size={18} fill="#000" />
          ENTER PROGRAM
        </button>
      </div>
    </div>
  );
}

/* ═══ Exercise Runner — Full-screen video + timer + COMPLETE SET ═══ */
export function ExerciseRunner({ dayData, completedExIds, onCompleteExercise, onCompleteDay, onBack }: {
  dayData: PlanDay;
  completedExIds: string[];
  onCompleteExercise: (exId: string) => void;
  onCompleteDay: () => void;
  onBack: () => void;
}) {
  const remaining = dayData.exercises.filter(ex => !completedExIds.includes(ex.id));
  const [currentIdx, setCurrentIdx] = useState(0);
  const exercise = remaining[currentIdx];

  // If all done
  if (!exercise || remaining.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.3s',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginBottom: 8 }}>ALL EXERCISES DONE!</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Day {dayData.day} complete</div>
        <button onClick={onCompleteDay} style={{
          padding: '16px 48px', borderRadius: 12, border: 'none', background: 'var(--primary)',
          color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer', letterSpacing: 1,
        }}>✓ COMPLETE DAY</button>
        <button onClick={onBack} style={{
          marginTop: 16, padding: '12px 32px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Back to Map</button>
      </div>
    );
  }

  return (
    <SingleExerciseView
      key={exercise.id}
      exercise={exercise}
      exerciseNum={dayData.exercises.indexOf(exercise) + 1}
      totalExercises={dayData.exercises.length}
      onComplete={() => {
        onCompleteExercise(exercise.id);
        if (currentIdx < remaining.length - 1) setCurrentIdx(currentIdx + 1);
        else setCurrentIdx(0); // will trigger "all done" on re-render
      }}
      onSkip={() => {
        if (currentIdx < remaining.length - 1) setCurrentIdx(currentIdx + 1);
      }}
      onBack={onBack}
    />
  );
}

/* ═══ Single Exercise View — Video + Timer + Complete Set ═══ */
function SingleExerciseView({ exercise, exerciseNum, totalExercises, onComplete, onSkip, onBack }: {
  exercise: ExerciseItem;
  exerciseNum: number;
  totalExercises: number;
  onComplete: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const isHold = exercise.reps === 0;
  const [timeLeft, setTimeLeft] = useState(exercise.duration);
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);

  useEffect(() => {
    setTimeLeft(exercise.duration);
    setRunning(false);
    setCurrentSet(1);
  }, [exercise.id]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) { setRunning(false); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [running, timeLeft]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const allSetsDone = currentSet > exercise.sets;
  const holdDone = isHold && timeLeft <= 0;

  const handleCompleteSet = () => {
    if (isHold) {
      if (holdDone || !running) {
        // Complete this hold exercise
        onComplete();
      }
    } else {
      if (currentSet < exercise.sets) {
        setCurrentSet(s => s + 1);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '48px 16px 12px',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#fff',
          background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8,
        }}>
          {exerciseNum}/{totalExercises}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Timer size={12} /> {fmt(exercise.duration)}
          </div>
          <button onClick={onBack} style={{
            background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="#fff" />
          </button>
        </div>
      </div>

      {/* Video Placeholder Area */}
      <div style={{
        flex: 1, minHeight: '55vh',
        background: 'linear-gradient(180deg, rgba(200,168,78,0.05) 0%, rgba(0,0,0,0) 40%), var(--surface)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <Dumbbell size={56} color="rgba(200,168,78,0.3)" />
        <div style={{ fontSize: 14, color: 'var(--text-disabled)', marginTop: 12 }}>Video coming soon</div>
        <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>Tap to play when available</div>
      </div>

      {/* Bottom Controls */}
      <div style={{ background: '#000', padding: '20px 20px 40px' }}>
        {/* Exercise Name */}
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontStyle: 'italic', marginBottom: 8 }}>
          {exercise.name.toUpperCase()}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            background: 'rgba(200,168,78,0.1)', border: '1px solid rgba(200,168,78,0.2)', color: 'var(--primary)',
          }}>
            {exercise.sets} SETS
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            background: 'rgba(200,168,78,0.1)', border: '1px solid rgba(200,168,78,0.2)', color: 'var(--primary)',
          }}>
            {isHold ? `${fmt(exercise.duration)} HOLD` : `${exercise.reps} REPS`}
          </div>
        </div>

        {/* Timer / Set indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Progress bar */}
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginRight: 16 }}>
            <div style={{
              height: '100%', borderRadius: 2, background: 'var(--primary)', transition: 'width 0.3s',
              width: isHold
                ? `${((exercise.duration - timeLeft) / exercise.duration) * 100}%`
                : `${((currentSet - 1) / exercise.sets) * 100}%`,
            }} />
          </div>
          {/* Timer display */}
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}>
            {isHold ? fmt(timeLeft) : `${Math.min(currentSet, exercise.sets)}/${exercise.sets}`}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Pause/Play for holds */}
          {isHold && (
            <button onClick={() => setRunning(!running)} style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {running ? <Pause size={22} color="var(--primary)" /> : <Play size={22} color="var(--primary)" fill="var(--primary)" />}
            </button>
          )}

          {/* Complete Set / Complete Exercise */}
          <button onClick={handleCompleteSet} style={{
            flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
            background: (holdDone || allSetsDone || !isHold) ? 'var(--primary)' : 'var(--primary)',
            color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 0 20px rgba(200,168,78,0.3)',
            letterSpacing: 0.5,
          }}>
            <Check size={18} strokeWidth={3} />
            {isHold ? 'COMPLETE EXERCISE' : allSetsDone ? 'NEXT EXERCISE' : 'COMPLETE SET'}
          </button>
        </div>

        {/* Skip */}
        <button onClick={onSkip} style={{
          width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 10,
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          Skip Exercise →
        </button>
      </div>
    </div>
  );
}
