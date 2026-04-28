/**
 * Lynx Economy System
 * Manages: Lynx Coins balance, streak tracking, owned items, equipped cosmetics.
 * Persisted in localStorage + synced to cloud via existing pushToCloud mechanism.
 */

/* ═══ Types ═══ */
export interface EconomyState {
  coins: number;
  totalCoinsEarned: number;
  streak: StreakData;
  owned: string[];        // item IDs the user owns
  equipped: EquippedItems;
  purchaseHistory: PurchaseRecord[];
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;   // ISO date string "2026-04-28"
  shieldsRemaining: number;
  milestonesClaimed: number[]; // days already claimed (7,14,30,60,100)
}

export interface EquippedItems {
  border: string | null;
  theme: string | null;
  banner: string | null;
  title: string | null;
}

export interface PurchaseRecord {
  itemId: string;
  price: number;
  timestamp: string;
}

/* ═══ Constants ═══ */
const STORAGE_KEY = 'lynx_economy';

const STREAK_MILESTONES: { days: number; reward: number }[] = [
  { days: 3, reward: 15 },
  { days: 7, reward: 50 },
  { days: 14, reward: 100 },
  { days: 30, reward: 250 },
  { days: 60, reward: 500 },
  { days: 100, reward: 1000 },
];

/* ═══ Default State ═══ */
function defaultState(): EconomyState {
  return {
    coins: 0,
    totalCoinsEarned: 0,
    streak: {
      current: 0,
      longest: 0,
      lastActiveDate: '',
      shieldsRemaining: 0,
      milestonesClaimed: [],
    },
    owned: [],
    equipped: { border: null, theme: null, banner: null, title: null },
    purchaseHistory: [],
  };
}

/* ═══ Load / Save ═══ */
export function getEconomy(): EconomyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function save(state: EconomyState): EconomyState {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

/* ═══ Coins ═══ */
export function earnCoins(amount: number, _reason?: string): EconomyState {
  const s = getEconomy();
  s.coins += amount;
  s.totalCoinsEarned += amount;
  return save(s);
}

export function spendCoins(amount: number): EconomyState | null {
  const s = getEconomy();
  if (s.coins < amount) return null; // insufficient funds
  s.coins -= amount;
  return save(s);
}

export function getBalance(): number {
  return getEconomy().coins;
}

/* ═══ Purchases ═══ */
export function purchaseItem(itemId: string, price: number): EconomyState | null {
  const s = getEconomy();
  if (s.coins < price) return null;
  if (s.owned.includes(itemId)) return s; // already owned
  s.coins -= price;
  s.owned.push(itemId);
  s.purchaseHistory.push({ itemId, price, timestamp: new Date().toISOString() });
  return save(s);
}

export function ownsItem(itemId: string): boolean {
  return getEconomy().owned.includes(itemId);
}

/* ═══ Equip / Unequip ═══ */
export function equipItem(slot: keyof EquippedItems, itemId: string | null): EconomyState {
  const s = getEconomy();
  s.equipped[slot] = itemId;
  return save(s);
}

export function getEquipped(): EquippedItems {
  return getEconomy().equipped;
}

/* ═══ Streak System ═══ */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/** Call this when user does a qualifying action (workout, scan, login) */
export function recordStreakActivity(): { state: EconomyState; milestonesHit: number[] } {
  const s = getEconomy();
  const today = todayStr();

  if (s.streak.lastActiveDate === today) {
    // Already recorded today
    return { state: s, milestonesHit: [] };
  }

  const yesterday = yesterdayStr();

  if (s.streak.lastActiveDate === yesterday) {
    // Consecutive day
    s.streak.current += 1;
  } else if (s.streak.lastActiveDate && s.streak.lastActiveDate !== today) {
    // Missed a day — check shield
    if (s.streak.shieldsRemaining > 0) {
      s.streak.shieldsRemaining -= 1;
      s.streak.current += 1;
    } else {
      // Streak broken
      s.streak.current = 1;
    }
  } else {
    // First ever activity
    s.streak.current = 1;
  }

  s.streak.lastActiveDate = today;
  if (s.streak.current > s.streak.longest) {
    s.streak.longest = s.streak.current;
  }

  // Check milestone rewards
  const newMilestones: number[] = [];
  for (const m of STREAK_MILESTONES) {
    if (s.streak.current >= m.days && !s.streak.milestonesClaimed.includes(m.days)) {
      s.streak.milestonesClaimed.push(m.days);
      s.coins += m.reward;
      s.totalCoinsEarned += m.reward;
      newMilestones.push(m.days);
    }
  }

  save(s);
  return { state: s, milestonesHit: newMilestones };
}

export function getStreak(): StreakData {
  const s = getEconomy();
  // Check if streak is still valid
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (s.streak.lastActiveDate !== today && s.streak.lastActiveDate !== yesterday) {
    // Streak has expired (missed yesterday + no shield)
    if (s.streak.shieldsRemaining > 0 && s.streak.lastActiveDate) {
      // Shield could save it — but only if they act today
      return s.streak;
    }
    // Expired
    if (s.streak.current > 0 && s.streak.lastActiveDate) {
      s.streak.current = 0;
      save(s);
    }
  }
  return s.streak;
}

/* ═══ Coin Earning Events ═══ */
export const EARN_AMOUNTS = {
  DAILY_LOGIN: 5,
  WORKOUT_DAY: 20,
  PLAN_COMPLETE: 200,
  FACE_SCAN: 10,
  RANK_UP: 100,
} as const;

/** Daily login bonus — only once per day */
export function claimDailyLogin(): EconomyState | null {
  const key = 'lynx_last_login_claim';
  const today = todayStr();
  if (localStorage.getItem(key) === today) return null; // already claimed
  localStorage.setItem(key, today);
  return earnCoins(EARN_AMOUNTS.DAILY_LOGIN, 'daily_login');
}
