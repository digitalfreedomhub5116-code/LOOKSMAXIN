import { useState, useEffect } from 'react';
import { User, ChevronRight, BarChart3, Shield, LogOut, FileText, Zap, Crown, Lock } from 'lucide-react';
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
      <polygon points={fillPoints} fill="url(#lgFill)" />
      <polyline points={polyline} fill="none" stroke="url(#lgStroke)" strokeWidth="2.5"
        strokeLinejoin="round" filter="url(#glow)" />
      <line x1={scoreX} y1={scoreY} x2={scoreX} y2={curveH}
        stroke={primary} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <circle cx={scoreX} cy={scoreY} r="6" fill={primary} stroke="#000" strokeWidth="2" filter="url(#glow)" />
      <circle cx={scoreX} cy={scoreY} r="3" fill={primary} />
      <text x={scoreX} y={scoreY - 14} textAnchor="middle" fill={primary}
        fontSize="9" fontWeight="800" fontFamily="Inter, sans-serif">YOU</text>
      <text x={padX} y={canvasH - 8} fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">0</text>
      <text x={canvasW / 2} y={canvasH - 8} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">50</text>
      <text x={canvasW - padX} y={canvasH - 8} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="Inter">100</text>
    </svg>
  );
}

/* ═══ Circular Trait Progress Rings ═══ */
const TRAIT_RING_COLORS = [
  '#C8A84E', // jawline – gold
  '#60A5FA', // skin – blue
  '#34D399', // eyes – emerald
  '#F472B6', // lips – pink
  '#A78BFA', // symmetry – violet
  '#FB923C', // hair – orange
];

const TRAIT_RING_LABELS = ['Jaw', 'Skin', 'Eyes', 'Lips', 'Sym', 'Hair'];

