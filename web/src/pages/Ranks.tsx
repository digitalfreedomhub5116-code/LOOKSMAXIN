import { Trophy, Lock } from 'lucide-react';

export default function Ranks() {
  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Ranks</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Compete & climb the leaderboard</div>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(200,168,78,0.08)', border: '2px solid rgba(200,168,78,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Trophy size={36} color="var(--primary)" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Coming Soon</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 20px' }}>
          Compete with others, earn ranks, and climb the leaderboard based on your exercise streaks and scan improvements.
        </p>

        {/* Preview Ranks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {[
            { rank: 'Bronze', icon: '🥉', xp: '0 - 500 XP' },
            { rank: 'Silver', icon: '🥈', xp: '500 - 1500 XP' },
            { rank: 'Gold', icon: '🥇', xp: '1500 - 3000 XP' },
            { rank: 'Platinum', icon: '💎', xp: '3000 - 5000 XP' },
            { rank: 'Lynx Elite', icon: '🐆', xp: '5000+ XP' },
          ].map((r) => (
            <div key={r.rank} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              opacity: 0.5,
            }}>
              <span style={{ fontSize: 24 }}>{r.icon}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{r.rank}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.xp}</div>
              </div>
              <Lock size={14} color="var(--text-disabled)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
