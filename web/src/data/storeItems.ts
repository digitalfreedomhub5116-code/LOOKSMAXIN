/**
 * Store Items Database
 * All purchasable items: borders, themes, consumables, titles, banners.
 */

/* ═══ Types ═══ */
export type StoreCategory = 'border' | 'theme' | 'consumable' | 'title' | 'banner';
export type ItemTier = 'basic' | 'color' | 'elemental' | 'special' | 'prismatic' | 'seasonal' | 'premium' | 'legendary' | 'rank-gated';

export interface StoreItem {
  id: string;
  name: string;
  category: StoreCategory;
  tier: ItemTier;
  price: number;
  description: string;
  /** For themes: CSS variable overrides */
  themeVars?: Record<string, string>;
  /** For borders: SVG config */
  borderConfig?: BorderConfig;
  /** For borders: image path (used with mix-blend-mode: screen) */
  imageBorder?: string;
  /** For borders: CSS animation on the image overlay */
  imageAnimated?: boolean;
  /** For borders: CSS aura glow config (no image needed) */
  auraConfig?: {
    colors: string[];       // glow colors
    blur: number;           // blur radius in px
    spread: number;         // spread radius in px
    animated?: boolean;     // hue-rotate animation
    pulseSpeed?: number;    // pulse animation speed in seconds
  };
  /** For titles: display styling */
  titleConfig?: TitleConfig;
  /** For consumables: effect */
  consumableEffect?: string;
  /** Rank requirement (e.g. "chad", "gigachad") */
  rankRequired?: string;
  /** Is it limited time / seasonal? */
  seasonal?: boolean;
}

export interface BorderConfig {
  colors: string[];       // gradient stops
  strokeWidth: number;
  animated: boolean;
  animationType?: 'rotate' | 'pulse' | 'dash' | 'shimmer' | 'hue-rotate';
  glowColor?: string;
  glowIntensity?: number; // 0-1
}

export interface TitleConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  glow?: boolean;
}

