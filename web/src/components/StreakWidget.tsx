/**
 * StreakWidget — Dashboard section showing current streak, weekly dots, and milestone progress.
 * Layout matches the reference: big fire Lottie on right, days count + milestone on left.
 */
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Flame, ShieldCheck } from 'lucide-react';
import { getStreak, type StreakData } from '../lib/economy';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FIRE_LOTTIE_URL = '/flame.json';
const MILESTONES = [3, 7, 14, 30, 60, 100];

/* ═══ Header Streak Badge (for top-right of app) ═══ */
export function StreakBadge() {
  const streak = getStreak();
  const [fireData, setFireData] = useState<any>(null);

  useEffect(() => {
    fetch(FIRE_LOTTIE_URL)
      .then(r => r.json())
      .then(setFireData)
      .catch(() => {});
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

  const today = new Date().getDay();
  const dayIdx = today === 0 ? 6 : today - 1;

  const getIsFilled = (i: number): boolean => {
    if (streak.current === 0) return false;
    const daysBack = dayIdx - i;
    if (daysBack < 0) return false;
    return daysBack < streak.current;
  };

  // Next milestone calculation
  const nextMilestone = MILESTONES.find(m => m > streak.current) || MILESTONES[MILESTONES.length - 1];
  const daysToMilestone = nextMilestone - streak.current;

  return (
    <div style={{ marginBottom: 36 }}>
      <div className="glass-card" style={{ padding: '20px 20px 16px', position: 'relative', overflow: 'hidden' }}>

        {/* Top row: ACTIVE STREAK label + shields */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#F59E0B',
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            Active Streak
          </div>
          {streak.shieldsRemaining > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <ShieldCheck size={11} color="#3B82F6" />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6' }}>{streak.shieldsRemaining}</span>
            </div>
          )}
        </div>

        {/* Main row: days count on left, fire Lottie on right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1,
                fontFamily: 'var(--font-display, Inter, sans-serif)',
              }}>
                {streak.current}
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {streak.current === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {streak.current >= nextMilestone
                ? 'Milestone reached!'
                : `${daysToMilestone} more day${daysToMilestone === 1 ? '' : 's'} to next milestone`}
            </div>
          </div>

          {/* Big blazing fire Lottie */}
          <div style={{ width: 80, height: 80, flexShrink: 0, position: 'relative' }}>
            {fireData ? (
              <Lottie
                animationData={fireData}
                loop
                autoplay
                style={{ width: 90, height: 90, position: 'absolute', top: -5, left: -5 }}
              />
            ) : (
              <Flame size={56} color="#F59E0B" fill="rgba(245,158,11,0.3)" style={{ margin: 12 }} />
            )}
          </div>
        </div>

        {/* Weekly dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 12 }}>
          {DAYS.map((d, i) => {
            const isToday = i === dayIdx;
            const isFilled = getIsFilled(i);

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                <div style={{
                  fontSize: 9, fontWeight: 600,
                  color: isToday ? '#F59E0B' : 'var(--text-muted)',
                }}>{d}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
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
                  {isFilled && <Flame size={14} color="#F59E0B" fill="#F59E0B" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom motivation banner */}
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.1)',
          fontSize: 12, color: 'rgba(245,158,11,0.85)',
          textAlign: 'center', fontWeight: 600,
        }}>
          {streak.current >= 30 ? 'Legendary! 30+ day streak!'
            : streak.current >= 14 ? 'On fire! Keep the momentum!'
            : streak.current >= 7 ? 'One week strong!'
            : streak.current >= 3 ? 'Building consistency!'
            : 'Come back tomorrow to keep your streak!'}
        </div>
      </div>
    </div>
  );
}
