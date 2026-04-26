import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Roadmap from './pages/Roadmap';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import TabBar from './components/TabBar';
import type { FaceScores } from './lib/api';

export type Tab = 'dashboard' | 'roadmap' | 'lynx' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);
  const [latestScores, setLatestScores] = useState<FaceScores | null>(null);

  const handleScanResults = (scores: FaceScores) => {
    setLatestScores(scores);
  };

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
