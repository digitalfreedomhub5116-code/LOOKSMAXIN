/**
 * TopNavbar — Global persistent header across all tabs.
 * Shows: LYNX AI logo + Plan Badge, Streak, Coins
 */
import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { getEconomy, getStreak, type PlanTier } from '../lib/economy';
import { LynxCoin } from './StoreComponents';
import LynxLogo from './LynxLogo';

const PLAN_LABELS: Record<PlanTier, string> = { free: 'TRIAL', basic: 'BASIC', pro: 'PRO', ultra: 'ULTRA' };
const PLAN_COLORS: Record<PlanTier, string> = { free: '#94A3B8', basic: '#22C55E', pro: '#8B5CF6', ultra: '#F59E0B' };

export default function TopNavbar({ onPlanClick }: { onPlanClick?: () => void }) {
  const [economy, setEconomy] = useState(getEconomy());
  const streak = getStreak();

  useEffect(() => {
    const id = setInterval(() => setEconomy(getEconomy()), 2000);
    return () => clearInterval(id);
  }, []);

  const plan = economy.plan;
  const label = PLAN_LABELS[plan];
  const color = PLAN_COLORS[plan];

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px 10px',
      background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, transparent 100%)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left: Logo + Plan badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LynxLogo size={26} />
        <button
          onClick={onPlanClick}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 20,
            border: `1px solid ${color}40`,
            background: `${color}15`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            fontSize: 10, fontWeight: 800, color,
            letterSpacing: 1, lineHeight: 1,
          }}>{label}</span>
        </button>
      </div>

      {/* Right: Streak + Coins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={22} color={streak.current > 0 ? '#FF8C00' : '#555'} fill={streak.current > 0 ? '#FF8C00' : 'none'} />
          <span style={{ fontSize: 18, fontWeight: 800, color: streak.current > 0 ? '#FF8C00' : '#555' }}>{streak.current}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <LynxCoin size={22} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#C8A84E' }}>{economy.coins}</span>
        </div>
      </div>
    </div>
  );
}
