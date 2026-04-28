/**
 * AI Suggestions Section — Dashboard Component
 * Shows personalized remedy cards, quick tips, and exercise plan suggestions
 * based on the user's latest face scan results.
 */
import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, X, ArrowRight, Dumbbell, Droplets, Droplet, Sun, Moon, Shield, Clock, User, Apple, Pipette } from 'lucide-react';
import type { FaceScores } from '../lib/api';
import { getPersonalizedSuggestions, dismissTip, type Suggestions, type RemedySuggestion, type QuickTip, type PlanSuggestion } from '../data/suggestionsEngine';
import type { Remedy } from '../data/skinRemedies';
import { RemedyDetail } from './SkinRemedies';
import { pushField } from '../lib/sync';

interface Props {
  scores: FaceScores;
  onGoPrograms?: () => void;
  onViewRemedy?: (remedy: Remedy) => void;
}

export default function AISuggestions({ scores, onGoPrograms, onViewRemedy }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [selectedRemedy, setSelectedRemedy] = useState<Remedy | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lynx_saved_remedies') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    const s = getPersonalizedSuggestions(scores);
    setSuggestions(s);
  }, [scores]);

  if (!suggestions) return null;

  const { remedies, tips, exercisePlans } = suggestions;
  const visibleTips = tips.filter(t => !dismissedTips.has(t.id));

  // Nothing to show
  if (remedies.length === 0 && visibleTips.length === 0 && exercisePlans.length === 0) return null;

  const handleDismissTip = (id: string) => {
    dismissTip(id);
    setDismissedTips(prev => new Set([...prev, id]));
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      const arr = [...next];
      localStorage.setItem('lynx_saved_remedies', JSON.stringify(arr));
      pushField('saved_remedies', arr).catch(() => {});
      return next;
    });
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>AI Suggestions</div>
        <div style={{ 
          fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--primary)',
          padding: '4px 10px', borderRadius: 20,
          background: 'rgba(200,168,78,0.08)', border: '1px solid rgba(200,168,78,0.15)',
        }}>
          BASED ON SCAN
        </div>
      </div>

      {/* ═══ Remedy Cards — Horizontal Scroll ═══ */}
      {remedies.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
            Recommended Remedies
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8,
            margin: '0 -20px', padding: '0 20px 8px',
            scrollSnapType: 'x mandatory',
          }}>
            {remedies.map(({ remedy, reason }) => (
              <RemedyCard
                key={remedy.id}
                remedy={remedy}
                reason={reason}
                onOpen={() => setSelectedRemedy(remedy)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Quick Tips ═══ */}
      {visibleTips.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
            Quick Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleTips.map(tip => (
              <TipCard key={tip.id} tip={tip} onDismiss={() => handleDismissTip(tip.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Exercise Plan Suggestions ═══ */}
      {exercisePlans.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
            Suggested Programs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercisePlans.map(plan => (
              <PlanCard key={plan.planId} plan={plan} onGo={onGoPrograms} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Full-screen Remedy Detail Modal ═══ */}
      {selectedRemedy && (
        <RemedyDetail
          remedy={selectedRemedy}
          isSaved={saved.has(selectedRemedy.id)}
          onSave={(e) => toggleSave(selectedRemedy.id, e)}
          onClose={() => setSelectedRemedy(null)}
        />
      )}
    </div>
  );
}

/* ═══ Remedy Card (compact — opens full detail on click) ═══ */
function RemedyCard({ remedy, reason, onOpen }: {
  remedy: Remedy; reason: string; onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        minWidth: 160, maxWidth: 180,
        flexShrink: 0, borderRadius: 16, overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer', transition: 'all 0.3s ease',
        scrollSnapAlign: 'start',
      }}
    >
      {/* Image */}
      <div style={{ width: '100%', height: 100, overflow: 'hidden', position: 'relative' }}>
        <img
          src={remedy.image}
          alt={remedy.name}
          loading="lazy"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'grayscale(100%) brightness(0.5) contrast(1.1)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.7) 100%)',
        }} />
        {/* Frequency badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 8px', borderRadius: 12,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          fontSize: 9, fontWeight: 700, color: remedy.color, letterSpacing: 0.5,
        }}>
          {remedy.frequency}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
          {remedy.name}
        </div>

        {/* AI Reason Tag */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 6,
        }}>
          <Sparkles size={10} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 10, color: 'var(--primary)', lineHeight: 1.4, fontWeight: 600 }}>
            {reason}
          </span>
        </div>

        {/* Duration + Category */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
            background: `${remedy.color}15`, color: remedy.color, letterSpacing: 0.5,
          }}>
            {remedy.duration}
          </span>
          {remedy.tags.slice(0, 1).map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Quick Tip Card ═══ */

// Map icon string names → Lucide components
const TIP_ICON_MAP: Record<string, React.ReactNode> = {
  droplets: <Droplets size={18} color="var(--primary)" />,
  droplet: <Droplet size={18} color="var(--primary)" />,
  sun: <Sun size={18} color="var(--primary)" />,
  moon: <Moon size={18} color="var(--primary)" />,
  shield: <Shield size={18} color="var(--primary)" />,
  sparkles: <Sparkles size={18} color="var(--primary)" />,
  pipette: <Pipette size={18} color="var(--primary)" />,
  clock: <Clock size={18} color="var(--primary)" />,
  user: <User size={18} color="var(--primary)" />,
  apple: <Apple size={18} color="var(--primary)" />,
};

function TipCard({ tip, onDismiss }: { tip: QuickTip; onDismiss: () => void }) {
  const iconNode = TIP_ICON_MAP[tip.icon] || <Sparkles size={18} color="var(--primary)" />;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 14,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      transition: 'all 0.2s',
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'rgba(200,168,78,0.08)',
        border: '1px solid rgba(200,168,78,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {iconNode}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, lineHeight: 1.3 }}>
          {tip.text}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8,
            background: 'rgba(200,168,78,0.1)', color: 'var(--primary)',
            letterSpacing: 0.5,
          }}>
            {tip.category}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {tip.reason}
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{
          background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8,
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <X size={12} color="var(--text-muted)" />
      </button>
    </div>
  );
}

/* ═══ Exercise Plan Suggestion Card ═══ */
function PlanCard({ plan, onGo }: { plan: PlanSuggestion; onGo?: () => void }) {
  const scoreColor = plan.score < 40 ? '#EF4444' : plan.score < 55 ? '#F59E0B' : '#C8A84E';

  return (
    <div
      onClick={onGo}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 14,
        background: 'rgba(200,168,78,0.04)',
        border: '1px solid rgba(200,168,78,0.12)',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'rgba(200,168,78,0.1)',
        border: '1.5px solid rgba(200,168,78,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Dumbbell size={20} color="var(--primary)" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          {plan.planName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {plan.reason} — <span style={{ color: scoreColor, fontWeight: 700 }}>needs work</span>
        </div>
      </div>

      {/* Score + Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          fontSize: 18, fontWeight: 900, color: scoreColor,
        }}>
          {plan.score}
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowRight size={14} color="#000" />
        </div>
      </div>
    </div>
  );
}
