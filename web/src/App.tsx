import { useState, useEffect, useRef } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Programs from './pages/Programs';
import Ranks from './pages/Ranks';
import Courses from './pages/Courses';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import RemediesPage from './pages/RemediesPage';
import { ReportsPage } from './pages/ReportsGrid';
import AuthPage from './pages/AuthPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import TabBar, { LynxBubbleIcon } from './components/TabBar';
import { supabase, saveScores, loadLatestScores, loadFaceImage } from './lib/api';
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
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const chatTimerRef = useRef<number>(0);
  const [showRemedies, setShowRemedies] = useState(false);
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthed(!!session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleScanResults = (scores: FaceScores, base64Image: string) => {
    setLatestScores(scores);
    setFaceImage(base64Image);
    saveScores(scores, base64Image);
  };

  const handleLogout = () => {
    setAuthed(false);
    setLatestScores(null);
    setTab('dashboard');
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
      case 'vault': return <Courses />;
      case 'profile': return <Profile onLogout={handleLogout} />;
      default: return <Dashboard onScan={() => setScanning(true)} scores={latestScores} faceImage={faceImage} />;
    }
  };

  return (
    <div className="app">
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
