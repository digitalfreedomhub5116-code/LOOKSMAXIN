/**
 * StreakWidget — Dashboard section showing current streak, weekly dots, and shields.
 * Includes Lottie fire animation and an exportable header badge.
 */
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Flame, ShieldCheck } from 'lucide-react';
import { getStreak, type StreakData } from '../lib/economy';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Fire Lottie animation — local file in /public
const FIRE_LOTTIE_URL = '/flame.json';

/* ═══ Header Streak Badge (for top-right of app) ═══ */
export function StreakBadge() {
  const streak = getStreak();
  const [fireData, setFireData] = useState<any>(null);

  useEffect(() => {
    fetch(FIRE_LOTTIE_URL)
      .then(r => r.json())
      .then(setFireData)
      .catch(() => {}); // fallback to static icon
  }, []);

  if (streak.current === 0 && streak.longest === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      background: streak.current >= 7
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(245,158,11,0.08)',
      border: `1px solid rgba(245,158,11,${streak.current >= 7 ? 0.3 : 0.15})`,
      borderRadius: 20, padding: '5px 10px 5px 4px',
      cursor: 'default',
    }}>
      <div style={{ width: 24, height: 24, position: 'relative', flexShrink: 0 }}>
        {fireData ? (
          <Lottie
            animationData={fireData}
            loop
            autoplay
            style={{ width: 24, height: 24, position: 'absolute', top: -2, left: -2 }}
          />
        ) : (
          <Flame size={16} color="#F59E0B" style={{ marginTop: 4, marginLeft: 4 }} />
        )}
      </div>
      <span style={{
        fontSize: 13, fontWeight: 800,
        color: '#F59E0B',
        lineHeight: 1,
        fontFamily: 'var(--font-display, Inter, sans-serif)',
      }}>
        {streak.current}
      </span>
    </div>
  );
}

/* ═══ Full Streak Widget (Dashboard section) ═══ */
export default function StreakWidget() {
  const streak = getStreak();
  const [fireData, setFireData] = useState<any>(null);

  useEffect(() => {
    fetch(FIRE_LOTTIE_URL)
      .then(r => r.json())
      .then(setFireData)
      .catch(() => {});
  }, []);

  // Always show the widget so users see the streak section
  const today = new Date().getDay(); // 0 = Sunday
  const dayIdx = today === 0 ? 6 : today - 1;

  // Calculate which dots should be filled based on streak
  const getIsFilled = (i: number): boolean => {
    if (streak.current === 0) return false;
    // How many days back from today is this dot?
    const daysBack = dayIdx - i;
    if (daysBack < 0) return false; // future day
    return daysBack < streak.current;
  };

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
        {/* Streak info row with Lottie fire */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {fireData ? (
                <Lottie
                  animationData={fireData}
                  loop
                  autoplay
                  style={{ width: 40, height: 40, position: 'absolute', top: 2, left: 4 }}
                />
              ) : (
                <Flame size={24} color="#F59E0B" />
              )}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', lineHeight: 1.2 }}>
                {streak.current} {streak.current === 1 ? 'day' : 'days'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                Best: {streak.longest} days
              </div>
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
            const isFilled = getIsFilled(i);

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? '#F59E0B' : 'var(--text-muted)' }}>{d}</div>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isFilled ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isToday
                    ? '2px solid #F59E0B'
                    : isFilled
                      ? '1.5px solid rgba(245,158,11,0.3)'
                      : '1.5px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s',
                  boxShadow: isFilled ? '0 0 8px rgba(245,158,11,0.2)' : 'none',
                }}>
                  {isFilled && <Flame size={13} color="#F59E0B" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak motivation text */}
        {streak.current > 0 && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(245,158,11,0.06)',
            fontSize: 11, color: 'rgba(245,158,11,0.8)',
            textAlign: 'center', fontWeight: 600,
          }}>
            {streak.current >= 30 ? '🏆 Legendary! 30+ day streak!'
              : streak.current >= 14 ? '🔥 On fire! Keep the momentum!'
              : streak.current >= 7 ? '⚡ One week strong!'
              : streak.current >= 3 ? '💪 Building consistency!'
              : 'Come back tomorrow to keep your streak!'}
          </div>
        )}
      </div>
    </div>
  );
}
