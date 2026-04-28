/**
 * AI Suggestions Engine
 * Maps scan results → personalized remedies, tips, and exercise plan suggestions.
 * Deterministic keyword matching — zero API cost.
 */
import type { FaceScores } from '../lib/api';
import { REMEDIES, type Remedy, type RemedyCategory } from './skinRemedies';
import { PLANS } from './exercisePlans';

/* ═══ Types ═══ */
export interface QuickTip {
  id: string;
  icon: string;
  text: string;
  category: string;
  reason: string;
}

export interface PlanSuggestion {
  planId: string;
  planName: string;
  reason: string;
  score: number;
}

export interface RemedySuggestion {
  remedy: Remedy;
  reason: string;
}

export interface Suggestions {
  remedies: RemedySuggestion[];
  tips: QuickTip[];
  exercisePlans: PlanSuggestion[];
}

/* ═══ Keyword → Category Map ═══ */
const ISSUE_MAP: Record<string, RemedyCategory[]> = {
  'dull': ['glow'],
  'lack': ['glow'],
  'radiance': ['glow'],
  'glow': ['glow'],
  'bright': ['glow'],
  'dark spot': ['detan'],
  'dark circle': ['hydration', 'detan'],
  'tan': ['detan'],
  'pigment': ['detan'],
  'uneven': ['glow', 'detan'],
  'discolor': ['detan'],
  'sun damage': ['detan'],
  'acne': ['acne'],
  'pimple': ['acne'],
  'breakout': ['acne'],
  'blemish': ['acne'],
  'scar': ['acne', 'glow'],
  'oily': ['pores', 'acne'],
  'blackhead': ['pores'],
  'pore': ['pores'],
  'sebum': ['pores'],
  'dry': ['hydration'],
  'dehydrat': ['hydration'],
  'flaky': ['hydration'],
  'rough': ['hydration'],
  'crack': ['hydration'],
  'wrinkle': ['antiaging'],
  'fine line': ['antiaging'],
  'aging': ['antiaging'],
  'sag': ['antiaging'],
  'firmness': ['antiaging'],
  'elasticity': ['antiaging'],
  'puffy': ['pores', 'hydration'],
  'inflam': ['acne', 'hydration'],
  'redness': ['acne', 'hydration'],
  'texture': ['glow', 'pores'],
};

/* ═══ Score → Exercise Plan Map ═══ */
const SCORE_TO_PLAN: { traitKey: string; threshold: number; planId: string; label: string }[] = [
  { traitKey: 'jawline', threshold: 60, planId: 'jawline', label: 'Jawline Sculptor' },
  { traitKey: 'facial_symmetry', threshold: 55, planId: 'cheekbones', label: 'Cheekbone Definer' },
  { traitKey: 'eyes', threshold: 55, planId: 'eye-area', label: 'Eye Area Rejuvenation' },
];

/* ═══ Built-in Quick Tips Database ═══ */
const TIP_RULES: { keywords: string[]; tip: QuickTip }[] = [
  {
    keywords: ['dry', 'dehydrat', 'flaky', 'water'],
    tip: { id: 'hydrate', icon: 'droplets', text: 'Drink at least 3L of water daily', category: 'Hydration', reason: 'Dehydration signs detected in your scan' },
  },
  {
    keywords: ['sun', 'tan', 'dark spot', 'pigment', 'uv'],
    tip: { id: 'sunscreen', icon: 'sun', text: 'Apply SPF 50+ sunscreen every morning', category: 'Sun Protection', reason: 'Sun damage indicators found' },
  },
  {
    keywords: ['dark circle', 'tired', 'puffy', 'fatigue'],
    tip: { id: 'sleep', icon: 'moon', text: 'Get 7-8 hours of quality sleep', category: 'Sleep', reason: 'Dark circles / fatigue detected' },
  },
  {
    keywords: ['acne', 'pimple', 'oily', 'breakout'],
    tip: { id: 'pillowcase', icon: 'shield', text: 'Change your pillowcase every 2-3 days', category: 'Hygiene', reason: 'Acne-prone skin detected' },
  },
  {
    keywords: ['oily', 'pore', 'sebum', 'blackhead'],
    tip: { id: 'cleanse', icon: 'sparkles', text: 'Double-cleanse every night before bed', category: 'Skincare', reason: 'Excess oil production detected' },
  },
  {
    keywords: ['dull', 'glow', 'radiance', 'bright'],
    tip: { id: 'vitaminc', icon: 'pipette', text: 'Add a Vitamin C serum to your AM routine', category: 'Skincare', reason: 'Dull skin tone detected' },
  },
  {
    keywords: ['wrinkle', 'fine line', 'aging', 'sag'],
    tip: { id: 'retinol', icon: 'clock', text: 'Start using retinol 2x per week at night', category: 'Anti-Aging', reason: 'Early aging signs detected' },
  },
  {
    keywords: ['dry', 'crack', 'rough', 'flaky'],
    tip: { id: 'moisturize', icon: 'droplet', text: 'Apply moisturizer on damp skin after washing', category: 'Skincare', reason: 'Dry, rough skin detected' },
  },
  {
    keywords: ['jawline', 'chin', 'double chin', 'neck'],
    tip: { id: 'posture', icon: 'user', text: 'Keep phone at eye level to avoid neck strain', category: 'Posture', reason: 'Jawline/neck improvement opportunity' },
  },
  {
    keywords: ['diet', 'sugar', 'process', 'food'],
    tip: { id: 'diet', icon: 'apple', text: 'Cut refined sugar — it accelerates skin aging', category: 'Diet', reason: 'Dietary improvements can boost your skin' },
  },
];

