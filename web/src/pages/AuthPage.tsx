import { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, ChevronLeft, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/api';
import { Capacitor } from '@capacitor/core';

type Mode = 'splash' | 'login' | 'signup' | 'verify' | 'forgot';

/* ═══ Styles ═══ */
const S = {
  page: {
    minHeight: '100vh', background: '#0A0A0F',
    display: 'flex', flexDirection: 'column' as const,
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: '#fff', overflow: 'hidden',
  },
  input: {
    width: '100%', padding: '14px 16px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, fontSize: 15,
    color: '#fff', outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    borderColor: '#FBBF24',
  },
  label: {
    fontSize: 13, fontWeight: 600 as const,
    color: '#fff', marginBottom: 6,
    display: 'block' as const,
  },
  btnPrimary: {
    width: '100%', padding: '16px 0',
    background: '#FBBF24', border: 'none',
    borderRadius: 14, fontSize: 16,
    fontWeight: 700 as const, color: '#0A0A0F',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    gap: 8, transition: 'transform 0.15s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(251,191,36,0.3)',
  },
  btnGoogle: {
    width: '100%', padding: '14px 0',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12, fontSize: 14,
    fontWeight: 600 as const, color: '#fff',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center' as const, justifyContent: 'center' as const,
    gap: 10, transition: 'background 0.2s',
  },
  sub: {
    fontSize: 12, letterSpacing: 2,
    fontWeight: 700 as const, textTransform: 'uppercase' as const,
    color: '#FBBF24', marginBottom: 8,
  },
  heading: {
    fontSize: 30, fontWeight: 800 as const,
    lineHeight: 1.15, marginBottom: 16,
    letterSpacing: -0.5,
  },
  link: {
    background: 'none', border: 'none',
    color: '#FBBF24', fontWeight: 700 as const,
    cursor: 'pointer', fontSize: 14,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10, padding: '10px 14px',
    fontSize: 13, color: '#EF4444',
    marginBottom: 12,
  },
  success: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 10, padding: '10px 14px',
    fontSize: 13, color: '#22C55E',
    marginBottom: 12,
  },
  backBtn: {
    position: 'absolute' as const, top: 16, left: 16,
    background: 'none', border: 'none',
    color: '#fff', cursor: 'pointer',
    padding: 8, borderRadius: 8,
    display: 'flex', alignItems: 'center' as const,
  },
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<Mode>('splash');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else onAuth();
  };

  const handleSignup = async () => {
    if (!email || !password || !name) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setMode('verify');
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');

    if (Capacitor.isNativePlatform()) {
      // Native Google Sign-In using Capgo plugin
      try {
        const { SocialLogin } = await import('@capgo/capacitor-social-login');

        // Initialize Google provider
        await SocialLogin.initialize({
          google: {
            webClientId: '20910572316-4d14c6df8bocnkt032m020vt0bavahlo.apps.googleusercontent.com',
          },
        });

        // Trigger native Google account picker
        const result = await SocialLogin.login({
          provider: 'google',
          options: {},
        });

        // GoogleLoginResponse is a union: Online (has idToken) | Offline (has serverAuthCode)
        const googleResult = result?.result as any;
        const idToken = googleResult?.idToken;
        if (!idToken) {
          setError('Google sign-in failed — no token received');
          setLoading(false);
          return;
        }

        // Use token to sign in to Supabase
        const { error: sbError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (sbError) {
          setError(sbError.message);
          setLoading(false);
        }
        // If success, onAuthStateChange in App.tsx will handle the rest
      } catch (e: any) {
        console.error('[GoogleAuth] Error:', e);
        setError(e?.message || 'Google sign-in failed');
        setLoading(false);
      }
    } else {
      // On web: normal redirect
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (err) { setError(err.message); setLoading(false); }
    }
  };

  const handleForgot = async () => {
    if (!email) { setError('Enter your email address'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?reset=true`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setMessage('Password reset link sent to your email!');
  };

  const goTo = (m: Mode) => { setMode(m); setError(''); setMessage(''); };

  /* ═══════════════════════════════════════════════ */
  /* ═══ SPLASH SCREEN ═══ */
  /* ═══════════════════════════════════════════════ */
  if (mode === 'splash') {
    return (
      <div style={{ ...S.page, justifyContent: 'space-between', padding: '0 28px' }}>
        {/* Logo */}
        <div style={{ paddingTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={24} color="#FBBF24" />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 1 }}>LYNX<span style={{ color: '#FBBF24' }}>AI</span></span>
        </div>

        {/* Face Image */}
        <div style={{
          display: 'flex', justifyContent: 'center', margin: '-20px 0 -10px',
        }}>
          <img src="/splash-face.webp" alt="" style={{
            width: 220, height: 220, objectFit: 'cover', objectPosition: 'top',
            borderRadius: '50%',
            mask: 'radial-gradient(circle, #000 50%, transparent 80%)',
            WebkitMask: 'radial-gradient(circle, #000 50%, transparent 80%)',
            opacity: 0.85,
          }} />
        </div>

        {/* Text */}
        <div>
          <div style={S.sub}>AI-POWERED LOOKSMAXING</div>
          <h1 style={{ ...S.heading, fontSize: 34 }}>
            Unlock your<br />max potential.
          </h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, maxWidth: 320, marginBottom: 32,
          }}>
            Scan your face. Get elite-tier ratings, a tailored
            Lynx Report, and a Duolingo-style path to your
            looksmax ceiling.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ paddingBottom: 36 }}>
          <button style={S.btnPrimary} onClick={() => goTo('signup')}>
            Begin Ascension <ArrowRight size={18} />
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button style={{ ...S.link, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
              onClick={() => goTo('login')}>
              I already have an account
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ VERIFY EMAIL ═══ */
  /* ═══════════════════════════════════════════════ */
  if (mode === 'verify') {
    return (
      <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center', padding: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}>
          <Mail size={28} color="#22C55E" />
        </div>
        <h1 style={{ ...S.heading, textAlign: 'center', fontSize: 26 }}>Check Your Email</h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, maxWidth: 280, marginBottom: 28 }}>
          We sent a verification link to<br />
          <strong style={{ color: '#fff' }}>{email}</strong><br />
          Click the link to verify your account.
        </p>
        <button style={{ ...S.btnPrimary, maxWidth: 300 }}
          onClick={() => { goTo('login'); setMessage('Account created! Log in after verifying.'); }}>
          Back to Login
        </button>
        <button style={{ ...S.link, marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
          onClick={handleSignup}>
          Resend Email
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ FORGOT PASSWORD ═══ */
  /* ═══════════════════════════════════════════════ */
  if (mode === 'forgot') {
    return (
      <div style={{ ...S.page, padding: '0 28px', position: 'relative' }}>
        <button style={S.backBtn} onClick={() => goTo('login')}>
          <ChevronLeft size={22} />
        </button>
        <div style={{ paddingTop: 70 }}>
          <div style={S.sub}>RESET PASSWORD</div>
          <h1 style={S.heading}>Forgot your<br />password?</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
            Enter your email to receive a reset link
          </p>

          {error && <div style={S.error}>{error}</div>}
          {message && <div style={S.success}>{message}</div>}

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email</label>
            <input type="email" placeholder="you@elite.com" value={email}
              onChange={e => setEmail(e.target.value)} style={S.input} />
          </div>

          <button style={S.btnPrimary} onClick={handleForgot} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Remember your password? </span>
            <button style={S.link} onClick={() => goTo('login')}>Log in</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════ */
  /* ═══ LOGIN / SIGNUP ═══ */
  /* ═══════════════════════════════════════════════ */
  const isSignup = mode === 'signup';

  return (
    <div style={{ ...S.page, padding: '0 28px', position: 'relative' }}>
      <button style={S.backBtn} onClick={() => goTo('splash')}>
        <ChevronLeft size={22} />
      </button>

      <div style={{ paddingTop: 70, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={S.sub}>JOIN LYNXAI</div>
        <h1 style={S.heading}>
          {isSignup ? <>Create your<br />ascension profile.</> : <>Welcome back,<br />champion.</>}
        </h1>

        {error && <div style={S.error}>{error}</div>}
        {message && <div style={S.success}>{message}</div>}

        {/* Google */}
        <button style={S.btnGoogle} onClick={handleGoogle} disabled={loading}>
          <GoogleIcon /> Continue with Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '18px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Name (signup only) */}
        {isSignup && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Full name</label>
            <input type="text" placeholder="John Maxxed" value={name}
              onChange={e => setName(e.target.value)} style={S.input} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Email</label>
          <input type="email" placeholder="you@elite.com" value={email}
            onChange={e => setEmail(e.target.value)} style={S.input}
            onKeyDown={e => e.key === 'Enter' && (isSignup ? handleSignup() : handleLogin())} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14, position: 'relative' }}>
          <label style={S.label}>Password</label>
          <input type={showPw ? 'text' : 'password'} placeholder="6+ characters" value={password}
            onChange={e => setPassword(e.target.value)} style={S.input}
            onKeyDown={e => e.key === 'Enter' && (isSignup ? handleSignup() : handleLogin())} />
          <button onClick={() => setShowPw(!showPw)} type="button" style={{
            position: 'absolute', right: 14, top: 34,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
          }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Forgot (login only) */}
        {!isSignup && (
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <button style={{ ...S.link, fontSize: 12 }} onClick={() => goTo('forgot')}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <div style={{ marginTop: 'auto', paddingBottom: 36, paddingTop: 16 }}>
          <button style={S.btnPrimary} onClick={isSignup ? handleSignup : handleLogin} disabled={loading}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button style={S.link} onClick={() => goTo(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
