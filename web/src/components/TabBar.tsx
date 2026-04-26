import type { Tab } from '../App';
import { Grid3x3, Map, Library, User } from 'lucide-react';

const tabs: { id: Tab; icon: typeof Grid3x3; label: string; center?: boolean }[] = [
  { id: 'dashboard', icon: Grid3x3, label: 'Dashboard' },
  { id: 'roadmap', icon: Map, label: 'Roadmap' },
  { id: 'lynx', icon: Grid3x3, label: '', center: true },
  { id: 'vault', icon: Library, label: 'Vault' },
  { id: 'profile', icon: User, label: 'Profile' },
];

/* Chat bubble icon matching the reference */
function LynxBubbleIcon() {
  return (
    <div className="lynx-icon-wrap">
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chat bubble shape */}
        <path
          d="M20 4C10.06 4 2 10.72 2 19c0 4.52 2.44 8.58 6.28 11.38L6 36l7.12-3.56C15 33.16 17.44 33.6 20 33.6c9.94 0 18-6.32 18-14.6S29.94 4 20 4z"
          fill="url(#bubbleGrad)"
        />
        {/* Glossy highlight */}
        <ellipse cx="18" cy="12" rx="12" ry="6" fill="rgba(255,255,255,0.18)" />
        {/* Left pill */}
        <rect x="14" y="13" width="4.5" height="12" rx="2.25" fill="white" />
        {/* Right pill */}
        <rect x="21.5" y="13" width="4.5" height="12" rx="2.25" fill="white" />
        <defs>
          <linearGradient id="bubbleGrad" x1="2" y1="4" x2="38" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5BA3F5" />
            <stop offset="0.5" stopColor="#4A8FEF" />
            <stop offset="1" stopColor="#3B6FD4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        t.center ? (
          <button key={t.id} className="tab-center" onClick={() => onChange(t.id)}>
            <LynxBubbleIcon />
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

