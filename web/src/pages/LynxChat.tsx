import { Sparkles, Zap, Shield, Brain } from 'lucide-react';

const SUGGESTIONS = [
  { icon: <Zap size={15} />, text: "What's my best feature?" },
  { icon: <Shield size={15} />, text: 'Build a skincare routine' },
  { icon: <Brain size={15} />, text: 'How to improve jawline?' },
];

export default function LynxChat() {
  return (
    <div className="page">
      <div className="chat-hero">
        <div className="lynx-blob">
          <Sparkles size={44} color="rgba(255,255,255,0.92)" />
        </div>

        <div className="h1" style={{ marginBottom: 6 }}>Meet Lynx</div>
        <div className="label" style={{ maxWidth: 260, margin: '0 auto' }}>
          Your AI-powered glow up companion. Ask me anything about self-improvement.
        </div>

        {/* Status dot */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
          marginTop: 16,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
            boxShadow: '0 0 6px rgba(34,197,94,0.7)',
          }} />
          <span className="label">Online • Ready to help</span>
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="label-xs" style={{ marginBottom: 4 }}>SUGGESTED</div>
        {SUGGESTIONS.map((s, i) => (
          <div className="glass suggestion-chip" key={i}>
            <span style={{ color: 'var(--primary)', marginRight: 8 }}>{s.icon}</span>
            {s.text}
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div style={{
        marginTop: 40, textAlign: 'center',
        padding: 20, background: 'rgba(142,161,188,0.05)', borderRadius: 16,
        border: '1px dashed rgba(142,161,188,0.15)',
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
        <div className="h3" style={{ color: 'var(--text-muted)' }}>Chat coming soon</div>
        <div className="label" style={{ marginTop: 4 }}>Full AI chat in the next update</div>
      </div>
    </div>
  );
}
