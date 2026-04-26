import { useState, useEffect } from 'react';
import { Sparkles, Check, Lock, RotateCcw, BookOpen, Activity, Scissors, Eye, Droplets } from 'lucide-react';
import { getScanCount } from '../lib/api';

interface MilestoneNode {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  icon: React.ReactNode;
  unlockCondition: () => boolean;
}

export default function Roadmap() {
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    setScanCount(getScanCount());
  }, []);

  const totalXP = milestones.reduce((sum, m) => m.unlockCondition() ? sum + m.xp : sum, 0);

  // Define milestones with conditions
  const nodes: MilestoneNode[] = [
    {
      id: 'awakening',
      title: 'Awakening',
      subtitle: 'Take your first scan',
      xp: 50,
      icon: <RotateCcw size={22} />,
      unlockCondition: () => scanCount >= 1,
    },
    {
      id: 'foundations',
      title: 'Foundations',
      subtitle: 'Skincare basics unlocked',
      xp: 80,
      icon: <Droplets size={22} />,
      unlockCondition: () => scanCount >= 2,
    },
    {
      id: 'posture',
      title: 'Posture Reset',
      subtitle: 'Mewing & alignment',
      xp: 125,
      icon: <Activity size={22} />,
      unlockCondition: () => scanCount >= 3,
    },
    {
      id: 'grooming',
      title: 'Grooming Protocol',
      subtitle: 'Hair, brows & beard care',
      xp: 100,
      icon: <Scissors size={22} />,
      unlockCondition: () => scanCount >= 4,
    },
    {
      id: 'eye-area',
      title: 'Eye Area Mastery',
      subtitle: 'Under-eye & brow optimization',
      xp: 150,
      icon: <Eye size={22} />,
      unlockCondition: () => scanCount >= 5,
    },
    {
      id: 'ascension',
      title: 'Full Ascension',
      subtitle: 'Advanced strategies unlocked',
      xp: 200,
      icon: <BookOpen size={22} />,
      unlockCondition: () => scanCount >= 8,
    },
  ];

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>Your Roadmap</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Step by step path to Lynx Mode</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{totalXP} XP</span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 32, position: 'relative' }}>
        {nodes.map((node, i) => {
          const unlocked = node.unlockCondition();
          const isLast = i === nodes.length - 1;

          return (
            <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginBottom: isLast ? 0 : 0 }}>
              {/* Connector line (above, except first) */}
              {i > 0 && (
                <div style={{
                  width: 2,
                  height: 40,
                  background: unlocked ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                  borderStyle: unlocked ? 'solid' : 'dashed' ,
                }} />
              )}

              {/* Node circle */}
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: `2.5px solid ${unlocked ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`,
                background: unlocked ? 'rgba(200,168,78,0.1)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: unlocked ? 1 : 0.4,
                boxShadow: unlocked ? '0 0 20px rgba(200,168,78,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {unlocked ? (
                  <div style={{ color: 'var(--primary)' }}>{node.icon}</div>
                ) : (
                  <Lock size={18} color="var(--text-disabled)" />
                )}
              </div>

              {/* Title & subtitle */}
              <div style={{ textAlign: 'center', marginTop: 10, marginBottom: 4, opacity: unlocked ? 1 : 0.4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{node.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{node.subtitle}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                  {unlocked ? <><Check size={12} style={{ verticalAlign: -1 }} /> +{node.xp} XP</> : `+${node.xp} XP`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-define milestones for XP calc (matches the nodes array above)
const milestones = [
  { xp: 50, unlockCondition: () => false },
  { xp: 80, unlockCondition: () => false },
  { xp: 125, unlockCondition: () => false },
  { xp: 100, unlockCondition: () => false },
  { xp: 150, unlockCondition: () => false },
  { xp: 200, unlockCondition: () => false },
];
