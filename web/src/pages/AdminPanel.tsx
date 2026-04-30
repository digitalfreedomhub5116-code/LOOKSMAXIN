import { useState, useEffect, useRef } from 'react';
import { fetchAllPlans, fetchAllExercises, updateExerciseFrames, addExercise, deleteExercise, reindexExercises, updateExercise, togglePlanVisibility, updateExerciseName } from '../lib/workoutApi';
import type { WorkoutPlan, WorkoutExercise, WorkoutFrame } from '../lib/workoutApi';

const ADMIN_ID = 'admin';
const ADMIN_PW = 'LYNXAIPASSOWORDSECURED@34';
const LS_KEY = 'lynx_admin_auth';

function isAdminAuthed(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === 'true' || sessionStorage.getItem(LS_KEY) === 'true';
  } catch { return false; }
}

/* ═══ Admin Login ═══ */
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');

  const submit = () => {
    if (id === ADMIN_ID && pw === ADMIN_PW) {
      if (remember) {
        localStorage.setItem(LS_KEY, 'true');
      } else {
        sessionStorage.setItem(LS_KEY, 'true');
      }
      onLogin();
    } else {
      setErr('Invalid credentials');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:380, padding:32, background:'#111', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#C8A84E', marginBottom:8 }}>LYNX AI</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:24 }}>Admin Panel</h1>
        {err && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#EF4444', marginBottom:12 }}>{err}</div>}
        <label style={{ fontSize:12, fontWeight:600, color:'#888', display:'block', marginBottom:4 }}>Username</label>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="admin" style={{ width:'100%', padding:'12px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:14, marginBottom:14, outline:'none' }} onKeyDown={e => e.key==='Enter' && submit()} />
        <label style={{ fontSize:12, fontWeight:600, color:'#888', display:'block', marginBottom:4 }}>Password</label>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={{ width:'100%', padding:'12px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:14, marginBottom:14, outline:'none' }} onKeyDown={e => e.key==='Enter' && submit()} />
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer' }}>
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor:'#C8A84E' }} />
          <span style={{ fontSize:13, color:'#888' }}>Remember me</span>
        </label>
        <button onClick={submit} style={{ width:'100%', padding:'14px', background:'#C8A84E', border:'none', borderRadius:10, fontSize:15, fontWeight:700, color:'#000', cursor:'pointer' }}>Sign In</button>
      </div>
    </div>
  );
}

/* ═══ Frame Preview (looped animation) ═══ */
function FramePreview({ frames }: { frames: WorkoutFrame[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (frames.length <= 0) return;
    const safeIdx = idx % frames.length;
    const ms = frames[safeIdx]?.duration_ms || 2000;
    timerRef.current = window.setTimeout(() => setIdx(i => (i + 1) % frames.length), ms);
    return () => clearTimeout(timerRef.current);
  }, [idx, frames]);

  useEffect(() => { setIdx(0); }, [frames.length]);

  if (frames.length === 0) return <div style={{ width:120, height:120, borderRadius:12, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#555' }}>No frames</div>;

  return (
    <div style={{ position:'relative', width:120, height:120, borderRadius:12, overflow:'hidden', background:'#000' }}>
      {frames.map((f, i) => (
        <img key={i} src={f.url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity: i === (idx % frames.length) ? 1 : 0, transition:'opacity 0.3s' }} />
      ))}
      <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center', fontSize:9, color:'#C8A84E', fontWeight:700 }}>
        Frame {(idx % frames.length) + 1}/{frames.length} · {frames[idx % frames.length]?.duration_ms}ms
      </div>
    </div>
  );
}

/* ═══ Frame Editor ═══ */
function FrameEditor({ frames, onChange }: { frames: WorkoutFrame[]; onChange: (f: WorkoutFrame[]) => void }) {
  const addFrame = () => onChange([...frames, { url: '', duration_ms: 2000 }]);
  const removeFrame = (i: number) => onChange(frames.filter((_, j) => j !== i));
  const updateFrame = (i: number, key: keyof WorkoutFrame, val: any) => {
    const copy = [...frames];
    copy[i] = { ...copy[i], [key]: key === 'duration_ms' ? Number(val) || 0 : val };
    onChange(copy);
  };

  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#C8A84E', letterSpacing:1 }}>FRAMES ({frames.length})</span>
        <button onClick={addFrame} style={{ padding:'4px 12px', background:'rgba(200,168,78,0.15)', border:'1px solid rgba(200,168,78,0.3)', borderRadius:6, color:'#C8A84E', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add Frame</button>
      </div>
      {frames.map((f, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6, padding:'8px 10px', background:'rgba(255,255,255,0.02)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#555', minWidth:16 }}>#{i+1}</span>
          <input placeholder="Image URL" value={f.url} onChange={e => updateFrame(i, 'url', e.target.value)} style={{ flex:1, padding:'6px 8px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#fff', fontSize:12, outline:'none' }} />
          <input type="number" value={f.duration_ms} onChange={e => updateFrame(i, 'duration_ms', e.target.value)} style={{ width:70, padding:'6px 8px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#C8A84E', fontSize:12, textAlign:'center', outline:'none' }} />
          <span style={{ fontSize:9, color:'#555' }}>ms</span>
          {f.url && <img src={f.url} alt="" style={{ width:32, height:32, borderRadius:4, objectFit:'cover' }} onError={e => (e.currentTarget.style.display='none')} />}
          <button onClick={() => removeFrame(i)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:4, color:'#EF4444', fontSize:11, padding:'2px 6px', cursor:'pointer' }}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ═══ Exercise Card (admin) ═══ */
function ExerciseCard({ ex, onSaveFrames, onDelete, onSaveName }: { ex: WorkoutExercise; onSaveFrames: (id: string, frames: WorkoutFrame[]) => Promise<void>; onDelete: (id: string) => Promise<void>; onSaveName: (id: string, name: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [frames, setFrames] = useState<WorkoutFrame[]>(ex.frames);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(ex.name);
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when exercise prop changes
  useEffect(() => { setFrames(ex.frames); }, [ex.frames]);
  useEffect(() => { setNameValue(ex.name); }, [ex.name]);
  useEffect(() => { if (editingName && nameInputRef.current) nameInputRef.current.focus(); }, [editingName]);

  const dirty = JSON.stringify(frames) !== JSON.stringify(ex.frames);

  const save = async () => { setSaving(true); await onSaveFrames(ex.id, frames); setSaving(false); };
  const del = async () => { if (!confirm(`Delete "${ex.name}"?`)) return; setDeleting(true); await onDelete(ex.id); };
  const saveName = async () => {
    if (!nameValue.trim() || nameValue === ex.name) { setEditingName(false); setNameValue(ex.name); return; }
    setSavingName(true);
    await onSaveName(ex.id, nameValue.trim());
    setSavingName(false);
    setEditingName(false);
  };

  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, marginBottom:8, overflow:'hidden' }}>
      <div onClick={() => !editingName && setExpanded(!expanded)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}>
        <div style={{ width:36, height:36, borderRadius:8, background:'rgba(200,168,78,0.08)', border:'1px solid rgba(200,168,78,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#C8A84E', flexShrink:0 }}>
          {ex.exercise_index + 1}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          {editingName ? (
            <div style={{ display:'flex', gap:6, alignItems:'center' }} onClick={e => e.stopPropagation()}>
              <input ref={nameInputRef} value={nameValue} onChange={e => setNameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameValue(ex.name); } }} style={{ flex:1, padding:'4px 8px', background:'transparent', border:'1px solid rgba(200,168,78,0.4)', borderRadius:6, color:'#fff', fontSize:14, fontWeight:700, outline:'none' }} />
              <button onClick={saveName} disabled={savingName} style={{ padding:'4px 10px', background:'#C8A84E', border:'none', borderRadius:5, color:'#000', fontSize:11, fontWeight:700, cursor:'pointer' }}>{savingName ? '...' : '✓'}</button>
              <button onClick={() => { setEditingName(false); setNameValue(ex.name); }} style={{ padding:'4px 8px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, color:'#888', fontSize:11, cursor:'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ex.name}</div>
              <button onClick={e => { e.stopPropagation(); setEditingName(true); }} style={{ background:'none', border:'none', color:'#555', fontSize:12, cursor:'pointer', padding:'2px 4px', flexShrink:0 }} title="Edit name">✏️</button>
            </div>
          )}
          <div style={{ fontSize:11, color:'#555', marginTop:2 }}>{ex.sets} sets · {ex.reps > 0 ? `${ex.reps} reps` : `${ex.duration}s hold`} · {'⭐'.repeat(ex.difficulty)} · {ex.frames.length} frames</div>
        </div>
        <FramePreview frames={ex.frames} />
        <span style={{ color:'#555', fontSize:16 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize:12, color:'#888', marginTop:10, lineHeight:1.6, marginBottom:10 }}>{ex.description}</div>
          <FrameEditor frames={frames} onChange={setFrames} />
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            {dirty && (
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'10px', background:'#C8A84E', border:'none', borderRadius:8, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving...' : '💾 Save Frames'}
              </button>
            )}
            <button onClick={del} disabled={deleting} style={{ padding:'10px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#EF4444', fontSize:12, fontWeight:700, cursor:'pointer', opacity: deleting ? 0.5 : 1 }}>
              {deleting ? '...' : '🗑 Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Add Exercise Modal ═══ */
function AddExerciseForm({ planId, nextIndex, onAdd }: { planId: string; nextIndex: number; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(120);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(0);
  const [diff, setDiff] = useState<1|2|3>(1);
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addExercise(planId, { plan_id: planId, exercise_index: nextIndex, name, duration, sets, reps, difficulty: diff, description: desc, frames: [] });
    setSaving(false);
    setOpen(false);
    setName(''); setDuration(120); setSets(3); setReps(0); setDiff(1); setDesc('');
    onAdd();
  };

  if (!open) return <button onClick={() => setOpen(true)} style={{ width:'100%', padding:'12px', background:'rgba(200,168,78,0.06)', border:'1px dashed rgba(200,168,78,0.3)', borderRadius:10, color:'#C8A84E', fontSize:13, fontWeight:700, cursor:'pointer', marginTop:4 }}>+ Add New Exercise</button>;

  const inp = (label: string, val: any, set: any, type='text') => (
    <div style={{ marginBottom:10 }}>
      <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:3 }}>{label}</label>
      <input type={type} value={val} onChange={e => set(type==='number' ? Number(e.target.value) : e.target.value)} style={{ width:'100%', padding:'8px 10px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#fff', fontSize:13, outline:'none' }} />
    </div>
  );

  return (
    <div style={{ background:'rgba(200,168,78,0.04)', border:'1px solid rgba(200,168,78,0.15)', borderRadius:12, padding:16, marginTop:4 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#C8A84E', marginBottom:12 }}>New Exercise</div>
      {inp('Name', name, setName)}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {inp('Duration (sec)', duration, setDuration, 'number')}
        {inp('Sets', sets, setSets, 'number')}
        {inp('Reps (0=hold)', reps, setReps, 'number')}
      </div>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:11, color:'#888', display:'block', marginBottom:3 }}>Difficulty</label>
        <div style={{ display:'flex', gap:6 }}>
          {[1,2,3].map(d => <button key={d} onClick={() => setDiff(d as 1|2|3)} style={{ flex:1, padding:'6px', borderRadius:6, border: diff===d ? '1px solid #C8A84E' : '1px solid rgba(255,255,255,0.1)', background: diff===d ? 'rgba(200,168,78,0.15)' : 'transparent', color: diff===d ? '#C8A84E' : '#555', fontSize:12, fontWeight:700, cursor:'pointer' }}>{'⭐'.repeat(d)}</button>)}
        </div>
      </div>
      {inp('Description', desc, setDesc)}
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={submit} disabled={saving} style={{ flex:1, padding:'10px', background:'#C8A84E', border:'none', borderRadius:8, color:'#000', fontSize:13, fontWeight:700, cursor:'pointer' }}>{saving ? 'Adding...' : 'Add Exercise'}</button>
        <button onClick={() => setOpen(false)} style={{ padding:'10px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#888', fontSize:12, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══ Main Admin Panel ═══ */
export default function AdminPanel() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Map<string, WorkoutExercise[]>>(new Map());
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [p, e] = await Promise.all([fetchAllPlans(), fetchAllExercises()]);
    setPlans(p);
    setExercises(e);
    if (!activePlan && p.length > 0) setActivePlan(p[0].id);
    setLoading(false);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  const planExercises = activePlan ? (exercises.get(activePlan) || []) : [];

  const handleSaveFrames = async (exId: string, frames: WorkoutFrame[]) => {
    await updateExerciseFrames(exId, frames);
    await load();
  };

  const handleDelete = async (exId: string) => {
    await deleteExercise(exId);
    if (activePlan) await reindexExercises(activePlan);
    await load();
  };

  const handleAdd = async () => {
    await load();
  };

  const handleSaveName = async (exId: string, name: string) => {
    await updateExerciseName(exId, name);
    await load();
  };

  const handleToggleVisibility = async (planId: string, currentActive: boolean) => {
    await togglePlanVisibility(planId, !currentActive);
    await load();
  };

  const handleLogout = () => {
    localStorage.removeItem(LS_KEY);
    try { sessionStorage.removeItem(LS_KEY); } catch {}
    setAuthed(false);
  };

  const currentPlan = plans.find(p => p.id === activePlan);

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', fontFamily:"'Inter',sans-serif", color:'#fff' }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(10,10,15,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#C8A84E' }}>LYNX AI</span>
          <span style={{ fontSize:18, fontWeight:800, color:'#fff', marginLeft:12 }}>Admin Panel</span>
        </div>
        <button onClick={handleLogout} style={{ padding:'6px 16px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#EF4444', fontSize:12, fontWeight:600, cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ display:'flex', maxWidth:1200, margin:'0 auto' }}>
        {/* Sidebar — Plan List */}
        <div style={{ width:260, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)', padding:'16px 0', minHeight:'calc(100vh - 60px)' }}>
          <div style={{ padding:'0 16px', fontSize:10, fontWeight:700, letterSpacing:1.5, color:'#555', marginBottom:12 }}>PLANS ({plans.length})</div>
          {plans.map(p => (
            <div key={p.id} style={{ padding:'10px 16px', cursor:'pointer', background: activePlan === p.id ? 'rgba(200,168,78,0.08)' : 'transparent', borderLeft: activePlan === p.id ? '3px solid #C8A84E' : '3px solid transparent', transition:'all 0.15s', opacity: p.is_active ? 1 : 0.45 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div onClick={() => setActivePlan(p.id)} style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color: activePlan === p.id ? '#fff' : '#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'#444', marginTop:2 }}>{exercises.get(p.id)?.length || 0} exercises{!p.is_active ? ' · HIDDEN' : ''}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(p.id, p.is_active); }}
                  title={p.is_active ? 'Hide from users' : 'Show to users'}
                  style={{ background: p.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: p.is_active ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(239,68,68,0.25)', borderRadius:6, padding:'4px 8px', fontSize:13, cursor:'pointer', flexShrink:0, lineHeight:1 }}
                >{p.is_active ? '👁' : '🚫'}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex:1, padding:'20px 24px', maxWidth:900 }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#555' }}>Loading...</div>
          ) : activePlan ? (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{currentPlan?.name}</span>
                    {currentPlan && !currentPlan.is_active && (
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:'#EF4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:4, padding:'2px 8px' }}>HIDDEN</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:'#555', marginTop:2 }}>{planExercises.length} exercises · Click to expand & manage frames</div>
                </div>
              </div>
              {planExercises.map(ex => (
                <ExerciseCard key={ex.id} ex={ex} onSaveFrames={handleSaveFrames} onDelete={handleDelete} onSaveName={handleSaveName} />
              ))}
              <AddExerciseForm planId={activePlan} nextIndex={planExercises.length} onAdd={handleAdd} />
            </>
          ) : (
            <div style={{ padding:60, textAlign:'center', color:'#555' }}>Select a plan from the sidebar</div>
          )}
        </div>
      </div>
    </div>
  );
}
