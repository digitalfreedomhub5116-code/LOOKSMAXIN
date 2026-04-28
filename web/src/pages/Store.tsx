import { ShoppingBag, Lock, Crown, Sparkles, Palette, Frame } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: typeof Crown;
  color: string;
  tag?: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'premium', name: 'Lynx Premium', description: 'Unlimited scans, detailed reports & priority AI chat',
    price: 'Coming Soon', icon: Crown, color: '#C8A84E', tag: 'POPULAR',
  },
  {
    id: 'borders', name: 'Animated Borders', description: 'Unlock premium animated profile borders',
    price: 'Coming Soon', icon: Frame, color: '#A78BFA',
  },
  {
    id: 'themes', name: 'Custom Themes', description: 'Unlock exclusive color themes for your app',
    price: 'Coming Soon', icon: Palette, color: '#60A5FA',
  },
  {
    id: 'ai-boost', name: 'AI Analysis Boost', description: 'Get deeper trait analysis with enhanced AI models',
    price: 'Coming Soon', icon: Sparkles, color: '#F59E0B',
  },
];

export default function Store() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>LYNX AI</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Store</div>
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        padding: '20px 24px', borderRadius: 16, marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(200,168,78,0.12) 0%, rgba(200,168,78,0.04) 100%)',
        border: '1px solid rgba(200,168,78,0.2)',
        textAlign: 'center',
      }}>
        <ShoppingBag size={28} color="var(--primary)" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Store Opening Soon</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Premium features, cosmetics & boosts — all coming in the next update.
        </div>
      </div>

      {/* Items Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STORE_ITEMS.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              opacity: 0.7,
              position: 'relative',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${item.color}12`,
              border: `1.5px solid ${item.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <item.icon size={20} color={item.color} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.name}</span>
                {item.tag && (
                  <span style={{
                    fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(200,168,78,0.15)', color: 'var(--primary)',
                    letterSpacing: 0.5,
                  }}>
                    {item.tag}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.description}
              </div>
            </div>

            {/* Price / Lock */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Lock size={10} color="var(--text-muted)" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                {item.price}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
