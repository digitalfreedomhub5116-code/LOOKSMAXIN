/**
 * useWorkoutData.ts — Hook to load workout exercises from Supabase
 * Merges DB frames/exercises into the plan structure so the
 * frontend always shows the latest admin panel changes.
 * Hidden plans (is_active=false) are filtered out automatically.
 */
import { useState, useEffect, useCallback } from 'react';
import { PLANS } from '../data/exercisePlans';
import type { ExercisePlan, ExerciseItem, FrameTiming } from '../data/exercisePlans';
import { fetchExercises, fetchPlans } from '../lib/workoutApi';
import type { WorkoutExercise, WorkoutPlan } from '../lib/workoutApi';

/** Build an enriched ExerciseItem from a DB row */
function dbToExerciseItem(dbEx: WorkoutExercise, planId: string, dayNum: number, exIdx: number): ExerciseItem {
  const frames = dbEx.frames
    .filter(f => f.url && f.url.trim() !== '')
    .map(f => f.url);

  const frameTiming: FrameTiming[] = dbEx.frames
    .filter(f => f.url && f.url.trim() !== '')
    .map(f => ({ url: f.url, duration_ms: f.duration_ms || 2000 }));

  return {
    id: `${planId}-d${dayNum}-e${exIdx}`,
    name: dbEx.name,
    duration: dbEx.duration,
    sets: dbEx.sets,
    reps: dbEx.reps,
    difficulty: dbEx.difficulty,
    description: dbEx.description,
    frames: frames.length > 0 ? frames : undefined,
    frameTiming: frameTiming.length > 0 ? frameTiming : undefined,
  };
}

/**
 * Rebuild plan days using DB exercises instead of local static data.
 */
function buildDaysFromDB(planId: string, exercises: WorkoutExercise[]): ExercisePlan['days'] {
  if (exercises.length === 0) return [];

  const days: ExercisePlan['days'] = [];
  for (let d = 1; d <= 30; d++) {
    const phase = d <= 10 ? 'Foundation' : d <= 20 ? 'Intensify' : 'Mastery';
    const count = d <= 10 ? 4 : 5;
    const dayExercises: ExerciseItem[] = [];

    for (let e = 0; e < count; e++) {
      const idx = ((d - 1) * count + e) % exercises.length;
      const dbEx = exercises[idx];
      const item = dbToExerciseItem(dbEx, planId, d, e);
      if (phase === 'Mastery') item.sets = dbEx.sets + 1;
      dayExercises.push(item);
    }

    const day: ExercisePlan['days'][0] = { day: d, phase: phase as any, exercises: dayExercises };
    if (d === 10) { day.milestone = 'Phase 1 Complete!'; day.bonusXP = 50; }
    if (d === 20) { day.milestone = 'Phase 2 Complete!'; day.bonusXP = 75; }
    if (d === 30) { day.milestone = 'Plan Complete! 🏆'; day.bonusXP = 150; }
    days.push(day);
  }
  return days;
}

/** Convert a WorkoutPlan DB row + local fallback into an ExercisePlan */
function dbPlanToExercisePlan(dbPlan: WorkoutPlan): ExercisePlan {
  const localPlan = PLANS.find(p => p.id === dbPlan.id);
  return {
    id: dbPlan.id,
    name: dbPlan.name,
    description: dbPlan.description,
    image: dbPlan.image,
    days: localPlan?.days || [], // will be overridden when exercises are loaded
  };
}

export interface WorkoutDataState {
  plans: ExercisePlan[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * useWorkoutData — fetches active plans + exercises from Supabase.
 * Hidden plans (is_active=false) are automatically excluded.
 * Falls back to local PLANS data if DB fetch fails.
 */
export function useWorkoutData(activePlanId: string | null): WorkoutDataState {
  const [plans, setPlans] = useState<ExercisePlan[]>(PLANS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active plans from Supabase (hidden plans are filtered by is_active=true)
      const dbPlans = await fetchPlans();

      if (dbPlans.length > 0) {
        // Build ExercisePlan[] from DB plans
        const builtPlans = dbPlans.map(dbPlanToExercisePlan);

        // If we have an active plan, also fetch its exercises for day enrichment
        if (activePlanId) {
          const dbExercises = await fetchExercises(activePlanId);
          if (dbExercises.length > 0) {
            const planIdx = builtPlans.findIndex(p => p.id === activePlanId);
            if (planIdx >= 0) {
              builtPlans[planIdx] = {
                ...builtPlans[planIdx],
                days: buildDaysFromDB(activePlanId, dbExercises),
              };
            }
          }
        }

        setPlans(builtPlans);
      }
      // If DB returned nothing, keep using local PLANS as fallback
    } catch (e) {
      console.warn('[useWorkoutData] DB fetch failed, using local data:', e);
    }
    setLoading(false);
  }, [activePlanId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { plans, loading, refresh };
}
