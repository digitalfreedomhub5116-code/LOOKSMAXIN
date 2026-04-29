/**
 * LynxLogo — Premium LYNX AI brand mark.
 * Golden chat-bubble icon + "LYNX" (gold) + "AI" (white/silver)
 */
export default function LynxLogo({ size = 28 }: { size?: number }) {
  const iconSize = size;
  const fontSize = size * 0.72;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3 }}>
      {/* Custom app icon */}
      <img src="/lynxicon.jpeg" alt="Lynx" style={{ width: iconSize, height: iconSize, borderRadius: '25%', objectFit: 'cover' }} />

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
