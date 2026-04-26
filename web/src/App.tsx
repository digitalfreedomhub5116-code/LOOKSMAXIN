import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Roadmap from './pages/Roadmap';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import TabBar from './components/TabBar';
import { getOrCreateUser, saveScan, getLatestScan } from './lib/api';
import type { FaceScores } from './lib/api';

export type Tab = 'dashboard' | 'roadmap' | 'lynx' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);
  const [latestScores, setLatestScores] = useState<FaceScores | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: get/create user, load latest scan
  useEffect(() => {
    (async () => {
      const uid = await getOrCreateUser();
      setUserId(uid);
      if (uid) {
        const saved = await getLatestScan(uid);
        if (saved) setLatestScores(saved);
      }
      setLoading(false);
    })();
  }, []);

  // After scan: save to Supabase + update UI
  const handleScanResults = async (scores: FaceScores) => {
    setLatestScores(scores);
    if (userId) {
      await saveScan(userId, scores);
    }
  };

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-ring" style={{ margin: '0 auto 16px', width: 60, height: 60 }} />
          <div className="label">Loading Lynx AI...</div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard onScan={() => setScanning(true)} scores={latestScores} />;
      case 'roadmap': return <Roadmap />;
      case 'lynx': return <LynxChat />;
      case 'profile': return <Profile />;
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
