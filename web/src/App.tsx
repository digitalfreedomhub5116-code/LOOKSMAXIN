import { useState, useEffect, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Programs from './pages/Programs';
import Ranks from './pages/Ranks';
import Store from './pages/Store';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import RemediesPage from './pages/RemediesPage';
import { ReportsPage } from './pages/ReportsGrid';
import AuthPage from './pages/AuthPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import TabBar, { LynxBubbleIcon } from './components/TabBar';
import TopNavbar from './components/TopNavbar';
import { supabase, saveScores, loadLatestScores, loadFaceImage } from './lib/api';
import { pullFromCloud, pushToCloud, retryPendingUploads, setActiveUserId } from './lib/sync';
import { claimDailyLogin, recordStreakActivity, applyThemeVars, getEquipped } from './lib/economy';
import { getItemById } from './data/storeItems';
import { registerDeviceSession, startSessionGuard, stopSessionGuard, clearDeviceToken } from './lib/sessionGuard';
import type { FaceScores } from './lib/api';

export type Tab = 'dashboard' | 'programs' | 'ranks' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);
  // Chat states: 'closed' | 'opening' | 'open' | 'closing'
  const [chatState, setChatState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [latestScores, setLatestScores] = useState<FaceScores | null>(() => loadLatestScores());
  const [faceImage, setFaceImage] = useState<string | null>(() => loadFaceImage());
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const chatTimerRef = useRef<number>(0);
  const [showRemedies, setShowRemedies] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const [openPlans, setOpenPlans] = useState(false);

  const handlePlanClick = () => {
    setTab('vault');
    setOpenPlans(true);
  };

  // Apply equipped theme on app init
  useEffect(() => {
    const equipped = getEquipped();
    const themeItem = equipped.theme ? getItemById(equipped.theme) : null;
    applyThemeVars(themeItem?.themeVars || null);
  }, []);

  // Flush pending sync data before page unload (tab close, refresh, navigate away)
  useEffect(() => {
    const handleUnload = () => {
      // Fire-and-forget — browser may kill it, that's OK
      try { pushToCloud(); } catch {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // ═══ Single source of truth for auth state ═══
  useEffect(() => {
    // Safety timeout: if auth check takes too long, force to login page
    const safetyTimer = setTimeout(() => {
      setAuthed(prev => {
        if (prev === null) {
          console.warn('[Auth] Timeout — forcing to login');
          return false;
        }
        return prev;
      });
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(safetyTimer);
      console.log(`[Auth] Event: ${event}, Has session: ${!!session}, User: ${session?.user?.email || 'none'}`);

      if (event === 'INITIAL_SESSION') {
        // First event on page load — determines if user is logged in
        if (session) {
          console.log('[Auth] ✅ Valid session found on load');
          setAuthed(true);
          setSessionUser(session.user);
          accessTokenRef.current = session.access_token;
          setActiveUserId(session.user.id);
          // Register this device and start session guard
          await registerDeviceSession();
          startSessionGuard();
          try {
            await pullFromCloud(session.user.id);
            setLatestScores(loadLatestScores());
            setFaceImage(loadFaceImage());
            console.log('[Auth] Post-pull state:', {
              hasScores: !!loadLatestScores(),
              hasFace: !!loadFaceImage(),
            });
            retryPendingUploads().catch(() => {});
            claimDailyLogin();
            recordStreakActivity();
          } catch (e) {
            console.warn('[Auth] Cloud pull failed:', e);
          }
        } else {
          console.log('[Auth] ❌ No session on load — showing login');
          setAuthed(false);
        }
        return;
      }

      if (event === 'SIGNED_IN') {
        setAuthed(true);
        setSessionUser(session?.user || null);
        accessTokenRef.current = session?.access_token || null;
        setActiveUserId(session?.user?.id || null);
        // Register this device as the active one
        await registerDeviceSession();
        startSessionGuard();
        try {
          await pullFromCloud(session?.user?.id);
          setLatestScores(loadLatestScores());
          setFaceImage(loadFaceImage());
          console.log('[Auth] Post-pull state (SIGNED_IN):', {
            hasScores: !!loadLatestScores(),
            hasFace: !!loadFaceImage(),
          });
          retryPendingUploads().catch(() => {});
        } catch {}
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setAuthed(true);
        accessTokenRef.current = session?.access_token || null;
        return;
      }

      if (event === 'SIGNED_OUT') {
        stopSessionGuard();
        clearDeviceToken();
        setActiveUserId(null);
        setAuthed(false);
        setSessionUser(null);
        setLatestScores(null);
        setFaceImage(null);
        setTab('dashboard');
        setChatState('closed');
        setShowRemedies(false);
        setShowReports(false);
        setScanning(false);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
        return;
      }

      // Any other event: just sync auth state
      setAuthed(!!session);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      stopSessionGuard();
    };
  }, []);

  const handleScanResults = async (scores: FaceScores, base64Image: string) => {
    setLatestScores(scores);
    setFaceImage(base64Image);  // Show immediately with base64
    // Cloud-first: upload image, save to Supabase, then sync
    await saveScores(scores, base64Image, sessionUser?.id, accessTokenRef.current || undefined);
    // Re-read face image — saveScores may have replaced base64 with Supabase URL
    setFaceImage(loadFaceImage());
  };

  const handleLogout = async () => {
    // Step 1: Try to sync data (best-effort, 3s max — never block logout)
    try {
      await Promise.race([
        pushToCloud(),
        new Promise(r => setTimeout(r, 3000)),
      ]);
    } catch {}

    // Step 2: Sign out GLOBALLY — logs out ALL other devices (single-session enforcement)
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise(r => setTimeout(r, 2000)),
      ]);
    } catch {}

    // Step 3: Clear app data from localStorage (keep sb- auth keys for Supabase)
    try {
      const appKeys = Object.keys(localStorage).filter(k => !k.startsWith('sb-'));
      appKeys.forEach(k => localStorage.removeItem(k));
    } catch {}

    // Step 4: Reset React state → triggers render of AuthPage
    setAuthed(false);
    setSessionUser(null);
    setLatestScores(null);
    setFaceImage(null);
    setTab('dashboard');
    setShowRemedies(false);
    setShowReports(false);
    setChatState('closed');
    setScanning(false);
  };

  const openChat = () => {
    clearTimeout(chatTimerRef.current);
    setChatState('opening');
    chatTimerRef.current = window.setTimeout(() => setChatState('open'), 20);
  };

  const closeChat = () => {
    clearTimeout(chatTimerRef.current);
    setChatState('closing');
    chatTimerRef.current = window.setTimeout(() => setChatState('closed'), 350);
  };

  if (authed === null) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-ring" style={{ margin: '0 auto 16px', width: 60, height: 60 }} />
          <div className="label">Loading Lynx AI...</div>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <AuthPage onAuth={() => setAuthed(true)} />;
  }

  if (showUpdatePassword) {
    return <UpdatePasswordPage onComplete={() => setShowUpdatePassword(false)} />;
  }

  const chatVisible = chatState !== 'closed';
  const chatAnimClass = chatState === 'open' ? 'chat-panel-open' : chatState === 'closing' ? 'chat-panel-closing' : 'chat-panel-opening';

  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard onScan={() => setScanning(true)} scores={latestScores} faceImage={faceImage} onGoPrograms={() => setTab('programs')} onViewAllRemedies={() => setShowRemedies(true)} onViewAllReports={() => setShowReports(true)} />;
      case 'programs': return <Programs />;
      case 'ranks': return <Ranks />;
      case 'vault': {
        const show = openPlans;
        if (openPlans) setTimeout(() => setOpenPlans(false), 100);
        return <Store user={sessionUser} initialShowPlans={show} />;
      }
      case 'profile': return <Profile onLogout={handleLogout} user={sessionUser} />;
      default: return <Dashboard onScan={() => setScanning(true)} scores={latestScores} faceImage={faceImage} />;
    }
  };

  return (
    <div className="app">
      {!scanning && !chatVisible && !showRemedies && !showReports && <TopNavbar onPlanClick={handlePlanClick} />}
      {renderPage()}

      {/* ═══ Chat overlay — animated ═══ */}
      {chatVisible && (
        <div className={`chat-overlay ${chatAnimClass}`}>
          <LynxChat scores={latestScores} />
        </div>
      )}

      {/* Tab bar */}
      {!scanning && <TabBar active={chatVisible ? null : tab} onChange={(t) => { if (chatVisible) closeChat(); setTab(t); }} />}

      {/* Floating Lynx AI FAB */}
      {!scanning && (
        <button
          className={`lynx-fab ${chatVisible ? 'lynx-fab-active' : ''}`}
          onClick={() => chatVisible ? closeChat() : openChat()}
          aria-label={chatVisible ? 'Close Lynx AI Chat' : 'Open Lynx AI Chat'}
        >
          {chatVisible ? (
            <span style={{ fontSize: 18, color: '#fff', lineHeight: 1 }}>✕</span>
          ) : (
            <LynxBubbleIcon size={32} animated />
          )}
        </button>
      )}

      {scanning && (
        <FaceScan
          onClose={() => setScanning(false)}
          onResults={handleScanResults}
        />
      )}

      {showRemedies && <RemediesPage onBack={() => setShowRemedies(false)} />}
      {showReports && <ReportsPage onBack={() => setShowReports(false)} />}
    </div>
  );
}
