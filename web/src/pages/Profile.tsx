import { useState, useEffect } from 'react';
import { User, ChevronRight, BarChart3, Shield, LogOut, Mail, Lock, FileText, Zap, Crown } from 'lucide-react';
import Lottie from 'lottie-react';
import { getScanCount, loadLatestScores, type FaceScores } from '../lib/api';
import { getEquipped, getEconomy, type PlanTier } from '../lib/economy';
import { getItemById } from '../data/storeItems';
import type { Tab } from '../App';

/* ═══ Plan Upgrade Map ═══ */
const NEXT_PLAN: Record<PlanTier, { next: PlanTier | null; label: string; color: string }> = {
  free:  { next: 'basic', label: 'Basic',  color: '#60A5FA' },
  basic: { next: 'pro',   label: 'Pro',    color: '#C8A84E' },
  pro:   { next: 'ultra', label: 'Ultra',  color: '#F59E0B' },
  ultra: { next: null,    label: '',       color: '#F59E0B' },
};

const PLAN_LABELS: Record<PlanTier, { name: string; color: string; icon: any }> = {
  free:  { name: 'Free',  color: '#94A3B8', icon: Zap },
  basic: { name: 'Basic', color: '#60A5FA', icon: Zap },
  pro:   { name: 'Pro',   color: '#C8A84E', icon: Crown },
  ultra: { name: 'Ultra', color: '#F59E0B', icon: Crown },
};

/* ═══ 6 Major Trait Config ═══ */
const TRAIT_CONFIG = [
  { key: 'jawline',   label: 'Jawline',   legacyKey: 'jawline' },
  { key: 'skin',      label: 'Skin',      legacyKey: 'skin_quality' },
  { key: 'eyes',      label: 'Eyes',      legacyKey: 'eyes' },
  { key: 'symmetry',  label: 'Symmetry',  legacyKey: 'facial_symmetry' },
  { key: 'nose',      label: 'Nose',      legacyKey: null },
  { key: 'cheekbones',label: 'Cheeks',    legacyKey: null },
] as const;

/* ═══ Score → Color (gold/amber spectrum) ═══ */
function scoreColor(score: number): string {
  if (score >= 80) return '#F59E0B'; // bright amber
  if (score >= 65) return '#C8A84E'; // gold
  if (score >= 50) return '#D4A843'; // warm gold
  if (score >= 35) return '#B8860B'; // dark gold
  return '#8B6914'; // dim gold
}

/* ═══ Circular Progress Ring ═══ */
function TraitRing({ score, label }: { score: number; label: string }) {
  const size = 72;
  const stroke = 4;
  const radius = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = scoreColor(score);

  return (
    <div style={{ textAlign: 'center', width: size + 8 }}>
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 6px' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {/* Fill */}
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
          />
        </svg>
        {/* Center number */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 18, fontWeight: 800, color,
            textShadow: `0 0 12px ${color}44`,
          }}>{score}</span>
        </div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  );
}

