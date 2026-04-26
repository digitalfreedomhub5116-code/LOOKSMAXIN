import { User, Settings, ChevronRight, Star, BarChart3, Shield, LogOut } from 'lucide-react';

const MENU = [
  { icon: <BarChart3 size={18} />, label: 'Advanced Stats', sub: 'Detailed analytics' },
  { icon: <Star size={18} />, label: 'Achievements', sub: '4 badges earned' },
  { icon: <Shield size={18} />, label: 'Privacy & Security', sub: 'Manage your data' },
  { icon: <Settings size={18} />, label: 'Preferences', sub: 'Theme, notifications' },
];

export default function Profile() {
  return (
    <div className="page">
      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', border: '2px solid rgba(142,161,188,0.3)',
          boxShadow: '0 0 20px var(--primary-glow)',
        }}>
          <User size={32} color="#fff" />
        </div>
        <div className="h1" style={{ marginBottom: 2 }}>Champion</div>
        <div className="label">Level 3 • 125 XP</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>12</div>
            <div className="label">Scans</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)', height: 32 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>3</div>
            <div className="label">Streak</div>
          </div>
          <div style={{ width: 1, background: 'var(--border-subtle)', height: 32 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>+8</div>
            <div className="label">Progress</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MENU.map((item, i) => (
          <div className="glass" key={i} style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          }}>
            <div style={{ color: 'var(--primary)' }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
              <div className="label" style={{ marginTop: 1 }}>{item.sub}</div>
            </div>
            <ChevronRight size={16} color="var(--text-disabled)" />
          </div>
        ))}
      </div>

      {/* Logout */}
      <button className="btn btn-outline" style={{
        width: '100%', justifyContent: 'center', marginTop: 24, color: 'var(--error)',
        borderColor: 'rgba(239,68,68,0.2)',
      }}>
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}
