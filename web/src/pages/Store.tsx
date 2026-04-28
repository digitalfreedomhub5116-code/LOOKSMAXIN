/**
 * Lynx AI Store
 * Full store with rotating deals, borders, themes, consumables, titles.
 */
import { useState, useEffect } from 'react';
import { ShoppingBag, Lock, Flame, Zap, ScanLine, Star, ShieldCheck, Palette, Frame, Tag, Clock, Check, ChevronRight } from 'lucide-react';
import { ALL_STORE_ITEMS, getItemsByCategory, getItemById, getTodaysDeals, type StoreItem, type StoreCategory } from '../data/storeItems';
import { getEconomy, purchaseItem, equipItem, ownsItem, getEquipped, type EquippedItems } from '../lib/economy';
import { LynxCoin, BorderRing, TitleBadge, ThemeSwatch } from '../components/StoreComponents';

/* ═══ Consumable Icon Map ═══ */
const CONSUMABLE_ICONS: Record<string, typeof Zap> = {
  'boost-2x': Zap,
  'boost-3x': Zap,
  'streak-shield': ShieldCheck,
  'scan-token': ScanLine,
  'spotlight': Star,
};

export default function Store() {
  const [economy, setEconomy] = useState(getEconomy());
  const [activeSection, setActiveSection] = useState<StoreCategory | 'deals'>('deals');
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [dealTimer, setDealTimer] = useState('');

  // Refresh economy on mount
  useEffect(() => setEconomy(getEconomy()), []);

  // Deal countdown timer
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextRefresh = new Date(now);
      nextRefresh.setHours(nextRefresh.getHours() + 8 - (nextRefresh.getHours() % 8), 0, 0, 0);
      const diff = nextRefresh.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDealTimer(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handlePurchase = (item: StoreItem) => {
    if (economy.owned.includes(item.id)) return;
    const result = purchaseItem(item.id, item.price);
    if (result) {
      setEconomy(result);
      setPurchasedId(item.id);
      setTimeout(() => setPurchasedId(null), 1500);
    }
  };

  const handleEquip = (slot: keyof EquippedItems, itemId: string) => {
    const current = economy.equipped[slot];
    const newId = current === itemId ? null : itemId;
    const result = equipItem(slot, newId);
    setEconomy(result);
  };

  const deals = getTodaysDeals(4);

  const SECTIONS: { id: StoreCategory | 'deals'; label: string; icon: typeof ShoppingBag }[] = [
    { id: 'deals', label: 'Deals', icon: Clock },
    { id: 'border', label: 'Borders', icon: Frame },
    { id: 'theme', label: 'Themes', icon: Palette },
    { id: 'consumable', label: 'Boosts', icon: Zap },
    { id: 'title', label: 'Titles', icon: Tag },
  ];

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>LYNX AI</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Store</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 20,
          background: 'rgba(200,168,78,0.08)',
          border: '1px solid rgba(200,168,78,0.2)',
        }}>
          <LynxCoin size={18} />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{economy.coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 20,
        margin: '0 -20px', padding: '0 20px 8px',
      }}>
        {SECTIONS.map(s => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 10, border: 'none',
                background: isActive ? 'rgba(200,168,78,0.15)' : 'var(--surface)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              <s.icon size={13} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══ DEALS SECTION ═══ */}
      {activeSection === 'deals' && (
        <div>
          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(200,168,78,0.06)',
            border: '1px solid rgba(200,168,78,0.12)',
          }}>
            <Clock size={13} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
              Deals refresh in <span style={{ color: 'var(--primary)' }}>{dealTimer}</span>
            </span>
          </div>

          {/* Deal Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {deals.map(({ item, discount }) => {
              const discountedPrice = Math.round(item.price * (1 - discount / 100));
              const owned = economy.owned.includes(item.id);
              return (
                <DealCard
                  key={item.id}
                  item={item}
                  discount={discount}
                  discountedPrice={discountedPrice}
                  owned={owned}
                  justPurchased={purchasedId === item.id}
                  canAfford={economy.coins >= discountedPrice}
                  onBuy={() => {
                    const result = purchaseItem(item.id, discountedPrice);
                    if (result) { setEconomy(result); setPurchasedId(item.id); setTimeout(() => setPurchasedId(null), 1500); }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ BORDERS SECTION ═══ */}
      {activeSection === 'border' && (
        <div>
          {renderTierGroup('Basic', getItemsByCategory('border').filter(i => i.tier === 'basic'), economy, purchasedId, handlePurchase, handleEquip, 'border')}
          {renderTierGroup('Elemental', getItemsByCategory('border').filter(i => i.tier === 'elemental'), economy, purchasedId, handlePurchase, handleEquip, 'border')}
          {renderTierGroup('Rank-Gated', getItemsByCategory('border').filter(i => i.tier === 'rank-gated'), economy, purchasedId, handlePurchase, handleEquip, 'border')}
          {renderTierGroup('Premium', getItemsByCategory('border').filter(i => i.tier === 'premium'), economy, purchasedId, handlePurchase, handleEquip, 'border')}
        </div>
      )}

      {/* ═══ THEMES SECTION ═══ */}
      {activeSection === 'theme' && (
        <div>
          {renderTierGroup('Color Themes', getItemsByCategory('theme').filter(i => i.tier === 'color'), economy, purchasedId, handlePurchase, handleEquip, 'theme')}
          {renderTierGroup('Special', getItemsByCategory('theme').filter(i => i.tier === 'special'), economy, purchasedId, handlePurchase, handleEquip, 'theme')}
          {renderTierGroup('Prismatic', getItemsByCategory('theme').filter(i => i.tier === 'prismatic'), economy, purchasedId, handlePurchase, handleEquip, 'theme')}
          {renderTierGroup('Seasonal', getItemsByCategory('theme').filter(i => i.tier === 'seasonal'), economy, purchasedId, handlePurchase, handleEquip, 'theme')}
        </div>
      )}

      {/* ═══ CONSUMABLES SECTION ═══ */}
      {activeSection === 'consumable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {getItemsByCategory('consumable').map(item => {
            const Icon = CONSUMABLE_ICONS[item.id] || Zap;
            const iconColor = item.tier === 'special' ? '#EF4444' : item.tier === 'premium' ? '#C8A84E' : '#F59E0B';
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: 'var(--surface)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${iconColor}10`, border: `1.5px solid ${iconColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={iconColor} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{item.description}</div>
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={economy.coins < item.price}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    padding: '7px 12px', borderRadius: 8, border: 'none',
                    background: economy.coins >= item.price ? 'rgba(200,168,78,0.15)' : 'rgba(255,255,255,0.04)',
                    color: economy.coins >= item.price ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 800, cursor: economy.coins >= item.price ? 'pointer' : 'default',
                  }}
                >
                  <LynxCoin size={13} /> {item.price}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ TITLES SECTION ═══ */}
      {activeSection === 'title' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {getItemsByCategory('title').map(item => {
            const owned = economy.owned.includes(item.id);
            const equipped = economy.equipped.title === item.id;
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                background: equipped ? 'rgba(200,168,78,0.06)' : 'var(--surface)',
                border: equipped ? '1.5px solid rgba(200,168,78,0.25)' : '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  {item.titleConfig && <TitleBadge name={item.name} config={item.titleConfig} />}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{item.description}</div>
                </div>
                {owned ? (
                  <button
                    onClick={() => handleEquip('title', item.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: equipped ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      color: equipped ? '#000' : 'var(--text-muted)',
                      fontSize: 10, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    {equipped ? 'EQUIPPED' : 'EQUIP'}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={economy.coins < item.price}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: economy.coins >= item.price ? 'rgba(200,168,78,0.15)' : 'rgba(255,255,255,0.04)',
                      color: economy.coins >= item.price ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 800, cursor: economy.coins >= item.price ? 'pointer' : 'default',
                    }}
                  >
                    <LynxCoin size={13} /> {item.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══ Tier Group Renderer ═══ */
function renderTierGroup(
  label: string,
  items: StoreItem[],
  economy: ReturnType<typeof getEconomy>,
  purchasedId: string | null,
  onPurchase: (item: StoreItem) => void,
  onEquip: (slot: keyof EquippedItems, id: string) => void,
  slot: keyof EquippedItems,
) {
  if (items.length === 0) return null;
  const tierPrice = items[0].price;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{label}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          padding: '3px 8px', borderRadius: 8,
          background: 'rgba(200,168,78,0.08)',
          fontSize: 10, fontWeight: 700, color: 'var(--primary)',
        }}>
          <LynxCoin size={11} /> {tierPrice}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            owned={economy.owned.includes(item.id)}
            equipped={economy.equipped[slot] === item.id}
            justPurchased={purchasedId === item.id}
            canAfford={economy.coins >= item.price}
            onBuy={() => onPurchase(item)}
            onEquip={() => onEquip(slot, item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══ Item Card ═══ */
function ItemCard({ item, owned, equipped, justPurchased, canAfford, onBuy, onEquip }: {
  item: StoreItem; owned: boolean; equipped: boolean; justPurchased: boolean;
  canAfford: boolean; onBuy: () => void; onEquip: () => void;
}) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: equipped ? 'rgba(200,168,78,0.06)' : 'var(--surface)',
      border: equipped ? '1.5px solid rgba(200,168,78,0.3)' : '1px solid var(--border)',
      transition: 'all 0.3s',
      animation: justPurchased ? 'fadeIn 0.4s ease' : undefined,
    }}>
      {/* Preview */}
      <div style={{
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)', position: 'relative',
      }}>
        {item.category === 'border' && item.borderConfig && (
          <BorderRing config={item.borderConfig} size={60} />
        )}
        {item.category === 'theme' && item.themeVars && (
          <div style={{ width: '100%', height: '100%', padding: 8 }}>
            <ThemeSwatch themeVars={item.themeVars} size="small" />
          </div>
        )}
        {item.rankRequired && (
          <div style={{
            position: 'absolute', top: 6, right: 6, padding: '2px 6px', borderRadius: 6,
            background: 'rgba(0,0,0,0.7)', fontSize: 8, fontWeight: 700, color: '#F59E0B',
          }}>
            {item.rankRequired}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2, lineHeight: 1.3 }}>{item.name}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.3 }}>{item.description}</div>

        {owned ? (
          <button onClick={onEquip} style={{
            width: '100%', padding: '6px 0', borderRadius: 8, border: 'none',
            background: equipped ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
            color: equipped ? '#000' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {equipped ? '✓ EQUIPPED' : 'EQUIP'}
          </button>
        ) : (
          <button onClick={onBuy} disabled={!canAfford} style={{
            width: '100%', padding: '6px 0', borderRadius: 8, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            background: canAfford ? 'rgba(200,168,78,0.15)' : 'rgba(255,255,255,0.03)',
            color: canAfford ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 800, cursor: canAfford ? 'pointer' : 'default',
          }}>
            {canAfford ? <><LynxCoin size={12} /> {item.price}</> : <><Lock size={10} /> {item.price}</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══ Deal Card ═══ */
function DealCard({ item, discount, discountedPrice, owned, justPurchased, canAfford, onBuy }: {
  item: StoreItem; discount: number; discountedPrice: number; owned: boolean;
  justPurchased: boolean; canAfford: boolean; onBuy: () => void;
}) {
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'var(--surface)',
      border: '1px solid rgba(200,168,78,0.2)',
      position: 'relative',
      boxShadow: '0 0 12px rgba(200,168,78,0.05)',
    }}>
      {/* Discount badge */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 2,
        padding: '3px 7px', borderRadius: 6,
        background: '#22C55E', fontSize: 9, fontWeight: 900, color: '#000',
      }}>
        {discount}% OFF
      </div>

      {/* Preview */}
      <div style={{
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {item.category === 'border' && item.borderConfig && <BorderRing config={item.borderConfig} size={56} />}
        {item.category === 'theme' && item.themeVars && (
          <div style={{ width: '100%', height: '100%', padding: 8 }}><ThemeSwatch themeVars={item.themeVars} size="small" /></div>
        )}
        {item.category === 'title' && item.titleConfig && (
          <TitleBadge name={item.name} config={item.titleConfig} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.name}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'capitalize' }}>{item.category}</div>

        {owned ? (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textAlign: 'center' }}>✓ Owned</div>
        ) : (
          <button onClick={onBuy} disabled={!canAfford} style={{
            width: '100%', padding: '6px 0', borderRadius: 8, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: canAfford ? 'rgba(200,168,78,0.15)' : 'rgba(255,255,255,0.03)',
            color: canAfford ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: 10, fontWeight: 800, cursor: canAfford ? 'pointer' : 'default',
          }}>
            <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: 9 }}>{item.price}</span>
            <LynxCoin size={12} /> {discountedPrice}
          </button>
        )}
      </div>
    </div>
  );
}