/* ═══ BORDERS ═══ */
const BORDERS: StoreItem[] = [
  // SVG Borders
  {
    id: 'border-inferno', name: 'Inferno', category: 'border', tier: 'elemental', price: 200,
    description: 'Blazing fire ring with animated glow.',
    borderConfig: { colors: ['#FF4500', '#FF8C00'], strokeWidth: 3.5, animated: true, animationType: 'pulse', glowColor: 'rgba(255,69,0,0.3)', glowIntensity: 0.6 },
  },
  {
    id: 'border-diamond', name: 'Diamond Edge', category: 'border', tier: 'rank-gated', price: 300,
    description: 'Faceted diamond ring — for the above average.',
    borderConfig: { colors: ['#B9F2FF', '#E0FFFF', '#FFFFFF'], strokeWidth: 3.5, animated: true, animationType: 'shimmer', glowColor: 'rgba(185,242,255,0.3)', glowIntensity: 0.4 },
    rankRequired: 'Above Average',
  },
  {
    id: 'border-darkmatter', name: 'Dark Matter', category: 'border', tier: 'premium', price: 500,
    description: 'Void black core with orbiting gold particles.',
    borderConfig: { colors: ['#000000', '#C8A84E'], strokeWidth: 4, animated: true, animationType: 'dash', glowColor: 'rgba(200,168,78,0.4)', glowIntensity: 0.7 },
  },

  // Image-Based Borders
  {
    id: 'border-ice-img', name: 'Ice Crown', category: 'border', tier: 'elemental', price: 350,
    description: 'Frozen crystalline frost wrapping your avatar.',
    imageBorder: '/borders/ice-transparent.png',
    borderConfig: { colors: ['#00BFFF', '#E0FFFF'], strokeWidth: 3, animated: false, glowColor: 'rgba(0,191,255,0.4)', glowIntensity: 0.6 },
  },
  {
    id: 'border-dragon-img', name: 'Dragon Coil', category: 'border', tier: 'legendary', price: 500,
    description: 'A mythic water dragon coils around your profile.',
    imageBorder: '/borders/dragon.png',
    borderConfig: { colors: ['#60A5FA', '#93C5FD'], strokeWidth: 3, animated: false, glowColor: 'rgba(96,165,250,0.4)', glowIntensity: 0.7 },
  },
  {
    id: 'border-starcrown-img', name: 'Star Crown', category: 'border', tier: 'premium', price: 400,
    description: 'Celestial stars orbiting your portrait like a crown.',
    imageBorder: '/borders/rotate.png',
    imageAnimated: true,
    borderConfig: { colors: ['#E2E8F0', '#94A3B8'], strokeWidth: 3, animated: false, glowColor: 'rgba(226,232,240,0.4)', glowIntensity: 0.5 },
  },
  {
    id: 'border-shadowthrone-img', name: 'Shadow Throne', category: 'border', tier: 'legendary', price: 500,
    description: 'Ornate dark-magic thorns weaving a royal frame.',
    imageBorder: '/borders/purple.png',
    borderConfig: { colors: ['#C084FC', '#A855F7'], strokeWidth: 3, animated: false, glowColor: 'rgba(192,132,252,0.4)', glowIntensity: 0.7 },
  },

  // CSS Aura Glow Borders
  {
    id: 'border-aura-void', name: 'Void Aura', category: 'border', tier: 'legendary', price: 600,
    description: 'A swirling void of purple and blue energy radiating from your profile.',
    auraConfig: { colors: ['#7C3AED', '#3B82F6', '#A855F7', '#6366F1'], blur: 12, spread: 3, animated: true, pulseSpeed: 3 },
    borderConfig: { colors: ['#7C3AED', '#A855F7'], strokeWidth: 3, animated: false, glowColor: 'rgba(124,58,237,0.5)', glowIntensity: 0.8 },
  },
  {
    id: 'border-aura-solar', name: 'Solar Flare', category: 'border', tier: 'legendary', price: 600,
    description: 'Blazing golden-orange plasma aura scorching around your avatar.',
    auraConfig: { colors: ['#F59E0B', '#EF4444', '#F97316', '#FBBF24'], blur: 14, spread: 4, animated: true, pulseSpeed: 2.5 },
    borderConfig: { colors: ['#F59E0B', '#EF4444'], strokeWidth: 3, animated: false, glowColor: 'rgba(245,158,11,0.5)', glowIntensity: 0.8 },
  },
  {
    id: 'border-aura-toxic', name: 'Toxic Haze', category: 'border', tier: 'premium', price: 450,
    description: 'Radioactive green mist pulsing with biohazard energy.',
    auraConfig: { colors: ['#22C55E', '#10B981', '#84CC16', '#34D399'], blur: 10, spread: 3, animated: true, pulseSpeed: 4 },
    borderConfig: { colors: ['#22C55E', '#10B981'], strokeWidth: 3, animated: false, glowColor: 'rgba(34,197,94,0.5)', glowIntensity: 0.7 },
  },
];



