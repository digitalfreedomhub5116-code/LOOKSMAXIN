/**
 * Daily Tasks Engine
 * Generates 4-5 contextual daily tasks based on scan weaknesses.
 * Uses day-of-year as seed for deterministic daily rotation.
 */
import type { FaceScores } from '../lib/api';

export interface DailyTask {
  id: string;
  text: string;
  type: 'scan' | 'exercise' | 'habit' | 'skincare';
  /** If true, this task auto-completes based on app state (scan done, exercise done) */
  autoComplete: boolean;
}

// ─── Task pools by weakness category ───

const JAWLINE_TASKS: string[] = [
  'Mew for 5 minutes (tongue flat on palate)',
  'Do 30 chin tucks throughout the day',
  'Chew mastic gum for 10 minutes each side',
  'Practice proper tongue posture for 1 hour',
  'Hold jaw in correct resting position for 5 min',
];

const SKIN_TASKS: string[] = [
  'Apply sunscreen before going outside',
  'Drink 2L of water today',
  'Do a 60-second cold water face rinse',
  'Clean your pillowcase or flip it tonight',
  'No touching your face today',
];

const EYES_TASKS: string[] = [
  'Get 7+ hours of sleep tonight',
  'Apply cold spoon under eyes for 2 min',
  'Take a 20-second screen break every 20 min',
  'Reduce sodium intake today (less puffiness)',
  'Sleep on your back tonight',
];

const HAIR_TASKS: string[] = [
  'Massage scalp for 3 minutes in the shower',
  'Skip heat styling today — air dry',
  'Take your biotin or multivitamin today',
  'Drink an extra glass of water for hydration',
  'Avoid tight hairstyles today',
];

const SYMMETRY_TASKS: string[] = [
  'Sleep on your back tonight (prevents asymmetry)',
  'Chew evenly on both sides during meals',
  'Check your posture 5 times today',
  'Do 2 min of face yoga stretches',
  'Practice neutral resting face for 5 min',
];

const POSTURE_TASKS: string[] = [
  'Set 3 posture check alarms today',
  'Keep phone at eye level when scrolling',
  'Do a 30-second wall angel stretch',
  'Sit with back straight for your next meal',
  'Tuck chin while walking for 5 minutes',
];

const LIFESTYLE_TASKS: string[] = [
  'No processed sugar before noon',
  'Get 10 minutes of morning sunlight',
  'Take a 15-minute walk today',
  'Eat one extra serving of protein',
  'Do 5 minutes of deep breathing',
];

// ─── Seeded random using day of year ───

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function seededPick<T>(arr: T[], seed: number, offset: number): T {
  const idx = (seed + offset * 7) % arr.length;
  return arr[idx];
}

// ─── Determine weakest areas from scores ───

function getWeakAreas(scores: FaceScores): string[] {
  const areas: { key: string; score: number }[] = [
    { key: 'jawline', score: scores.jawline || 50 },
    { key: 'skin', score: scores.skin_quality || 50 },
    { key: 'eyes', score: scores.eyes || 50 },
    { key: 'hair', score: scores.hair_quality || 50 },
    { key: 'symmetry', score: scores.facial_symmetry || 50 },
  ];
  // Sort by weakest first
  areas.sort((a, b) => a.score - b.score);
  // Return top 2 weakest
  return areas.slice(0, 2).map(a => a.key);
}

function getTaskPool(area: string): string[] {
  switch (area) {
    case 'jawline': return JAWLINE_TASKS;
    case 'skin': return SKIN_TASKS;
    case 'eyes': return EYES_TASKS;
    case 'hair': return HAIR_TASKS;
    case 'symmetry': return SYMMETRY_TASKS;
    default: return POSTURE_TASKS;
  }
}

// ─── Generate today's tasks ───

export function generateDailyTasks(scores: FaceScores | null, hasActiveProgram: boolean): DailyTask[] {
  const day = getDayOfYear();
  const tasks: DailyTask[] = [];

  // 1. Always: Scan face (auto-completes when scan is done today)
  tasks.push({
    id: 'scan',
    text: 'Scan your face today',
    type: 'scan',
    autoComplete: true,
  });

  // 2. Always if program active: Complete today's exercise
  if (hasActiveProgram) {
    tasks.push({
      id: 'exercise',
      text: "Complete today's exercise",
      type: 'exercise',
      autoComplete: true,
    });
  }

  // 3. Contextual habit based on weakest area
  if (scores) {
    const weakAreas = getWeakAreas(scores);
    const pool1 = getTaskPool(weakAreas[0]);
    const task1 = seededPick(pool1, day, 0);
    tasks.push({
      id: 'habit1',
      text: task1,
      type: 'habit',
      autoComplete: false,
    });

    // 4. Second contextual task from second weakest area
    const pool2 = getTaskPool(weakAreas[1]);
    const task2 = seededPick(pool2, day, 1);
    tasks.push({
      id: 'habit2',
      text: task2,
      type: 'habit',
      autoComplete: false,
    });
  } else {
    // No scan data — use generic posture + lifestyle
    tasks.push({
      id: 'habit1',
      text: seededPick(POSTURE_TASKS, day, 0),
      type: 'habit',
      autoComplete: false,
    });
    tasks.push({
      id: 'habit2',
      text: seededPick(LIFESTYLE_TASKS, day, 1),
      type: 'habit',
      autoComplete: false,
    });
  }

  // 5. Rotating lifestyle task
  const lifestyleTask = seededPick(LIFESTYLE_TASKS, day, 2);
  // Avoid duplicate with habit2
  const finalLifestyle = tasks.some(t => t.text === lifestyleTask)
    ? seededPick(POSTURE_TASKS, day, 3)
    : lifestyleTask;

  tasks.push({
    id: 'lifestyle',
    text: finalLifestyle,
    type: 'skincare',
    autoComplete: false,
  });

  return tasks;
}

// ─── Persistence for manual completions (per-day) ───

const LS_KEY = 'lynx_daily_todos';

interface DailyTodoState {
  date: string; // YYYY-MM-DD
  completed: string[]; // task ids
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCompletedIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const state: DailyTodoState = JSON.parse(raw);
    if (state.date !== todayStr()) return []; // New day, reset
    return state.completed;
  } catch {
    return [];
  }
}

export function markCompleted(taskId: string): string[] {
  const today = todayStr();
  let state: DailyTodoState;
  try {
    const raw = localStorage.getItem(LS_KEY);
    state = raw ? JSON.parse(raw) : { date: today, completed: [] };
    if (state.date !== today) state = { date: today, completed: [] };
  } catch {
    state = { date: today, completed: [] };
  }
  if (!state.completed.includes(taskId)) {
    state.completed.push(taskId);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  return state.completed;
}
