import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Roadmap from './pages/Roadmap';
import Exercises from './pages/Exercises';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import TabBar, { LynxBubbleIcon } from './components/TabBar';
import { supabase, saveScores, loadLatestScores, loadFaceImage } from './lib/api';
import type { FaceScores } from './lib/api';

export type Tab = 'dashboard' | 'roadmap' | 'exercises' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [latestScores, setLatestScores] = useState<FaceScores | null>(() => loadLatestScores());
  const [faceImage, setFaceImage] = useState<string | null>(() => loadFaceImage());
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
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

  const renderPage = () => {
    if (chatOpen) return <LynxChat scores={latestScores} />;
    switch (tab) {
      case 'dashboard': return <Dashboard onScan={() => setScanning(true)} scores={latestScores} faceImage={faceImage} />;
      case 'roadmap': return <Roadmap />;
      case 'exercises': return <Exercises />;
      case 'profile': return <Profile onLogout={handleLogout} />;
      default: return <Dashboard onScan={() => setScanning(true)} scores={latestScores} faceImage={faceImage} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}

      {/* Tab bar — hidden during scan */}
      {!scanning && <TabBar active={chatOpen ? null : tab} onChange={(t) => { setChatOpen(false); setTab(t); }} />}

      {/* Floating Lynx AI FAB — bottom right */}
      {!scanning && !chatOpen && (
        <button
          className="lynx-fab"
          onClick={() => setChatOpen(true)}
          aria-label="Open Lynx AI Chat"
        >
          <LynxBubbleIcon size={32} animated />
        </button>
      )}

      {/* Close chat button when chat is open */}
      {chatOpen && !scanning && (
        <button
          className="lynx-fab"
          onClick={() => setChatOpen(false)}
          aria-label="Close Lynx AI Chat"
          style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
        >
          <span style={{ fontSize: 20, color: '#fff' }}>✕</span>
        </button>
      )}

      {scanning && (
        <FaceScan
          onClose={() => setScanning(false)}
          onResults={handleScanResults}
        />
      )}
    </div>
  );
}
