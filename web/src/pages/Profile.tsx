import { useState, useEffect } from 'react';
import { User, ChevronRight, BarChart3, Shield, LogOut, Mail, Lock, FileText, Zap, Crown } from 'lucide-react';
import Lottie from 'lottie-react';
import { getScanCount, loadLatestScores, type FaceScores } from '../lib/api';
import { getEquipped, getEconomy, type PlanTier } from '../lib/economy';
import { getItemById } from '../data/storeItems';
import type { Tab } from '../App';

/* ═══ Plan Upgrade Map ═══ */
const NEXT_PLAN: Record<PlanTier, { next: PlanTier | null; label: string; color: string }> = {
  free: { next: 'basic', label: 'Basic', color: '#60A5FA' },
  basic: { next: 'pro', label: 'Pro', color: '#C8A84E' },
  pro: { next: 'ultra', label: 'Ultra', color: '#F59E0B' },
  ultra: { next: null, label: '', color: '#F59E0B' },
};

const PLAN_LABELS: Record<PlanTier, { name: string; color: string; icon: any }> = {
  free: { name: 'Free', color: '#94A3B8', icon: Zap },
  basic: { name: 'Basic', color: '#60A5FA', icon: Zap },
  pro: { name: 'Pro', color: '#C8A84E', icon: Crown },
  ultra: { name: 'Ultra', color: '#F59E0B', icon: Crown },
};

/* ═══ 6 Major Trait Config ═══ */
const TRAIT_CONFIG = [
  { key: 'jawline', label: 'Jawline', legacyKey: 'jawline' },
  { key: 'skin', label: 'Skin', legacyKey: 'skin_quality' },
  { key: 'eyes', label: 'Eyes', legacyKey: 'eyes' },
  { key: 'symmetry', label: 'Symmetry', legacyKey: 'facial_symmetry' },
  { key: 'nose', label: 'Nose', legacyKey: null },
  { key: 'cheekbones', label: 'Cheeks', legacyKey: null },
] as const;

/* ═══ Score → Color (gold/amber spectrum) ═══ */
function scoreColor(score: number): string {
  if (score >= 80) return 'var(--primary, #F59E0B)';
  if (score >= 65) return 'var(--primary, #C8A84E)';
  if (score >= 50) return 'var(--primary, #D4A843)';
  if (score >= 35) return 'var(--primary, #B8860B)';
  return 'var(--primary, #8B6914)';
}

/* ═══ Circular Progress Ring ═══ */
function TraitRing({ score, label }: { score: number; label: string }) {
  const size = 40;
  const stroke = 2.5;
  const radius = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ textAlign: 'center', width: 40, flexShrink: 0 }}>
      <div style={{ position: 'relative', width: 36, height: 36, margin: '0 auto 3px' }}>
        <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={18} cy={18} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle cx={18} cy={18} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color,
            textShadow: `0 0 10px ${color}44`,
          }}>{score}</span>
        </div>
      </div>
      <div style={{
        fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
        letterSpacing: 0.8, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  );
}

