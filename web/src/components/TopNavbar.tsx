/**
 * TopNavbar — Global persistent header across all tabs.
 * Shows: App name, Streak, Coins
 */
import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { getEconomy, getStreak } from '../lib/economy';
import { LynxCoin } from './StoreComponents';

export default function TopNavbar() {
  const [economy, setEconomy] = useState(getEconomy());
  const streak = getStreak();

  useEffect(() => {
    const id = setInterval(() => setEconomy(getEconomy()), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 20px 10px',
      background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, transparent 100%)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left: App name */}
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', letterSpacing: 1.5 }}>
        LYNX AI
      </div>

      {/* Right: Streak + Coins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Streak */}
        {streak.current > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Flame size={22} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{streak.current}</span>
          </div>
        )}

        {/* Coins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <LynxCoin size={22} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#C8A84E' }}>{economy.coins}</span>
        </div>
      </div>
    </div>
  );
}
