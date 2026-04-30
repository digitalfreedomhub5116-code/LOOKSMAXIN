/**
 * useWorkoutData.ts — Fetches day-based exercises from Supabase
 * and maps them into the local ExercisePlan structure for the frontend.
 */
import { useState, useEffect, useCallback } from 'react';
import { PLANS } from '../data/exercisePlans';
import type { ExercisePlan, ExerciseItem, FrameTiming } from '../data/exercisePlans';
import { fetchExercises, fetchPlans } from '../lib/workoutApi';
import type { WorkoutExercise, WorkoutPlan } from '../lib/workoutApi';

function dbToExerciseItem(dbEx: WorkoutExercise, planId: string, dayNum: number, exIdx: number): ExerciseItem {
  const frames = dbEx.frames.filter(f => f.url?.trim()).map(f => f.url);
  const frameTiming: FrameTiming[] = dbEx.frames.filter(f => f.url?.trim()).map(f => ({ url: f.url, duration_ms: f.duration_ms || 2000 }));
  return {
    id: `${planId}-d${dayNum}-e${exIdx}`,
    name: dbEx.name, duration: dbEx.duration, sets: dbEx.sets,
    reps: dbEx.reps, difficulty: dbEx.difficulty, description: dbEx.description,
    frames: frames.length > 0 ? frames : undefined,
    frameTiming: frameTiming.length > 0 ? frameTiming : undefined,
  };
}

function buildDaysFromDB(planId: string, exercises: WorkoutExercise[]): ExercisePlan['days'] {
  if (exercises.length === 0) return [];

  // Group by day_number
  const dayMap = new Map<number, WorkoutExercise[]>();
  for (const ex of exercises) {
    if (!dayMap.has(ex.day_number)) dayMap.set(ex.day_number, []);
    dayMap.get(ex.day_number)!.push(ex);
  }

  const days: ExercisePlan['days'] = [];
  for (let d = 1; d <= 30; d++) {
    const phase = d <= 10 ? 'Foundation' : d <= 20 ? 'Intensify' : 'Mastery';
    const dayExercises = dayMap.get(d) || [];

    // If this day has exercises in DB, use them directly
    let items: ExerciseItem[];
    if (dayExercises.length > 0) {
      items = dayExercises.map((dbEx, i) => dbToExerciseItem(dbEx, planId, d, i));
    } else {
      // Fallback: rotate all exercises if no day-specific ones exist
      const allExs = exercises.sort((a, b) => a.exercise_index - b.exercise_index);
      const count = d <= 10 ? 4 : 5;
      items = [];
      for (let e = 0; e < count; e++) {
        const idx = ((d - 1) * count + e) % allExs.length;
        items.push(dbToExerciseItem(allExs[idx], planId, d, e));
      }
    }

    const day: ExercisePlan['days'][0] = { day: d, phase: phase as any, exercises: items };
    if (d === 10) { day.milestone = 'Phase 1 Complete!'; day.bonusXP = 50; }
    if (d === 20) { day.milestone = 'Phase 2 Complete!'; day.bonusXP = 75; }
    if (d === 30) { day.milestone = 'Plan Complete! 🏆'; day.bonusXP = 150; }
    days.push(day);
  }
  return days;
}

function dbPlanToExercisePlan(dbPlan: WorkoutPlan): ExercisePlan {
  const localPlan = PLANS.find(p => p.id === dbPlan.id);
  return { id: dbPlan.id, name: dbPlan.name, description: dbPlan.description, image: dbPlan.image, days: localPlan?.days || [] };
}

export interface WorkoutDataState { plans: ExercisePlan[]; loading: boolean; refresh: () => Promise<void>; }

export function useWorkoutData(activePlanId: string | null): WorkoutDataState {
  const [plans, setPlans] = useState<ExercisePlan[]>(PLANS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const dbPlans = await fetchPlans();
      if (dbPlans.length > 0) {
        const builtPlans = dbPlans.map(dbPlanToExercisePlan);
        if (activePlanId) {
          const dbExercises = await fetchExercises(activePlanId);
          if (dbExercises.length > 0) {
            const idx = builtPlans.findIndex(p => p.id === activePlanId);
            if (idx >= 0) builtPlans[idx] = { ...builtPlans[idx], days: buildDaysFromDB(activePlanId, dbExercises) };
          }
        }
        setPlans(builtPlans);
      }
    } catch (e) { console.warn('[useWorkoutData]', e); }
    setLoading(false);
  }, [activePlanId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { plans, loading, refresh };
}
