/**
 * TopNavbar — Global persistent header across all tabs.
 * Shows: App name, Streak (fire lottie), AI Credits, Coins
 */
import { useState, useEffect } from 'react';
import { Flame, BrainCircuit, Crown, Star, Sparkles } from 'lucide-react';
import { getEconomy, getStreak } from '../lib/economy';
import { LynxCoin } from './StoreComponents';

export default function TopNavbar({ onPlanClick }: { onPlanClick?: () => void }) {
  const [economy, setEconomy] = useState(getEconomy());
  const streak = getStreak();

  // Re-read economy state periodically (for cross-tab updates)
  useEffect(() => {
    const id = setInterval(() => setEconomy(getEconomy()), 2000);
    return () => clearInterval(id);
  }, []);

  const planLabel = economy.plan === 'free' ? 'Trial' : economy.plan === 'pro' ? 'Pro' : 'Ultra';
  const planColor = economy.plan === 'free' ? '#94A3B8' : economy.plan === 'pro' ? '#8B5CF6' : '#F59E0B';
  const PlanIcon = economy.plan === 'ultra' ? Crown : economy.plan === 'pro' ? Star : Sparkles;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 20px 8px',
      background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, transparent 100%)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left: App name */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5 }}>LYNX AI</div>
      </div>

      {/* Right: Streak + Plan + Credits + Coins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Streak */}
        {streak.current > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
            <Flame size={18} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{streak.current}</span>
          </div>
        )}

        {/* Plan Badge */}
        <button onClick={onPlanClick} style={{
          display: 'flex', alignItems: 'center', gap: 3,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <PlanIcon size={15} color={planColor} />
          <span style={{ fontSize: 12, fontWeight: 800, color: planColor }}>{planLabel}</span>
        </button>

        {/* AI Credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BrainCircuit size={17} color="#06B6D4" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#06B6D4' }}>{economy.aiCredits}</span>
        </div>

        {/* Coins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LynxCoin size={17} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#C8A84E' }}>{economy.coins}</span>
        </div>
      </div>
    </div>
  );
}