/* ═══ Liquid Glass Bell Curve ═══ */
function LiquidGlassBellCurve({ score, primary = '#C8A84E' }: { score: number; primary?: string }) {
  const canvasW = 300;
  const canvasH = 130;
  const padX = 24;
  const padBottom = 28;
  const curveH = canvasH - padBottom;

  const points: string[] = [];
  const numPoints = 80;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = padX + t * (canvasW - padX * 2);
    const gauss = Math.exp(-0.5 * Math.pow((t - 0.5) / 0.17, 2));
    const y = curveH - gauss * (curveH - 16);
    points.push(`${x},${y}`);
  }
  const polyline = points.join(' ');
  const fillPoints = `${padX},${curveH} ${polyline} ${canvasW - padX},${curveH}`;

  const clampedScore = Math.max(0, Math.min(100, score));
  const scoreT = clampedScore / 100;
  const scoreX = padX + scoreT * (canvasW - padX * 2);
  const scoreGauss = Math.exp(-0.5 * Math.pow((scoreT - 0.5) / 0.17, 2));
  const scoreY = curveH - scoreGauss * (curveH - 16);

  // Convert hex to rgba helper
  const toRgba = (hex: string, a: number) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  return (
    <svg width="100%" viewBox={`0 0 ${canvasW} ${canvasH}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={toRgba(primary, 0.2)} />
          <stop offset="100%" stopColor={toRgba(primary, 0)} />
        </linearGradient>
        <linearGradient id="lgStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={toRgba(primary, 0.2)} />
          <stop offset="30%" stopColor={primary} />
          <stop offset="50%" stopColor={primary} />
          <stop offset="70%" stopColor={primary} />
          <stop offset="100%" stopColor={toRgba(primary, 0.2)} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Fill under curve */}
      <polygon points={fillPoints} fill="url(#lgFill)" />

      {/* Curve line with glow */}
      <polyline points={polyline} fill="none" stroke="url(#lgStroke)" strokeWidth="2.5"
        strokeLinejoin="round" filter="url(#glow)" />

      {/* Vertical marker */}
      <line x1={scoreX} y1={scoreY} x2={scoreX} y2={curveH}
        stroke={primary} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

      {/* Marker dot with glow */}
      <circle cx={scoreX} cy={scoreY} r="6" fill={primary} stroke="#000" strokeWidth="2" filter="url(#glow)" />
      <circle cx={scoreX} cy={scoreY} r="3" fill={primary} />

      {/* "You" label */}
      <text x={scoreX} y={scoreY - 14} textAnchor="middle" fill={primary}
        fontSize="9" fontWeight="800" fontFamily="Inter, sans-serif">YOU</text>

      {/* X-axis labels */}
      <text x={padX} y={canvasH - 8} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">0</text>
      <text x={canvasW / 2} y={canvasH - 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">50</text>
      <text x={canvasW - padX} y={canvasH - 8} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">100</text>
    </svg>
  );
}

interface Props {
  onLogout: () => void;
  user: any;
  onNavigate?: (tab: Tab, opts?: { showPlans?: boolean }) => void;
}

/* ═══ Lottie Border for Profile ═══ */
const lottieProfCache: Record<string, any> = {};

function ProfileLottieBorder({ src, glow }: { src: string; glow: string }) {
  const [data, setData] = useState<any>(lottieProfCache[src] || null);

  useEffect(() => {
    if (lottieProfCache[src]) { setData(lottieProfCache[src]); return; }
    fetch(src).then(r => r.json()).then(d => { lottieProfCache[src] = d; setData(d); }).catch(() => { });
  }, [src]);

  if (!data) return null;

  return (
    <div style={{
      position: 'absolute', inset: -12,
      width: 'calc(100% + 24px)', height: 'calc(100% + 24px)',
      pointerEvents: 'none', mixBlendMode: 'screen',
      filter: `drop-shadow(0 0 8px ${glow}) brightness(1.1)`,
      borderRadius: '50%', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: '100%', height: '200%',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }}>
        <Lottie animationData={data} loop autoplay style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

export default function Profile({ onLogout, user: sessionUser, onNavigate }: Props) {
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; avatar?: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [scores, setScores] = useState<FaceScores | null>(null);

  useEffect(() => {
    if (sessionUser) {
      setUserInfo({
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Champion',
        avatar: sessionUser.user_metadata?.avatar_url,
      });
    }
    setScanCount(getScanCount());
    setScores(loadLatestScores());
  }, [sessionUser]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await onLogout(); } catch { localStorage.clear(); window.location.reload(); }
  };

  const economy = getEconomy();
  const plan = economy.plan;
  const planInfo = PLAN_LABELS[plan];
  const upgrade = NEXT_PLAN[plan];
  const PlanIcon = planInfo.icon;

  // Border config
  const equipped = getEquipped();
  const borderItem = equipped.border ? getItemById(equipped.border) : null;
  const borderConfig = borderItem?.borderConfig;
  const hasLottie = !!borderItem?.lottieBorder;
  const borderGrad = borderConfig && !hasLottie
    ? `linear-gradient(135deg, ${borderConfig.colors.join(', ')})`
    : 'linear-gradient(135deg, rgba(200,168,78,0.4), rgba(200,168,78,0.2))';
  const borderGlow = borderConfig?.glowColor || 'rgba(200,168,78,0.3)';
  const hasBorder = !!borderConfig && !hasLottie;

  // Banner config
  const bannerItem = equipped.banner ? getItemById(equipped.banner) : null;
  const bannerSrc = bannerItem?.bannerImage || '/banners/default.webp';

  // Theme color for SVG elements that can't use CSS vars
  const themeItem = equipped.theme ? getItemById(equipped.theme) : null;
  const themeColor = themeItem?.themeVars?.['--primary'] || '#C8A84E';

  const handleUpgrade = () => { if (onNavigate) onNavigate('vault', { showPlans: true }); };
  const handleAdvancedStats = () => { if (plan === 'free' && onNavigate) onNavigate('vault', { showPlans: true }); };

  // Extract trait scores — prefer rich traits, fallback to legacy flat fields
  function getTraitScore(cfg: typeof TRAIT_CONFIG[number]): number {
    if (scores?.traits?.[cfg.key]) return scores.traits[cfg.key].score;
    if (cfg.legacyKey && scores) return (scores as any)[cfg.legacyKey] || 0;
    return 0;
  }

  const potentialScore = scores?.potential || scores?.overall || 0;

  /* ═══ Liquid Glass Shared Style ═══ */
  const liquidGlass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(var(--primary-rgb, 200,168,78),0.12)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  return (
    <div className="page" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 100 }}>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ BANNER with overlapping AVATAR ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', marginBottom: 56 }}>

        {/* Banner Image */}
        <div style={{
          width: '100%', height: 170,
          borderRadius: '0 0 20px 20px',
          overflow: 'hidden', position: 'relative',
        }}>
          <img src={bannerSrc} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: 'center 40%',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          }} />
        </div>

        {/* Username Badge — bottom-left of banner */}
        <div style={{
          position: 'absolute', bottom: 50, left: 16, zIndex: 6,
          whiteSpace: 'nowrap', maxWidth: 'calc(50% - 70px)',
        }}>
          <div style={{
            padding: '4px 14px', borderRadius: 16,
            background: 'rgba(var(--primary-rgb, 200,168,78),0.12)',
            border: '1px solid rgba(var(--primary-rgb, 200,168,78),0.35)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--primary, #C8A84E)', letterSpacing: 0.5,
            }}>@{userInfo?.name || 'Champion'}</span>
          </div>
        </div>

        {/* Avatar — centered, overlapping banner bottom */}
        <div style={{
          position: 'absolute', bottom: -44, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
          overflow: 'visible',
        }}>
          <div style={{ position: 'relative', width: 96, height: 96, overflow: 'visible' }}>
            {/* Gradient ring — only when NO image border */}
            {!borderItem?.imageBorder && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: borderGrad, padding: 3,
                boxShadow: hasBorder
                  ? `0 0 20px ${borderGlow}, 0 0 40px ${borderGlow}`
                  : '0 0 24px rgba(200,168,78,0.15)',
                animation: borderConfig?.animated ? 'border-pulse 2s ease-in-out infinite' : 'none',
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#000' }} />
              </div>
            )}
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt="" style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: borderItem?.imageBorder ? 76 : 86,
                height: borderItem?.imageBorder ? 76 : 86,
                borderRadius: '50%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: borderItem?.imageBorder ? 76 : 86,
                height: borderItem?.imageBorder ? 76 : 86,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={32} color="#fff" />
              </div>
            )}
            {borderItem?.imageBorder && borderItem.imageAnimated && borderItem.imageAnimationType === 'pulse' ? (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${(borderItem.imageScale || 1) * 100}%`,
                height: `${(borderItem.imageScale || 1) * 100}%`,
                transform: `translate(-50%, calc(-50% + ${borderItem.imageOffsetY || 0}px))`,
                pointerEvents: 'none',
                filter: `drop-shadow(0 0 6px ${borderGlow})`,
                animation: 'border-breathe-centered 3s ease-in-out infinite',
              }}>
                <img src={borderItem.imageBorder} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                }} />
              </div>
            ) : borderItem?.imageBorder ? (
              <img src={borderItem.imageBorder} alt="" style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${(borderItem.imageScale || 1) * 100}%`,
                height: `${(borderItem.imageScale || 1) * 100}%`,
                transform: `translate(-50%, calc(-50% + ${borderItem.imageOffsetY || 0}px))`,
                pointerEvents: 'none', objectFit: 'contain',
                animation: borderItem.imageAnimated ? 'spin 8s linear infinite' : 'none',
                filter: `drop-shadow(0 0 6px ${borderGlow})`,
              }} />
            ) : null}
            {borderItem?.lottieBorder && <ProfileLottieBorder src={borderItem.lottieBorder} glow={borderGlow} />}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ TRAIT RINGS — Horizontal row flanking avatar ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '0 20px', marginBottom: 16, marginTop: -38,
        overflowX: 'auto', overflowY: 'visible',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {TRAIT_CONFIG.slice(0, 3).map(cfg => (
          <TraitRing key={cfg.key} score={scores ? getTraitScore(cfg) : 0} label={cfg.label} />
        ))}

        <div style={{ width: 72, flexShrink: 0 }} />

        {TRAIT_CONFIG.slice(3, 6).map(cfg => (
          <TraitRing key={cfg.key} score={scores ? getTraitScore(cfg) : 0} label={cfg.label} />
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ═══ POTENTIAL GRAPH — Liquid Glass Card ═══ */}
        {/* ═══════════════════════════════════════════════════ */}
        <div style={{
          ...liquidGlass,
          padding: '20px 16px 16px',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle inner glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 100,
            background: 'radial-gradient(ellipse, rgba(200,168,78,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(var(--primary-rgb, 200,168,78),0.5)',
            letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4,
          }}>
            Potential Distribution
          </div>

          {scores ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: 44, fontWeight: 900, color: 'var(--primary, #C8A84E)', lineHeight: 1,
                textShadow: '0 0 20px rgba(var(--primary-rgb, 200,168,78),0.3)',
              }}>
                {potentialScore}
              </div>
              <div style={{
                fontSize: 9, color: 'rgba(var(--primary-rgb, 200,168,78),0.4)', marginBottom: 10,
                letterSpacing: 2, fontWeight: 700,
              }}>
                POTENTIAL SCORE
              </div>
              <LiquidGlassBellCurve score={potentialScore} primary={themeColor} />
            </div>
          ) : (
            <div style={{
              padding: 28, color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center',
            }}>
              Complete a scan to see your potential curve
            </div>
          )}
        </div>

        {/* ═══ Current Plan + Upgrade ═══ */}
        <div style={{ ...liquidGlass, marginBottom: 12, overflow: 'hidden' }}
          onClick={upgrade.next ? handleUpgrade : undefined}>
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: upgrade.next ? 'pointer' : 'default',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${planInfo.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PlanIcon size={20} color={planInfo.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                <span style={{ color: planInfo.color }}>{planInfo.name}</span>
                <span style={{ color: 'var(--text-muted)' }}> Plan</span>
              </div>
              {upgrade.next ? (
                <div style={{
                  fontSize: 12, fontWeight: 600, marginTop: 2,
                  background: `linear-gradient(90deg, ${upgrade.color}, ${upgrade.color}cc)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  ✨ Upgrade to {upgrade.label}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  You have the highest plan!
                </div>
              )}
            </div>
            {upgrade.next && <ChevronRight size={16} color={upgrade.color} />}
          </div>
        </div>

        {/* ═══ Advanced Stats ═══ */}
        <div style={{ ...liquidGlass, marginBottom: 6, overflow: 'hidden' }}
          onClick={handleAdvancedStats}>
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: plan === 'free' ? 'pointer' : 'default',
            opacity: plan === 'free' ? 0.65 : 1,
          }}>
            <div style={{ color: 'var(--primary)' }}><BarChart3 size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Advanced Stats</div>
              <div className="label" style={{ marginTop: 1 }}>
                {plan === 'free' ? 'Unlock with Pro plan' : 'Detailed analytics'}
              </div>
            </div>
            {plan === 'free' ? <Lock size={14} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-disabled)" />}
          </div>
        </div>

        {/* ═══ Legal Links ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          <div style={{ ...liquidGlass, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ color: 'var(--primary)' }}><Shield size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Privacy Policy</div>
                <div className="label" style={{ marginTop: 1 }}>How we handle your data</div>
              </div>
              <ChevronRight size={16} color="var(--text-disabled)" />
            </div>
          </div>

          <div style={{ ...liquidGlass, overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ color: 'var(--primary)' }}><FileText size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Terms & Conditions</div>
                <div className="label" style={{ marginTop: 1 }}>Usage terms and agreement</div>
              </div>
              <ChevronRight size={16} color="var(--text-disabled)" />
            </div>
          </div>
        </div>

        {/* ═══ Sign Out ═══ */}
        <button onClick={handleLogout} disabled={loggingOut} style={{
          width: '100%', marginTop: 28, padding: '14px 0',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.12)',
          borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: '#EF4444', fontSize: 14, fontWeight: 600,
          transition: 'all 0.2s',
          opacity: loggingOut ? 0.5 : 1,
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        }}>
          <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
