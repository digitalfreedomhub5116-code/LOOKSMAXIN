import { useState } from 'react';
import { Bookmark, ChevronRight, Clock, Repeat, ArrowLeft, Check } from 'lucide-react';
import { REMEDIES, CATEGORY_META, CATEGORY_ORDER, type Remedy, type RemedyCategory } from '../data/skinRemedies';

interface SectionProps {
  limit?: number; // max categories to show
  onViewAll?: () => void;
}

export default function SkinRemediesSection({ limit, onViewAll }: SectionProps) {
  const [selected, setSelected] = useState<Remedy | null>(null);
  const [saved, setSaved] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lynx_saved_remedies') || '[]')); } catch { return new Set(); }
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('lynx_saved_remedies', JSON.stringify([...next]));
      return next;
    });
  };

  // Group remedies by category
  const allGrouped = CATEGORY_ORDER.map(cat => ({
    cat,
    meta: CATEGORY_META[cat],
    items: REMEDIES.filter(r => r.category === cat),
  }));
  const grouped = limit ? allGrouped.slice(0, limit) : allGrouped;

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Skin Rituals</div>

        {grouped.map(({ cat, meta, items }) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 4, height: 18, borderRadius: 2, background: meta.color,
              }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{meta.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{meta.description}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: meta.color }}>{items.length}</span>
            </div>

            {/* Horizontal scroll */}
            <div style={{
              display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            }}>
              {items.map(r => (
                <RemedyCard key={r.id} r={r} isSaved={saved.has(r.id)} onSave={toggleSave} onView={() => setSelected(r)} />
              ))}
            </div>
          </div>
        ))}

        {/* View All button when limited */}
        {limit && onViewAll && (
          <button onClick={onViewAll} style={{
            width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
            border: '1px solid var(--border)', cursor: 'pointer',
            background: 'rgba(200,168,78,0.06)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 4,
          }}>
            View All {REMEDIES.length} Rituals <ChevronRight size={14} />
          </button>
        )}
      </div>

      {selected && (
        <RemedyDetail
          remedy={selected}
          isSaved={saved.has(selected.id)}
          onSave={(e) => toggleSave(selected.id, e)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

/* ─── Single Remedy Card ─── */
function RemedyCard({ r, isSaved, onSave, onView }: {
  r: Remedy; isSaved: boolean;
  onSave: (id: string, e: React.MouseEvent) => void;
  onView: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <div style={{
      minWidth: 170, maxWidth: 170, scrollSnapAlign: 'start', flexShrink: 0,
      borderRadius: 12, overflow: 'hidden',
      background: 'var(--surface)', border: '1px solid var(--border)',
    }}>
      {/* Color accent bar */}
      <div style={{
        height: 4, background: `linear-gradient(90deg, ${r.color}, ${r.color}60)`,
      }} />

      {/* Content */}
      <div style={{ padding: '10px 10px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.25, flex: 1 }}>{r.name}</div>
          <span style={{
            fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginLeft: 4,
            background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25`,
          }}>{r.tags[0]}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.subtitle}</div>
        <p style={{
          fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{r.summary}</p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
          {r.tags.slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
              background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>{t}</span>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={(e) => onSave(r.id, e)} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 10, fontWeight: 700,
            border: '1px solid var(--border)', cursor: 'pointer',
            background: isSaved ? 'rgba(200,168,78,0.1)' : 'none',
            color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            <Bookmark size={10} fill={isSaved ? 'var(--primary)' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={onView} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 10, fontWeight: 800,
            border: 'none', cursor: 'pointer',
            background: 'var(--primary)', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            View <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Modal ─── */
function RemedyDetail({ remedy: r, isSaved, onSave, onClose }: {
  remedy: Remedy; isSaved: boolean;
  onSave: (e: React.MouseEvent) => void; onClose: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={onSave} style={{
          background: isSaved ? 'rgba(200,168,78,0.15)' : 'none',
          border: `1px solid ${isSaved ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
          color: isSaved ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Bookmark size={14} fill={isSaved ? 'var(--primary)' : 'none'} /> {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          {/* Hero image */}
          <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
            <img src={r.image} alt={r.name} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'brightness(0.4) grayscale(100%) contrast(1.1)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.9) 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: r.color, marginBottom: 4 }}>
                {CATEGORY_META[r.category].label.toUpperCase()}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{r.name}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{r.subtitle}</div>
            </div>
          </div>

          <div style={{ padding: '20px 20px 100px' }}>
            {/* Meta */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={14} color={r.color} /> {r.duration}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Repeat size={14} color={r.color} /> {r.frequency}
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {r.tags.map(t => (
                <span key={t} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25`,
                }}>{t}</span>
              ))}
            </div>

            {/* Summary */}
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24 }}>{r.summary}</p>

            {/* Ingredients */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ingredients</div>
              {r.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{ing}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Step-by-Step Guide</div>
              {r.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 14,
                  padding: 12, borderRadius: 12,
                  background: i === 0 ? `${r.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? r.color + '20' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: `${r.color}15`, border: `1px solid ${r.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: r.color,
                  }}>{i + 1}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Benefits</div>
              {r.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <Check size={14} color={r.color} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
