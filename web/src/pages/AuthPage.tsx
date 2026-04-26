import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/api';

type Mode = 'login' | 'signup' | 'verify' | 'forgot';

export default function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ─── Email + Password Login ───
  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onAuth();
    }
  };

  // ─── Email + Password Signup ───
  const handleSignup = async () => {
    if (!email || !password || !name) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setMode('verify');
    }
  };

  // ─── Google OAuth ───
  const handleGoogle = async () => {
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ─── Forgot Password ───
  const handleForgot = async () => {
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?reset=true`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setMessage('Password reset link sent to your email!');
    }
  };

  // ─── Verification Sent Screen ───
  if (mode === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon-ring success">
            <Mail size={32} color="#22C55E" />
          </div>
          <div className="h1" style={{ marginBottom: 8 }}>Check Your Email</div>
          <div className="label" style={{ maxWidth: 280, lineHeight: 1.6, textAlign: 'center' }}>
            We sent a verification link to<br />
            <strong style={{ color: 'var(--text)' }}>{email}</strong><br />
            Click the link to verify your account.
          </div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setMode('login'); setMessage('Account created! Log in after verifying.'); }}>
              Back to Login
            </button>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={handleSignup}>
              Resend Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Forgot Password Screen ───
  if (mode === 'forgot') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon-ring">
            <Lock size={28} color="var(--primary)" />
          </div>
          <div className="h1" style={{ marginBottom: 4 }}>Reset Password</div>
          <div className="label" style={{ marginBottom: 20 }}>Enter your email to receive a reset link</div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <div className="input-group">
            <Mail size={16} className="input-icon" />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} className="auth-input" />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            onClick={handleForgot} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="auth-switch" style={{ marginTop: 16 }}>
            <span className="label">Remember your password?</span>
            <button className="auth-link" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>
              Log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Login / Signup Screen ───
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-icon-ring">
          <Sparkles size={28} color="var(--primary)" />
        </div>
        <div className="h1" style={{ marginBottom: 2 }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </div>
        <div className="label" style={{ marginBottom: 24 }}>
          {mode === 'login' ? 'Log in to your Lynx AI account' : 'Start your glow up journey'}
        </div>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        {/* Google OAuth */}
        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Name (signup only) */}
        {mode === 'signup' && (
          <div className="input-group">
            <User size={16} className="input-icon" />
            <input type="text" placeholder="Display name" value={name}
              onChange={e => setName(e.target.value)} className="auth-input" />
          </div>
        )}

        {/* Email */}
        <div className="input-group">
          <Mail size={16} className="input-icon" />
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} className="auth-input"
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} />
        </div>

        {/* Password */}
        <div className="input-group">
          <Lock size={16} className="input-icon" />
          <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} className="auth-input"
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} />
          <button className="pw-toggle" onClick={() => setShowPw(!showPw)} type="button">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Forgot password (login only) */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 4 }}>
            <button className="auth-link" style={{ fontSize: 12 }}
              onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}>
          {loading ? 'Please wait...' : (
            <>{mode === 'login' ? 'Log In' : 'Create Account'} <ArrowRight size={16} /></>
          )}
        </button>

        {/* Switch mode */}
        <div className="auth-switch">
          <span className="label">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button className="auth-link" onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(''); setMessage('');
          }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
