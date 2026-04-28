/**
 * Lynx AI Store — Premium Liftoff-inspired design
 * Subscription plans + cosmetic shop with glowing cards.
 */
import { useState, useEffect } from 'react';
import {
  ShoppingBag, Lock, Flame, Zap, ScanLine, Star, ShieldCheck,
  Palette, Frame, Tag, Clock, Check, Crown, BrainCircuit,
  Infinity, ChevronRight, Sparkles,
} from 'lucide-react';
import { ALL_STORE_ITEMS, getItemsByCategory, getTodaysDeals, type StoreItem, type StoreCategory } from '../data/storeItems';
import { getEconomy, purchaseItem, equipItem, grantFreeCredits, type EquippedItems, type PlanTier, PLAN_CONFIG } from '../lib/economy';
import { LynxCoin, BorderRing, TitleBadge, ThemeSwatch } from '../components/StoreComponents';

/* ═══ Category accent colors ═══ */
const CAT_COLORS: Record<string, string> = {
  border: '#06B6D4',
  theme: '#8B5CF6',
  consumable: '#F59E0B',
  title: '#EC4899',
  deals: '#C8A84E',
};

const CONSUMABLE_ICONS: Record<string, typeof Zap> = {
  'boost-2x': Zap,
  'boost-3x': Zap,
  'streak-shield': ShieldCheck,
  'scan-token': ScanLine,
  'spotlight': Star,
};

/* ═══ Billing types ═══ */
type BillingCycle = 'weekly' | 'monthly' | 'yearly';

const PLAN_PRICING: Record<PlanTier, Record<BillingCycle, { price: number; credits: number | 'unlimited'; label: string }>> = {
  free: {
    weekly: { price: 0, credits: 200, label: 'One-time' },
    monthly: { price: 0, credits: 200, label: 'One-time' },
    yearly: { price: 0, credits: 200, label: 'One-time' },
  },
  pro: {
    weekly: { price: 70, credits: 600, label: '/week' },
    monthly: { price: 299, credits: 2199, label: '/month' },
    yearly: { price: 1450, credits: 26388, label: '/year' },
  },
  ultra: {
    weekly: { price: 149, credits: 1400, label: '/week' },
    monthly: { price: 999, credits: 'unlimited', label: '/month' },
    yearly: { price: 4300, credits: 'unlimited', label: '/year' },
  },
};