/* ═══ THEMES ═══ */
const THEMES: StoreItem[] = [
  // Color (100 LC)
  {
    id: 'theme-crimson', name: 'Crimson Night', category: 'theme', tier: 'color', price: 100,
    description: 'Deep red accents on midnight black.',
    themeVars: { '--primary': '#DC2626', '--primary-rgb': '220,38,38', '--surface': '#1a0808', '--bg': '#0a0000', '--border': 'rgba(220,38,38,0.15)' },
  },
  {
    id: 'theme-emerald', name: 'Emerald Dark', category: 'theme', tier: 'color', price: 100,
    description: 'Rich green tones — nature meets luxury.',
    themeVars: { '--primary': '#10B981', '--primary-rgb': '16,185,129', '--surface': '#061a12', '--bg': '#000a06', '--border': 'rgba(16,185,129,0.15)' },
  },
  {
    id: 'theme-sapphire', name: 'Sapphire Night', category: 'theme', tier: 'color', price: 100,
    description: 'Cool blue hues — calm and focused.',
    themeVars: { '--primary': '#3B82F6', '--primary-rgb': '59,130,246', '--surface': '#0a1428', '--bg': '#000818', '--border': 'rgba(59,130,246,0.15)' },
  },
  {
    id: 'theme-amber', name: 'Amber Flame', category: 'theme', tier: 'color', price: 100,
    description: 'Warm amber glow — fiery and bold.',
    themeVars: { '--primary': '#F59E0B', '--primary-rgb': '245,158,11', '--surface': '#1a1400', '--bg': '#0a0a00', '--border': 'rgba(245,158,11,0.15)' },
  },
  {
    id: 'theme-rose', name: 'Rose Gold', category: 'theme', tier: 'color', price: 100,
    description: 'Elegant pink-gold — premium and soft.',
    themeVars: { '--primary': '#F472B6', '--primary-rgb': '244,114,182', '--surface': '#1a0a14', '--bg': '#0a0008', '--border': 'rgba(244,114,182,0.15)' },
  },
  {
    id: 'theme-violet', name: 'Violet Dusk', category: 'theme', tier: 'color', price: 100,
    description: 'Twilight purple — mysterious and sleek.',
    themeVars: { '--primary': '#8B5CF6', '--primary-rgb': '139,92,246', '--surface': '#120a1e', '--bg': '#08041a', '--border': 'rgba(139,92,246,0.15)' },
  },
  {
    id: 'theme-ocean', name: 'Ocean Blue', category: 'theme', tier: 'color', price: 100,
    description: 'Deep ocean teal — fresh and modern.',
    themeVars: { '--primary': '#06B6D4', '--primary-rgb': '6,182,212', '--surface': '#041a1e', '--bg': '#000a0e', '--border': 'rgba(6,182,212,0.15)' },
  },
  {
    id: 'theme-silver', name: 'Silver Frost', category: 'theme', tier: 'color', price: 100,
    description: 'Neutral silver — clean and minimal.',
    themeVars: { '--primary': '#94A3B8', '--primary-rgb': '148,163,184', '--surface': '#14161a', '--bg': '#0a0a0e', '--border': 'rgba(148,163,184,0.15)' },
  },

  // Special (200 LC)
  {
    id: 'theme-carbon', name: 'Carbon Fiber', category: 'theme', tier: 'special', price: 200,
    description: 'Textured dark carbon with grey accents.',
    themeVars: { '--primary': '#9CA3AF', '--primary-rgb': '156,163,175', '--surface': '#1a1a1a', '--bg': '#0d0d0d', '--border': 'rgba(156,163,175,0.12)' },
  },
  {
    id: 'theme-platinum', name: 'Platinum', category: 'theme', tier: 'special', price: 200,
    description: 'Brilliant white-silver — ultra-premium.',
    themeVars: { '--primary': '#E5E7EB', '--primary-rgb': '229,231,235', '--surface': '#18181b', '--bg': '#09090b', '--border': 'rgba(229,231,235,0.12)' },
  },
  {
    id: 'theme-obsidian', name: 'Obsidian', category: 'theme', tier: 'special', price: 200,
    description: 'Pure black with sharp gold accents.',
    themeVars: { '--primary': '#C8A84E', '--primary-rgb': '200,168,78', '--surface': '#0a0a0a', '--bg': '#000000', '--border': 'rgba(200,168,78,0.1)' },
  },
  {
    id: 'theme-chrome', name: 'Midnight Chrome', category: 'theme', tier: 'special', price: 200,
    description: 'Metallic blue chrome — futuristic edge.',
    themeVars: { '--primary': '#60A5FA', '--primary-rgb': '96,165,250', '--surface': '#0f172a', '--bg': '#020617', '--border': 'rgba(96,165,250,0.12)' },
  },

  // Prismatic (400 LC)
  {
    id: 'theme-aurora', name: 'Aurora Borealis', category: 'theme', tier: 'prismatic', price: 400,
    description: 'Shifting green-cyan-purple — alive and mesmerizing.',
    themeVars: { '--primary': '#34D399', '--primary-rgb': '52,211,153', '--surface': '#0a1a14', '--bg': '#040e0a', '--border': 'rgba(52,211,153,0.12)' },
  },
  {
    id: 'theme-neon', name: 'Neon Pulse', category: 'theme', tier: 'prismatic', price: 400,
    description: 'Hot pink and electric blue — cyberpunk vibes.',
    themeVars: { '--primary': '#EC4899', '--primary-rgb': '236,72,153', '--surface': '#1a0a18', '--bg': '#0a0410', '--border': 'rgba(236,72,153,0.15)' },
  },
  {
    id: 'theme-solar', name: 'Solar Flare', category: 'theme', tier: 'prismatic', price: 400,
    description: 'Warm yellow-orange-red pulsing glow.',
    themeVars: { '--primary': '#FB923C', '--primary-rgb': '251,146,60', '--surface': '#1a1008', '--bg': '#0a0804', '--border': 'rgba(251,146,60,0.15)' },
  },
  {
    id: 'theme-cosmic', name: 'Cosmic Drift', category: 'theme', tier: 'prismatic', price: 400,
    description: 'Deep purple with starlight white accents.',
    themeVars: { '--primary': '#A78BFA', '--primary-rgb': '167,139,250', '--surface': '#0e0a1e', '--bg': '#06041a', '--border': 'rgba(167,139,250,0.12)' },
  },

  // Seasonal (150 LC)
  {
    id: 'theme-winter', name: 'Winter Frost', category: 'theme', tier: 'seasonal', price: 150,
    description: 'Ice blue and white — crisp winter energy.', seasonal: true,
    themeVars: { '--primary': '#7DD3FC', '--primary-rgb': '125,211,252', '--surface': '#0c1929', '--bg': '#040e1a', '--border': 'rgba(125,211,252,0.12)' },
  },
  {
    id: 'theme-spring', name: 'Spring Bloom', category: 'theme', tier: 'seasonal', price: 150,
    description: 'Soft pink-green — fresh renewal.', seasonal: true,
    themeVars: { '--primary': '#FB7185', '--primary-rgb': '251,113,133', '--surface': '#1a0e12', '--bg': '#0a0608', '--border': 'rgba(251,113,133,0.12)' },
  },
  {
    id: 'theme-summer', name: 'Summer Heat', category: 'theme', tier: 'seasonal', price: 150,
    description: 'Warm orange-gold — sun-kissed glow.', seasonal: true,
    themeVars: { '--primary': '#FBBF24', '--primary-rgb': '251,191,36', '--surface': '#1a1608', '--bg': '#0a0c04', '--border': 'rgba(251,191,36,0.12)' },
  },
  {
    id: 'theme-autumn', name: 'Autumn Ember', category: 'theme', tier: 'seasonal', price: 150,
    description: 'Burnt orange-brown — cozy and warm.', seasonal: true,
    themeVars: { '--primary': '#EA580C', '--primary-rgb': '234,88,12', '--surface': '#1a1008', '--bg': '#0a0804', '--border': 'rgba(234,88,12,0.12)' },
  },
];

