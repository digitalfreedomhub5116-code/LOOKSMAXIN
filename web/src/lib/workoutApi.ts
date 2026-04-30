/**
 * workoutApi.ts — Supabase-backed workout data layer
 * Fetches plans & exercises from the database so admin panel changes
 * are reflected in real-time on the frontend.
 */
import { supabase } from './api';

// ═══ Types ═══

export interface WorkoutFrame {
  url: string;
  duration_ms: number;
}

export interface WorkoutExercise {
  id: string;
  plan_id: string;
  exercise_index: number;
  name: string;
  duration: number;
  sets: number;
  reps: number;
  difficulty: 1 | 2 | 3;
  description: string;
  frames: WorkoutFrame[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  image: string;
  sort_order: number;
  is_active: boolean;
}

// ═══ Cache ═══
let _plansCache: WorkoutPlan[] | null = null;
let _exercisesCache: Map<string, WorkoutExercise[]> = new Map();
let _lastFetch = 0;
const CACHE_TTL = 60_000; // 1 minute

function isCacheStale() {
  return Date.now() - _lastFetch > CACHE_TTL;
}

export function invalidateCache() {
  _plansCache = null;
  _exercisesCache.clear();
  _lastFetch = 0;
}

// ═══ Fetch Plans ═══
export async function fetchPlans(): Promise<WorkoutPlan[]> {
  if (_plansCache && !isCacheStale()) return _plansCache;

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[WorkoutAPI] Failed to fetch plans:', error.message);
    return _plansCache || [];
  }

  _plansCache = data || [];
  _lastFetch = Date.now();
  return _plansCache;
}

// ═══ Fetch Exercises for a Plan ═══
export async function fetchExercises(planId: string): Promise<WorkoutExercise[]> {
  if (_exercisesCache.has(planId) && !isCacheStale()) {
    return _exercisesCache.get(planId)!;
  }

  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('plan_id', planId)
    .order('exercise_index', { ascending: true });

  if (error) {
    console.warn('[WorkoutAPI] Failed to fetch exercises:', error.message);
    return _exercisesCache.get(planId) || [];
  }

  const exercises = (data || []).map((e: any) => ({
    ...e,
    difficulty: Math.min(3, Math.max(1, e.difficulty)) as 1 | 2 | 3,
    frames: Array.isArray(e.frames) ? e.frames : [],
  }));

  _exercisesCache.set(planId, exercises);
  return exercises;
}

// ═══ Fetch ALL exercises for ALL plans (bulk load for admin) ═══
export async function fetchAllExercises(): Promise<Map<string, WorkoutExercise[]>> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .order('exercise_index', { ascending: true });

  if (error) {
    console.warn('[WorkoutAPI] Failed to fetch all exercises:', error.message);
    return _exercisesCache;
  }

  const map = new Map<string, WorkoutExercise[]>();
  for (const row of data || []) {
    const ex: WorkoutExercise = {
      ...row,
      difficulty: Math.min(3, Math.max(1, row.difficulty)) as 1 | 2 | 3,
      frames: Array.isArray(row.frames) ? row.frames : [],
    };
    if (!map.has(ex.plan_id)) map.set(ex.plan_id, []);
    map.get(ex.plan_id)!.push(ex);
  }

  _exercisesCache = map;
  _lastFetch = Date.now();
  return map;
}

// ═══ Admin: Update exercise frames ═══
export async function updateExerciseFrames(exerciseId: string, frames: WorkoutFrame[]): Promise<boolean> {
  const { error } = await supabase
    .from('workout_exercises')
    .update({ frames, updated_at: new Date().toISOString() })
    .eq('id', exerciseId);

  if (error) {
    console.error('[WorkoutAPI] Failed to update frames:', error.message);
    return false;
  }
  invalidateCache();
  return true;
}

// ═══ Admin: Update exercise details ═══
export async function updateExercise(exerciseId: string, data: Partial<WorkoutExercise>): Promise<boolean> {
  const { error } = await supabase
    .from('workout_exercises')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', exerciseId);

  if (error) {
    console.error('[WorkoutAPI] Failed to update exercise:', error.message);
    return false;
  }
  invalidateCache();
  return true;
}

// ═══ Admin: Add new exercise to a plan ═══
export async function addExercise(planId: string, exercise: Omit<WorkoutExercise, 'id'>): Promise<WorkoutExercise | null> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      plan_id: planId,
      exercise_index: exercise.exercise_index,
      name: exercise.name,
      duration: exercise.duration,
      sets: exercise.sets,
      reps: exercise.reps,
      difficulty: exercise.difficulty,
      description: exercise.description,
      frames: exercise.frames || [],
    })
    .select()
    .single();

  if (error) {
    console.error('[WorkoutAPI] Failed to add exercise:', error.message);
    return null;
  }
  invalidateCache();
  return data as WorkoutExercise;
}

// ═══ Admin: Delete exercise ═══
export async function deleteExercise(exerciseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    console.error('[WorkoutAPI] Failed to delete exercise:', error.message);
    return false;
  }
  invalidateCache();
  return true;
}

// ═══ Admin: Re-index exercises after add/delete ═══
export async function reindexExercises(planId: string): Promise<void> {
  const exercises = await fetchExercises(planId);
  // Sort by current index and reassign sequential indices
  const sorted = [...exercises].sort((a, b) => a.exercise_index - b.exercise_index);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].exercise_index !== i) {
      await supabase
        .from('workout_exercises')
        .update({ exercise_index: i })
        .eq('id', sorted[i].id);
    }
  }
  invalidateCache();
}

// ═══ Fetch all plans (including inactive, for admin) ═══
export async function fetchAllPlans(): Promise<WorkoutPlan[]> {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[WorkoutAPI] Failed to fetch all plans:', error.message);
    return [];
  }
  return data || [];
}

// ═══ Admin: Toggle plan visibility (hide/show from frontend) ═══
export async function togglePlanVisibility(planId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('workout_plans')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', planId);

  if (error) {
    console.error('[WorkoutAPI] Failed to toggle plan visibility:', error.message);
    return false;
  }
  invalidateCache();
  return true;
}

// ═══ Admin: Update exercise name ═══
export async function updateExerciseName(exerciseId: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('workout_exercises')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', exerciseId);

  if (error) {
    console.error('[WorkoutAPI] Failed to update exercise name:', error.message);
    return false;
  }
  invalidateCache();
  return true;
}
