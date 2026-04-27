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
  { name: 'Mewing Hold', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Place tongue flat against roof of mouth. Hold position with lips sealed and teeth lightly touching.' },
  { name: 'Chin Tuck', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Pull chin straight back creating a double chin. Hold 2 seconds, release. Keep eyes level.' },
  { name: 'Jaw Clench & Release', duration: 120, sets: 3, reps: 20, difficulty: 1, description: 'Clench jaw firmly for 3 seconds, then slowly release. Focus on masseter engagement.' },
  { name: 'Neck Curl', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Lie face up, tuck chin and curl head off ground. Hold 2 seconds at top. Keep shoulders down.' },
  { name: 'Tongue Press', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Press tongue hard against roof of mouth for 5 seconds. Release. Focus on hyoid engagement.' },
  { name: 'Jaw Side Slide', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Slide jaw left, hold 2 seconds, center, slide right, hold. Keep teeth apart.' },
  { name: 'Resistance Jaw Open', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place fist under chin. Open jaw against resistance of fist. Hold 3 seconds open.' },
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

const LIP_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Kiss & Hold', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Pucker lips tightly as if kissing. Push lips forward as far as possible. Hold 5 seconds, release slowly.' },
  { name: 'Whistle Pucker', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Form a small O with lips as if whistling. Hold tension for 5 seconds. Relax. Tones orbicularis oris.' },
  { name: 'Lip Press Resistance', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Press lips firmly together. Place index fingers at corners of mouth, pull outward gently while lips resist.' },
  { name: 'Lip Roll', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Tuck both lips inward over teeth. Hold 5 seconds. Roll them back out slowly. Repeat.' },
  { name: 'Smile & Pucker Alternation', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Smile as wide as possible with closed lips, hold 3s. Then pucker tightly, hold 3s. Alternate.' },
  { name: 'Upper Lip Curl', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Curl upper lip upward showing upper gums while keeping lower lip still. Hold 5 seconds. Builds philtrum area.' },
  { name: 'Lower Lip Scoop', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Push lower lip up and over upper lip. Tilt head back slightly. Hold 5 seconds. Feel chin and lip engage.' },
  { name: 'Lip Vibration Buzz', duration: 60, sets: 3, reps: 0, difficulty: 1, description: 'Make a buzzing/motorboat sound with closed lips for 20 seconds. Relaxes and increases blood flow to lips.' },
  { name: 'Balloon Cheeks', duration: 90, sets: 3, reps: 10, difficulty: 1, description: 'Puff cheeks full of air, press lips tightly sealed. Hold 10 seconds without air escaping. Release slowly.' },
  { name: 'Straw Sip Hold', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Purse lips as if sucking through a narrow straw. Hold maximum pucker for 5 seconds. Release slowly.' },
  { name: 'Cupid Bow Definer', duration: 120, sets: 3, reps: 10, difficulty: 3, description: 'Place finger on cupid bow. Pucker and push upper lip upward against finger resistance. Hold 5 seconds.' },
  { name: 'Full Lip Circuit', duration: 180, sets: 2, reps: 0, difficulty: 3, description: 'Combine: pucker 5s → wide smile 5s → O-shape 5s → lip tuck 5s → buzz 5s. No rest between. Repeat circuit.' },
];

const FOREHEAD_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Brow Raise Hold', duration: 120, sets: 3, reps: 12, difficulty: 1, description: 'Raise eyebrows as high as possible. Hold 5 seconds. Lower slowly. Works frontalis muscle.' },
  { name: 'Lion Face', duration: 90, sets: 3, reps: 10, difficulty: 1, description: 'Open eyes and mouth as wide as possible, stretch all facial muscles. Hold 5 seconds. Release completely.' },
  { name: 'Brow Resistance Lift', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Place fingertips along eyebrows pressing down. Try to raise brows against resistance. Hold 5 seconds.' },
  { name: 'Forehead Smoother', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place both palms flat on forehead. Apply light pressure. Try to raise eyebrows against your hands. Hold 10s.' },
  { name: 'Surprise & Frown', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Make a surprised face (brows up, eyes wide) hold 3s. Then frown deeply (brows down) hold 3s. Alternate.' },
  { name: 'Temple Finger Lift', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place fingers on temples. Pull skin slightly upward and back. Close eyes and try to look down. Hold 10s.' },
  { name: 'Forehead Tap Stimulation', duration: 90, sets: 1, reps: 0, difficulty: 1, description: 'Rapidly tap fingertips across entire forehead for 30 seconds. Stimulates blood circulation and collagen.' },
  { name: 'Corrugator Release', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Place middle fingers between eyebrows on the glabella. Apply pressure while trying to frown. Hold 5 seconds.' },
  { name: 'Scalp Pull', duration: 120, sets: 3, reps: 0, difficulty: 1, description: 'Grip hair at crown and gently pull upward. Hold 10 seconds. Move to sides, pull up. Lifts forehead skin.' },
  { name: 'Owl Eyes', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Make C-shapes with thumbs and index fingers around eyes. Pull down while raising brows. Hold 3 seconds.' },
  { name: 'Forehead Pinch Walk', duration: 120, sets: 2, reps: 0, difficulty: 2, description: 'Pinch forehead skin between fingers. Walk pinches from brow line to hairline. Repeat 5 lines across.' },
  { name: 'Anti-Wrinkle Press', duration: 150, sets: 3, reps: 0, difficulty: 3, description: 'Place palms on forehead. Apply firm pressure. Raise brows 10x, hold last rep 15 seconds against resistance.' },
];

const NOSE_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Nostril Flare', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Place index fingers gently on sides of nose. Flare nostrils against finger pressure while inhaling. Release on exhale.' },
  { name: 'Nose Bridge Press', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Place fingers on either side of nose bridge. Apply light downward pressure while scrunching nose upward. Hold 5s.' },
  { name: 'Nose Tip Push-Up', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Place index finger on nose tip. Push tip upward gently. Use nasalis muscle to push nose tip back down against finger.' },
  { name: 'Nose Shortener', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Place index finger under nose tip. Smile while pressing tip down with finger. Feel nose muscle contract. Hold 3s.' },
  { name: 'Nose Narrower', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Place thumbs on sides of nose at widest point. Press gently inward while breathing through nose. Hold 5 seconds.' },
  { name: 'Bunny Scrunch', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Scrunch nose upward like a bunny. Hold 3 seconds. Release. Works nasalis and procerus muscles.' },
  { name: 'Nose Wiggle', duration: 60, sets: 3, reps: 20, difficulty: 1, description: 'Try to move nose side to side without moving lips. Small movements. Builds nose muscle awareness and control.' },
  { name: 'Assisted Nose Lift', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Smile broadly. Place finger on nose tip, push upward. Try to push tip down using facial muscles. Hold 5s.' },
  { name: 'Nose Breathing Exercise', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Block right nostril, breathe in left for 4s. Block left, exhale right 4s. Switch. 3 minutes total. Tones nasal passages.' },
  { name: 'Nose Bridge Massage', duration: 120, sets: 1, reps: 0, difficulty: 1, description: 'Use index and middle fingers to massage up and down the nose bridge. Medium pressure, circular motions. 2 minutes.' },
  { name: 'Depressor Septi Flex', duration: 90, sets: 3, reps: 12, difficulty: 3, description: 'Pull upper lip down firmly. Focus on feeling the muscle between nose base and upper lip engage. Hold 5 seconds.' },
  { name: 'Nose Sculptor Circuit', duration: 150, sets: 2, reps: 0, difficulty: 3, description: 'Combine: scrunch 5s → flare 5s → tip push 5s → narrower 5s → wiggle 10x. No rest between. Repeat.' },
];

const SMILE_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Wide Smile Hold', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Smile as wide as possible showing all teeth. Hold 5 seconds. Relax. Works zygomaticus major muscle.' },
  { name: 'Closed Smile Lift', duration: 120, sets: 3, reps: 15, difficulty: 1, description: 'Tuck lips over teeth. Smile with corners of mouth only, lifting cheeks. Hold 5 seconds. Feel zygomatic engage.' },
  { name: 'Happy Cheeks Sculpting', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Smile without showing teeth. Place fingers at mouth corners. Slide fingers up to top of cheekbones. Hold 20 seconds.' },
  { name: 'Smile Symmetry Trainer', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Smile only on right side, hold 5s. Relax. Smile only on left side, hold 5s. Then both sides together.' },
  { name: 'Laugh Line Lifter', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Make small circles with fingers along nasolabial folds while smiling. Upward pressure only. 30 seconds each side.' },
  { name: 'Dimple Maker', duration: 90, sets: 3, reps: 15, difficulty: 1, description: 'Press index fingers into cheeks where dimples would be. Smile while pressing. Hold 3 seconds. Release.' },
  { name: 'Corner Lip Lift', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Focus on lifting only the corners of mouth upward without showing teeth. Hold 5 seconds. Fights downturned mouth.' },
  { name: 'Scooping Jaw Smile', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Tilt head back slightly. Fold lower lip inward. Use jaw to scoop upward while smiling. Hold 5 seconds at top.' },
  { name: 'Teeth Clench Smile', duration: 90, sets: 3, reps: 12, difficulty: 1, description: 'Clench teeth together gently. Smile as wide as possible with clenched teeth. Hold 5 seconds. Relax jaw.' },
  { name: 'Cheek Puffer Smile', duration: 90, sets: 3, reps: 10, difficulty: 1, description: 'Puff air into right cheek 5s, move air to left cheek 5s, then upper lip 5s, lower lip 5s. Release and smile.' },
  { name: 'Risorius Activator', duration: 90, sets: 3, reps: 15, difficulty: 2, description: 'Pull mouth corners straight sideways into a wide grin without lifting. Hold 3s. Works risorius muscle.' },
  { name: 'Mega Smile Circuit', duration: 150, sets: 2, reps: 0, difficulty: 3, description: 'Wide smile 5s → pucker 5s → closed smile 5s → asymmetric right 5s → left 5s → max smile 10s. No rest.' },
];

const RELAX_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'Jaw Drop Release', duration: 120, sets: 3, reps: 0, difficulty: 1, description: 'Let jaw drop open completely. Let tongue rest on floor of mouth. Breathe deeply. Hold 30 seconds.' },
  { name: 'Lion Breath', duration: 90, sets: 3, reps: 5, difficulty: 1, description: 'Inhale deeply through nose. Exhale forcefully through mouth, stick tongue out, widen eyes. Release all tension.' },
  { name: 'TMJ Massage', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Place fingers on jaw joints (TMJ) in front of ears. Massage in small circles. Open and close mouth slowly. 3 minutes.' },
  { name: 'Progressive Face Relax', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Tense forehead 5s → relax. Squeeze eyes 5s → relax. Clench jaw 5s → relax. Pucker lips 5s → relax. Feel release.' },
  { name: 'Ear Pull Stretch', duration: 90, sets: 3, reps: 0, difficulty: 1, description: 'Gently pull earlobes downward for 10s. Pull top of ears upward 10s. Pull middle outward 10s. Releases fascia.' },
  { name: 'Eye Palming', duration: 180, sets: 1, reps: 0, difficulty: 1, description: 'Rub palms together until warm. Cup palms over closed eyes without pressing. Breathe deeply. Hold 3 minutes.' },
  { name: 'Tongue Stretch Release', duration: 90, sets: 3, reps: 10, difficulty: 1, description: 'Stick tongue out as far as possible toward chin. Hold 5 seconds. Retract. Releases hyoid and throat tension.' },
  { name: 'Face Steam Prep', duration: 300, sets: 1, reps: 0, difficulty: 1, description: 'Hold warm towel over face for 5 minutes. Opens pores, relaxes muscles, increases blood flow before exercises.' },
  { name: 'Masseter Release', duration: 120, sets: 1, reps: 0, difficulty: 2, description: 'Open mouth slightly. Place thumbs on inner cheek, fingers outside on masseter. Pinch and massage for 2 minutes.' },
  { name: 'Neck & Jaw Decompression', duration: 120, sets: 3, reps: 0, difficulty: 1, description: 'Tilt head right, open jaw, hold 10s. Center. Tilt left, open jaw, hold 10s. Releases SCM and jaw simultaneously.' },
  { name: 'Face Yoga Breath', duration: 120, sets: 3, reps: 5, difficulty: 1, description: 'Inhale 4 counts, puff cheeks and hold 4 counts, exhale slowly through pursed lips 8 counts. Calms nervous system.' },
  { name: 'Full Face De-Stress', duration: 240, sets: 1, reps: 0, difficulty: 2, description: 'Gentle lymphatic strokes forehead→temples→jawline→neck. Then TMJ circles. Then ear pulls. Full relaxation protocol.' },
];

const FULLFACE_EXERCISES: Omit<ExerciseItem, 'id'>[] = [
  { name: 'The Wake-Up Slap', duration: 60, sets: 1, reps: 0, difficulty: 1, description: 'Gently tap entire face with fingertips rapidly for 30 seconds. Wakes up facial muscles and boosts circulation.' },
  { name: 'Full Face Isometric', duration: 120, sets: 3, reps: 0, difficulty: 2, description: 'Squeeze all facial muscles inward (scrunch face) hold 5s. Then stretch all outward (surprise face) hold 5s. Alternate.' },
  { name: 'Jaw + Cheek Combo', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Clench jaw firmly while simultaneously lifting cheeks into a smile. Hold 5 seconds. Release both. Full mid-face burn.' },
  { name: 'Brow + Eye Superset', duration: 120, sets: 3, reps: 10, difficulty: 2, description: 'Raise brows high, hold 3s. Immediately squint lower lids up, hold 3s. Then squeeze eyes shut 3s. No rest.' },
  { name: 'Lip + Chin Combo', duration: 120, sets: 3, reps: 12, difficulty: 2, description: 'Pucker lips tightly, then push lower jaw forward. Hold both 5 seconds. Engages orbicularis oris and mentalis.' },
  { name: 'Tongue Chewing', duration: 180, sets: 1, reps: 0, difficulty: 2, description: 'Place gum on roof of mouth. Use tongue to compress and move it around the palate. Strengthens tongue and inner face muscles.' },
  { name: 'Cheek + Nose Superset', duration: 90, sets: 3, reps: 12, difficulty: 2, description: 'Flare nostrils while lifting cheeks high. Hold 3s. Relax. Bunny scrunch nose while sucking cheeks in. Hold 3s.' },
  { name: 'Neck + Jaw Superset', duration: 120, sets: 3, reps: 10, difficulty: 3, description: 'Tilt head back, push jaw forward, press tongue to roof. Hold 5s. Maximum submental and platysma engagement.' },
  { name: 'Face Yoga AMRAP', duration: 180, sets: 1, reps: 0, difficulty: 3, description: 'As many rounds as possible in 3 min: 5 brow raises + 5 cheek lifts + 5 jaw clenches + 5 lip puckers. No rest.' },
  { name: 'The 360 Sculptor', duration: 240, sets: 1, reps: 0, difficulty: 3, description: 'Work around face clockwise: forehead 30s → eyes 30s → cheeks 30s → nose 30s → lips 30s → jaw 30s → neck 30s → massage 30s.' },
  { name: 'Mewing Power Hold', duration: 300, sets: 1, reps: 0, difficulty: 3, description: 'Full tongue suction on palate with correct posture. Breathe only through nose. Jaw relaxed, lips sealed. 5 min hold.' },
  { name: 'Face Burnout Finisher', duration: 180, sets: 1, reps: 0, difficulty: 3, description: 'Max brow raises 20s → max cheek lifts 20s → max jaw clenches 20s → max puckers 20s → max scrunches 20s → collapse and relax 60s.' },
];

// ── Plan builder ──

const PLAN_EXERCISES: Record<string, Omit<ExerciseItem, 'id'>[]> = {
  jawline: JAW_EXERCISES,
  'double-chin': CHIN_EXERCISES,
  'neck-posture': NECK_EXERCISES,
  'face-massage': MASSAGE_EXERCISES,
  cheekbones: CHEEK_EXERCISES,
  'eye-area': EYE_EXERCISES,
  'lip-plumper': LIP_EXERCISES,
  'forehead-smooth': FOREHEAD_EXERCISES,
  'nose-reshaper': NOSE_EXERCISES,
  'smile-enhancer': SMILE_EXERCISES,
  'face-relax': RELAX_EXERCISES,
  'full-face': FULLFACE_EXERCISES,
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
  {
    id: 'lip-plumper',
    name: 'Lip Plumper & Definer',
    description: 'Fuller, defined lips through orbicularis oris training',
    image: '/plans/jawline.webp',
    days: buildDays('lip-plumper', LIP_EXERCISES),
  },
  {
    id: 'forehead-smooth',
    name: 'Forehead Smoother',
    description: 'Reduce forehead lines and lift the brow area',
    image: '/plans/eye-area.webp',
    days: buildDays('forehead-smooth', FOREHEAD_EXERCISES),
  },
  {
    id: 'nose-reshaper',
    name: 'Nose Reshaper',
    description: 'Tone nasalis muscles for a slimmer nose appearance',
    image: '/plans/neck-posture.webp',
    days: buildDays('nose-reshaper', NOSE_EXERCISES),
  },
  {
    id: 'smile-enhancer',
    name: 'Smile Enhancer',
    description: 'Build a wider, symmetrical smile and lift laugh lines',
    image: '/plans/cheekbone.webp',
    days: buildDays('smile-enhancer', SMILE_EXERCISES),
  },
  {
    id: 'face-relax',
    name: 'Face Relaxation & TMJ Relief',
    description: 'Release jaw tension, de-stress facial muscles, and restore calm',
    image: '/plans/face-massage.webp',
    days: buildDays('face-relax', RELAX_EXERCISES),
  },
  {
    id: 'full-face',
    name: 'Full Face Burn',
    description: 'High-intensity circuit hitting every facial muscle group',
    image: '/plans/double-chin.webp',
    days: buildDays('full-face', FULLFACE_EXERCISES),
  },
];

// ── Auto-recommend mapping ──
export const TRAIT_TO_PLAN: Record<string, string> = {
  jawline: 'jawline',
  skin: 'face-massage',
  cheekbones: 'cheekbones',
  eyes: 'eye-area',
  symmetry: 'smile-enhancer',
  lips: 'lip-plumper',
  hair: 'neck-posture',
  nose: 'nose-reshaper',
  chin: 'double-chin',
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