/* ═══ CONSUMABLES ═══ */
const CONSUMABLES: StoreItem[] = [
  {
    id: 'boost-2x', name: '2× XP Shake', category: 'consumable', tier: 'basic', price: 75,
    description: 'Double XP from workouts for 24 hours.',
    consumableEffect: 'xp-2x',
  },
  {
    id: 'boost-3x', name: '3× XP Mega Shake', category: 'consumable', tier: 'special', price: 150,
    description: 'Triple XP from workouts for 24 hours.',
    consumableEffect: 'xp-3x',
  },
  {
    id: 'streak-shield', name: 'Streak Shield', category: 'consumable', tier: 'basic', price: 100,
    description: 'Protects your streak if you miss one day.',
    consumableEffect: 'streak-shield',
  },
  {
    id: 'scan-token', name: 'Extra Scan Token', category: 'consumable', tier: 'basic', price: 50,
    description: 'One bonus face scan beyond the daily limit.',
    consumableEffect: 'scan-token',
  },
  {
    id: 'spotlight', name: 'Leaderboard Spotlight', category: 'consumable', tier: 'premium', price: 200,
    description: 'Your name glows gold on the leaderboard for 7 days.',
    consumableEffect: 'spotlight',
  },
];

/* ═══ TITLES ═══ */
const TITLES: StoreItem[] = [
  {
    id: 'title-grinder', name: 'Grinder', category: 'title', tier: 'basic', price: 100,
    description: 'Show the world you never skip a day.',
    titleConfig: { color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
  },
  {
    id: 'title-sigma', name: 'Sigma', category: 'title', tier: 'basic', price: 150,
    description: 'Walk your own path.',
    titleConfig: { color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)' },
  },
  {
    id: 'title-beast', name: 'Beast Mode', category: 'title', tier: 'special', price: 200,
    description: 'Unleash your inner beast.',
    titleConfig: { color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  },
  {
    id: 'title-ascended', name: 'Ascended', category: 'title', tier: 'special', price: 300,
    description: 'You\'ve transcended the average.',
    titleConfig: { color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  },
  {
    id: 'title-elite', name: 'Lynx Elite', category: 'title', tier: 'premium', price: 500,
    description: 'The ultimate flex — you\'re the apex.',
    titleConfig: { color: '#C8A84E', bgColor: 'rgba(200,168,78,0.15)', borderColor: 'rgba(200,168,78,0.4)', glow: true },
  },
];

/* ═══ BANNERS ═══ */
const BANNERS: StoreItem[] = [
  { id: 'banner-mountain', name: 'Mountain Summit', category: 'banner', tier: 'basic', price: 150, description: 'Dramatic peak piercing through clouds.' },
  { id: 'banner-city', name: 'City Night', category: 'banner', tier: 'basic', price: 150, description: 'Skyline lit up after dark.' },
  { id: 'banner-golden', name: 'Golden Hour', category: 'banner', tier: 'special', price: 200, description: 'Sunset light breaking through clouds.' },
  { id: 'banner-abstract', name: 'Dark Abstract', category: 'banner', tier: 'special', price: 150, description: 'Black and gold fluid art.' },
  { id: 'banner-marble', name: 'Marble Luxury', category: 'banner', tier: 'premium', price: 200, description: 'Black marble with gold veins.' },
  { id: 'banner-gym', name: 'Gym Motivation', category: 'banner', tier: 'basic', price: 150, description: 'Raw iron and determination.' },
];

/* ═══ ALL ITEMS ═══ */
export const ALL_STORE_ITEMS: StoreItem[] = [
  ...BORDERS,
  ...THEMES,
  ...CONSUMABLES,
  ...TITLES,
  ...BANNERS,
];

export function getItemsByCategory(cat: StoreCategory): StoreItem[] {
  return ALL_STORE_ITEMS.filter(i => i.category === cat);
}

export function getItemById(id: string): StoreItem | undefined {
  return ALL_STORE_ITEMS.find(i => i.id === id);
}

/* ═══ Rotating Deals ═══ */
export function getTodaysDeals(count = 4): { item: StoreItem; discount: number }[] {
  // Seed based on date so deals are consistent throughout the day
  const seed = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''), 10);
  const shuffled = [...ALL_STORE_ITEMS]
    .filter(i => i.category !== 'consumable') // consumables are always available
    .sort((a, b) => {
      const hashA = (seed * 31 + a.id.charCodeAt(0)) % 1000;
      const hashB = (seed * 31 + b.id.charCodeAt(0)) % 1000;
      return hashA - hashB;
    });

  return shuffled.slice(0, count).map((item, i) => ({
    item,
    discount: [25, 30, 33, 40][i % 4],
  }));
}
