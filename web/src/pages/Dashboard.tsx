import { useState, useEffect, useRef } from 'react';
import { ScanLine, ChevronRight, Sparkles, RefreshCw, ChevronDown, ChevronUp, Dumbbell, Play, Zap } from 'lucide-react';
import type { FaceScores } from '../lib/api';
import { PLANS } from '../data/exercisePlans';
import * as progress from '../data/planProgress';
import SkinRemediesSection from './SkinRemedies';
import RecentReports from './ReportsGrid';
import AISuggestions from './AISuggestions';
import { getImageSrc } from '../lib/imageUtils';

interface DashboardProps {
  onScan: () => void;
  scores: FaceScores | null;
  faceImage?: string | null;
  onGoPrograms?: () => void;
  onViewAllRemedies?: () => void;
  onViewAllReports?: () => void;
}

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

export default function Dashboard({ onScan, scores, faceImage, onGoPrograms, onViewAllRemedies, onViewAllReports }: DashboardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const scanVersion = useRef(0);

  useEffect(() => {
    if (!scores) return;
    scanVersion.current++;
    let frame = 0;
    const target = scores.overall;
    const step = () => {
      frame++;
      const progress = Math.min(frame / 40, 1);
      setAnimatedScore(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [scores]);

  const tier = scores ? getTier(scores.overall) : null;
  const TRAIT_LIST = scores?.traits ? Object.entries(scores.traits).map(([key, t]) => ({
    key, label: key.charAt(0).toUpperCase() + key.slice(1), ...t,
  })) : [];

  // Determine face image src — handles base64, URLs, and data: URIs
  const faceImgSrc = getImageSrc(faceImage);

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>LYNX AI</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Welcome back</div>
        </div>
        {scores && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>⚡ {scores.potential || 0} XP</span>
          </div>
        )}
      </div>

      {/* ═══ SECTION 1: GET RATED / LYNX REPORT ═══ */}
      {!scores ? (
        <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          {/* Hero Image */}
          <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative' }}>
            <img
              src="/hero-chad.webp"
              alt="Transform your look"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                objectPosition: 'center top',
                filter: 'grayscale(100%) contrast(1.1)',
                display: 'block',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(17,17,17,0.7) 70%, #111 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: 16, left: 20, right: 20,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, marginBottom: 4 }}>FIRST SCAN</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Get rated</div>
            </div>
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Take your first face scan to unlock your personalized Lynx Report and improvement roadmap.
            </p>
            <button className="btn btn-primary" onClick={onScan} style={{ width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ScanLine size={16} /> Start Face Scan
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
          {/* B&W face photo — compact */}
          {faceImgSrc && (
            <div style={{ width: '100%', height: 180, overflow: 'hidden', position: 'relative' }}>
              <img
                src={faceImgSrc}
                alt="Face scan"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, #111)' }} />
            </div>
          )}

          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5 }}>OVERALL LYNX SCORE</div>
              <button onClick={onScan} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <RefreshCw size={14} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: tier!.color, lineHeight: 1 }}>{animatedScore}</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tier!.color, marginBottom: 8 }}>
              {scores.overall_rating || tier!.label}
            </div>

            {scores.description && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
                {scores.description}
              </p>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>
              Potential: {scores.potential}/100
            </div>

            {/* Read More / Read Less toggle */}
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'var(--primary)', fontSize: 13, fontWeight: 700, padding: 0,
                }}
              >
                Read full report <ChevronDown size={16} />
              </button>
            ) : (
              <>
                {/* ── Trait Breakdown ── */}
                {TRAIT_LIST.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Trait Breakdown</div>
                    {TRAIT_LIST.map(t => (
                      <div key={t.key} style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.label}</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: getBarColor(t.score) }}>{t.score}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginBottom: 4 }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${t.score}%`, background: getBarColor(t.score), transition: 'width 1s ease' }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: getBarColor(t.score), marginBottom: 6 }}>{t.rating}</div>
                        {t.holding_back && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>What's holding you back</div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{t.holding_back}</p>
                          </>
                        )}
                        {t.fix_it && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>Fix it</div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.fix_it}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Top Recommendations ── */}
                {(scores.recommendations || scores.tips)?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Top Recommendations</div>
                    {(scores.recommendations || scores.tips).map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingLeft: 10, borderLeft: '3px solid var(--primary)' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', minWidth: 16 }}>{i + 1}</span>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setExpanded(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 12,
                    color: 'var(--primary)', fontSize: 13, fontWeight: 700, padding: 0,
                  }}
                >
                  Show less <ChevronUp size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ GENERATE REPORT CTA ═══ */}
      {!scores && (
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', marginBottom: 32, cursor: 'pointer' }} onClick={onScan}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ScanLine size={20} color="#000" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Generate Your First Report</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan your face to unlock</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      )}

      {/* ═══ RECENT REPORTS ═══ */}
      <RecentReports key={`reports-${scanVersion.current}`} onViewAll={onViewAllReports || (() => {})} />

      {/* ═══ EXERCISES SECTION ═══ */}
      <ActivePlanCard onGoPrograms={onGoPrograms} />

      {/* ═══ AI SUGGESTIONS ═══ */}
      {scores && <AISuggestions scores={scores} onGoPrograms={onGoPrograms} />}

      {/* ═══ SKIN RITUALS ═══ */}
      <SkinRemediesSection limit={2} onViewAll={onViewAllRemedies} />
    </div>
  );
}

/* ═══ Active Plan Card for Dashboard ═══ */
function ActivePlanCard({ onGoPrograms }: { onGoPrograms?: () => void }) {
  const userProgress = progress.getProgress();
  const activePlan = PLANS.find(p => p.id === userProgress.activePlanId) || null;
  const planProg = activePlan ? userProgress.plans[activePlan.id] : null;
  const currentDay = planProg?.currentDay || 1;
  const completedCount = planProg?.completedDays.length || 0;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Exercises</div>
        <span onClick={onGoPrograms} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>View all</span>
      </div>

      {activePlan && planProg ? (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={onGoPrograms}>
          {/* Plain gradient banner */}
          <div style={{
            width: '100%', height: 100, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(200,168,78,0.08) 0%, rgba(200,168,78,0.02) 50%, rgba(0,0,0,0) 100%)',
          }}>
            {/* Day badge */}
            <div style={{
              position: 'absolute', top: 10, right: 12,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(200,168,78,0.3)',
              fontSize: 11, fontWeight: 700, color: 'var(--primary)',
            }}>
              DAY {Math.min(currentDay, 30)}/30
            </div>
            {/* Plan name overlay */}
            <div style={{ position: 'absolute', bottom: 10, left: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--primary)', marginBottom: 2 }}>ACTIVE PROGRAM</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{activePlan.name}</div>
            </div>
          </div>

          {/* Bottom section */}
          <div style={{ padding: '14px 16px' }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: 'var(--primary)',
                  width: `${(completedCount / 30) * 100}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{completedCount}/30</span>
            </div>

            {/* Today info + Start button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Today's Mission</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  Day {Math.min(currentDay, 30)} — {currentDay <= 10 ? 'Foundation' : currentDay <= 20 ? 'Intensify' : 'Mastery'}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10,
                background: 'var(--primary)',
                boxShadow: '0 0 16px rgba(200,168,78,0.3)',
                fontSize: 13, fontWeight: 800, color: '#000',
              }}>
                <Play size={14} fill="#000" /> START
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No active plan */
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }} onClick={onGoPrograms}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(200,168,78,0.1)', border: '1.5px solid rgba(200,168,78,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Dumbbell size={22} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Pick a Program</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose a 30-day face exercise plan</div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      )}
    </div>
  );
}
