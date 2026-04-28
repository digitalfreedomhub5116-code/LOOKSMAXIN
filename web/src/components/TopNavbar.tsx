/**
 * TopNavbar — Global persistent header across all tabs.
 * Shows: App name, Streak, Coins (Trial + Credits moved to Dashboard)
 */
import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { getEconomy, getStreak } from '../lib/economy';
import { LynxCoin } from './StoreComponents';

export default function TopNavbar() {
  const [economy, setEconomy] = useState(getEconomy());
  const streak = getStreak();

  // Re-read economy state periodically (for cross-tab updates)
  useEffect(() => {
    const id = setInterval(() => setEconomy(getEconomy()), 2000);
    return () => clearInterval(id);
  }, []);

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

      {/* Right: Streak + Coins */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Streak */}
        {streak.current > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
            <Flame size={18} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>{streak.current}</span>
          </div>
        )}

        {/* Coins */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LynxCoin size={17} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#C8A84E' }}>{economy.coins}</span>
        </div>
      </div>
    </div>
  );
}
