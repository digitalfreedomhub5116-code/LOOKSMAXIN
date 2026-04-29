// ═══════════════════════════════════════════
//  Face Exercise Plans — 6 Plans × 30 Days
// ═══════════════════════════════════════════

export interface ExerciseItem {
  id: string;
  name: string;
  duration: number;    // seconds
  sets: number;
  reps: number;        // 0 = timed hold (use duration)
  difficulty: 1 | 2 | 3;
  description: string;
  frames?: string[];   // animation frames — image paths that play sequentially like a GIF
}

export interface PlanDay {
  day: number;
  phase: 'Foundation' | 'Intensify' | 'Mastery';
  exercises: ExerciseItem[];
  milestone?: string;
  bonusXP?: number;
}

export interface ExercisePlan {
  id: string;
  name: string;
  description: string;
  image: string;
  days: PlanDay[];
}

// ── Exercise Libraries per plan ──

const JAW_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Mewing Hold', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Place tongue flat against roof of mouth. Hold position with lips sealed and teeth lightly touching.', frames: ['/exercises/jawline/mewing-hold-1.webp', '/exercises/jawline/mewing-hold-2.webp'] },
  { name: 'Chin Tuck', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Pull chin straight back creating a double chin. Hold 2 seconds, release. Keep eyes level.', frames: ['/exercises/jawline/chin-tuck-1.webp', '/exercises/jawline/chin-tuck-2.webp'] },
  { name: 'Jaw Clench & Release', duration: 120, sets: 3, reps: 20, difficulty: 1, description: 'Clench jaw firmly for 3 seconds, then slowly release. Focus on masseter engagement.', frames: ['/exercises/jawline/jaw-clench-1.webp', '/exercises/jawline/jaw-clench-2.webp'] },
  { name: 'Neck Curl', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Lie face up, tuck chin and curl head off ground. Hold 2 seconds at top. Keep shoulders down.', frames: ['/exercises/jawline/neck-curl-1.webp', '/exercises/jawline/neck-curl-2.webp'] },
  { name: 'Tongue Press', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Press tongue hard against roof of mouth for 5 seconds. Release. Focus on hyoid engagement.', frames: ['/exercises/jawline/tongue-press-1.webp', '/exercises/jawline/tongue-press-2.webp'] },
  { name: 'Jaw Side Slide', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Slide jaw left, hold 2 seconds, center, slide right, hold. Keep teeth apart.', frames: ['/exercises/jawline/jaw-slide-1.webp', '/exercises/jawline/jaw-slide-2.webp', '/exercises/jawline/jaw-slide-3.webp'] },
  { name: 'Resistance Jaw Open', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place fist under chin. Open jaw against resistance of fist. Hold 3 seconds open.', frames: ['/exercises/jawline/resistance-jaw-1.webp', '/exercises/jawline/resistance-jaw-2.webp'] },
  { name: 'Masseter Flex', duration: 60, sets: 3, reps: 20, difficulty: 1, description: 'Clench back teeth firmly, feel masseter muscle pop. Hold 2s, release slowly.' },
  { name: 'Jawline Definer', duration: 150, sets: 4, reps: 15, difficulty: 3, description: 'Tilt head back 45°, push lower jaw forward, hold 5 seconds. Return slowly.' },
  { name: 'Platysma Stretch', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Tilt head back, press tongue to roof, swallow hard. Feel neck and jaw tighten.' },
  { name: 'Chewing Exercise', duration: 180, sets: 1, reps: 0, difficulty: 2, description: 'Use jawline exerciser or tough gum. Chew evenly on both sides for the full duration.' },
  { name: 'Advanced Mewing', duration: 240, sets: 1, reps: 0, difficulty: 3, description: 'Full tongue suction hold including back third. Maintain while breathing through nose only.' },
];

const CHIN_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Chin Lift', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Tilt head toward ceiling, pucker lips upward. Hold 5 seconds feeling stretch under chin.' },
  { name: 'Tongue Press Up', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Press tongue firmly against roof of mouth. Feel the muscles under chin engage. Hold 5s.' },
  { name: 'Neck Roll', duration: 120, sets: 2, reps: 10, difficulty: 1, description: 'Slowly roll head in a circle — right, back, left, forward. 5 each direction.' },
  { name: 'Fish Face', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Suck cheeks in like a fish face. Hold 5 seconds. Release. Tones under-chin area.' },
  { name: 'Platysma Toner', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Open mouth wide, pull lower lip over bottom teeth, move jaw up and down. Feel neck tighten.' },
  { name: 'Head Tilt Back Press', duration: 90, sets: 3, reps: 10, difficulty: 2, description: 'Tilt head back, press tongue to roof of mouth firmly. Hold 10 seconds. Feel submental area.' },
  { name: 'Jaw Jut', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Push lower jaw forward past upper teeth. Hold 3 seconds. Return slowly.' },
  { name: 'Neck Stretch Hold', duration: 120, sets: 3, reps: 0, difficulty: 2, description: 'Tilt head right, hold 20s. Left, hold 20s. Back, hold 20s. Feel deep stretch.' },
  { name: 'Supine Chin Tuck', duration: 120, sets: 3, reps: 15, difficulty: 2, description: 'Lie on back, tuck chin to chest without lifting shoulders. Hold 3 seconds.' },
  { name: 'Tongue Slide', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Stick tongue out and try to touch chin. Hold 5 seconds. Engages submental muscles.' },
  { name: 'Resistance Chin Lift', duration: 120, sets: 3, reps: 10, difficulty: 3, description: 'Place thumbs under chin. Lift chin against thumb resistance. Hold 5 seconds at top.' },
  { name: 'Swallow & Hold', duration: 90, sets: 3, reps: 10, difficulty: 3, description: 'Tilt head back, swallow and hold at peak contraction for 5 seconds. Feel throat tighten.' },
];

const NECK_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Wall Angel', duration: 180, sets: 3, reps: 10, difficulty: 1, description: 'Stand back against wall. Slide arms up and down keeping contact with wall. Squeeze shoulder blades.' },
  { name: 'Chin Retraction', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Pull chin straight back without tilting. Hold 3 seconds. Resets forward head posture.' },
  { name: 'Thoracic Extension', duration: 150, sets: 3, reps: 0, difficulty: 1, description: 'Place foam roller under upper back. Arms behind head. Extend back over roller. Hold 15s each spot.' },
  { name: 'Neck Flexion', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Lie face up, tuck chin and lift head. Hold 3 seconds. Builds anterior neck muscles.' },
  { name: 'SCM Stretch', duration: 120, sets: 2, reps: 0, difficulty: 1, description: 'Tilt head to right, rotate left, hold 30 seconds. Switch sides. Stretches sternocleidomastoid.' },
  { name: 'Band Pull Apart', duration: 120, sets: 3, reps: 15, difficulty: 2, description: 'Hold band at shoulder width. Pull apart squeezing shoulder blades. Slow and controlled.' },
  { name: 'Prone Y Raise', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Lie face down, arms in Y shape. Lift arms off ground squeezing upper back. Hold 2 seconds.' },
  { name: 'Doorway Stretch', duration: 120, sets: 2, reps: 0, difficulty: 1, description: 'Place forearms on doorframe. Step through until chest stretch is felt. Hold 30 seconds.' },
  { name: 'Neck Lateral Flexion', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Tilt head sideways against hand resistance. Hold 5 seconds each side. Builds neck width.' },
  { name: 'Cat-Cow Stretch', duration: 120, sets: 2, reps: 10, difficulty: 1, description: 'On all fours, arch back up (cat), then drop belly down (cow). Sync with breathing.' },
  { name: 'Neck Bridge Hold', duration: 90, sets: 3, reps: 0, difficulty: 3, description: 'Wrestlers bridge — support weight on head and feet. Hold 10 seconds. Advanced only.' },
  { name: 'Trap Shrug Hold', duration: 120, sets: 3, reps: 15, difficulty: 2, description: 'Shrug shoulders to ears, hold 5 seconds at top. Slowly lower. Builds trap muscles.' },
];

const MASSAGE_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Lymphatic Drainage', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Light strokes from center of face outward and downward toward ears and neck. Very gentle pressure.' },
  { name: 'Jawline Massage', duration: 120, sets: 1, reps: 0, difficulty: 1, description: 'Use knuckles along jawline from chin to ear. Medium pressure, circular motions. Both sides.' },
  { name: 'Forehead Smoothing', duration: 90, sets: 1, reps: 0, difficulty: 1, description: 'Place fingers at center of forehead. Sweep outward to temples with medium pressure. Repeat.' },
  { name: 'Under-Eye Tapping', duration: 90, sets: 1, reps: 0, difficulty: 1, description: 'Gently tap under-eye area with ring finger. Move from inner corner to outer. Reduces puffiness.' },
  { name: 'Cheek Sculpting', duration: 120, sets: 1, reps: 0, difficulty: 2, description: 'Use gua sha or knuckles upward along cheekbone from nose to ear. Firm upward pressure.' },
  { name: 'Nasolabial Fold Massage', duration: 90, sets: 1, reps: 0, difficulty: 2, description: 'Small circles along laugh lines from nose to mouth corners. Helps reduce fold appearance.' },
  { name: 'Temple Release', duration: 90, sets: 1, reps: 0, difficulty: 1, description: 'Circular pressure on temples with fingertips. Releases jaw tension. Slow and firm.' },
  { name: 'Neck Drainage', duration: 120, sets: 1, reps: 0, difficulty: 1, description: 'Stroke down sides of neck from jaw to collarbone. Opens lymphatic pathways. Light pressure.' },
  { name: 'Buccal Massage', duration: 120, sets: 1, reps: 0, difficulty: 3, description: 'Place thumb inside cheek, fingers outside. Pinch and massage cheek muscles. Deep tissue work.' },
  { name: 'Acupressure Points', duration: 120, sets: 1, reps: 0, difficulty: 2, description: 'Press and hold key facial acupressure points — between brows, beside nostrils, jaw hinge. 10s each.' },
  { name: 'Full Face Gua Sha', duration: 240, sets: 1, reps: 0, difficulty: 2, description: 'Use gua sha tool with oil. Long sweeping strokes upward and outward across entire face.' },
  { name: 'Scalp Massage', duration: 120, sets: 1, reps: 0, difficulty: 1, description: 'Fingertips on scalp, small circular movements. Cover entire head. Improves blood flow to face.' },
];

const CHEEK_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Cheek Lifter', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Smile wide showing upper teeth, push cheeks up toward eyes with fingers. Hold 5 seconds.' },
  { name: 'Fish Face Hold', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Suck cheeks in between teeth. Try to smile while holding. Feel cheekbone area engage.' },
  { name: 'Smile Sculptor', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Smile as wide as possible without opening lips. Hold 5 seconds. Relax. Builds zygomatic muscles.' },
  { name: 'Cheek Puff', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Puff air into right cheek, hold 5s. Move to left cheek, hold 5s. Then both cheeks.' },
  { name: 'O to E Stretch', duration: 120, sets: 3, reps: 15, difficulty: 2, description: 'Make exaggerated O shape, then immediately switch to wide E. Feel cheeks stretch and contract.' },
  { name: 'Upper Lip Lift', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Lift upper lip to show upper gums. Hold 5 seconds. Works levator muscles near cheekbones.' },
  { name: 'Malar Push', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place fingers on cheekbones. Push cheeks up while resisting with fingers. Hold 5 seconds.' },
  { name: 'Face Yoga X-O', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Alternate making exaggerated X face (scrunch everything) and O face (open everything wide).' },
  { name: 'Puppet Face', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Place fingertips on nasolabial folds. Smile while pushing up. Lifts mid-face area.' },
  { name: 'Tongue on Cheek', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Push tongue firmly into right cheek from inside. Hold 3s. Switch to left. Builds buccinator.' },
  { name: 'Cheekbone Definer', duration: 120, sets: 4, reps: 15, difficulty: 3, description: 'Combine smile + cheek lift + malar push. Hold each rep 5 seconds. Full cheekbone activation.' },
  { name: 'Vacuum Cheeks', duration: 90, sets: 3, reps: 10, difficulty: 3, description: 'Suck cheeks in hard creating hollow look. Hold 10 seconds. Builds definition over time.' },
];

const EYE_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Eye Squeeze', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Squeeze eyes shut firmly for 3 seconds, then open wide. Tones orbicularis oculi.' },
  { name: 'Brow Lift', duration: 120, sets: 3, reps: 12, difficulty: 1, description: 'Place fingers above eyebrows. Lift brows while pressing down with fingers. Hold 5 seconds.' },
  { name: 'Under-Eye Firm', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Place fingertips on upper cheeks. Squint lower eyelids upward. Hold 3 seconds.' },
  { name: 'Eye Circle', duration: 120, sets: 2, reps: 10, difficulty: 1, description: 'Roll eyes slowly in a full circle — right, up, left, down. 5 each direction.' },
  { name: 'Temple Tightener', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Place fingers on temples. Pull slightly back while opening and closing eyes. Feel lateral tension.' },
  { name: 'Crow Feet Smoother', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'V-fingers on outer eye corners. Squint while resisting with fingers. Hold 5 seconds.' },
  { name: 'Brow Pinch', duration: 90, sets: 3, reps: 15, difficulty: 2, description: 'Pinch along brow bone from inner to outer corner. Stimulates circulation to brow area.' },
  { name: 'Focus Shift', duration: 120, sets: 3, reps: 10, difficulty: 1, description: 'Focus on near object (thumb) 5 seconds, then far object 5 seconds. Strengthens eye muscles.' },
  { name: 'Orbital Massage', duration: 120, sets: 1, reps: 0, difficulty: 1, description: 'Gentle circular massage around eye orbit bone. Inner corner, under, outer, over brow. Light pressure.' },
  { name: 'Eyelid Lift', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Look up, slowly close upper eyelids while looking up. Hold 5 seconds. Fights droopy lids.' },
  { name: 'Full Eye Circuit', duration: 150, sets: 3, reps: 0, difficulty: 3, description: 'Combine squeeze + brow lift + under-eye firm + temple tightener. 10 seconds each, no rest.' },
  { name: 'Pressure Point Eye', duration: 120, sets: 1, reps: 0, difficulty: 2, description: 'Press inner eye corner, mid-brow, temple — 10 seconds each point. Releases tension.' },
];

// ── Plan builder ──

const PLAN_EXERCISES: Record<string, Omit<ExerciseItem, 'id'>[]> = {
  jawline: JAW_EXERCISES,
  'double-chin': CHIN_EXERCISES,
  'neck-posture': NECK_EXERCISES,
  'face-massage': MASSAGE_EXERCISES,
  cheekbones: CHEEK_EXERCISES,
  'eye-area': EYE_EXERCISES,
};

function buildDays(planId: string, exercises: Omit<ExerciseItem, 'id'>[]): PlanDay[] {
  const days: PlanDay[] = [];
  for (let d = 1; d <= 30; d++) {
    const phase: PlanDay['phase'] = d <= 10 ? 'Foundation' : d <= 20 ? 'Intensify' : 'Mastery';
    const count = d <= 10 ? 4 : 5;
    // Rotate through exercises so each day has variety
    const dayExercises: ExerciseItem[] = [];
    for (let e = 0; e < count; e++) {
      const idx = ((d - 1) * count + e) % exercises.length;
      const ex = exercises[idx];
      // Scale difficulty with phase
      const diff = phase === 'Foundation' ? ex.difficulty : phase === 'Intensify' ? Math.min(3, ex.difficulty + (d > 15 ? 1 : 0)) as 1|2|3 : Math.min(3, ex.difficulty) as 1|2|3;
      dayExercises.push({
        ...ex,
        id: `${planId}-d${d}-e${e}`,
        difficulty: diff,
        sets: phase === 'Mastery' ? ex.sets + 1 : ex.sets,
      });
    }
    const day: PlanDay = { day: d, phase, exercises: dayExercises };
    if (d === 10) { day.milestone = 'Phase 1 Complete!'; day.bonusXP = 50; }
    if (d === 20) { day.milestone = 'Phase 2 Complete!'; day.bonusXP = 75; }
    if (d === 30) { day.milestone = 'Plan Complete! 🏆'; day.bonusXP = 150; }
    days.push(day);
  }
  return days;
}

export const PLANS: ExercisePlan[] = [
  {
    id: 'jawline',
    name: 'Jawline Sculptor',
    description: 'Build a chiseled, defined jawline through targeted exercises',
    image: '/plans/jawline.webp',
    days: buildDays('jawline', JAW_EXERCISES),
  },
  {
    id: 'double-chin',
    name: 'Double Chin Destroyer',
    description: 'Eliminate double chin and tighten the submental area',
    image: '/plans/double-chin.webp',
    days: buildDays('double-chin', CHIN_EXERCISES),
  },
  {
    id: 'neck-posture',
    name: 'Neck & Posture Reset',
    description: 'Fix forward head posture and build a strong neck',
    image: '/plans/neck-posture.webp',
    days: buildDays('neck-posture', NECK_EXERCISES),
  },
  {
    id: 'face-massage',
    name: 'Face Massage & Glow',
    description: 'Lymphatic drainage, pore reduction, and facial sculpting',
    image: '/plans/face-massage.webp',
    days: buildDays('face-massage', MASSAGE_EXERCISES),
  },
  {
    id: 'cheekbones',
    name: 'Cheekbone Definer',
    description: 'Sculpt and define your cheekbone structure',
    image: '/plans/cheekbone.webp',
    days: buildDays('cheekbones', CHEEK_EXERCISES),
  },
  {
    id: 'eye-area',
    name: 'Eye Area Rejuvenation',
    description: 'Firm under-eyes, lift brows, reduce puffiness',
    image: '/plans/eye-area.webp',
    days: buildDays('eye-area', EYE_EXERCISES),
  },
];

// ── Auto-recommend mapping ──
export const TRAIT_TO_PLAN: Record<string, string> = {
  jawline: 'jawline',
  skin: 'face-massage',
  cheekbones: 'cheekbones',
  eyes: 'eye-area',
  symmetry: 'face-massage',
  lips: 'cheekbones',
  hair: 'neck-posture',
};

export function getRecommendedPlans(traits: Record<string, { score: number }>): ExercisePlan[] {
  const dominated = new Set<string>();
  Object.entries(traits).forEach(([trait, { score }]) => {
    if (score < 60 && TRAIT_TO_PLAN[trait]) {
      dominated.add(TRAIT_TO_PLAN[trait]);
    }
  });
  return PLANS.filter(p => dominated.has(p.id));
}
