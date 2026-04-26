import type { Tab } from '../App';
import { Grid3x3, Map, Library, User } from 'lucide-react';

const tabs: { id: Tab; icon: typeof Grid3x3; label: string; center?: boolean }[] = [
  { id: 'dashboard', icon: Grid3x3, label: 'Dashboard' },
  { id: 'roadmap', icon: Map, label: 'Roadmap' },
  { id: 'lynx', icon: Grid3x3, label: '', center: true },
  { id: 'vault', icon: Library, label: 'Vault' },
  { id: 'profile', icon: User, label: 'Profile' },
];

/* Lynx chat bubble mascot
   animated = true  → navbar version with look-around + blink loop
   animated = false → static version for headers/empty state/bubbles */
export function LynxBubbleIcon({ size = 34, animated = false }: { size?: number; animated?: boolean }) {
  const s = size;
  const vb = 40;
  const eyeW = s > 30 ? 4.5 : 3.5;
  const eyeH = s > 30 ? 12 : 9;
  const eyeRx = eyeW / 2;
  const eyeClass = animated ? 'lynx-eye-nav' : 'lynx-eye-static';

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${vb} ${vb}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="lynx-bubble-svg"
    >
      {/* Chat bubble body */}
      <path
        d="M20 4C10.06 4 2 10.72 2 19c0 4.52 2.44 8.58 6.28 11.38L6 36l7.12-3.56C15 33.16 17.44 33.6 20 33.6c9.94 0 18-6.32 18-14.6S29.94 4 20 4z"
        fill="url(#bubbleGrad)"
      />
      {/* Glossy top highlight */}
      <ellipse cx="17" cy="11" rx="11" ry="5" fill="rgba(255,255,255,0.15)" />
      {/* Left eye */}
      <rect className={eyeClass} x="14" y="13" width={eyeW} height={eyeH} rx={eyeRx} fill="white" />
      {/* Right eye */}
      <rect className={eyeClass} x="21.5" y="13" width={eyeW} height={eyeH} rx={eyeRx} fill="white" />
      <defs>
        <linearGradient id="bubbleGrad" x1="2" y1="4" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        t.center ? (
          <button key={t.id} className="tab-center" onClick={() => onChange(t.id)}>
            <div className="lynx-icon-wrap">
              <LynxBubbleIcon size={34} animated />
            </div>
          </button>
        ) : (
          <button
            key={t.id}
            className={`tab-item ${active === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <t.icon size={22} />
            <span>{t.label}</span>
            {active === t.id && <span className="dot" />}
          </button>
        )
      ))}
    </nav>
  );
}
