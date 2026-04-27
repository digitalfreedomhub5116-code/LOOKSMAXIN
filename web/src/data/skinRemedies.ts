export interface Remedy {
  id: string;
  name: string;
  subtitle: string;
  tags: string[];
  summary: string;
  ingredients: string[];
  steps: string[];
  benefits: string[];
  duration: string;
  frequency: string;
  color: string;
  image: string;
  category: RemedyCategory;
}

export type RemedyCategory = 'glow' | 'acne' | 'detan' | 'hydration' | 'antiaging' | 'pores';

export const CATEGORY_META: Record<RemedyCategory, { label: string; description: string; color: string }> = {
  glow: { label: 'Glow & Brightening', description: 'Radiance-boosting face packs', color: '#C8A84E' },
  acne: { label: 'Acne & Purifying', description: 'Fight breakouts naturally', color: '#22C55E' },
  detan: { label: 'De-Tan & Dark Spots', description: 'Remove tan & fade marks', color: '#FB923C' },
  hydration: { label: 'Hydration & Repair', description: 'Deep nourishment for dry skin', color: '#60A5FA' },
  antiaging: { label: 'Anti-Aging & Firming', description: 'Tighten, firm & reduce wrinkles', color: '#A78BFA' },
  pores: { label: 'Pore & Oil Control', description: 'Mattify, tighten & detox pores', color: '#F472B6' },
};

export const CATEGORY_ORDER: RemedyCategory[] = ['glow', 'detan', 'acne', 'hydration', 'antiaging', 'pores'];

const IMG = {
  turmeric: '/remedies/turmeric.webp',
  neem: '/remedies/neem.webp',
  sandalwood: '/remedies/sandalwood.webp',
  clay: '/remedies/clay.webp',
  aloe: '/remedies/aloe.webp',
  rose: '/remedies/rose.webp',
  honey: '/remedies/honey.webp',
  coffee: '/remedies/coffee.webp',
  papaya: '/remedies/papaya.webp',
  tomato: '/remedies/tomato.webp',
  cucumber: '/remedies/cucumber.webp',
  lemon: '/remedies/lemon.webp',
  milk: '/remedies/milk.webp',
  oats: '/remedies/oats.webp',
  charcoal: '/remedies/charcoal.webp',
  teatree: '/remedies/teatree.webp',
  rice: '/remedies/rice.webp',
  coconut: '/remedies/coconut.webp',
  potato: '/remedies/potato.webp',
  haldi_milk: '/remedies/haldi_milk.webp',
  karela: '/remedies/karela.webp',
  saffron: '/remedies/saffron.webp',
  amla2: '/remedies/amla2.webp',
  fenugreek: '/remedies/fenugreek.webp',
  tulsi: '/remedies/tulsi.webp',
};

