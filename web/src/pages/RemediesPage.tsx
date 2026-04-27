import { ArrowLeft } from 'lucide-react';
import SkinRemediesSection from './SkinRemedies';

interface Props {
  onBack: () => void;
}

export default function RemediesPage({ onBack }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600,
        }}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 16px' }}>
        <SkinRemediesSection />
      </div>
    </div>
  );
}