/* ═══ Main Engine ═══ */
export function getPersonalizedSuggestions(scores: FaceScores): Suggestions {
  // Collect all text from scan results for keyword matching
  const textPool = buildTextPool(scores);
  
  // 1. Match remedies
  const matchedCategories = matchCategories(textPool);
  // Also add categories based on low scores
  if (scores.skin_quality < 60) matchedCategories.add('glow');
  if (scores.skin_quality < 45) matchedCategories.add('hydration');
  
  const remedies = pickRemedies(matchedCategories, 4);

  // 2. Match tips
  const tips = matchTips(textPool, scores);

  // 3. Match exercise plans
  const exercisePlans = matchExercisePlans(scores);

  return { remedies, tips, exercisePlans };
}

/* ═══ Helpers ═══ */
function buildTextPool(scores: FaceScores): string {
  const parts: string[] = [];
  if (scores.description) parts.push(scores.description);
  if (scores.recommendations) parts.push(...scores.recommendations);
  if (scores.tips) parts.push(...scores.tips);
  if (scores.traits) {
    Object.values(scores.traits).forEach(t => {
      if (t.holding_back) parts.push(t.holding_back);
      if (t.fix_it) parts.push(t.fix_it);
      if (t.rating) parts.push(t.rating);
    });
  }
  return parts.join(' ').toLowerCase();
}

function matchCategories(text: string): Set<RemedyCategory> {
  const cats = new Set<RemedyCategory>();
  for (const [keyword, categories] of Object.entries(ISSUE_MAP)) {
    if (text.includes(keyword)) {
      categories.forEach(c => cats.add(c));
    }
  }
  return cats;
}

function pickRemedies(categories: Set<RemedyCategory>, max: number): RemedySuggestion[] {
  if (categories.size === 0) {
    // Fallback: suggest glow remedies
    categories.add('glow');
  }

  const result: RemedySuggestion[] = [];
  const usedIds = new Set<string>();

  // Reason map for each category
  const REASONS: Record<RemedyCategory, string> = {
    glow: 'Dull skin detected — this boosts radiance',
    acne: 'Acne/breakouts detected in your scan',
    detan: 'Dark spots or tan detected — helps brighten',
    hydration: 'Dry/dehydrated skin detected — deep repair',
    antiaging: 'Fine lines or aging signs detected',
    pores: 'Enlarged pores or excess oil detected',
  };

  for (const cat of categories) {
    const catRemedies = REMEDIES.filter(r => r.category === cat && !usedIds.has(r.id));
    // Pick top 1-2 from each category
    const pick = catRemedies.slice(0, Math.ceil(max / categories.size));
    for (const r of pick) {
      if (result.length >= max) break;
      result.push({ remedy: r, reason: REASONS[cat] });
      usedIds.add(r.id);
    }
  }

  return result.slice(0, max);
}

function matchTips(text: string, scores: FaceScores): QuickTip[] {
  const dismissed = getDismissedTips();
  const matched: QuickTip[] = [];

  for (const rule of TIP_RULES) {
    if (dismissed.has(rule.tip.id)) continue;
    const hit = rule.keywords.some(kw => text.includes(kw));
    if (hit && matched.length < 3) {
      matched.push(rule.tip);
    }
  }

  // If fewer than 2, add general tips
  if (matched.length < 2) {
    const general: QuickTip[] = [
      { id: 'water-gen', icon: 'droplets', text: 'Stay hydrated — drink 3L water daily', category: 'Health', reason: 'Essential for healthy skin' },
      { id: 'sun-gen', icon: 'sun', text: 'Never skip sunscreen, even indoors', category: 'Protection', reason: 'UV is the #1 cause of premature aging' },
    ];
    for (const g of general) {
      if (matched.length >= 3) break;
      if (!dismissed.has(g.id) && !matched.find(m => m.id === g.id)) {
        matched.push(g);
      }
    }
  }

  return matched;
}

function matchExercisePlans(scores: FaceScores): PlanSuggestion[] {
  const suggestions: PlanSuggestion[] = [];
  
  for (const rule of SCORE_TO_PLAN) {
    const score = (scores as any)[rule.traitKey];
    if (typeof score === 'number' && score < rule.threshold) {
      const plan = PLANS.find(p => p.id === rule.planId);
      if (plan) {
        suggestions.push({
          planId: plan.id,
          planName: plan.name,
          reason: `Your ${rule.traitKey.replace('_', ' ')} scored ${score}/100`,
          score,
        });
      }
    }
  }

  return suggestions.slice(0, 2);
}

/* ═══ Dismissed Tips Persistence ═══ */
const DISMISSED_KEY = 'lynx_dismissed_tips';

export function getDismissedTips(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

export function dismissTip(id: string) {
  const set = getDismissedTips();
  set.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}
