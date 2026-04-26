import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import FaceScan from './pages/FaceScan';
import Roadmap from './pages/Roadmap';
import LynxChat from './pages/LynxChat';
import Profile from './pages/Profile';
import TabBar from './components/TabBar';

export type Tab = 'dashboard' | 'roadmap' | 'lynx' | 'vault' | 'profile';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [scanning, setScanning] = useState(false);

  const renderPage = () => {
    switch (tab) {
      case 'dashboard': return <Dashboard onScan={() => setScanning(true)} />;
      case 'roadmap': return <Roadmap />;
      case 'lynx': return <LynxChat />;
      case 'profile': return <Profile />;
      default: return <Dashboard onScan={() => setScanning(true)} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
      {!scanning && <TabBar active={tab} onChange={setTab} />}
      {scanning && <FaceScan onClose={() => setScanning(false)} />}
    </div>
  );
}
