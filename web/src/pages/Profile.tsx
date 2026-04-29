import { useState, useEffect, useRef } from 'react';
import { User, ChevronRight, BarChart3, Shield, LogOut, Mail, Flame, Lock, FileText, Zap, Crown, Camera, ScanLine } from 'lucide-react';
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
          <stop offset="0%" stopColor="rgba(96,165,250,0.25)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0.02)" />
        </linearGradient>
        <linearGradient id="bellStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      {/* Fill under curve */}
      <polygon points={fillPoints} fill="url(#bellFill)" />
      
      {/* Curve line */}
      <polyline points={polyline} fill="none" stroke="url(#bellStroke)" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Vertical marker line */}
      <line x1={scoreX} y1={scoreY} x2={scoreX} y2={curveH} stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="3 2" />
      
      {/* Marker dot */}
      <circle cx={scoreX} cy={scoreY} r="5" fill="#60A5FA" stroke="#0A0A0F" strokeWidth="2" />
      
      {/* "You" label */}
      <text x={scoreX} y={scoreY - 10} textAnchor="middle" fill="#60A5FA" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">YOU</text>
      
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
      <div style={{
        position: 'absolute',
        width: '100%', height: '178%',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }}>
        <Lottie animationData={data} loop autoplay style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

/* ═══ Default Banner ═══ */
const DEFAULT_BANNER = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)';

export default function Profile({ onLogout, user: sessionUser, onNavigate }: Props) {
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; avatar?: string } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [scores, setScores] = useState<FaceScores | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

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
    // Load saved banner
    const saved = localStorage.getItem('lynx_profile_banner');
    if (saved) setBannerUrl(saved);
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
  const hasLottie = !!borderItem?.lottieBorder;
  const borderGrad = borderConfig && !hasLottie
    ? `linear-gradient(135deg, ${borderConfig.colors.join(', ')})`
    : 'linear-gradient(135deg, rgba(142,161,188,0.3), rgba(142,161,188,0.3))';
  const borderGlow = borderConfig?.glowColor || 'var(--primary-glow)';
  const hasBorder = !!borderConfig && !hasLottie;

  const handleUpgrade = () => {
    if (onNavigate) onNavigate('vault', { showPlans: true });
  };

  const handleAdvancedStats = () => {
    if (plan === 'free') {
      if (onNavigate) onNavigate('vault', { showPlans: true });
    }
  };

  const potentialScore = scores?.potential || scores?.overall || 0;

  return (
    <div className="page" style={{ paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 100 }}>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ PROFILE HERO: Banner + Avatar + Stats ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', marginBottom: 16 }}>

        {/* ── Banner Image ── */}
        <div style={{
          width: '100%',
          height: 160,
          borderRadius: '0 0 20px 20px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {bannerUrl ? (
            <img src={bannerUrl} alt="" style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
            }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: DEFAULT_BANNER,
              position: 'relative',
            }}>
              {/* Subtle pattern overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(200,168,78,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(96,165,250,0.06) 0%, transparent 50%)',
              }} />
              {/* Grid lines */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.04,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
            </div>
          )}
          {/* Dark gradient at bottom for smooth blend */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }} />
        </div>

        {/* ── Username Badge (on banner) ── */}
        <div style={{
          position: 'absolute',
          top: 56,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
        }}>
          <div style={{
            padding: '5px 16px',
            borderRadius: 20,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: '#22C55E', letterSpacing: 0.5,
            }}>
              @{userInfo?.name || 'Champion'}
            </span>
          </div>
        </div>

        {/* ── Avatar (overlapping banner bottom) ── */}
        <div style={{
          position: 'absolute',
          bottom: -48,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
        }}>
          <div style={{
            position: 'relative', width: 96, height: 96,
          }}>
            {/* Border ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: borderGrad, padding: 3,
              boxShadow: hasBorder
                ? `0 0 20px ${borderGlow}, 0 0 40px ${borderGlow}`
                : '0 0 20px rgba(200,168,78,0.2)',
              animation: borderConfig?.animated ? 'border-pulse 2s ease-in-out infinite' : 'none',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#000' }} />
            </div>
            {/* Avatar image */}
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
        </div>

        {/* ── Stat Boxes (flanking avatar) ── */}
        {/* Left: Streak */}
        <div style={{
          position: 'absolute',
          bottom: -38,
          left: 20,
          zIndex: 3,
        }}>
          <div style={{
            width: 80, padding: '10px 0',
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontSize: 20, fontWeight: 800, color: '#fff',
            }}>
              <Flame size={16} color="#F97316" />
              {streak}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(249,115,22,0.8)',
              letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2,
            }}>STREAK</div>
          </div>
        </div>

        {/* Right: Scans */}
        <div style={{
          position: 'absolute',
          bottom: -38,
          right: 20,
          zIndex: 3,
        }}>
          <div style={{
            width: 80, padding: '10px 0',
            borderRadius: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              fontSize: 20, fontWeight: 800, color: '#fff',
            }}>
              <ScanLine size={15} color="#EF4444" />
              {scanCount}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(239,68,68,0.8)',
              letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2,
            }}>SCANS</div>
          </div>
        </div>
      </div>

      {/* ── Spacer for avatar overflow ── */}
      <div style={{ height: 56 }} />

      {/* ── Email under avatar ── */}
      <div style={{ textAlign: 'center', marginBottom: 16, padding: '0 20px' }}>
        <div className="label" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          fontSize: 11, opacity: 0.6,
        }}>
          <Mail size={11} /> {userInfo?.email || '...'}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ POTENTIAL GRAPH (Blue Box) ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          padding: '16px 14px 14px',
          borderRadius: 16,
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
          textAlign: 'center',
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'rgba(96,165,250,0.8)',
            marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5,
          }}>
            Your Potential Distribution
          </div>
          {scores ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#60A5FA', lineHeight: 1 }}>
                {potentialScore}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(96,165,250,0.6)', marginBottom: 8, letterSpacing: 1.5, fontWeight: 600 }}>
                POTENTIAL SCORE
              </div>
              <BellCurve score={potentialScore} />
            </div>
          ) : (
            <div style={{ padding: 20, color: 'rgba(96,165,250,0.5)', fontSize: 13 }}>
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
    </div>
  );
}
