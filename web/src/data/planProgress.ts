// ═══════════════════════════════════
//  Plan Progress — localStorage + Cloud Sync
// ═══════════════════════════════════

import { pushField } from '../lib/sync';

const STORAGE_KEY = 'lynx_plan_progress';

export interface PlanProgress {
  startDate: string;
  completedDays: number[];
  completedExercises: Record<number, string[]>; // day -> exerciseIds
  currentDay: number;
  totalXP: number;
}

export interface UserProgress {
  activePlanId: string | null;
  plans: Record<string, PlanProgress>;
}

function load(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { activePlanId: null, plans: {} };
}

function save(data: UserProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Sync to cloud (fire-and-forget)
  pushField('plan_progress', data).catch(() => {});
}

export function getProgress(): UserProgress {
  return load();
}

export function getActivePlanId(): string | null {
  return load().activePlanId;
}

export function getPlanProgress(planId: string): PlanProgress | null {
  return load().plans[planId] || null;
}

export function startPlan(planId: string): UserProgress {
  const data = load();
  data.activePlanId = planId;
  if (!data.plans[planId]) {
    data.plans[planId] = {
      startDate: new Date().toISOString(),
      completedDays: [],
      completedExercises: {},
      currentDay: 1,
      totalXP: 0,
    };
  }
  save(data);
  return data;
}

export function switchPlan(planId: string): UserProgress {
  const data = load();
  data.activePlanId = planId;
  save(data);
  return data;
}

export function completeExercise(planId: string, day: number, exerciseId: string): UserProgress {
  const data = load();
  if (!data.plans[planId]) return data;
  const plan = data.plans[planId];
  if (!plan.completedExercises[day]) plan.completedExercises[day] = [];
  if (!plan.completedExercises[day].includes(exerciseId)) {
    plan.completedExercises[day].push(exerciseId);
  }
  save(data);
  return data;
}

export function completeDay(planId: string, day: number, xp: number): UserProgress {
  const data = load();
  if (!data.plans[planId]) return data;
  const plan = data.plans[planId];
  if (!plan.completedDays.includes(day)) {
    plan.completedDays.push(day);
    plan.totalXP += xp;
    plan.currentDay = Math.max(plan.currentDay, day + 1);
  }
  save(data);
  return data;
}

export function isDayComplete(planId: string, day: number): boolean {
  const data = load();
  return data.plans[planId]?.completedDays.includes(day) ?? false;
}

export function getCompletedExercises(planId: string, day: number): string[] {
  const data = load();
  return data.plans[planId]?.completedExercises[day] || [];
}
