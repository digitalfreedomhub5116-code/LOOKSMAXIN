import { useState, useEffect, useRef } from 'react';
import { User, ChevronRight, BarChart3, Shield, LogOut, Mail, Flame, Lock, FileText, Zap, Crown } from 'lucide-react';
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

/* ═══ Bell Curve Chart (SVG) ═══ */
function BellCurve({ score }: { score: number }) {
  const canvasW = 280;
  const canvasH = 120;
  const padX = 20;
  const padBottom = 24;
  const curveH = canvasH - padBottom;
  
  // Generate bell curve points
  const points: string[] = [];
  const numPoints = 60;
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const x = padX + t * (canvasW - padX * 2);
    // Gaussian: mean=0.5, sigma=0.17
    const gauss = Math.exp(-0.5 * Math.pow((t - 0.5) / 0.17, 2));
    const y = curveH - gauss * (curveH - 12);
    points.push(`${x},${y}`);
  }
  const polyline = points.join(' ');
  
  // Fill area
  const fillPoints = `${padX},${curveH} ${polyline} ${canvasW - padX},${curveH}`;
  
  // Score position along x-axis (0-100 mapped to curve)
  const clampedScore = Math.max(0, Math.min(100, score));
  const scoreT = clampedScore / 100;
  const scoreX = padX + scoreT * (canvasW - padX * 2);
  const scoreGauss = Math.exp(-0.5 * Math.pow((scoreT - 0.5) / 0.17, 2));
  const scoreY = curveH - scoreGauss * (curveH - 12);
  
  return (
    <svg width={canvasW} height={canvasH} viewBox={`0 0 ${canvasW} ${canvasH}`}>
      <defs>
        <linearGradient id="bellFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,168,78,0.3)" />
          <stop offset="100%" stopColor="rgba(200,168,78,0.02)" />
        </linearGradient>
        <linearGradient id="bellStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#C8A84E" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      
      {/* Fill under curve */}
      <polygon points={fillPoints} fill="url(#bellFill)" />
      
      {/* Curve line */}
      <polyline points={polyline} fill="none" stroke="url(#bellStroke)" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Vertical marker line */}
      <line x1={scoreX} y1={scoreY} x2={scoreX} y2={curveH} stroke="#C8A84E" strokeWidth="1.5" strokeDasharray="3 2" />
      
      {/* Marker dot */}
      <circle cx={scoreX} cy={scoreY} r="5" fill="#C8A84E" stroke="#0A0A0F" strokeWidth="2" />
      
      {/* "You" label */}
      <text x={scoreX} y={scoreY - 10} textAnchor="middle" fill="#C8A84E" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">YOU</text>
      
      {/* X-axis labels */}
      <text x={padX} y={canvasH - 6} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">0</text>
      <text x={canvasW / 2} y={canvasH - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">50</text>
      <text x={canvasW - padX} y={canvasH - 6} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Inter, sans-serif">100</text>
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
      pointerEvents: 'none',
      mixBlendMode: 'screen',
      filter: `drop-shadow(0 0 8px ${glow})`,
      borderRadius: '50%', overflow: 'hidden',
    }}>
      <Lottie animationData={data} loop autoplay style={{ width: '100%', height: '100%' }} />
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
  const streak = economy.streak.current;
  const planInfo = PLAN_LABELS[plan];
  const upgrade = NEXT_PLAN[plan];
  const PlanIcon = planInfo.icon;

  // Border config
  const equipped = getEquipped();
  const borderItem = equipped.border ? getItemById(equipped.border) : null;
  const borderConfig = borderItem?.borderConfig;
  const borderGrad = borderConfig
    ? `linear-gradient(135deg, ${borderConfig.colors.join(', ')})`
    : 'linear-gradient(135deg, rgba(142,161,188,0.3), rgba(142,161,188,0.3))';
  const borderGlow = borderConfig?.glowColor || 'var(--primary-glow)';
  const hasBorder = !!borderConfig;

  const handleUpgrade = () => {
    if (onNavigate) onNavigate('vault', { showPlans: true });
  };

  const handleAdvancedStats = () => {
    if (plan === 'free') {
      if (onNavigate) onNavigate('vault', { showPlans: true });
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* ═══ Avatar + Name ═══ */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          position: 'relative', width: 96, height: 96,
          margin: '0 auto 14px', display: 'inline-block',
        }}>
          {/* Border ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: borderGrad, padding: 3,
            boxShadow: hasBorder ? `0 0 20px ${borderGlow}, 0 0 40px ${borderGlow}` : '0 0 20px var(--primary-glow)',
            animation: borderConfig?.animated ? 'border-pulse 2s ease-in-out infinite' : 'none',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)' }} />
          </div>
          {/* Avatar */}
          {userInfo?.avatar ? (
            <img src={userInfo.avatar} alt="" style={{
              position: 'absolute', top: 5, left: 5,
              width: 86, height: 86, borderRadius: '50%', objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              position: 'absolute', top: 5, left: 5,
              width: 86, height: 86, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={32} color="#fff" />
            </div>
          )}
          {/* Image-based border overlay */}
          {borderItem?.imageBorder && (
            <img src={borderItem.imageBorder} alt="" style={{
              position: 'absolute', inset: -8, width: 'calc(100% + 16px)', height: 'calc(100% + 16px)',
              pointerEvents: 'none', objectFit: 'contain',
              animation: borderItem.imageAnimated ? 'spin 8s linear infinite' : 'none',
              filter: `drop-shadow(0 0 6px ${borderGlow})`,
            }} />
          )}
          {/* Lottie border overlay */}
          {borderItem?.lottieBorder && <ProfileLottieBorder src={borderItem.lottieBorder} glow={borderGlow} />}
        </div>
        <div className="h1" style={{ marginBottom: 2 }}>{userInfo?.name || 'Champion'}</div>
        <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Mail size={12} /> {userInfo?.email || '...'}
        </div>
      </div>

      {/* ═══ Stats: Scans + Streak ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{scanCount}</div>
          <div className="label" style={{ fontSize: 11 }}>Scans</div>
        </div>
        <div style={{ width: 1, background: 'var(--border-subtle)', height: 36 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Flame size={16} color="#F59E0B" /> {streak}
          </div>
          <div className="label" style={{ fontSize: 11 }}>Streak</div>
        </div>
      </div>

      {/* ═══ Bell Curve Chart ═══ */}
      <div className="glass" style={{
        padding: '16px 12px 12px', marginBottom: 12, textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          Your Potential Distribution
        </div>
        {scores ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#C8A84E', lineHeight: 1 }}>{scores.potential || scores.overall}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>POTENTIAL SCORE</div>
            <BellCurve score={scores.potential || scores.overall} />
          </div>
        ) : (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            Complete a scan to see your potential curve
          </div>
        )}
      </div>

      {/* ═══ Current Plan + Upgrade ═══ */}
      <div className="glass" onClick={upgrade.next ? handleUpgrade : undefined} style={{
        padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14,
        cursor: upgrade.next ? 'pointer' : 'default',
        border: `1px solid ${planInfo.color}22`,
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

      {/* ═══ Advanced Stats (locked for free) ═══ */}
      <div className="glass" onClick={handleAdvancedStats} style={{
        padding: '14px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 14,
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
        {plan === 'free' ? (
          <Lock size={14} color="var(--text-muted)" />
        ) : (
          <ChevronRight size={16} color="var(--text-disabled)" />
        )}
      </div>

      {/* ═══ Legal Links ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        <div className="glass" style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}>
          <div style={{ color: 'var(--primary)' }}><Shield size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Privacy Policy</div>
            <div className="label" style={{ marginTop: 1 }}>How we handle your data</div>
          </div>
          <ChevronRight size={16} color="var(--text-disabled)" />
        </div>

        <div className="glass" style={{
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        }}>
          <div style={{ color: 'var(--primary)' }}><FileText size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Terms & Conditions</div>
            <div className="label" style={{ marginTop: 1 }}>Usage terms and agreement</div>
          </div>
          <ChevronRight size={16} color="var(--text-disabled)" />
        </div>
      </div>

      {/* ═══ Sign Out ═══ */}
      <button onClick={handleLogout} disabled={loggingOut} style={{
        width: '100%', marginTop: 28, padding: '14px 0',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        color: '#EF4444', fontSize: 14, fontWeight: 600,
        transition: 'all 0.2s',
        opacity: loggingOut ? 0.5 : 1,
      }}>
        <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
