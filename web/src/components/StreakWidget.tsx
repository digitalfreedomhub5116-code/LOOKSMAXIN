/**
 * StreakWidget — Dashboard section showing current streak, weekly dots, and shields.
 */
import { Flame, ShieldCheck } from 'lucide-react';
import { getStreak, type StreakData } from '../lib/economy';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakWidget() {
  const streak = getStreak();
  if (streak.current === 0 && streak.longest === 0) return null;

  const today = new Date().getDay(); // 0 = Sunday
  // Convert to Mon=0 format
  const dayIdx = today === 0 ? 6 : today - 1;

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Streak</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Flame size={16} color="#F59E0B" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>{streak.current}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px' }}>
        {/* Streak info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Flame size={20} color="#F59E0B" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B' }}>{streak.current} days</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best: {streak.longest} days</div>
            </div>
          </div>

          {/* Shields */}
          {streak.shieldsRemaining > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <ShieldCheck size={12} color="#3B82F6" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>{streak.shieldsRemaining}</span>
            </div>
          )}
        </div>

        {/* Weekly dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {DAYS.map((d, i) => {
            const isToday = i === dayIdx;
            const isPast = i < dayIdx;
            const isActive = isPast || isToday;
            // If streak >= remaining days in the week up to this point, it's filled
            const isFilled = isActive && streak.current > 0;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? '#F59E0B' : 'var(--text-muted)' }}>{d}</div>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isFilled ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isToday
                    ? '2px solid #F59E0B'
                    : isFilled
                      ? '1.5px solid rgba(245,158,11,0.3)'
                      : '1.5px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s',
                }}>
                  {isFilled && <Flame size={12} color="#F59E0B" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
