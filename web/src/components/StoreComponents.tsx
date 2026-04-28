/**
 * Lynx Store Components — Reusable SVG/CSS building blocks.
 * LynxCoin icon, BorderRing preview, TitleBadge.
 */
import type { BorderConfig, TitleConfig } from '../data/storeItems';

/* ═══ Lynx Coin Icon ═══ */
export function LynxCoin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coinGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D4B04A" />
          <stop offset="0.5" stopColor="#C8A84E" />
          <stop offset="1" stopColor="#A08030" />
        </linearGradient>
        <linearGradient id="coinHighlight" x1="10" y1="5" x2="30" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" fill="url(#coinGrad)" />
      {/* Inner rim */}
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Highlight arc */}
      <ellipse cx="18" cy="12" rx="10" ry="5" fill="url(#coinHighlight)" />
      {/* L monogram */}
      <text x="20" y="26" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="16" fontWeight="900" fill="#1a1200">
        L
      </text>
    </svg>
  );
}

/* ═══ Border Ring Preview ═══ */
export function BorderRing({ config, size = 64 }: { config: BorderConfig; size?: number }) {
  const r = size / 2 - config.strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
  const gradId = `border-${config.colors.join('-').replace(/[^a-zA-Z0-9]/g, '')}`;

  const animationStyle: React.CSSProperties = {};
  if (config.animated) {
    switch (config.animationType) {
      case 'rotate':
        animationStyle.animation = 'borderRotate 3s linear infinite';
        break;
      case 'pulse':
        animationStyle.animation = 'borderPulse 2s ease-in-out infinite';
        break;
      case 'dash':
        animationStyle.animation = 'borderDash 2s linear infinite';
        break;
      case 'shimmer':
        animationStyle.animation = 'borderShimmer 2.5s ease-in-out infinite';
        break;
      case 'hue-rotate':
        animationStyle.animation = 'borderHueRotate 4s linear infinite';
        break;
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={animationStyle}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2={String(size)} y2={String(size)} gradientUnits="userSpaceOnUse">
          {config.colors.map((c, i) => (
            <stop key={i} offset={`${(i / Math.max(config.colors.length - 1, 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      {/* Glow */}
      {config.glowColor && (
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={config.glowColor} strokeWidth={6} opacity={config.glowIntensity || 0.3} />
      )}
      {/* Ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={config.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={config.animated && config.animationType === 'dash' ? '8 4' : undefined}
      />
      {/* User icon placeholder */}
      <circle cx={cx} cy={cy} r={r - 6} fill="rgba(255,255,255,0.05)" />
      <circle cx={cx} cy={cy - 2} r={6} fill="rgba(255,255,255,0.15)" />
      <path
        d={`M ${cx - 10} ${cy + 14} Q ${cx - 10} ${cy + 4}, ${cx} ${cy + 4} Q ${cx + 10} ${cy + 4}, ${cx + 10} ${cy + 14}`}
        fill="rgba(255,255,255,0.1)"
      />
    </svg>
  );
}

/* ═══ Title Badge ═══ */
export function TitleBadge({ name, config, size = 'normal' }: { name: string; config: TitleConfig; size?: 'small' | 'normal' }) {
  const isSmall = size === 'small';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: isSmall ? 9 : 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      padding: isSmall ? '2px 6px' : '3px 10px',
      borderRadius: 6,
      color: config.color,
      background: config.bgColor,
      border: `1px solid ${config.borderColor}`,
      boxShadow: config.glow ? `0 0 8px ${config.borderColor}` : 'none',
    }}>
      {name}
    </span>
  );
}

/* ═══ Theme Swatch Card ═══ */
export function ThemeSwatch({ themeVars, size = 'normal' }: { themeVars: Record<string, string>; size?: 'small' | 'normal' }) {
  const primary = themeVars['--primary'] || '#C8A84E';
  const surface = themeVars['--surface'] || '#1a1a1a';
  const bg = themeVars['--bg'] || '#111';
  const h = size === 'small' ? 32 : 48;

  return (
    <div style={{
      width: '100%', height: h, borderRadius: 8, overflow: 'hidden',
      display: 'flex', position: 'relative',
    }}>
      <div style={{ flex: 1, background: bg }} />
      <div style={{ flex: 1, background: surface }} />
      <div style={{ flex: 1, background: `linear-gradient(135deg, ${primary}, ${surface})` }} />
      {/* Accent dot */}
      <div style={{
        position: 'absolute', bottom: 6, right: 8,
        width: 12, height: 12, borderRadius: '50%',
        background: primary, border: '2px solid rgba(255,255,255,0.2)',
      }} />
    </div>
  );
}
