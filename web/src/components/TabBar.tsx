import type { Tab } from '../App';
import { Grid3x3, Map, Sparkles, Library, User } from 'lucide-react';

const tabs: { id: Tab; icon: typeof Grid3x3; label: string; center?: boolean }[] = [
  { id: 'dashboard', icon: Grid3x3, label: 'Dashboard' },
  { id: 'roadmap', icon: Map, label: 'Roadmap' },
  { id: 'lynx', icon: Sparkles, label: '', center: true },
  { id: 'vault', icon: Library, label: 'Vault' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tab-bar">
      {tabs.map(t => (
        t.center ? (
          <button key={t.id} className="tab-center" onClick={() => onChange(t.id)}>
            <t.icon size={26} color="#fff" />
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
