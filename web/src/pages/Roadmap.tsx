import { Check, Lock, Diamond, Leaf, Sparkles, PersonStanding, Users, Shirt } from 'lucide-react';

type NodeStatus = 'completed' | 'current' | 'locked';

interface RoadmapNode {
  title: string;
  subtitle: string;
  icon: typeof Leaf;
  status: NodeStatus;
  xp: number;
}

const NODES: RoadmapNode[] = [
  { title: 'Foundation', subtitle: 'Basic skincare & hygiene', icon: Leaf, status: 'completed', xp: 50 },
  { title: 'Facial Structure', subtitle: 'Jawline & mewing exercises', icon: Diamond, status: 'completed', xp: 75 },
  { title: 'Skin Mastery', subtitle: 'Advanced routines & treatments', icon: Sparkles, status: 'current', xp: 100 },
  { title: 'Body Language', subtitle: 'Posture & presence', icon: PersonStanding, status: 'locked', xp: 120 },
  { title: 'Social Dynamics', subtitle: 'Conversation & confidence', icon: Users, status: 'locked', xp: 150 },
  { title: 'Style & Fashion', subtitle: 'Personal brand building', icon: Shirt, status: 'locked', xp: 175 },
];

export default function Roadmap() {
  const done = NODES.filter(n => n.status === 'completed').length;

  return (
    <div className="page">
      <div className="h1" style={{ marginBottom: 4 }}>Your Roadmap</div>
      <div className="label" style={{ marginBottom: 20 }}>Unlock skills • Level up your life</div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div className="metric-track" style={{ height: 4, marginBottom: 6 }}>
          <div className="metric-fill" style={{ width: `${(done / NODES.length) * 100}%`, background: 'var(--primary)' }} />
        </div>
        <div className="label">{done} of {NODES.length} skills unlocked</div>
      </div>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const Icon = node.icon;
        const isDone = node.status === 'completed';
        const isCurrent = node.status === 'current';
        const isLocked = node.status === 'locked';

        return (
          <div className="roadmap-node" key={i}>
            <div className="connector-col">
              {i > 0 && <div className={`connector-line ${isDone ? 'done' : ''}`} />}
              <div className={`node-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                {isDone ? <Check size={12} color="#22C55E" /> :
                 isLocked ? <Lock size={9} color="var(--text-disabled)" /> :
                 <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--primary)' }} />}
              </div>
              {i < NODES.length - 1 && <div className={`connector-line ${isDone ? 'done' : ''}`} />}
            </div>

            <div className={`glass node-card ${isLocked ? 'locked' : isCurrent ? 'current' : ''}`}>
              <div className="task-icon" style={isCurrent ? { borderColor: 'rgba(142,161,188,0.3)', background: 'rgba(142,161,188,0.1)' } : {}}>
                <Icon size={18} color={isLocked ? 'var(--text-disabled)' : isCurrent ? 'var(--primary)' : '#22C55E'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: isLocked ? 'var(--text-disabled)' : 'var(--text)', letterSpacing: 0.3 }}>
                  {node.title}
                </div>
                <div className="label" style={{ marginTop: 2 }}>{node.subtitle}</div>
              </div>
              <span className="xp-badge" style={isLocked ? { color: 'var(--text-disabled)' } : {}}>
                +{node.xp} XP
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
