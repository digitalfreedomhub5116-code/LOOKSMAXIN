/**
 * workoutApi.ts — Supabase-backed workout data layer
 * Day-based exercise management for admin panel.
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
  day_number: number;
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
const CACHE_TTL = 60_000;

function isCacheStale() { return Date.now() - _lastFetch > CACHE_TTL; }

export function invalidateCache() {
  _plansCache = null;
  _exercisesCache.clear();
  _lastFetch = 0;
}

// ═══ Fetch active plans (frontend) ═══
export async function fetchPlans(): Promise<WorkoutPlan[]> {
  if (_plansCache && !isCacheStale()) return _plansCache;
  const { data, error } = await supabase
    .from('workout_plans').select('*').eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) { console.warn('[WorkoutAPI]', error.message); return _plansCache || []; }
  _plansCache = data || [];
  _lastFetch = Date.now();
  return _plansCache;
}

// ═══ Fetch exercises for a plan (all days) ═══
export async function fetchExercises(planId: string): Promise<WorkoutExercise[]> {
  if (_exercisesCache.has(planId) && !isCacheStale()) return _exercisesCache.get(planId)!;
  const { data, error } = await supabase
    .from('workout_exercises').select('*').eq('plan_id', planId)
    .order('day_number', { ascending: true })
    .order('exercise_index', { ascending: true });
  if (error) { console.warn('[WorkoutAPI]', error.message); return _exercisesCache.get(planId) || []; }
  const exercises = (data || []).map((e: any) => ({
    ...e,
    difficulty: Math.min(3, Math.max(1, e.difficulty)) as 1 | 2 | 3,
    frames: Array.isArray(e.frames) ? e.frames : [],
  }));
  _exercisesCache.set(planId, exercises);
  return exercises;
}

// ═══ Fetch ALL exercises (admin bulk load) ═══
export async function fetchAllExercises(): Promise<Map<string, WorkoutExercise[]>> {
  const { data, error } = await supabase
    .from('workout_exercises').select('*')
    .order('day_number', { ascending: true })
    .order('exercise_index', { ascending: true });
  if (error) { console.warn('[WorkoutAPI]', error.message); return _exercisesCache; }
  const map = new Map<string, WorkoutExercise[]>();
  for (const row of data || []) {
    const ex: WorkoutExercise = { ...row, difficulty: Math.min(3, Math.max(1, row.difficulty)) as 1 | 2 | 3, frames: Array.isArray(row.frames) ? row.frames : [] };
    if (!map.has(ex.plan_id)) map.set(ex.plan_id, []);
    map.get(ex.plan_id)!.push(ex);
  }
  _exercisesCache = map;
  _lastFetch = Date.now();
  return map;
}

// ═══ Fetch all plans (admin, including inactive) ═══
export async function fetchAllPlans(): Promise<WorkoutPlan[]> {
  const { data, error } = await supabase
    .from('workout_plans').select('*').order('sort_order', { ascending: true });
  if (error) { console.warn('[WorkoutAPI]', error.message); return []; }
  return data || [];
}

// ═══ Update exercise frames ═══
export async function updateExerciseFrames(exerciseId: string, frames: WorkoutFrame[]): Promise<boolean> {
  const { error } = await supabase.from('workout_exercises')
    .update({ frames, updated_at: new Date().toISOString() }).eq('id', exerciseId);
  if (error) { console.error('[WorkoutAPI]', error.message); return false; }
  invalidateCache(); return true;
}

// ═══ Update exercise name ═══
export async function updateExerciseName(exerciseId: string, name: string): Promise<boolean> {
  const { error } = await supabase.from('workout_exercises')
    .update({ name, updated_at: new Date().toISOString() }).eq('id', exerciseId);
  if (error) { console.error('[WorkoutAPI]', error.message); return false; }
  invalidateCache(); return true;
}

// ═══ Update exercise details ═══
export async function updateExercise(exerciseId: string, data: Partial<WorkoutExercise>): Promise<boolean> {
  const { error } = await supabase.from('workout_exercises')
    .update({ ...data, updated_at: new Date().toISOString() }).eq('id', exerciseId);
  if (error) { console.error('[WorkoutAPI]', error.message); return false; }
  invalidateCache(); return true;
}

// ═══ Add exercise to a specific day ═══
export async function addExercise(planId: string, dayNumber: number, exercise: Omit<WorkoutExercise, 'id'>): Promise<WorkoutExercise | null> {
  const { data, error } = await supabase.from('workout_exercises')
    .insert({
      plan_id: planId, day_number: dayNumber,
      exercise_index: exercise.exercise_index, name: exercise.name,
      duration: exercise.duration, sets: exercise.sets, reps: exercise.reps,
      difficulty: exercise.difficulty, description: exercise.description,
      frames: exercise.frames || [],
    }).select().single();
  if (error) { console.error('[WorkoutAPI]', error.message); return null; }
  invalidateCache(); return data as WorkoutExercise;
}

// ═══ Delete exercise ═══
export async function deleteExercise(exerciseId: string): Promise<boolean> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);
  if (error) { console.error('[WorkoutAPI]', error.message); return false; }
  invalidateCache(); return true;
}

// ═══ Re-index exercises for a specific day ═══
export async function reindexExercises(planId: string, dayNumber: number): Promise<void> {
  const all = await fetchExercises(planId);
  const dayExs = all.filter(e => e.day_number === dayNumber).sort((a, b) => a.exercise_index - b.exercise_index);
  for (let i = 0; i < dayExs.length; i++) {
    if (dayExs[i].exercise_index !== i) {
      await supabase.from('workout_exercises').update({ exercise_index: i }).eq('id', dayExs[i].id);
    }
  }
  invalidateCache();
}

// ═══ Copy exercise to a target plan + day ═══
export async function copyExerciseToDay(exercise: WorkoutExercise, targetPlanId: string, targetDay: number, targetIndex: number): Promise<WorkoutExercise | null> {
  const { data, error } = await supabase.from('workout_exercises')
    .insert({
      plan_id: targetPlanId, day_number: targetDay,
      exercise_index: targetIndex, name: exercise.name,
      duration: exercise.duration, sets: exercise.sets, reps: exercise.reps,
      difficulty: exercise.difficulty, description: exercise.description,
      frames: exercise.frames || [],
    }).select().single();
  if (error) { console.error('[WorkoutAPI] Copy failed:', error.message); return null; }
  invalidateCache(); return data as WorkoutExercise;
}

// ═══ Toggle plan visibility ═══
export async function togglePlanVisibility(planId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase.from('workout_plans')
    .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', planId);
  if (error) { console.error('[WorkoutAPI]', error.message); return false; }
  invalidateCache(); return true;
}
