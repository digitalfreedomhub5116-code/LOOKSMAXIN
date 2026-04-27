import { useState, useEffect } from 'react';
import { User, Settings, ChevronRight, Star, BarChart3, Shield, LogOut, Mail } from 'lucide-react';
import { supabase, getScanCount } from '../lib/api';

const MENU = [
  { icon: <BarChart3 size={18} />, label: 'Advanced Stats', sub: 'Detailed analytics' },
  { icon: <Star size={18} />, label: 'Achievements', sub: 'Badges earned' },
  { icon: <Shield size={18} />, label: 'Privacy & Security', sub: 'Manage your data' },
  { icon: <Settings size={18} />, label: 'Preferences', sub: 'Theme, notifications' },
];

interface UserInfo {
  email: string;
  name: string;
  avatar?: string;
}

export default function Profile({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Helper to set user from a Supabase User object
    const setFromUser = (u: any) => {
      if (!u) return;
      setUser({
        email: u.email || '',
        name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'Champion',
        avatar: u.user_metadata?.avatar_url,
      });
    };

    // Read session from localStorage (instant, no network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setFromUser(session.user);
    });

    // Subscribe to auth changes so Profile updates if token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setFromUser(session.user);
    });

    setScanCount(getScanCount());

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await onLogout();
    } catch {
      // Force logout even if everything fails
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="page">
      {/* Avatar */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        {user?.avatar ? (
          <img src={user.avatar} alt="Avatar" style={{
            width: 80, height: 80, borderRadius: '50%',
            border: '2px solid rgba(142,161,188,0.3)',
            boxShadow: '0 0 20px var(--primary-glow)',
            margin: '0 auto 14px', display: 'block', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', border: '2px solid rgba(142,161,188,0.3)',
            boxShadow: '0 0 20px var(--primary-glow)',
          }}>
            <User size={32} color="#fff" />
          </div>
        )}
        <div className="h1" style={{ marginBottom: 2 }}>{user?.name || 'Champion'}</div>
        <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Mail size={12} /> {user?.email || '...'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{scanCount}</div>
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
      <button className="btn btn-outline" onClick={handleLogout} disabled={loggingOut} style={{
        width: '100%', justifyContent: 'center', marginTop: 24, color: 'var(--error)',
        borderColor: 'rgba(239,68,68,0.2)', opacity: loggingOut ? 0.5 : 1,
      }}>
        <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