/* ═══ Liquid Glass Bell Curve ═══ */
function LiquidGlassBellCurve({ score }: { score: number }) {
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

  return (
    <svg width="100%" viewBox={`0 0 ${canvasW} ${canvasH}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lgFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,168,78,0.2)" />
          <stop offset="100%" stopColor="rgba(200,168,78,0)" />
        </linearGradient>
        <linearGradient id="lgStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(200,168,78,0.2)" />
          <stop offset="30%" stopColor="#C8A84E" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#C8A84E" />
          <stop offset="100%" stopColor="rgba(200,168,78,0.2)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
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
        stroke="#C8A84E" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

      {/* Marker dot with glow */}
      <circle cx={scoreX} cy={scoreY} r="6" fill="#C8A84E" stroke="#000" strokeWidth="2" filter="url(#glow)" />
      <circle cx={scoreX} cy={scoreY} r="3" fill="#F59E0B" />

      {/* "You" label */}
      <text x={scoreX} y={scoreY - 14} textAnchor="middle" fill="#F59E0B"
        fontSize="9" fontWeight="800" fontFamily="Inter, sans-serif"
        style={{ textShadow: '0 0 8px rgba(245,158,11,0.5)' }}>YOU</text>

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
    fetch(src).then(r => r.json()).then(d => { lottieProfCache[src] = d; setData(d); }).catch(() => {});
  }, [src]);

  if (!data) return null;

  return (
    <div style={{
      position: 'absolute', inset: -12,
      width: 'calc(100% + 24px)', height: 'calc(100% + 24px)',
      pointerEvents: 'none', mixBlendMode: 'screen',
      filter: `drop-shadow(0 0 8px ${glow})`,
      borderRadius: '50%', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: '100%', height: '178%',
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
    border: '1px solid rgba(200,168,78,0.12)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  return (
    <div className="page" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 100 }}>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ BANNER + AVATAR + USERNAME ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', marginBottom: 16 }}>

        {/* Banner */}
        <div style={{
          width: '100%', height: 160,
          borderRadius: '0 0 20px 20px',
          overflow: 'hidden', position: 'relative',
        }}>
          <img src="/profile-banner.png" alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(transparent, #000)',
          }} />
        </div>

        {/* Username Badge */}
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
        }}>
          <div style={{
            padding: '5px 18px', borderRadius: 20,
            background: 'rgba(200,168,78,0.12)',
            border: '1px solid rgba(200,168,78,0.35)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#C8A84E', letterSpacing: 0.5,
            }}>@{userInfo?.name || 'Champion'}</span>
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)', zIndex: 4,
        }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
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
            {userInfo?.avatar ? (
              <img src={userInfo.avatar} alt="" style={{
                position: 'absolute', top: 5, left: 5,
                width: 86, height: 86, borderRadius: '50%', objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                position: 'absolute', top: 5, left: 5,
                width: 86, height: 86, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <User size={32} color="#fff" />
              </div>
            )}
            {borderItem?.imageBorder && (
              <img src={borderItem.imageBorder} alt="" style={{
                position: 'absolute', inset: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)',
                pointerEvents: 'none', objectFit: 'contain',
                animation: borderItem.imageAnimated ? 'spin 8s linear infinite' : 'none',
                filter: `drop-shadow(0 0 6px ${borderGlow})`,
              }} />
            )}
            {borderItem?.lottieBorder && <ProfileLottieBorder src={borderItem.lottieBorder} glow={borderGlow} />}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: 56 }} />

      {/* Email */}
      <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
        }}>
          <Mail size={11} /> {userInfo?.email || '...'}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ═══ 6 TRAIT RINGS — Liquid Glass Card ═══ */}
        {/* ═══════════════════════════════════════════════════ */}
        <div style={{ ...liquidGlass, padding: '20px 12px 16px', marginBottom: 14 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'rgba(200,168,78,0.6)',
            letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 16,
          }}>
            Trait Breakdown
          </div>

          {scores ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px 0',
              justifyItems: 'center',
            }}>
              {TRAIT_CONFIG.map(cfg => (
                <TraitRing key={cfg.key} score={getTraitScore(cfg)} label={cfg.label} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '24px 0',
              color: 'rgba(255,255,255,0.3)', fontSize: 13,
            }}>
              Complete a face scan to see your traits
            </div>
          )}
        </div>

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
            fontSize: 10, fontWeight: 700, color: 'rgba(200,168,78,0.5)',
            letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4,
          }}>
            Potential Distribution
          </div>

          {scores ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                fontSize: 44, fontWeight: 900, color: '#C8A84E', lineHeight: 1,
                textShadow: '0 0 20px rgba(200,168,78,0.3)',
              }}>
                {potentialScore}
              </div>
              <div style={{
                fontSize: 9, color: 'rgba(200,168,78,0.4)', marginBottom: 10,
                letterSpacing: 2, fontWeight: 700,
              }}>
                POTENTIAL SCORE
              </div>
              <LiquidGlassBellCurve score={potentialScore} />
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
