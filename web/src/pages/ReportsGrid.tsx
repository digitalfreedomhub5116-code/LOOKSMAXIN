import { useState } from 'react';
import { Eye, Trash2, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Pin } from 'lucide-react';
import { getScanHistory, deleteReport, type ScanRecord, type FaceScores, type TraitDetail } from '../lib/api';
import { getImageSrc } from '../lib/imageUtils';

/* ─── helpers ─── */
function getTier(s: number) {
  if (s >= 90) return { label: 'Gigachad', color: '#C8A84E' };
  if (s >= 80) return { label: 'Chad', color: '#22C55E' };
  if (s >= 65) return { label: 'Above Average', color: '#22C55E' };
  if (s >= 50) return { label: 'Average', color: '#F59E0B' };
  return { label: 'Below Average', color: '#EF4444' };
}
function getBarColor(s: number) {
  if (s >= 85) return '#22C55E';
  if (s >= 70) return '#C8A84E';
  if (s >= 50) return '#F59E0B';
  return '#EF4444';
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

/* pin tilts for the grid cards */
const TILTS = [-2.2, 1.8, -1.5, 2.5, -1, 2, -2.8, 1.2];

/* ═══════════════════════════════════
   Dashboard Section: Recent Reports
   ═══════════════════════════════════ */
export default function RecentReports({ onViewAll }: { onViewAll: () => void }) {
  const [reports, setReports] = useState(() => getScanHistory());

  const handleDelete = (ts: string) => {
    deleteReport(ts);
    setReports(getScanHistory());
  };

  if (reports.length === 0) return null;

  const visible = reports.slice(0, 4);

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Recent Reports</div>
        {reports.length > 4 && (
          <span onClick={onViewAll} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
            View all
          </span>
        )}
      </div>

      {/* 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {visible.map((r, i) => (
          <PinnedCard key={r.timestamp} report={r} tilt={TILTS[i % TILTS.length]} onDelete={() => handleDelete(r.timestamp)} />
        ))}
      </div>

      {reports.length > 4 && (
        <button onClick={onViewAll} style={{
          width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
          border: '1px solid var(--border)', cursor: 'pointer', marginTop: 14,
          background: 'rgba(200,168,78,0.06)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          View All {reports.length} Reports <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── Single Pinned Report Card ─── */
function PinnedCard({ report, tilt, onDelete }: {
  report: ScanRecord; tilt: number; onDelete: () => void;
}) {
  const [viewing, setViewing] = useState(false);
  const score = report.scores.overall;
  const tier = getTier(score);
  const img = getImageSrc(report.faceImage);

  return (
    <>
      <div style={{
        position: 'relative', borderRadius: 14, overflow: 'visible',
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.3s ease',
      }}>
        {/* Pin icon */}
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2, width: 20, height: 20, borderRadius: '50%',
          background: 'var(--primary)', border: '2px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}>
          <Pin size={9} color="#000" fill="#000" />
        </div>

        <div style={{
          borderRadius: 14, overflow: 'hidden',
          background: 'var(--surface)', border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {/* Face Image */}
          <div style={{ height: 110, position: 'relative', overflow: 'hidden', background: 'var(--surface-light)' }}>
            {img ? (
              <img
                src={img}
                alt="Face scan"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: 'grayscale(100%) brightness(0.7) contrast(1.1)',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(200,168,78,0.08), rgba(200,168,78,0.02))',
              }}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>👤</span>
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
            }} />
            {/* Date badge */}
            <div style={{
              position: 'absolute', top: 8, right: 6,
              padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700,
              background: 'rgba(0,0,0,0.6)', color: 'var(--text-muted)',
              backdropFilter: 'blur(4px)',
            }}>{fmtDate(report.timestamp)}</div>
          </div>

          {/* Score + Tier */}
          <div style={{ padding: '10px 10px 8px', textAlign: 'center' }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: tier.color,
              lineHeight: 1, letterSpacing: -1,
              textShadow: `0 0 20px ${tier.color}40`,
            }}>{score}</div>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: tier.color,
              marginTop: 2, textTransform: 'uppercase',
            }}>{tier.label}</div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => setViewing(true)} style={{
                flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 10, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: 'var(--primary)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                <Eye size={10} /> View
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', color: '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Detail Modal */}
      {viewing && <ReportDetail report={report} onClose={() => setViewing(false)} />}
    </>
  );
}

/* ═══════════════════════════════════
   Full-screen Report Detail View
   ═══════════════════════════════════ */
function ReportDetail({ report, onClose }: { report: ScanRecord; onClose: () => void }) {
  const s = report.scores;
  const tier = getTier(s.overall);
  const img = getImageSrc(report.faceImage);
  const [expanded, setExpanded] = useState(false);

  const TRAITS = s.traits
    ? Object.entries(s.traits).map(([key, t]) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), ...t }))
    : [];

  // Fallback traits from numeric scores
  const BASIC_TRAITS = [
    { label: 'Jawline', score: s.jawline },
    { label: 'Skin Quality', score: s.skin_quality },
    { label: 'Eyes', score: s.eyes },
    { label: 'Lips', score: s.lips },
    { label: 'Symmetry', score: s.facial_symmetry },
    { label: 'Hair', score: s.hair_quality },
  ];

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
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(report.timestamp)}</span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 430, margin: '0 auto' }}>
          {/* Hero Face Image */}
          <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
            {img ? (
              <img
                src={img}
                alt="Face scan"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: 'grayscale(100%) brightness(0.5) contrast(1.1)',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, rgba(200,168,78,0.1), rgba(0,0,0,1))',
              }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.95) 100%)',
            }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: tier.color, lineHeight: 1, textShadow: `0 0 30px ${tier.color}50` }}>
                {s.overall}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: tier.color, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                {tier.label}
              </div>
              {s.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{s.description}</p>
              )}
            </div>
          </div>

          <div style={{ padding: '20px 16px 100px' }}>
            {/* Trait bars */}
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Feature Analysis</div>

            {TRAITS.length > 0 ? (
              <>
                {(expanded ? TRAITS : TRAITS.slice(0, 4)).map(t => (
                  <div key={t.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-light)', overflow: 'hidden' }}>
                      <div style={{ width: `${t.score}%`, height: '100%', borderRadius: 3, background: getBarColor(t.score), transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{t.rating}</div>
                  </div>
                ))}
                {TRAITS.length > 4 && (
                  <button onClick={() => setExpanded(!expanded)} style={{
                    background: 'none', border: 'none', color: 'var(--primary)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto',
                  }}>
                    {expanded ? 'Show less' : `Show all ${TRAITS.length} traits`}
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </>
            ) : (
              BASIC_TRAITS.map(t => (
                <div key={t.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-light)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.score}%`, height: '100%', borderRadius: 3, background: getBarColor(t.score) }} />
                  </div>
                </div>
              ))
            )}

            {/* Tips */}
            {s.tips && s.tips.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Improvement Tips</div>
                {s.tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, marginBottom: 10, padding: 12, borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>{i + 1}</span>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   Full Reports Page (View All)
   ═══════════════════════════════════ */
export function ReportsPage({ onBack }: { onBack: () => void }) {
  const [reports, setReports] = useState(() => getScanHistory());

  const handleDelete = (ts: string) => {
    deleteReport(ts);
    setReports(getScanHistory());
  };

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
        <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>All Reports</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{reports.length} scans</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 16px' }}>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No reports yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Scan your face to generate your first Lynx Report</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {reports.map((r, i) => (
              <PinnedCard key={r.timestamp} report={r} tilt={TILTS[i % TILTS.length]} onDelete={() => handleDelete(r.timestamp)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