function CircularTraitRings({ scores }: { scores: FaceScores | null }) {
  if (!scores) return null;

  const traitValues = [
    scores.jawline ?? 0,
    scores.skin_quality ?? 0,
    scores.eyes ?? 0,
    scores.lips ?? 0,
    scores.facial_symmetry ?? 0,
    scores.hair_quality ?? 0,
  ];

  const svgSize = 180;
  const center = svgSize / 2;
  const ringWidth = 5;
  const ringGap = 2;
  const outerRadius = 84;

  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <defs>
        {TRAIT_RING_COLORS.map((color, i) => (
          <linearGradient key={`tg-${i}`} id={`trait-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        ))}
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {traitValues.map((val, i) => {
        const r = outerRadius - i * (ringWidth + ringGap);
        const circumference = 2 * Math.PI * r;
        const arcLen = (val / 100) * circumference;
        const gapLen = circumference - arcLen;
        const startAngle = -90 + i * 30;

        return (
          <g key={i}>
            {/* Background track */}
            <circle
              cx={center} cy={center} r={r}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={ringWidth}
            />
            {/* Filled arc */}
            <circle
              cx={center} cy={center} r={r}
              fill="none"
              stroke={`url(#trait-grad-${i})`}
              strokeWidth={ringWidth}
              strokeLinecap="round"
              strokeDasharray={`${arcLen} ${gapLen}`}
              transform={`rotate(${startAngle} ${center} ${center})`}
              filter="url(#ringGlow)"
              style={{
                transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            {/* Score dot at end of arc */}
            {val > 5 && (() => {
              const endAngle = startAngle + (val / 100) * 360;
              const rad = (endAngle * Math.PI) / 180;
              const dotX = center + r * Math.cos(rad);
              const dotY = center + r * Math.sin(rad);
              return (
                <circle cx={dotX} cy={dotY} r={3} fill={TRAIT_RING_COLORS[i]}
                  style={{ filter: `drop-shadow(0 0 5px ${TRAIT_RING_COLORS[i]})` }} />
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ Trait ring legend — small colored dots below avatar ═══ */
function TraitRingLegend({ scores }: { scores: FaceScores | null }) {
  if (!scores) return null;

  const traitValues = [
    scores.jawline ?? 0,
    scores.skin_quality ?? 0,
    scores.eyes ?? 0,
    scores.lips ?? 0,
    scores.facial_symmetry ?? 0,
    scores.hair_quality ?? 0,
  ];

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
      marginTop: 4, padding: '0 8px',
    }}>
      {TRAIT_RING_LABELS.map((label, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: TRAIT_RING_COLORS[i],
            boxShadow: `0 0 4px ${TRAIT_RING_COLORS[i]}66`,
          }} />
          <span style={{
            fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
          }}>
            {label} {traitValues[i]}
          </span>
        </div>
      ))}
    </div>
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

/* ═══ Reforge-style glass panel ═══ */
const glassPanel: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(8,8,20,0.80) 12%, rgba(4,4,14,0.90) 100%)',
  borderTop: '1px solid rgba(255,255,255,0.10)',
  borderLeft: '1px solid rgba(255,255,255,0.07)',
  borderRight: '1px solid rgba(255,255,255,0.04)',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  borderRadius: 16,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
  position: 'relative',
  overflow: 'hidden',
};

/* ═══ Reforge-style card shimmer overlay ═══ */
function CardShine() {
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%)',
    }} />
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

  // Theme color for SVG elements
  const themeItem = equipped.theme ? getItemById(equipped.theme) : null;
  const themeColor = themeItem?.themeVars?.['--primary'] || '#C8A84E';

  const handleUpgrade = () => { if (onNavigate) onNavigate('vault', { showPlans: true }); };
  const handleAdvancedStats = () => { if (plan === 'free' && onNavigate) onNavigate('vault', { showPlans: true }); };

  const potentialScore = scores?.potential || scores?.overall || 0;

  return (
    <div style={{
      paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 100,
      fontFamily: "'Inter', sans-serif",
      background: '#05050a',
      minHeight: '100vh',
    }}>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ HERO: BANNER + AVATAR overlay — Reforge style ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', marginBottom: scores ? 86 : 56 }}>

        {/* Banner */}
        <div style={{
          width: '100%', height: 200,
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden', position: 'relative',
          background: '#000',
        }}>
          <img src={bannerSrc} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: 'center 40%',
          }} />
          {/* Bottom gradient for text readability */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
            background: 'linear-gradient(to top, rgba(5,5,10,0.95) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Name + Username — bottom-left on banner */}
        <div style={{
          position: 'absolute', bottom: 14, left: 16, zIndex: 6,
          maxWidth: 'calc(50% - 80px)',
        }}>
          <div style={{
            fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2,
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {userInfo?.name || 'Player'}
          </div>
          <div style={{
            fontSize: 11, fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            color: 'rgba(255,255,255,0.4)', marginTop: 2,
            textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            @{userInfo?.name?.toLowerCase().replace(/\s/g, '') || 'champion'}
          </div>
        </div>

        {/* Scan count pill — bottom-right on banner */}
        <div style={{
          position: 'absolute', bottom: 14, right: 16, zIndex: 6,
        }}>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(var(--primary-rgb, 200,168,78),0.10)',
            border: '1px solid rgba(var(--primary-rgb, 200,168,78),0.25)',
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700, color: 'var(--primary, #C8A84E)',
            letterSpacing: '0.1em',
          }}>
            {scanCount} SCANS
          </div>
        </div>

        {/* Avatar — centered, overlapping banner bottom with trait rings */}
        <div style={{
          position: 'absolute', bottom: scores ? -64 : -44,
          left: '50%', transform: 'translateX(-50%)', zIndex: 5,
          overflow: 'visible',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ position: 'relative', width: 150, height: 150, overflow: 'visible' }}>

            {/* ═══ Circular Trait Progress Rings (outer) ═══ */}
            <CircularTraitRings scores={scores} />

            {/* Gradient ring — only when NO image border */}
            {!borderItem?.imageBorder && (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 88, height: 88,
                borderRadius: '50%',
                background: borderGrad, padding: 3,
                zIndex: 1,
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
                width: borderItem?.imageBorder ? 72 : 80,
                height: borderItem?.imageBorder ? 72 : 80,
                borderRadius: '50%', objectFit: 'cover',
                zIndex: 3,
              }} />
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: borderItem?.imageBorder ? 72 : 80,
                height: borderItem?.imageBorder ? 72 : 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 3,
              }}>
                <User size={32} color="#fff" />
              </div>
            )}
            {/* Image border: pulse animation */}
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
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${(borderItem.imageScale || 1) * 100}%`,
                height: `${(borderItem.imageScale || 1) * 100}%`,
                transform: `translate(-50%, calc(-50% + ${borderItem.imageOffsetY || 0}px))`,
                pointerEvents: 'none',
                filter: `drop-shadow(0 0 6px ${borderGlow})`,
              }}>
                <img src={borderItem.imageBorder} alt="" style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  animation: borderItem.imageAnimated ? 'spin 8s linear infinite' : 'none',
                }} />
              </div>
            ) : null}
            {borderItem?.lottieBorder && <ProfileLottieBorder src={borderItem.lottieBorder} glow={borderGlow} />}
          </div>

          {/* Trait ring legend — small dots with labels */}
          {scores && (
            <div style={{ marginTop: 6 }}>
              <TraitRingLegend scores={scores} />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ═══ CONTENT AREA ═══ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '0 14px' }}>

        {/* ── POTENTIAL DISTRIBUTION — Glass Panel ── */}
        <div style={{ ...glassPanel, padding: '20px 16px 16px', marginBottom: 12 }}>
          <CardShine />

          {/* Section header — Reforge mono style */}
          <div style={{
            fontSize: 10, fontWeight: 700,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            color: 'rgba(var(--primary-rgb, 200,168,78),0.5)',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 6,
          }}>
            POTENTIAL DISTRIBUTION
          </div>

          {scores ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: 48, fontWeight: 900, color: 'var(--primary, #C8A84E)', lineHeight: 1,
                textShadow: '0 0 20px rgba(var(--primary-rgb, 200,168,78),0.3)',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.03em',
              }}>
                {potentialScore}
              </div>
              <div style={{
                fontSize: 8, color: 'rgba(var(--primary-rgb, 200,168,78),0.35)', marginBottom: 10,
                letterSpacing: '0.2em', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                POTENTIAL SCORE
              </div>
              <LiquidGlassBellCurve score={potentialScore} primary={themeColor} />
            </div>
          ) : (
            <div style={{
              padding: 32, color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Complete a scan to see your potential curve
            </div>
          )}
        </div>

        {/* ── CURRENT PLAN + UPGRADE — Glass Panel ── */}
        <div
          style={{ ...glassPanel, marginBottom: 10, cursor: upgrade.next ? 'pointer' : 'default' }}
          onClick={upgrade.next ? handleUpgrade : undefined}
        >
          <CardShine />
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${planInfo.color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PlanIcon size={20} color={planInfo.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                <span style={{ color: planInfo.color }}>{planInfo.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}> Plan</span>
              </div>
              {upgrade.next ? (
                <div style={{
                  fontSize: 11, fontWeight: 700, marginTop: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: upgrade.color,
                  letterSpacing: '0.05em',
                }}>
                  ✨ Upgrade to {upgrade.label}
                </div>
              ) : (
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  You have the highest plan!
                </div>
              )}
            </div>
            {upgrade.next && <ChevronRight size={16} color={upgrade.color} />}
          </div>
        </div>

        {/* ── ADVANCED STATS — Glass Panel ── */}
        <div
          style={{ ...glassPanel, marginBottom: 10, cursor: plan === 'free' ? 'pointer' : 'default' }}
          onClick={handleAdvancedStats}
        >
          <CardShine />
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
            opacity: plan === 'free' ? 0.6 : 1,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(var(--primary-rgb, 200,168,78),0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary, #C8A84E)',
            }}>
              <BarChart3 size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>Advanced Stats</div>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {plan === 'free' ? 'Unlock with Pro plan' : 'Detailed analytics'}
              </div>
            </div>
            {plan === 'free' ? <Lock size={14} color="rgba(255,255,255,0.25)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.15)" />}
          </div>
        </div>

        {/* ── LEGAL — Privacy + Terms ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {[
            { icon: <Shield size={18} />, title: 'Privacy Policy', sub: 'How we handle your data' },
            { icon: <FileText size={18} />, title: 'Terms & Conditions', sub: 'Usage terms and agreement' },
          ].map((item, i) => (
            <div key={i} style={{ ...glassPanel, cursor: 'pointer' }}>
              <CardShine />
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ color: 'var(--primary, #C8A84E)' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>{item.title}</div>
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{item.sub}</div>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.12)" />
              </div>
            </div>
          ))}
        </div>

        {/* ── SIGN OUT — Reforge red button ── */}
        <button onClick={handleLogout} disabled={loggingOut} style={{
          width: '100%', marginTop: 28, padding: '14px 0',
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.12)',
          borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          color: '#EF4444', fontSize: 13, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
          transition: 'all 0.2s',
          opacity: loggingOut ? 0.5 : 1,
        }}>
          <LogOut size={15} /> {loggingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
        </button>
      </div>
    </div>
  );
}
