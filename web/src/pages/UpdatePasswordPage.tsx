import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/api';

export default function UpdatePasswordPage({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    if (!password) { setError('Please enter a new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(() => onComplete(), 2000);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon-ring success">
            <CheckCircle size={32} color="#22C55E" />
          </div>
          <div className="h1" style={{ marginBottom: 8 }}>Password Updated!</div>
          <div className="label" style={{ maxWidth: 280, lineHeight: 1.6, textAlign: 'center' }}>
            Your password has been successfully changed. Redirecting you now...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon-ring">
          <Lock size={28} color="var(--primary)" />
        </div>
        <div className="h1" style={{ marginBottom: 4 }}>Set New Password</div>
        <div className="label" style={{ marginBottom: 20 }}>Enter your new password below</div>

        {error && <div className="auth-error">{error}</div>}

        {/* New Password */}
        <div className="input-group">
          <Lock size={16} className="input-icon" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
          />
          <button className="pw-toggle" onClick={() => setShowPw(!showPw)} type="button">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <Lock size={16} className="input-icon" />
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="auth-input"
            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
