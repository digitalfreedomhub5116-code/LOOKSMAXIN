import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Roadmap from './pages/Roadmap';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import TabBar from './components/TabBar';
import { supabase, saveScores, loadLatestScores } from './lib/api';
import type { FaceScores } from './lib/api';

export type Tab = 'dashboard' | 'roadmap' | 'lynx' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);
  const [latestScores, setLatestScores] = useState<FaceScores | null>(() => loadLatestScores());
  const [authed, setAuthed] = useState<boolean | null>(null); // null = loading

  // Check auth state on mount + listen for changes
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });

    // Listen for auth state changes (login, logout, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScanResults = (scores: FaceScores) => {
    setLatestScores(scores);
    saveScores(scores);
  };

  const handleLogout = () => {
    setAuthed(false);
    setLatestScores(null);
    setTab('dashboard');
  };

  // ─── Loading splash ───
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

  // ─── Auth gate ───
  if (!authed) {
    return <AuthPage onAuth={() => setAuthed(true)} />;
  }

  // ─── Main app ───
  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard onScan={() => setScanning(true)} scores={latestScores} />;
      case 'roadmap': return <Roadmap />;
      case 'lynx': return <LynxChat />;
      case 'profile': return <Profile onLogout={handleLogout} />;
      default: return <Dashboard onScan={() => setScanning(true)} scores={latestScores} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      {!scanning && <TabBar active={tab} onChange={setTab} />}
      {scanning && (
        <FaceScan
          onClose={() => setScanning(false)}
          onResults={handleScanResults}
        />
      )}
    </div>
  );
}