export default function Store({ user }: { user?: any }) {
  const avatarUrl: string | undefined = user?.user_metadata?.avatar_url;
  const [economy, setEconomy] = useState(getEconomy());
  const [activeTab, setActiveTab] = useState<'plans' | 'shop'>('plans');
  const [shopSection, setShopSection] = useState<StoreCategory | 'deals'>('deals');
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [dealTimer, setDealTimer] = useState('');

  useEffect(() => {
    // Grant free credits on first visit
    const e = grantFreeCredits();
    setEconomy(e);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(next.getHours() + 8 - (next.getHours() % 8), 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      setDealTimer(`${Math.floor(diff / 3600000)}h ${String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')}m ${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handlePurchase = (item: StoreItem) => {
    if (economy.owned.includes(item.id)) return;
    const result = purchaseItem(item.id, item.price);
    if (result) { setEconomy(result); setPurchasedId(item.id); setTimeout(() => setPurchasedId(null), 1500); }
  };

  const handleEquip = (slot: keyof EquippedItems, itemId: string) => {
    const newId = economy.equipped[slot] === itemId ? null : itemId;
    setEconomy(equipItem(slot, newId));
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* ═══ Header ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>LYNX AI</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Store</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* AI Credits */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 20,
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
          }}>
            <BrainCircuit size={14} color="#06B6D4" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#06B6D4' }}>
              {economy.aiCredits}
            </span>
          </div>
          {/* Coins */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 20,
            background: 'rgba(200,168,78,0.08)', border: '1px solid rgba(200,168,78,0.2)',
          }}>
            <LynxCoin size={15} />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{economy.coins}</span>
          </div>
        </div>
      </div>

      {/* ═══ Plans / Shop Toggle ═══ */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24, borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        {(['plans', 'shop'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
            background: activeTab === t ? 'rgba(200,168,78,0.12)' : 'transparent',
            color: activeTab === t ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
            borderBottom: activeTab === t ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            {t === 'plans' ? '⚡ Plans' : '🛍️ Shop'}
          </button>
        ))}
      </div>

      {/* ═══ PLANS TAB ═══ */}
      {activeTab === 'plans' && (
        <div>
          {/* Billing Toggle */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 24, borderRadius: 10, overflow: 'hidden',
            border: '1px solid rgba(200,168,78,0.15)', background: 'rgba(0,0,0,0.3)',
            padding: 3,
          }}>
            {(['weekly', 'monthly', 'yearly'] as BillingCycle[]).map(b => (
              <button key={b} onClick={() => setBilling(b)} style={{
                flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                borderRadius: 8,
                background: billing === b ? 'rgba(200,168,78,0.2)' : 'transparent',
                color: billing === b ? '#fff' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
                {b}
                {b === 'yearly' && <span style={{ display: 'block', fontSize: 8, color: '#22C55E', fontWeight: 800, marginTop: 1 }}>SAVE 60%</span>}
              </button>
            ))}
          </div>

          {/* Plan Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PlanCard tier="free" billing={billing} currentPlan={economy.plan} />
            <PlanCard tier="pro" billing={billing} currentPlan={economy.plan} />
            <PlanCard tier="ultra" billing={billing} currentPlan={economy.plan} />
          </div>
        </div>
      )}

      {/* ═══ SHOP TAB ═══ */}
      {activeTab === 'shop' && (
        <div>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 20, margin: '0 -20px', padding: '0 20px 8px' }}>
            {([
              { id: 'deals' as const, label: 'Deals', icon: Clock },
              { id: 'border' as const, label: 'Borders', icon: Frame },
              { id: 'theme' as const, label: 'Themes', icon: Palette },
              { id: 'consumable' as const, label: 'Boosts', icon: Zap },
              { id: 'title' as const, label: 'Titles', icon: Tag },
            ]).map(s => {
              const isActive = shopSection === s.id;
              const color = CAT_COLORS[s.id] || '#C8A84E';
              return (
                <button key={s.id} onClick={() => setShopSection(s.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: isActive ? `${color}18` : 'var(--surface)',
                  color: isActive ? color : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <s.icon size={13} /> {s.label}
                </button>
              );
            })}
          </div>

          {/* Deals */}
          {shopSection === 'deals' && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12, marginBottom: 16,
                background: 'linear-gradient(135deg, rgba(200,168,78,0.08) 0%, rgba(200,168,78,0.02) 100%)',
                border: '1px solid rgba(200,168,78,0.12)',
              }}>
                <Clock size={13} color="var(--primary)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Refreshes in <span style={{ color: 'var(--primary)' }}>{dealTimer}</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {getTodaysDeals(4).map(({ item, discount }) => (
                  <GlowCard key={item.id} item={item} discount={discount}
                    owned={economy.owned.includes(item.id)}
                    canAfford={economy.coins >= Math.round(item.price * (1 - discount / 100))}
                    onBuy={() => { const p = Math.round(item.price * (1 - discount / 100)); const r = purchaseItem(item.id, p); if (r) { setEconomy(r); setPurchasedId(item.id); setTimeout(() => setPurchasedId(null), 1500); } }}
                    avatarUrl={avatarUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category Items */}
          {shopSection !== 'deals' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {getItemsByCategory(shopSection).map(item => (
                <GlowCard key={item.id} item={item}
                  owned={economy.owned.includes(item.id)}
                  equipped={economy.equipped[shopSection === 'consumable' ? 'border' : shopSection as keyof EquippedItems] === item.id}
                  canAfford={economy.coins >= item.price}
                  onBuy={() => handlePurchase(item)}
                  onEquip={item.category !== 'consumable' ? () => handleEquip(item.category as keyof EquippedItems, item.id) : undefined}
                  avatarUrl={avatarUrl}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   Plan Card — Liftoff-inspired
   ═══════════════════════════════════ */
function PlanCard({ tier, billing, currentPlan }: { tier: PlanTier; billing: BillingCycle; currentPlan: PlanTier }) {
  const info = PLAN_PRICING[tier][billing];
  const config = PLAN_CONFIG[tier];
  const isActive = tier === currentPlan;
  const isFree = tier === 'free';
  const isPro = tier === 'pro';
  const isUltra = tier === 'ultra';

  const borderColor = isFree ? 'rgba(255,255,255,0.08)' : isPro ? 'rgba(200,168,78,0.35)' : 'rgba(200,168,78,0.5)';
  const bgGradient = isFree
    ? 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
    : isPro
      ? 'linear-gradient(145deg, rgba(200,168,78,0.08) 0%, rgba(200,168,78,0.02) 100%)'
      : 'linear-gradient(145deg, rgba(200,168,78,0.15) 0%, rgba(200,168,78,0.04) 100%)';
  const glowShadow = isFree
    ? 'none'
    : isPro
      ? '0 0 30px rgba(200,168,78,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 0 40px rgba(200,168,78,0.15), inset 0 1px 0 rgba(255,255,255,0.08)';

  const features: string[] = [];
  if (isFree) {
    features.push('200 AI credits (one-time)', `${config.scanCost} credits/scan`, `${config.chatCost} credits/chat`, 'Basic borders & default theme');
  } else if (isPro) {
    const cr = info.credits === 'unlimited' ? 'Unlimited' : info.credits.toLocaleString();
    features.push(`${cr} AI credits${info.label}`, `${config.scanCost} credits/scan (save 25%)`, `${config.chatCost} credits/chat (save 80%)`, 'All Color + Special themes', 'Elemental borders', '2× coin earning');
  } else {
    const cr = info.credits === 'unlimited' ? 'Unlimited AI credits' : `${info.credits.toLocaleString()} credits${info.label}`;
    features.push(cr, 'Unlimited face scans', 'Unlimited AI chat', 'ALL themes & borders', '3× coin earning', '2 free Streak Shields/month');
  }

  const chipSize = 16;
  const clipPath = `polygon(0 0, calc(100% - ${chipSize}px) 0, 100% ${chipSize}px, 100% 100%, ${chipSize}px 100%, 0 calc(100% - ${chipSize}px))`;
  const accentColor = isFree ? 'rgba(255,255,255,0.15)' : 'rgba(200,168,78,0.5)';

  return (
    /* Glow wrapper — no clip-path so drop-shadow renders outside */
    <div style={{
      filter: isFree ? 'none' : isPro
        ? 'drop-shadow(0 0 10px rgba(200,168,78,0.12))'
        : 'drop-shadow(0 0 16px rgba(200,168,78,0.2))',
    }}>
    {/* Border layer — clipped */}
    <div style={{
      clipPath,
      padding: isFree ? 1 : isUltra ? 2 : 1.5,
      background: isFree
        ? 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))'
        : isPro
          ? 'linear-gradient(145deg, rgba(200,168,78,0.5), rgba(200,168,78,0.1), rgba(200,168,78,0.3))'
          : 'linear-gradient(145deg, rgba(200,168,78,0.7), rgba(200,168,78,0.2), rgba(200,168,78,0.5))',
    }}>
      {/* Inner card */}
      <div style={{
        clipPath,
        padding: '20px',
        background: bgGradient,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* ─── Diagonal Shine Streaks ─── */}
        {!isFree && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-50%', left: '5%',
              width: '30%', height: '200%',
              background: 'linear-gradient(70deg, transparent 44%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 52%, transparent 56%)',
              transform: 'rotate(25deg)',
            }} />
            <div style={{
              position: 'absolute', top: '-50%', left: '35%',
              width: '20%', height: '200%',
              background: 'linear-gradient(70deg, transparent 46%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.03) 51%, transparent 54%)',
              transform: 'rotate(25deg)',
            }} />
          </div>
        )}

        {/* Shimmer overlay for Ultra */}
        {isUltra && (
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,168,78,0.06) 50%, transparent 100%)',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none', zIndex: 0,
          }} />
        )}

        {/* Top edge glow */}
        <div style={{
          position: 'absolute', top: 0, left: chipSize, right: chipSize, height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          zIndex: 1,
        }} />

        {/* Corner accents */}
        <div style={{
          position: 'absolute', top: chipSize - 3, right: 0, width: 6, height: 6,
          background: isFree ? 'rgba(255,255,255,0.15)' : 'var(--primary)', borderRadius: '50%',
          opacity: 0.6, boxShadow: isFree ? 'none' : '0 0 6px var(--primary)', zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: chipSize - 3, width: 6, height: 6,
          background: isFree ? 'rgba(255,255,255,0.15)' : 'var(--primary)', borderRadius: '50%',
          opacity: 0.6, boxShadow: isFree ? 'none' : '0 0 6px var(--primary)', zIndex: 1,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isUltra ? <Crown size={20} color="#C8A84E" /> : isPro ? <Star size={18} color="#C8A84E" /> : <Sparkles size={16} color="var(--text-muted)" />}
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                {tier}
              </div>
              {isActive && (
                <div style={{ fontSize: 9, fontWeight: 700, color: '#22C55E', letterSpacing: 0.5 }}>CURRENT PLAN</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {isFree ? (
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>Free</div>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>₹{info.price}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{info.label}</div>
              </>
            )}
          </div>
        </div>

        {/* AI Credits badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', marginBottom: 14, position: 'relative', zIndex: 1,
          background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)',
          clipPath: `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))`,
        }}>
          <BrainCircuit size={16} color="#06B6D4" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#06B6D4' }}>
            {info.credits === 'unlimited' ? '∞' : info.credits.toLocaleString()} AI Credits
          </span>
          {!isFree && <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>{info.label}</span>}
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={13} color={isFree ? 'var(--text-muted)' : '#C8A84E'} strokeWidth={3} />
              <span style={{ fontSize: 12, color: isFree ? 'var(--text-muted)' : 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!isActive && !isFree && (
          <button style={{
            width: '100%', padding: '12px 0', border: 'none', cursor: 'pointer',
            background: isUltra
              ? 'linear-gradient(135deg, #C8A84E, #D4B04A, #A08030)'
              : 'linear-gradient(135deg, rgba(200,168,78,0.25), rgba(200,168,78,0.1))',
            color: isUltra ? '#000' : '#fff',
            fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
            clipPath: `polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))`,
            boxShadow: isUltra ? '0 0 24px rgba(200,168,78,0.3)' : '0 0 12px rgba(200,168,78,0.1)',
            transition: 'all 0.2s', position: 'relative', zIndex: 1,
          }}>
            {isUltra ? '👑 UPGRADE TO ULTRA' : '⭐ UPGRADE TO PRO'}
          </button>
        )}
        {isActive && !isFree && (
          <div style={{
            textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 700,
            color: '#22C55E', letterSpacing: 0.5, position: 'relative', zIndex: 1,
          }}>
            ✓ Active
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

/* ═══════════════════════════════════
   Glow Card — Liftoff-matching premium card
   ═══════════════════════════════════ */
function GlowCard({ item, discount, owned, equipped, canAfford, onBuy, onEquip, avatarUrl }: {
  item: StoreItem; discount?: number; owned?: boolean; equipped?: boolean;
  canAfford: boolean; onBuy: () => void; onEquip?: () => void;
  avatarUrl?: string;
}) {
  const catColor = CAT_COLORS[item.category] || '#C8A84E';
  const finalPrice = discount ? Math.round(item.price * (1 - discount / 100)) : item.price;

  const chipSize = 14;
  const clipPath = `polygon(
    0 0,
    calc(100% - ${chipSize}px) 0,
    100% ${chipSize}px,
    100% 100%,
    ${chipSize}px 100%,
    0 calc(100% - ${chipSize}px)
  )`;

  return (
    /* Glow wrapper */
    <div style={{
      filter: `drop-shadow(0 0 12px ${catColor}40) drop-shadow(0 4px 16px rgba(0,0,0,0.6))`,
    }}>
      {/* Thick gradient border — 3px visible */}
      <div style={{
        clipPath,
        padding: 3,
        background: `linear-gradient(160deg, ${catColor}CC, ${catColor}50 40%, ${catColor}90 80%, ${catColor}CC)`,
      }}>
        {/* Inner card — RICH colored background like Liftoff */}
        <div style={{
          clipPath,
          background: `linear-gradient(160deg, ${catColor}40 0%, ${catColor}22 25%, #111828 55%, #0d1118 100%)`,
          position: 'relative', overflow: 'hidden',
          textAlign: 'center',
          padding: '16px 10px 14px',
          minHeight: 210,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>

          {/* ─── PROMINENT Diagonal Shine Streaks ─── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', zIndex: 1, overflow: 'hidden',
          }}>
            {/* Primary thick shine */}
            <div style={{
              position: 'absolute', top: '-80%', left: '-25%',
              width: '55%', height: '260%',
              background: 'linear-gradient(72deg, transparent 36%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0.14) 46%, rgba(255,255,255,0.22) 48%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 54%, transparent 60%)',
              transform: 'rotate(25deg)',
            }} />
            {/* Secondary shine */}
            <div style={{
              position: 'absolute', top: '-80%', left: '12%',
              width: '40%', height: '260%',
              background: 'linear-gradient(72deg, transparent 40%, rgba(255,255,255,0.04) 44%, rgba(255,255,255,0.12) 47%, rgba(255,255,255,0.18) 49%, rgba(255,255,255,0.12) 51%, rgba(255,255,255,0.04) 54%, transparent 58%)',
              transform: 'rotate(25deg)',
            }} />
            {/* Tertiary thin */}
            <div style={{
              position: 'absolute', top: '-80%', left: '42%',
              width: '28%', height: '260%',
              background: 'linear-gradient(72deg, transparent 44%, rgba(255,255,255,0.03) 47%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.03) 51%, transparent 54%)',
              transform: 'rotate(25deg)',
            }} />
          </div>

          {/* ─── Top edge glow line ─── */}
          <div style={{
            position: 'absolute', top: 0, left: chipSize, right: chipSize, height: 1.5,
            background: `linear-gradient(90deg, transparent, ${catColor}BB, transparent)`,
            zIndex: 2,
          }} />

          {/* ─── Discount badge (top-left) ─── */}
          {discount && (
            <div style={{
              position: 'absolute', top: 8, left: 8, zIndex: 3,
              padding: '3px 8px', borderRadius: 6,
              background: '#22C55E', fontSize: 9, fontWeight: 900, color: '#000',
              boxShadow: '0 0 10px rgba(34,197,94,0.5)',
            }}>
              -{discount}%
            </div>
          )}

          {/* ─── Info badge (top-right) like Liftoff ─── */}
          <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 3,
            width: 22, height: 22, borderRadius: 6,
            background: `${catColor}30`, border: `1px solid ${catColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: catColor,
            cursor: 'pointer',
          }}>
            i
          </div>

          {/* ─── Name & Category (CENTERED, large bold) ─── */}
          <div style={{ position: 'relative', zIndex: 2, marginBottom: 10 }}>
            <div style={{
              fontSize: 15, fontWeight: 900, color: '#fff',
              lineHeight: 1.2, marginBottom: 3,
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
              {item.name}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, color: catColor,
              textTransform: 'capitalize', opacity: 0.9,
            }}>
              {item.tier} {item.category}
            </div>
          </div>

          {/* ─── Preview area (MUCH LARGER — 50% of card) ─── */}
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2, width: '100%', minHeight: 100,
          }}>
            {/* Radial glow behind preview */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 110, height: 110, borderRadius: '50%',
              background: `radial-gradient(circle, ${catColor}25 0%, ${catColor}08 50%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
            }} />

            {item.category === 'border' && item.imageBorder ? (
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                {/* Profile pic — sized to match SVG BorderRing avatar */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: 66, height: 66, borderRadius: '50%',
                  background: 'radial-gradient(circle, #3a3a4a, #1a1a24)',
                  transform: 'translate(-50%, -50%)', zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,0.08)',
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <svg width="50" height="50" viewBox="0 0 40 40">
                      <circle cx="20" cy="16" r="7" fill="#555568" />
                      <ellipse cx="20" cy="35" rx="13" ry="10" fill="#4a4a5a" />
                    </svg>
                  )}
                </div>
                {/* Border effect overlay */}
                <img
                  src={item.imageBorder}
                  alt={item.name}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '140%', height: '140%',
                    transform: 'translate(-50%, -50%)',
                    objectFit: 'contain', zIndex: 2, pointerEvents: 'none',
                  }}
                />
              </div>
            ) : item.category === 'border' && item.borderConfig ? (
              <BorderRing config={item.borderConfig} size={90} profileUrl={avatarUrl} />
            ) : null}
            {item.category === 'theme' && item.themeVars && (
              <div style={{ width: '90%' }}><ThemeSwatch themeVars={item.themeVars} /></div>
            )}
            {item.category === 'title' && item.titleConfig && <TitleBadge name={item.name} config={item.titleConfig} />}
            {item.category === 'consumable' && (() => {
              const I = CONSUMABLE_ICONS[item.id] || Zap;
              return (
                <div style={{
                  width: 60, height: 60, borderRadius: 16,
                  background: `radial-gradient(circle, ${catColor}25 0%, transparent 70%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <I size={30} color={catColor} />
                </div>
              );
            })()}
            {item.rankRequired && (
              <div style={{
                position: 'absolute', top: 0, right: 4, padding: '2px 7px',
                background: 'rgba(0,0,0,0.85)', fontSize: 8, fontWeight: 700, color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4,
              }}>
                {item.rankRequired}
              </div>
            )}
          </div>

          {/* ─── Bottom: Styled Price Badge (Liftoff-style) ─── */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: 10, width: '100%' }}>
            {owned ? (
              onEquip ? (
                <button onClick={onEquip} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '8px 24px', border: 'none', cursor: 'pointer',
                  borderRadius: 20,
                  background: equipped
                    ? `linear-gradient(135deg, ${catColor}, ${catColor}CC)`
                    : `rgba(255,255,255,0.08)`,
                  color: equipped ? '#000' : catColor,
                  fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                  boxShadow: equipped ? `0 0 14px ${catColor}50` : 'none',
                }}>
                  {equipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22C55E' }}>✓ Owned</span>
              )
            ) : (
              <button onClick={onBuy} disabled={!canAfford} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '8px 22px', borderRadius: 20, cursor: canAfford ? 'pointer' : 'default',
                background: canAfford
                  ? `linear-gradient(135deg, ${catColor}35, ${catColor}15)`
                  : 'rgba(255,255,255,0.04)',
                border: canAfford ? `2px solid ${catColor}60` : '2px solid rgba(255,255,255,0.08)',
                color: canAfford ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 800,
                boxShadow: canAfford ? `0 0 12px ${catColor}25` : 'none',
                transition: 'all 0.2s',
              }}>
                {discount && <span style={{ textDecoration: 'line-through', opacity: 0.35, fontSize: 10 }}>{item.price}</span>}
                {canAfford ? <LynxCoin size={15} /> : <Lock size={12} />}
                <span style={{ fontSize: 14 }}>{finalPrice}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


