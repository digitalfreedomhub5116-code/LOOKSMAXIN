/**
 * Ranks — Production leaderboard page.
 * Shows top 50 users ranked by streak, with podium for top 3.
 */
import { useState, useEffect } from 'react';
import { Flame, RefreshCw, User } from 'lucide-react';
import Lottie from 'lottie-react';
import { fetchLeaderboard, getUserRank, type LeaderboardEntry } from '../lib/leaderboard';
import { getItemById, type StoreItem } from '../data/storeItems';

function AvatarCircle({ url, size = 48, rank, borderItem }: { url?: string | null; size?: number; rank?: number; borderItem?: StoreItem | null }) {
  const defaultColor = rank === 1 ? '#FBBF24' : rank === 2 ? '#94A3B8' : rank === 3 ? '#CD7F32' : 'rgba(255,255,255,0.1)';

  // If a store border is equipped, render the full border
  if (borderItem) {
    const cfg = borderItem.borderConfig;
    const glow = cfg?.glowColor || 'rgba(200,168,78,0.3)';
    const hasImage = !!borderItem.imageBorder;
    const hasAura = !!borderItem.auraConfig;
    const hasLottie = !!borderItem.lottieBorder;
    const outerSize = size + 16;

    return (
      <div style={{
        position: 'relative', width: outerSize, height: outerSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {/* Aura glow layer */}
        {hasAura && borderItem.auraConfig && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            background: `conic-gradient(${borderItem.auraConfig.colors.join(', ')}, ${borderItem.auraConfig.colors[0]})`,
            filter: `blur(${borderItem.auraConfig.blur}px)`,
            opacity: 0.6,
            animation: borderItem.auraConfig.animated ? `spin ${borderItem.auraConfig.pulseSpeed || 3}s linear infinite` : 'none',
          }} />
        )}

        {/* Gradient ring (for SVG/gradient borders, skip if image or lottie) */}
        {cfg && !hasImage && !hasLottie && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `linear-gradient(135deg, ${cfg.colors.join(', ')})`,
            padding: 3,
            boxShadow: `0 0 12px ${glow}, 0 0 24px ${glow}`,
            animation: cfg.animated ? 'border-pulse 2s ease-in-out infinite' : 'none',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)' }} />
          </div>
        )}

        {/* Avatar image (centered inside) */}
        <div style={{
          position: 'absolute',
          width: size, height: size, borderRadius: '50%',
          background: 'var(--bg)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: (hasImage || hasLottie) ? 'none' : `2px solid ${glow}`,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        }}>
          {url ? (
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={size * 0.5} color="var(--text-muted)" />
          )}
        </div>

        {/* Image border overlay (PNG around the avatar) */}
        {hasImage && borderItem.imageAnimated && borderItem.imageAnimationType === 'pulse' ? (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: outerSize * (borderItem.imageScale || 1),
            height: outerSize * (borderItem.imageScale || 1),
            transform: `translate(-50%, calc(-50% + ${borderItem.imageOffsetY || 0}px))`,
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 6px ${glow})`,
            animation: 'border-breathe-centered 3s ease-in-out infinite',
          }}>
            <img src={borderItem.imageBorder} alt="" style={{
              width: '100%', height: '100%', objectFit: 'contain',
            }} />
          </div>
        ) : hasImage ? (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: outerSize * (borderItem.imageScale || 1),
            height: outerSize * (borderItem.imageScale || 1),
            transform: `translate(-50%, calc(-50% + ${borderItem.imageOffsetY || 0}px))`,
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 6px ${glow})`,
          }}>
            <img src={borderItem.imageBorder} alt="" style={{
              width: '100%', height: '100%', objectFit: 'contain',
              animation: borderItem.imageAnimated ? 'spin 8s linear infinite' : 'none',
            }} />
          </div>
        ) : null}

        {/* Lottie border overlay */}
        {hasLottie && <LottieBorderOverlay src={borderItem.lottieBorder!} size={outerSize + 8} glow={glow} />}
      </div>
    );
  }

  // Default: simple border with rank color
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${defaultColor}`,
      background: 'var(--surface)', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <User size={size * 0.5} color="var(--text-muted)" />
      )}
    </div>
  );
}

/* ═══ Lottie Border Overlay ═══ */
const lottieCache: Record<string, any> = {};

function LottieBorderOverlay({ src, size, glow }: { src: string; size: number; glow: string }) {
  const [data, setData] = useState<any>(lottieCache[src] || null);

  useEffect(() => {
    if (lottieCache[src]) { setData(lottieCache[src]); return; }
    fetch(src).then(r => r.json()).then(d => { lottieCache[src] = d; setData(d); }).catch(() => {});
  }, [src]);

  if (!data) return null;

  // The Lottie is 720x1280 (9:16 portrait). We need to zoom in so the ring fills the circle.
  // Scale width to fill, let height overflow, clip to circle.
  return (
    <div style={{
      position: 'absolute', inset: '50%', transform: 'translate(-50%, -50%)',
      width: size, height: size, pointerEvents: 'none',
      mixBlendMode: 'screen',
      filter: `drop-shadow(0 0 6px ${glow}) brightness(1.1)`,
      borderRadius: '50%', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: '100%', height: '200%',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }}>
        <Lottie animationData={data} loop autoplay style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default function Ranks({ userId }: { userId?: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    const data = await fetchLeaderboard(force);
    setEntries(data);
    setLoading(false);
    setRefreshing(false);
  };

  // Force-refresh on every mount (each tab switch remounts the component)
  useEffect(() => { load(true); }, []);

  // Auto-refresh when tab becomes visible (switching back to Ranks)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Instant refresh when border changes in Store
  useEffect(() => {
    const onRefresh = () => load(true);
    window.addEventListener('leaderboard:refresh', onRefresh);
    return () => window.removeEventListener('leaderboard:refresh', onRefresh);
  }, []);

  const myRank = userId ? getUserRank(userId) : 0;

  // Look up any user's border item from their equipped_border ID
  const getBorderItem = (borderId: string | null | undefined): StoreItem | null => {
    if (!borderId) return null;
    return getItemById(borderId) || null;
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder podium: 2nd, 1st, 3rd
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Leaderboard</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Top players by streak
            {myRank > 0 && <span style={{ color: 'var(--primary)', fontWeight: 700 }}> — You're #{myRank}</span>}
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
          Loading leaderboard...
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Flame size={40} color="var(--primary)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No players yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Start your daily streak to appear on the leaderboard!
          </div>
        </div>
      ) : (
        <>
          {/* ═══ Podium — Top 3 ═══ */}
          {top3.length >= 3 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              gap: 8, marginBottom: 24, padding: '20px 0 0',
            }}>
              {podiumOrder.map((entry, i) => {
                const rank = podiumRanks[i];
                const isFirst = rank === 1;
                const avatarSize = isFirst ? 72 : 56;
                const crownColors = { 1: '#FBBF24', 2: '#94A3B8', 3: '#CD7F32' };
                const color = crownColors[rank as keyof typeof crownColors];
                const name = entry.display_name || 'Player';
                const truncName = name.length > 10 ? name.slice(0, 9) + '…' : name;

                return (
                  <div key={entry.user_id} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 4, flex: 1, maxWidth: 120,
                    marginBottom: isFirst ? 16 : 0,
                  }}>
                    {/* Rank medal */}
                    <div style={{
                      fontSize: isFirst ? 22 : 16, fontWeight: 900,
                      color, lineHeight: 1, marginBottom: 4,
                    }}>
                      {rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉'}
                    </div>

                    {/* Avatar with wreath effect */}
                    <div style={{ position: 'relative' }}>
                      <AvatarCircle url={entry.avatar_url} size={avatarSize} rank={rank} borderItem={getBorderItem(entry.equipped_border)} />
                      {/* Glow behind avatar for #1 */}
                      {isFirst && (
                        <div style={{
                          position: 'absolute', inset: -6, borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
                          zIndex: -1,
                        }} />
                      )}
                    </div>

                    {/* Name */}
                    <div style={{
                      fontSize: isFirst ? 13 : 11, fontWeight: 700, color: '#fff',
                      textAlign: 'center', marginTop: 4,
                    }}>
                      {truncName}
                    </div>

                    {/* Streak */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: isFirst ? 18 : 14, fontWeight: 800, color,
                    }}>
                      {entry.streak}
                      <Flame size={isFirst ? 18 : 14} color={color} fill={color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ Rest of leaderboard ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = userId && entry.user_id === userId;
              return (
                <div key={entry.user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  background: isMe ? 'rgba(var(--primary-rgb),0.08)' : 'var(--surface)',
                  border: isMe ? '1px solid rgba(var(--primary-rgb),0.2)' : '1px solid var(--border)',
                  borderRadius: 14,
                  transition: 'all 0.2s',
                }}>
                  {/* Rank number */}
                  <div style={{
                    width: 28, fontSize: 15, fontWeight: 800,
                    color: isMe ? 'var(--primary)' : 'var(--text-muted)',
                    textAlign: 'center',
                  }}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  <AvatarCircle url={entry.avatar_url} size={40} borderItem={getBorderItem(entry.equipped_border)} />

                  {/* Name */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: isMe ? '#fff' : '#e5e5e5',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {entry.display_name || 'Player'}
                      {isMe && <span style={{ fontSize: 10, color: 'var(--primary)', marginLeft: 6, fontWeight: 800 }}>YOU</span>}
                    </div>
                  </div>

                  {/* Streak */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 16, fontWeight: 800, color: '#F59E0B',
                  }}>
                    {entry.streak}
                    <Flame size={16} color="#F59E0B" fill="#F59E0B" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div style={{
            textAlign: 'center', marginTop: 24, fontSize: 11,
            color: 'var(--text-disabled)',
          }}>
            Updated every 60 seconds · Top 50 players
          </div>
        </>
      )}
    </div>
  );
}