export const REMEDIES: Remedy[] = [
  // ═══ GLOW & BRIGHTENING ═══
  {
    id: 'ubtan-gold', category: 'glow',
    name: 'Golden Ubtan', subtitle: 'Ancient glow formula',
    tags: ['Glow', 'Brightening', 'Exfoliant'],
    summary: 'Classic besan-haldi ubtan used for centuries to brighten skin and remove tan.',
    ingredients: ['2 tbsp Besan (gram flour)', '1/2 tsp Haldi (turmeric)', '1 tbsp Dahi (yogurt)', '1 tsp Honey', 'Rose water (as needed)'],
    steps: ['Mix besan and haldi in a bowl.', 'Add dahi and honey, stir into a smooth paste.', 'Add rose water drop by drop until you get a spreadable consistency.', 'Apply evenly on face and neck, avoiding eye area.', 'Leave for 15-20 minutes until semi-dry.', 'Wet fingers and gently scrub in circular motions to exfoliate.', 'Rinse with lukewarm water, pat dry.'],
    benefits: ['Removes dead skin cells', 'Brightens complexion', 'Reduces tan', 'Natural exfoliation'],
    duration: '20 min', frequency: '2-3x per week', color: '#C8A84E', image: IMG.turmeric,
  },
  {
    id: 'chandan-glow', category: 'glow',
    name: 'Chandan Glow Pack', subtitle: 'Royal skin brightener',
    tags: ['Brightening', 'Cooling', 'Anti-aging'],
    summary: 'Sandalwood and rose water pack used by royalty for radiant, cool skin.',
    ingredients: ['1 tbsp Chandan (sandalwood) powder', '2 tbsp Gulab jal (rose water)', '1 tsp Honey', 'Pinch of Kesar (saffron)'],
    steps: ['Soak saffron strands in rose water for 10 minutes.', 'Mix chandan powder with the saffron-infused rose water.', 'Add honey and mix into a smooth paste.', 'Apply evenly on face and neck.', 'Relax for 20-25 minutes.', 'Wash off with cool water.'],
    benefits: ['Brightens skin tone', 'Cooling effect', 'Reduces pigmentation', 'Anti-aging properties'],
    duration: '25 min', frequency: '2x per week', color: '#F59E0B', image: IMG.sandalwood,
  },
  {
    id: 'haldi-doodh', category: 'glow',
    name: 'Haldi Doodh Glow', subtitle: 'Golden milk face mask',
    tags: ['Anti-inflammatory', 'Glow', 'Healing'],
    summary: 'Turmeric milk paste — the ultimate anti-inflammatory glow booster.',
    ingredients: ['1 tsp Haldi powder', '2 tbsp raw Milk', '1 tsp Shahad (honey)', 'Pinch of Dalchini (cinnamon)'],
    steps: ['Mix haldi with raw milk to make a paste.', 'Add honey and cinnamon powder.', 'Apply on face and neck evenly.', 'Leave for 15 minutes.', 'Wash off with lukewarm water.', 'Use a toner afterwards to remove yellow tint.'],
    benefits: ['Reduces inflammation', 'Heals acne scars', 'Natural glow', 'Anti-bacterial'],
    duration: '15 min', frequency: '2-3x per week', color: '#EAB308', image: IMG.haldi_milk,
  },
  {
    id: 'kesar-cream', category: 'glow',
    name: 'Kesar Radiance Cream', subtitle: 'Luxury glow booster',
    tags: ['Luxury', 'Glow', 'Anti-aging'],
    summary: 'Saffron-infused cream — the Mughal beauty secret for luminous skin.',
    ingredients: ['5-6 Kesar (saffron) strands', '2 tbsp Malai (cream)', '1 tsp Badam (almond) oil', '1 tsp Honey'],
    steps: ['Soak saffron in 1 tsp warm milk for 15 min.', 'Mix malai with almond oil and honey.', 'Add saffron milk to the mixture.', 'Apply on face as a night cream.', 'Massage gently for 3-5 minutes.', 'Leave overnight or wash after 30 min.'],
    benefits: ['Luminous glow', 'Anti-aging', 'Reduces pigmentation', 'Deep nourishment'],
    duration: '30 min', frequency: '3x per week', color: '#DC2626', image: IMG.saffron,
  },
  {
    id: 'honey-glow', category: 'glow',
    name: 'Raw Honey Glow Mask', subtitle: 'The simplest glow hack',
    tags: ['Glow', 'Moisturizing', 'Simple'],
    summary: 'Pure raw honey — the simplest yet most effective face mask in existence.',
    ingredients: ['2 tbsp Raw honey (organic preferred)', 'Nothing else needed!'],
    steps: ['Wash face with warm water to open pores.', 'Apply raw honey directly on damp face.', 'Massage in circular upward motions for 2 min.', 'Leave for 15-20 minutes.', 'Rinse with lukewarm water.', 'That\'s it — instant glow.'],
    benefits: ['Instant glow', 'Natural humectant', 'Antibacterial', 'Heals and moisturizes'],
    duration: '20 min', frequency: 'Daily safe', color: '#F59E0B', image: IMG.honey,
  },
  {
    id: 'papaya-enzyme', category: 'glow',
    name: 'Papaya Enzyme Peel', subtitle: 'Natural chemical peel',
    tags: ['Exfoliant', 'Brightening', 'Anti-aging'],
    summary: 'Papain enzyme in raw papaya naturally dissolves dead skin for baby-soft face.',
    ingredients: ['3 tbsp mashed raw Papaya', '1 tsp Honey', '1/2 tsp Nimboo juice'],
    steps: ['Mash ripe papaya into a pulp (no chunks).', 'Mix in honey and lemon juice.', 'Apply on clean face in upward strokes.', 'Leave for 15-20 minutes.', 'Gently massage while washing off.', 'Apply light moisturizer.'],
    benefits: ['Natural enzyme exfoliation', 'Fades dark spots', 'Softens skin', 'Evens skin tone'],
    duration: '20 min', frequency: '2x per week', color: '#FB923C', image: IMG.papaya,
  },

  // ═══ ACNE & PURIFYING ═══
  {
    id: 'neem-purifier', category: 'acne',
    name: 'Neem Purifier', subtitle: 'Anti-acne warrior',
    tags: ['Acne', 'Antibacterial', 'Purifying'],
    summary: 'Neem paste kills acne-causing bacteria and clears breakouts naturally.',
    ingredients: ['10-12 fresh Neem leaves', '1 tsp Haldi', '1 tbsp Multani mitti', 'Water or rose water'],
    steps: ['Wash neem leaves and grind into a fine paste.', 'Mix neem paste with haldi and multani mitti.', 'Add rose water to make a smooth paste.', 'Apply on face focusing on acne-prone areas.', 'Leave for 15 minutes.', 'Wash off with cold water.'],
    benefits: ['Kills acne bacteria', 'Reduces inflammation', 'Prevents future breakouts', 'Purifies pores'],
    duration: '15 min', frequency: '3x per week', color: '#22C55E', image: IMG.neem,
  },
  {
    id: 'kadu-bitter', category: 'acne',
    name: 'Kadu Neem Lepa', subtitle: 'Blood purifier mask',
    tags: ['Detox', 'Acne', 'Blood Purifier'],
    summary: 'Bitter neem and karela combo purifies blood and clears stubborn acne.',
    ingredients: ['1 tbsp Neem powder', '1 tbsp Karela (bitter gourd) juice', '1 tsp Haldi', 'Rose water'],
    steps: ['Extract fresh karela juice by grinding and straining.', 'Mix neem powder with karela juice and haldi.', 'Add rose water for consistency.', 'Apply on face and affected areas.', 'Leave for 15 minutes (may tingle slightly).', 'Wash with lukewarm water.'],
    benefits: ['Purifies blood', 'Clears cystic acne', 'Reduces boils', 'Detoxifies skin'],
    duration: '15 min', frequency: '2x per week', color: '#166534', image: IMG.karela,
  },
  {
    id: 'tulsi-toner', category: 'acne',
    name: 'Tulsi Clarifying Toner', subtitle: 'Holy basil skin tonic',
    tags: ['Toner', 'Acne', 'Antibacterial'],
    summary: 'Tulsi-infused water works as a natural toner to fight acne and tighten pores.',
    ingredients: ['15-20 fresh Tulsi leaves', '1 cup boiled Water', '1 tsp Apple cider vinegar', '2-3 drops Tea tree oil'],
    steps: ['Boil water and add tulsi leaves.', 'Simmer for 10 minutes on low heat.', 'Strain and let it cool completely.', 'Add apple cider vinegar and tea tree oil.', 'Pour into a spray bottle.', 'Spritz on face after cleansing, morning and night.', 'Store in fridge — lasts 1 week.'],
    benefits: ['Natural antibacterial', 'Tightens pores', 'Controls oil', 'Prevents breakouts'],
    duration: '2 min', frequency: 'Daily (AM & PM)', color: '#059669', image: IMG.tulsi,
  },
  {
    id: 'tea-tree-spot', category: 'acne',
    name: 'Tea Tree Spot Fix', subtitle: 'Overnight pimple killer',
    tags: ['Spot Treatment', 'Acne', 'Overnight'],
    summary: 'Concentrated tea tree application that kills pimples overnight.',
    ingredients: ['3-4 drops Tea tree oil', '1 tsp Aloe vera gel', '1 tsp Neem oil', 'Cotton buds'],
    steps: ['Mix tea tree oil with aloe gel and neem oil.', 'Cleanse face thoroughly before bed.', 'Dip cotton bud in the mixture.', 'Dab directly on active pimples only.', 'Leave overnight.', 'Wash face normally in the morning.'],
    benefits: ['Kills pimples overnight', 'Reduces redness', 'Prevents spreading', 'No scarring'],
    duration: 'Overnight', frequency: 'As needed', color: '#34D399', image: IMG.teatree,
  },
  {
    id: 'charcoal-deep', category: 'acne',
    name: 'Charcoal Deep Clean', subtitle: 'Blackhead eliminator',
    tags: ['Blackheads', 'Deep Clean', 'Detox'],
    summary: 'Activated charcoal pulls out deep-seated blackheads and impurities.',
    ingredients: ['1 tbsp Activated charcoal powder', '1 tbsp Bentonite clay', '1 tbsp Apple cider vinegar', 'Water as needed'],
    steps: ['Mix charcoal and clay in a non-metal bowl.', 'Add apple cider vinegar (it will fizz — normal).', 'Add water to reach paste consistency.', 'Apply on nose, chin, and forehead (T-zone).', 'Leave for 10-15 minutes until tight.', 'Wash with warm water, follow with cold rinse.'],
    benefits: ['Pulls out blackheads', 'Deep pore cleansing', 'Absorbs toxins', 'Mattifies oily skin'],
    duration: '15 min', frequency: '1x per week', color: '#374151', image: IMG.charcoal,
  },

  // ═══ DE-TAN & DARK SPOTS ═══
  {
    id: 'coffee-scrub', category: 'detan',
    name: 'Coffee De-Tan Scrub', subtitle: 'Instant tan removal',
    tags: ['De-tan', 'Exfoliant', 'Energizing'],
    summary: 'Coffee grounds physically exfoliate and caffeine boosts blood flow for glow.',
    ingredients: ['2 tbsp Coffee grounds (used or fresh)', '1 tbsp Coconut oil', '1 tsp Brown sugar', '1/2 tsp Haldi'],
    steps: ['Mix coffee grounds with coconut oil.', 'Add brown sugar and haldi.', 'Wet face and apply in gentle circular motions.', 'Scrub for 3-5 minutes — focus on tan areas.', 'Leave for 5 minutes after scrubbing.', 'Rinse with cool water.'],
    benefits: ['Removes tan instantly', 'Boosts circulation', 'Physical exfoliation', 'Energizes dull skin'],
    duration: '10 min', frequency: '2x per week', color: '#78350F', image: IMG.coffee,
  },
  {
    id: 'nimbu-honey', category: 'detan',
    name: 'Nimbu Honey Brightener', subtitle: 'Vitamin C face mask',
    tags: ['Brightening', 'Dark Spots', 'Vitamin C'],
    summary: 'Lemon juice and honey lighten dark spots and even out skin tone naturally.',
    ingredients: ['1 tbsp fresh Nimbu (lemon) juice', '2 tbsp Shahad (honey)', '1 tsp Haldi'],
    steps: ['Mix lemon juice with honey (raw preferred).', 'Add haldi and stir well.', 'Apply on face avoiding eye area.', 'Leave for 15 minutes — slight tingling is normal.', 'Wash with cool water.', 'Apply sunscreen if going outdoors.'],
    benefits: ['Lightens dark spots', 'Natural vitamin C', 'Antibacterial', 'Evens tone'],
    duration: '15 min', frequency: '2x per week', color: '#FDE047', image: IMG.lemon,
  },
  {
    id: 'tomato-tan', category: 'detan',
    name: 'Tomato Tan Eraser', subtitle: 'Lycopene brightener',
    tags: ['De-tan', 'Brightening', 'Vitamin C'],
    summary: 'Tomato pulp\'s lycopene fights sun damage and removes stubborn tan.',
    ingredients: ['1 ripe Tomato', '1 tbsp Dahi', '1 tsp Honey', '1/2 tsp Nimbu juice'],
    steps: ['Blend tomato into smooth pulp.', 'Mix with curd, honey, and lemon juice.', 'Apply on sun-exposed areas.', 'Leave for 20 minutes.', 'Rinse with cool water.', 'Apply sunscreen before going out.'],
    benefits: ['Removes sun tan', 'Rich in lycopene', 'Reduces sun damage', 'Natural bleaching'],
    duration: '20 min', frequency: '3x per week', color: '#EF4444', image: IMG.tomato,
  },
  {
    id: 'potato-dark', category: 'detan',
    name: 'Potato Dark Spot Fade', subtitle: 'Natural bleaching agent',
    tags: ['Dark Spots', 'Brightening', 'Pigmentation'],
    summary: 'Raw potato juice is a natural bleach that fades dark spots and acne marks.',
    ingredients: ['1 raw Potato', '1 tsp Nimbu juice', '1 tsp Honey'],
    steps: ['Grate raw potato and extract juice.', 'Mix juice with lemon and honey.', 'Apply on dark spots and marks with cotton.', 'Leave for 20 minutes.', 'Rinse with water.', 'Use consistently for 2-3 weeks for visible results.'],
    benefits: ['Fades dark spots', 'Natural skin bleach', 'Reduces acne marks', 'Evens complexion'],
    duration: '20 min', frequency: 'Daily', color: '#D97706', image: IMG.potato,
  },

  // ═══ HYDRATION & REPAIR ═══
  {
    id: 'aloe-repair', category: 'hydration',
    name: 'Aloe Repair Gel', subtitle: 'Skin soother & healer',
    tags: ['Soothing', 'Hydrating', 'Healing'],
    summary: 'Fresh aloe vera gel heals sunburn, reduces scars, and deeply hydrates.',
    ingredients: ['1 fresh Aloe vera leaf', '1 tsp Honey', '2-3 drops Vitamin E oil'],
    steps: ['Cut aloe leaf and scoop out fresh gel.', 'Blend gel until smooth, no chunks.', 'Mix in honey and vitamin E oil.', 'Apply as a face mask or spot treatment.', 'Leave for 20 minutes.', 'Rinse with cool water.'],
    benefits: ['Heals sunburn', 'Fades scars', 'Deep hydration', 'Anti-inflammatory'],
    duration: '20 min', frequency: 'Daily', color: '#4ADE80', image: IMG.aloe,
  },
  {
    id: 'doodh-malai', category: 'hydration',
    name: 'Doodh Malai Pack', subtitle: 'Deep moisture ritual',
    tags: ['Dry Skin', 'Moisturizing', 'Softening'],
    summary: 'Raw milk cream (malai) deeply nourishes and softens dry, flaky skin.',
    ingredients: ['2 tbsp fresh Malai (milk cream)', '1 tsp Honey', 'Pinch of Haldi', '1 tsp Badam (almond) oil'],
    steps: ['Collect fresh malai from boiled milk.', 'Mix with honey, haldi, and almond oil.', 'Apply thick layer on face and neck.', 'Gently massage for 2-3 minutes.', 'Leave for 20 minutes.', 'Wash with lukewarm water, pat dry.'],
    benefits: ['Intense moisturization', 'Softens rough patches', 'Natural glow', 'Repairs dry skin'],
    duration: '20 min', frequency: '3x per week', color: '#FEF3C7', image: IMG.coconut,
  },
  {
    id: 'oats-gentle', category: 'hydration',
    name: 'Oats Gentle Scrub', subtitle: 'Sensitive skin cleanser',
    tags: ['Sensitive Skin', 'Gentle', 'Exfoliant'],
    summary: 'Oatmeal provides ultra-gentle exfoliation perfect for sensitive, reactive skin.',
    ingredients: ['2 tbsp ground Oats', '1 tbsp Honey', '1 tbsp Milk', '1 tsp Badam oil'],
    steps: ['Grind oats into a fine powder.', 'Mix with honey, milk, and almond oil.', 'Apply on damp face gently.', 'Very lightly massage in circles for 1-2 min.', 'Leave as mask for 10 minutes.', 'Rinse with lukewarm water.'],
    benefits: ['Ultra-gentle exfoliation', 'Safe for sensitive skin', 'Calms redness', 'Moisturizes'],
    duration: '12 min', frequency: '2-3x per week', color: '#D4A574', image: IMG.oats,
  },
  {
    id: 'coconut-lip', category: 'hydration',
    name: 'Coconut Lip Rescue', subtitle: 'Lip repair balm',
    tags: ['Lips', 'Moisturizing', 'Repair'],
    summary: 'Homemade lip balm that heals cracked, dry, and pigmented lips overnight.',
    ingredients: ['1 tbsp Nariyal (coconut) oil', '1 tsp Honey', '1/2 tsp Chukandar (beetroot) juice', 'Pinch of Sugar'],
    steps: ['Mix coconut oil with honey.', 'Add beetroot juice for natural tint.', 'Add sugar and mix as a scrub.', 'Apply on lips and scrub gently for 2 minutes.', 'Wipe off sugar with damp cloth.', 'Leave the oil-honey layer overnight.'],
    benefits: ['Heals cracked lips', 'Natural pink tint', 'Deep moisturization', 'Removes dead skin'],
    duration: 'Overnight', frequency: 'Daily', color: '#BE185D', image: IMG.coconut,
  },

  // ═══ ANTI-AGING & FIRMING ═══
  {
    id: 'methi-pack', category: 'antiaging',
    name: 'Methi Anti-Aging Pack', subtitle: 'Fenugreek firming mask',
    tags: ['Anti-aging', 'Firming', 'Wrinkles'],
    summary: 'Soaked methi seeds create a paste that firms skin and reduces fine lines.',
    ingredients: ['2 tbsp Methi (fenugreek) seeds', 'Water for soaking', '1 tbsp Dahi (yogurt)', '1 tsp Honey'],
    steps: ['Soak methi seeds overnight in water.', 'Grind soaked seeds into a smooth paste.', 'Mix with yogurt and honey.', 'Apply on face and neck — focus on wrinkle areas.', 'Leave for 20 minutes.', 'Wash with lukewarm water.'],
    benefits: ['Firms sagging skin', 'Reduces fine lines', 'Rich in antioxidants', 'Tightens skin'],
    duration: '20 min', frequency: '2x per week', color: '#A16207', image: IMG.fenugreek,
  },
  {
    id: 'amla-vitamin', category: 'antiaging',
    name: 'Amla Vitamin Pack', subtitle: 'Vitamin C powerhouse',
    tags: ['Vitamin C', 'Brightening', 'Anti-aging'],
    summary: 'Indian gooseberry has 20x more vitamin C than oranges — the ultimate brightener.',
    ingredients: ['2 tbsp Amla powder', '1 tbsp Honey', '1 tbsp Dahi', 'Rose water'],
    steps: ['Mix amla powder with yogurt and honey.', 'Add rose water for smooth consistency.', 'Apply on face and neck.', 'Leave for 15-20 minutes.', 'Wash with lukewarm water.', 'Follow with moisturizer.'],
    benefits: ['Intense vitamin C', 'Collagen boost', 'Brightens dull skin', 'Anti-aging'],
    duration: '20 min', frequency: '2x per week', color: '#84CC16', image: IMG.amla2,
  },
  {
    id: 'rice-water', category: 'antiaging',
    name: 'Rice Water Toner', subtitle: 'Korean-Ayurvedic hybrid',
    tags: ['Toner', 'Brightening', 'Anti-aging'],
    summary: 'Fermented rice water — used in both Korean and Indian beauty for centuries.',
    ingredients: ['1/2 cup uncooked Rice', '2 cups Water', 'Spray bottle', '2-3 drops Lavender oil (optional)'],
    steps: ['Wash rice once to remove dirt.', 'Soak in 2 cups water for 30 minutes, stir occasionally.', 'Strain the milky water into a jar.', 'Let it ferment at room temp for 24-48 hours.', 'Dilute 1:1 with fresh water, add lavender oil.', 'Pour into spray bottle.', 'Use as toner after cleansing — spritz and pat in.'],
    benefits: ['Tightens pores', 'Brightens skin', 'Reduces fine lines', 'Improves texture'],
    duration: '2 min', frequency: 'Daily', color: '#E5E7EB', image: IMG.rice,
  },

  // ═══ PORE & OIL CONTROL ═══
  {
    id: 'multani-detox', category: 'pores',
    name: 'Multani Mitti Detox', subtitle: 'Deep pore cleanser',
    tags: ['Oily Skin', 'Pores', 'Detox'],
    summary: 'Fuller\'s earth draws out impurities and excess oil for clear, matte skin.',
    ingredients: ['2 tbsp Multani mitti', '1 tbsp Rose water', '1 tsp Nimboo (lemon) juice', '1 tsp Honey'],
    steps: ['Mix multani mitti with rose water into a paste.', 'Add lemon juice and honey, stir well.', 'Apply thick layer on face, avoiding eyes.', 'Let it dry completely (15-20 min).', 'Splash water on face and gently remove.', 'Follow with a light moisturizer.'],
    benefits: ['Absorbs excess oil', 'Tightens pores', 'Deep cleanses', 'Gives matte finish'],
    duration: '20 min', frequency: '2x per week', color: '#A0522D', image: IMG.clay,
  },
  {
    id: 'rose-ice', category: 'pores',
    name: 'Rose Ice Facial', subtitle: 'Pore-tightening ritual',
    tags: ['Pores', 'Cooling', 'Tightening'],
    summary: 'Frozen rose water cubes shrink pores and give instant glass-skin effect.',
    ingredients: ['1 cup Gulab jal (rose water)', 'Ice tray', '5-6 fresh Rose petals (optional)', '2-3 drops Glycerin'],
    steps: ['Mix rose water with glycerin.', 'Place rose petals in ice tray compartments.', 'Pour rose water mix over petals.', 'Freeze for 6+ hours.', 'After cleansing, wrap cube in thin cloth.', 'Glide over face in upward strokes for 5 minutes.', 'Let skin air dry — don\'t towel off.'],
    benefits: ['Shrinks pores instantly', 'Glass skin effect', 'Reduces puffiness', 'Morning de-bloat'],
    duration: '5 min', frequency: 'Daily', color: '#F472B6', image: IMG.rose,
  },
  {
    id: 'cucumber-cool', category: 'pores',
    name: 'Cucumber Cool Mask', subtitle: 'Under-eye rescue',
    tags: ['Under-eye', 'Cooling', 'Soothing'],
    summary: 'Cucumber and potato juice reduce dark circles and puffiness around eyes.',
    ingredients: ['1/2 Cucumber (grated)', '1 small Potato (grated)', '1 tsp Gulab jal', '1 tsp Aloe gel'],
    steps: ['Grate cucumber and potato separately.', 'Extract juice from both by squeezing through cloth.', 'Mix both juices with rose water and aloe gel.', 'Soak cotton pads in the mixture.', 'Place on closed eyes for 15 minutes.', 'Rinse face with cold water.'],
    benefits: ['Reduces dark circles', 'De-puffs eyes', 'Cools tired eyes', 'Lightens under-eye area'],
    duration: '15 min', frequency: 'Daily', color: '#86EFAC', image: IMG.cucumber,
  },
];
