import { useState, useEffect, useCallback } from 'react';
import { Check, Lock, ChevronDown, ChevronUp, Play, Pause, RotateCcw, Trophy, X, ChevronLeft, Dumbbell, Timer, Zap } from 'lucide-react';
import { PLANS } from '../data/exercisePlans';
import type { ExercisePlan, ExerciseItem, PlanDay } from '../data/exercisePlans';
import * as progress from '../data/planProgress';
import { MissionOverview, ExerciseRunner } from './MissionScreens';

export default function Programs() {
  const [userProgress, setUserProgress] = useState(progress.getProgress());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [missionDay, setMissionDay] = useState<number | null>(null); // full-screen mission overview
  const [runnerDay, setRunnerDay] = useState<number | null>(null);   // exercise runner mode

  const activePlan = PLANS.find(p => p.id === userProgress.activePlanId) || null;
  const planProgress = activePlan ? userProgress.plans[activePlan.id] : null;
  const currentDay = planProgress?.currentDay || 1;

  const handleStartPlan = (planId: string) => {
    setUserProgress(progress.startPlan(planId));
    setExpandedDay(null);
  };

  const handleSwitchPlan = (planId: string) => {
    if (planId === userProgress.activePlanId) return;
    if (!userProgress.plans[planId]) {
      setUserProgress(progress.startPlan(planId));
    } else {
      setUserProgress(progress.switchPlan(planId));
    }
    setExpandedDay(null);
  };

  const handleCompleteExercise = (exId: string, day: number) => {
    if (!activePlan) return;
    setUserProgress(progress.completeExercise(activePlan.id, day, exId));
  };

  const handleCompleteDay = (day: number, bonusXP?: number) => {
    if (!activePlan) return;
    const xp = 20 + (bonusXP || 0);
    setUserProgress(progress.completeDay(activePlan.id, day, xp));
    setExpandedDay(null);
    setMissionDay(null);
    setRunnerDay(null);
  };

  // Full-screen Exercise Runner
  if (runnerDay !== null && activePlan) {
    const dayData = activePlan.days[runnerDay - 1];
    const completedExIds = planProgress?.completedExercises[runnerDay] || [];
    return (
      <ExerciseRunner
        dayData={dayData}
        completedExIds={completedExIds}
        onCompleteExercise={(exId) => handleCompleteExercise(exId, runnerDay)}
        onCompleteDay={() => handleCompleteDay(runnerDay, dayData.bonusXP)}
        onBack={() => setRunnerDay(null)}
      />
    );
  }

  // Full-screen Mission Overview
  if (missionDay !== null && activePlan) {
    const dayData = activePlan.days[missionDay - 1];
    const completedExIds = planProgress?.completedExercises[missionDay] || [];
    return (
      <MissionOverview
        planName={activePlan.name}
        dayData={dayData}
        completedExIds={completedExIds}
        onEnterProgram={() => { setRunnerDay(missionDay); setMissionDay(null); }}
        onBack={() => setMissionDay(null)}
      />
    );
  }

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

          {/* Journey Map */}
          <JourneyMap
            plan={activePlan}
            completedDays={planProgress.completedDays}
            completedExercises={planProgress.completedExercises}
            currentDay={currentDay}
            expandedDay={expandedDay}
            onToggleDay={(d) => setExpandedDay(expandedDay === d ? null : d)}
            onStartMission={(d) => setMissionDay(d)}
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
function JourneyMap({ plan, completedDays, completedExercises, currentDay, expandedDay, onToggleDay, onStartMission, onCompleteDay }: {
  plan: ExercisePlan;
  completedDays: number[];
  completedExercises: Record<number, string[]>;
  currentDay: number;
  expandedDay: number | null;
  onToggleDay: (d: number) => void;
  onStartMission: (d: number) => void;
  onCompleteDay: (d: number, bonusXP?: number) => void;
}) {
  const xPattern = [35, 65, 50, 25, 70, 45, 30, 60, 50, 40,
                     65, 35, 55, 25, 70, 45, 60, 30, 50, 65,
                     35, 55, 40, 70, 30, 60, 45, 35, 55, 50];
  const NODE_SIZE = 52;
  const MILESTONE_SIZE = 60;

  // Calculate per-node height: node + card + gap
  const getNodeRowH = (dayData: PlanDay) => {
    const d = dayData.day;
    const done = completedDays.includes(d);
    const isCurrent = d === currentDay && !done;
    const locked = d > currentDay;
    const size = dayData.milestone ? MILESTONE_SIZE : NODE_SIZE;
    // Card height estimates: node + gap + card content + bottom margin
    const cardH = isCurrent ? 130 : (locked ? 50 : 80);
    return size + 12 + cardH + 20; // node + gap + card + bottom breathing room
  };

  // Calculate node positions with proper spacing
  const nodes = plan.days.map((dayData, i) => {
    const isMilestone = !!dayData.milestone;
    const size = isMilestone ? MILESTONE_SIZE : NODE_SIZE;
    const xPct = xPattern[i % xPattern.length];
    let y = 0;
    for (let j = 0; j < i; j++) {
      y += getNodeRowH(plan.days[j]);
    }
    return { dayData, x: xPct, y, size, isMilestone };
  });

  const totalH = nodes.length > 0
    ? nodes[nodes.length - 1].y + getNodeRowH(plan.days[plan.days.length - 1])
    : 0;

  // Build SVG curved path
  const svgW = 400;
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
        <path d={scaledPath} fill="none" stroke="rgba(200,168,78,0.15)" strokeWidth="10" filter="url(#trackGlow)" />
        <path d={scaledPath} fill="none" stroke="rgba(200,168,78,0.35)" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Nodes */}
      {nodes.map(({ dayData, x, y, size, isMilestone }) => {
        const d = dayData.day;
        const done = completedDays.includes(d);
        const isCurrent = d === currentDay && !done;
        const locked = d > currentDay;
        const cardOnRight = x < 50;

        return (
          <div key={d} style={{ position: 'absolute', top: y, left: 0, right: 0 }}>
            {/* Node circle */}
            <div
              onClick={() => !locked && (isCurrent ? onStartMission(d) : onToggleDay(d))}
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
                opacity: locked ? 0.6 : 1,
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

            {/* Info card */}
            <div
              onClick={() => !locked && (isCurrent ? onStartMission(d) : onToggleDay(d))}
              style={{
                position: 'absolute',
                top: size + 12,
                left: cardOnRight ? `calc(${Math.max(x - 10, 10)}%)` : undefined,
                right: !cardOnRight ? `calc(${Math.max(100 - x - 10, 10)}%)` : undefined,
                width: '52%',
                maxWidth: 210,
                padding: isCurrent ? '12px 14px' : '8px 12px',
                borderRadius: 12,
                cursor: locked ? 'default' : 'pointer',
                zIndex: 2,
                background: isCurrent
                  ? 'rgba(200,168,78,0.06)'
                  : 'rgba(17,17,17,0.85)',
                border: isCurrent
                  ? '1.5px solid rgba(200,168,78,0.35)'
                  : '1px solid rgba(255,255,255,0.08)',
                opacity: locked ? 0.6 : 1,
                backdropFilter: 'blur(8px)',
                animation: isCurrent ? 'cardFloat 3s ease-in-out infinite' : 'none',
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
                color: done ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 2,
              }}>
                DAY {d}
              </div>
              <div style={{
                fontSize: 16, fontWeight: 800,
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
          </div>
        );
      })}
    </div>
  );
}


