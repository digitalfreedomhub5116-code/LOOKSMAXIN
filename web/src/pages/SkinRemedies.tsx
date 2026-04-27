import { useState } from 'react';
import { X, Bookmark, ChevronRight, Clock, Repeat, ArrowLeft, Check } from 'lucide-react';
import { REMEDIES, type Remedy } from '../data/skinRemedies';

export default function SkinRemediesSection() {
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

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Skin Rituals</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
            {REMEDIES.length} remedies
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, marginTop: -4 }}>
          Ayurvedic home remedies — tested & effective
        </div>

        {/* Horizontal scroll */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
          {REMEDIES.map(r => (
            <div key={r.id} style={{
              minWidth: 200, maxWidth: 200, scrollSnapAlign: 'start',
              borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              {/* Hero */}
              <div style={{
                height: 90, position: 'relative',
                background: `linear-gradient(135deg, ${r.color}22 0%, ${r.color}08 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 36 }}>{r.emoji}</span>
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                  background: `${r.color}20`, color: r.color, border: `1px solid ${r.color}30`,
                }}>{r.tags[0]}</div>
              </div>

              {/* Content */}
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: r.color, marginBottom: 6 }}>{r.subtitle}</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{r.summary}</p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {r.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>{t}</span>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={(e) => toggleSave(r.id, e)} style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: '1px solid var(--border)', cursor: 'pointer',
                    background: saved.has(r.id) ? 'rgba(200,168,78,0.1)' : 'none',
                    color: saved.has(r.id) ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <Bookmark size={12} fill={saved.has(r.id) ? 'var(--primary)' : 'none'} /> {saved.has(r.id) ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={() => setSelected(r)} style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    background: 'var(--primary)', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    View <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && <RemedyDetail remedy={selected} isSaved={saved.has(selected.id)} onSave={(e) => toggleSave(selected.id, e)} onClose={() => setSelected(null)} />}
    </>
  );
}

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
          {/* Hero */}
          <div style={{
            height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${r.color}20 0%, ${r.color}05 100%)`,
          }}>
            <span style={{ fontSize: 64 }}>{r.emoji}</span>
          </div>

          <div style={{ padding: '20px 20px 100px' }}>
            {/* Title */}
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: r.color, marginBottom: 4 }}>SKIN RITUAL</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{r.name}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>{r.subtitle}</div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={14} color={r.color} /> {r.duration}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                <Repeat size={14} color={r.color} /> {r.frequency}
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {r.tags.map(t => (
                <span key={t} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25`,
                }}>{t}</span>
              ))}
            </div>

            {/* Summary */}
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 28 }}>{r.summary}</p>

            {/* Ingredients */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Ingredients</div>
              {r.ingredients.map((ing, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{ing}</span>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Step-by-Step Guide</div>
              {r.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 16,
                  padding: 14, borderRadius: 12,
                  background: i === 0 ? `${r.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? r.color + '20' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${r.color}15`, border: `1px solid ${r.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: r.color,
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
