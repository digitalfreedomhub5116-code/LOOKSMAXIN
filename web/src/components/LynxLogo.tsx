/**
 * LynxLogo — Premium LYNX AI brand mark.
 * Golden chat-bubble icon + "LYNX" (gold) + "AI" (white/silver)
 */
export default function LynxLogo({ size = 28 }: { size?: number }) {
  const iconSize = size;
  const fontSize = size * 0.72;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
      {/* Chat bubble icon with eyes */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
        {/* Glow filter */}
        <defs>
          <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5D76E" />
            <stop offset="50%" stopColor="#C8A84E" />
            <stop offset="100%" stopColor="#B8960C" />
          </linearGradient>
        </defs>
        {/* Speech bubble body */}
        <path
          d="M5 8C5 5.8 6.8 4 9 4H23C25.2 4 27 5.8 27 8V18C27 20.2 25.2 22 23 22H14L9 27V22H9C6.8 22 5 20.2 5 18V8Z"
          fill="url(#logo-grad)"
          filter="url(#logo-glow)"
        />
        {/* Eyes — two rounded rects like the reference */}
        <rect x="10.5" y="10" width="4" height="5.5" rx="2" fill="#1a1a0a" />
        <rect x="17.5" y="10" width="4" height="5.5" rx="2" fill="#1a1a0a" />
        {/* Eye shine */}
        <circle cx="12" cy="11.5" r="0.8" fill="rgba(255,255,255,0.6)" />
        <circle cx="19" cy="11.5" r="0.8" fill="rgba(255,255,255,0.6)" />
      </svg>

      {/* Text */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, userSelect: 'none' }}>
        <span style={{
          fontSize,
          fontWeight: 900,
          color: '#C8A84E',
          letterSpacing: 2,
          lineHeight: 1,
          textShadow: '0 0 12px rgba(200,168,78,0.4)',
        }}>
          LYNX
        </span>
        <span style={{
          fontSize,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 1,
          lineHeight: 1,
        }}>
          AI
        </span>
      </div>
    </div>
  );
}
