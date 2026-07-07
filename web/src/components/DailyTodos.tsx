/**
 * DailyTodos — Contextual daily checklist on the Dashboard.
 * Auto-marks scan/exercise tasks. Manual tasks persist per day.
 */
import { useState, useEffect } from 'react';
import { generateDailyTasks, getCompletedIds, markCompleted, type DailyTask } from '../data/dailyTasks';
import { hasScannedToday } from '../lib/economy';
import { getProgress } from '../data/planProgress';
import type { FaceScores } from '../lib/api';

interface DailyTodosProps {
  scores: FaceScores | null;
  onGoPrograms?: () => void;
  onScan?: () => void;
}

export default function DailyTodos({ scores, onGoPrograms, onScan }: DailyTodosProps) {
  const progress = getProgress();
  const hasActiveProgram = !!progress.activePlanId;
  const tasks = generateDailyTasks(scores, hasActiveProgram);

  const [completedIds, setCompletedIds] = useState<string[]>(getCompletedIds());
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Auto-complete scan task
  useEffect(() => {
    if (hasScannedToday() && !completedIds.includes('scan')) {
      triggerComplete('scan');
    }
  }, []);

  // Auto-complete exercise task — check if today's day is in completedDays
  useEffect(() => {
    if (!hasActiveProgram) return;
    const planProg = progress.plans[progress.activePlanId!];
    if (!planProg) return;
    const today = planProg.currentDay - 1; // currentDay is next day after completing
    if (planProg.completedDays.includes(today) && !completedIds.includes('exercise')) {
      triggerComplete('exercise');
    }
  }, []);

  const triggerComplete = (taskId: string) => {
    setAnimatingId(taskId);
    setTimeout(() => {
      const updated = markCompleted(taskId);
      setCompletedIds([...updated]);
      setTimeout(() => setAnimatingId(null), 300);
    }, 200);
  };

  const handleTap = (task: DailyTask) => {
    if (completedIds.includes(task.id)) return;

    if (task.id === 'scan' && onScan) {
      onScan();
      return;
    }
    if (task.id === 'exercise' && onGoPrograms) {
      onGoPrograms();
      return;
    }

    // Manual tasks — mark done
    triggerComplete(task.id);
  };

  const doneCount = tasks.filter(t => completedIds.includes(t.id)).length;

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Today's Plan</div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: 'var(--primary)',
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(200,168,78,0.08)',
          border: '1px solid rgba(200,168,78,0.15)',
        }}>
          {doneCount}/{tasks.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: doneCount === tasks.length ? '#22C55E' : 'var(--primary)',
          width: `${(doneCount / tasks.length) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map(task => {
          const isDone = completedIds.includes(task.id);
          const isAnimating = animatingId === task.id;

          return (
            <div
              key={task.id}
              onClick={() => handleTap(task)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: isDone ? 'rgba(34,197,94,0.04)' : 'var(--surface)',
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.15)' : 'var(--border)'}`,
                cursor: isDone ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                border: isDone ? '2px solid #22C55E' : '2px solid rgba(255,255,255,0.15)',
                background: isDone ? 'rgba(34,197,94,0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
              }}>
                {isDone && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{
                    animation: 'checkDraw 0.3s ease-out forwards',
                  }}>
                    <path
                      d="M2.5 7.5L5.5 10.5L11.5 3.5"
                      stroke="#22C55E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 20,
                        strokeDashoffset: 0,
                        animation: 'checkStroke 0.3s ease-out forwards',
                      }}
                    />
                  </svg>
                )}
              </div>

              {/* Task text */}
              <div style={{
                flex: 1, fontSize: 14, fontWeight: 600,
                color: isDone ? 'rgba(255,255,255,0.4)' : '#fff',
                transition: 'color 0.3s',
              }}>
                {task.text}
              </div>

              {/* Arrow for actionable tasks */}
              {!isDone && (task.id === 'scan' || task.id === 'exercise') && (
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                  padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(200,168,78,0.08)',
                }}>
                  GO
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
