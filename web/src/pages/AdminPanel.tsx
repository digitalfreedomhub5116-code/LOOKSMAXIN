import { useState, useEffect, useRef } from 'react';
import { fetchAllPlans, fetchAllExercises, updateExerciseFrames, addExercise, deleteExercise, reindexExercises, togglePlanVisibility, updateExerciseName, copyExerciseToDay } from '../lib/workoutApi';
import type { WorkoutPlan, WorkoutExercise, WorkoutFrame } from '../lib/workoutApi';

const ADMIN_ID = 'admin';
const ADMIN_PW = 'LYNXAIPASSOWORDSECURED@34';
const LS_KEY = 'lynx_admin_auth';
function isAdminAuthed(): boolean { try { return localStorage.getItem(LS_KEY) === 'true' || sessionStorage.getItem(LS_KEY) === 'true'; } catch { return false; } }

/* ═══ Login ═══ */
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState(''); const [pw, setPw] = useState(''); const [remember, setRemember] = useState(true); const [err, setErr] = useState('');
  const submit = () => { if (id === ADMIN_ID && pw === ADMIN_PW) { if (remember) localStorage.setItem(LS_KEY, 'true'); else sessionStorage.setItem(LS_KEY, 'true'); onLogin(); } else setErr('Invalid credentials'); };
  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:380, padding:32, background:'#111', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#C8A84E', marginBottom:8 }}>LYNX AI</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:24 }}>Admin Panel</h1>
        {err && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#EF4444', marginBottom:12 }}>{err}</div>}
        <label style={{ fontSize:12, fontWeight:600, color:'#888', display:'block', marginBottom:4 }}>Username</label>
        <input value={id} onChange={e=>setId(e.target.value)} placeholder="admin" style={{ width:'100%', padding:'12px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:14, marginBottom:14, outline:'none', boxSizing:'border-box' }} onKeyDown={e=>e.key==='Enter'&&submit()} />
        <label style={{ fontSize:12, fontWeight:600, color:'#888', display:'block', marginBottom:4 }}>Password</label>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" style={{ width:'100%', padding:'12px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:14, marginBottom:14, outline:'none', boxSizing:'border-box' }} onKeyDown={e=>e.key==='Enter'&&submit()} />
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer' }}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{ accentColor:'#C8A84E' }} /><span style={{ fontSize:13, color:'#888' }}>Remember me</span></label>
        <button onClick={submit} style={{ width:'100%', padding:'14px', background:'#C8A84E', border:'none', borderRadius:10, fontSize:15, fontWeight:700, color:'#000', cursor:'pointer' }}>Sign In</button>
      </div>
    </div>
  );
}

/* ═══ Frame Editor ═══ */
function FrameEditor({ frames, onChange }: { frames: WorkoutFrame[]; onChange: (f: WorkoutFrame[]) => void }) {
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#C8A84E', letterSpacing:1 }}>FRAMES ({frames.length})</span>
        <button onClick={()=>onChange([...frames,{url:'',duration_ms:2000}])} style={{ padding:'3px 10px', background:'rgba(200,168,78,0.15)', border:'1px solid rgba(200,168,78,0.3)', borderRadius:5, color:'#C8A84E', fontSize:10, fontWeight:700, cursor:'pointer' }}>+ Frame</button>
      </div>
      {frames.map((f,i)=>(
        <div key={i} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4, padding:'6px 8px', background:'rgba(255,255,255,0.02)', borderRadius:6, border:'1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#555', minWidth:14 }}>#{i+1}</span>
          <input placeholder="Image URL" value={f.url} onChange={e=>{const c=[...frames];c[i]={...c[i],url:e.target.value};onChange(c);}} style={{ flex:1, padding:'5px 7px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, color:'#fff', fontSize:11, outline:'none' }} />
          <input type="number" value={f.duration_ms} onChange={e=>{const c=[...frames];c[i]={...c[i],duration_ms:Number(e.target.value)||0};onChange(c);}} style={{ width:60, padding:'5px 6px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, color:'#C8A84E', fontSize:11, textAlign:'center', outline:'none' }} />
          <span style={{ fontSize:8, color:'#555' }}>ms</span>
          {f.url && <img src={f.url} alt="" style={{ width:28, height:28, borderRadius:3, objectFit:'cover' }} onError={e=>(e.currentTarget.style.display='none')} />}
          <button onClick={()=>onChange(frames.filter((_,j)=>j!==i))} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:3, color:'#EF4444', fontSize:10, padding:'1px 5px', cursor:'pointer' }}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ═══ Exercise Card ═══ */
function ExerciseCard({ ex, onSave, onDelete, onCopy }: { ex: WorkoutExercise; onSave: (id:string,frames:WorkoutFrame[])=>Promise<void>; onDelete: (id:string)=>Promise<void>; onCopy: (ex:WorkoutExercise)=>void }) {
  const [expanded, setExpanded] = useState(false);
  const [frames, setFrames] = useState<WorkoutFrame[]>(ex.frames);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(ex.name);
  const [savingName, setSavingName] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(()=>{ setFrames(ex.frames); },[ex.frames]);
  useEffect(()=>{ setNameVal(ex.name); },[ex.name]);
  useEffect(()=>{ if(editingName&&ref.current) ref.current.focus(); },[editingName]);

  const dirty = JSON.stringify(frames) !== JSON.stringify(ex.frames);
  const save = async()=>{ setSaving(true); await onSave(ex.id, frames); setSaving(false); };
  const saveName = async()=>{ if(!nameVal.trim()||nameVal===ex.name){setEditingName(false);setNameVal(ex.name);return;} setSavingName(true); await updateExerciseName(ex.id,nameVal.trim()); setSavingName(false); setEditingName(false); };

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, marginBottom:4, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', cursor:'pointer' }} onClick={()=>!editingName&&setExpanded(!expanded)}>
        <div style={{ width:28, height:28, borderRadius:6, background:'rgba(200,168,78,0.08)', border:'1px solid rgba(200,168,78,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#C8A84E', flexShrink:0 }}>{ex.exercise_index+1}</div>
        <div style={{ flex:1, minWidth:0 }}>
          {editingName ? (
            <div style={{ display:'flex', gap:4, alignItems:'center' }} onClick={e=>e.stopPropagation()}>
              <input ref={ref} value={nameVal} onChange={e=>setNameVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveName();if(e.key==='Escape'){setEditingName(false);setNameVal(ex.name);}}} style={{ flex:1, padding:'3px 6px', background:'transparent', border:'1px solid rgba(200,168,78,0.4)', borderRadius:4, color:'#fff', fontSize:12, fontWeight:700, outline:'none' }} />
              <button onClick={saveName} disabled={savingName} style={{ padding:'3px 8px', background:'#C8A84E', border:'none', borderRadius:4, color:'#000', fontSize:10, fontWeight:700, cursor:'pointer' }}>{savingName?'...':'✓'}</button>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ex.name}</span>
              <button onClick={e=>{e.stopPropagation();setEditingName(true);}} style={{ background:'none', border:'none', color:'#555', fontSize:11, cursor:'pointer', padding:'1px 3px' }}>✏️</button>
            </div>
          )}
          <div style={{ fontSize:10, color:'#555', marginTop:1 }}>{ex.sets}s · {ex.reps>0?`${ex.reps}r`:`${ex.duration}s`} · {'⭐'.repeat(ex.difficulty)} · {ex.frames.length}f</div>
        </div>
        <button onClick={e=>{e.stopPropagation();onCopy(ex);}} title="Copy exercise" style={{ padding:'4px 8px', background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:5, color:'#60A5FA', fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0 }}>📋 Copy</button>
        <span style={{ color:'#555', fontSize:12 }}>{expanded?'▲':'▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding:'0 12px 10px', borderTop:'1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize:11, color:'#888', marginTop:8, lineHeight:1.5, marginBottom:6 }}>{ex.description}</div>
          <FrameEditor frames={frames} onChange={setFrames} />
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            {dirty && <button onClick={save} disabled={saving} style={{ flex:1, padding:'8px', background:'#C8A84E', border:'none', borderRadius:6, color:'#000', fontSize:12, fontWeight:700, cursor:'pointer', opacity:saving?0.5:1 }}>{saving?'Saving...':'💾 Save'}</button>}
            <button onClick={()=>{if(confirm(`Delete "${ex.name}"?`))onDelete(ex.id);}} style={{ padding:'8px 12px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#EF4444', fontSize:11, fontWeight:700, cursor:'pointer' }}>🗑</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Add Exercise Form ═══ */
function AddForm({ planId, day, nextIdx, onAdd }: { planId:string; day:number; nextIdx:number; onAdd:()=>void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [dur, setDur] = useState(120); const [sets, setSets] = useState(3); const [reps, setReps] = useState(0); const [diff, setDiff] = useState<1|2|3>(1); const [desc, setDesc] = useState(''); const [saving, setSaving] = useState(false);
  const submit = async()=>{ if(!name.trim())return; setSaving(true); await addExercise(planId,day,{plan_id:planId,day_number:day,exercise_index:nextIdx,name,duration:dur,sets,reps,difficulty:diff,description:desc,frames:[]}); setSaving(false); setOpen(false); setName('');setDur(120);setSets(3);setReps(0);setDiff(1);setDesc(''); onAdd(); };
  if(!open) return <button onClick={()=>setOpen(true)} style={{ width:'100%', padding:'8px', background:'rgba(200,168,78,0.04)', border:'1px dashed rgba(200,168,78,0.2)', borderRadius:8, color:'#C8A84E', fontSize:11, fontWeight:700, cursor:'pointer', marginTop:2 }}>+ Add Exercise</button>;
  const inp = (l:string,v:any,s:any,t='text')=>(<div style={{marginBottom:6}}><label style={{fontSize:10,color:'#888',display:'block',marginBottom:2}}>{l}</label><input type={t} value={v} onChange={e=>s(t==='number'?Number(e.target.value):e.target.value)} style={{width:'100%',padding:'6px 8px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:5,color:'#fff',fontSize:12,outline:'none',boxSizing:'border-box'}} /></div>);
  return (
    <div style={{ background:'rgba(200,168,78,0.03)', border:'1px solid rgba(200,168,78,0.12)', borderRadius:8, padding:12, marginTop:2 }}>
      {inp('Name',name,setName)}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>{inp('Duration(s)',dur,setDur,'number')}{inp('Sets',sets,setSets,'number')}{inp('Reps(0=hold)',reps,setReps,'number')}</div>
      {inp('Description',desc,setDesc)}
      <div style={{display:'flex',gap:6,marginTop:6}}>
        <button onClick={submit} disabled={saving} style={{flex:1,padding:'8px',background:'#C8A84E',border:'none',borderRadius:6,color:'#000',fontSize:12,fontWeight:700,cursor:'pointer'}}>{saving?'Adding...':'Add'}</button>
        <button onClick={()=>setOpen(false)} style={{padding:'8px 12px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,color:'#888',fontSize:11,cursor:'pointer'}}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══ Day Section ═══ */
function DaySection({ planId, day, exercises, clipboard, onCopy, onPaste, onSave, onDelete, onReload }: {
  planId:string; day:number; exercises:WorkoutExercise[]; clipboard:WorkoutExercise|null;
  onCopy:(ex:WorkoutExercise)=>void; onPaste:(planId:string,day:number,idx:number)=>Promise<void>;
  onSave:(id:string,frames:WorkoutFrame[])=>Promise<void>; onDelete:(id:string,day:number)=>Promise<void>; onReload:()=>void;
}) {
  const [open, setOpen] = useState(false);
  const phase = day<=10?'Foundation':day<=20?'Intensify':'Mastery';
  const phaseColor = day<=10?'#34D399':day<=20?'#60A5FA':'#C8A84E';

  return (
    <div style={{ marginBottom:6, border:'1px solid rgba(255,255,255,0.04)', borderRadius:10, overflow:'hidden', background: open?'rgba(255,255,255,0.01)':'transparent' }}>
      <div onClick={()=>setOpen(!open)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`${phaseColor}12`, border:`1px solid ${phaseColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:phaseColor, flexShrink:0 }}>{day}</div>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Day {day}</span>
          <span style={{ fontSize:10, color:phaseColor, marginLeft:8, fontWeight:600 }}>{phase}</span>
          <div style={{ fontSize:10, color:'#555', marginTop:1 }}>{exercises.length} exercise{exercises.length!==1?'s':''}</div>
        </div>
        {clipboard && (
          <button onClick={e=>{e.stopPropagation();onPaste(planId,day,exercises.length);}} style={{ padding:'4px 10px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:5, color:'#34D399', fontSize:10, fontWeight:700, cursor:'pointer' }}>📥 Paste</button>
        )}
        <span style={{ color:'#555', fontSize:12 }}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{ padding:'0 14px 10px' }}>
          {exercises.length===0 && <div style={{ fontSize:11, color:'#555', padding:'8px 0', textAlign:'center' }}>No exercises yet</div>}
          {exercises.map(ex=>(
            <ExerciseCard key={ex.id} ex={ex} onSave={onSave} onDelete={id=>onDelete(id,day)} onCopy={onCopy} />
          ))}
          <AddForm planId={planId} day={day} nextIdx={exercises.length} onAdd={onReload} />
        </div>
      )}
    </div>
  );
}

/* ═══ Main Admin Panel ═══ */
export default function AdminPanel() {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Map<string, WorkoutExercise[]>>(new Map());
  const [activePlan, setActivePlan] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [clipboard, setClipboard] = useState<WorkoutExercise|null>(null);

  const load = async()=>{ setLoading(true); const [p,e]=await Promise.all([fetchAllPlans(),fetchAllExercises()]); setPlans(p); setExercises(e); if(!activePlan&&p.length>0)setActivePlan(p[0].id); setLoading(false); };
  useEffect(()=>{ if(authed) load(); },[authed]);

  if(!authed) return <AdminLogin onLogin={()=>setAuthed(true)} />;

  const planExercises = activePlan ? (exercises.get(activePlan)||[]) : [];
  const currentPlan = plans.find(p=>p.id===activePlan);

  // Group exercises by day
  const dayMap = new Map<number, WorkoutExercise[]>();
  for(const ex of planExercises){ if(!dayMap.has(ex.day_number)) dayMap.set(ex.day_number,[]); dayMap.get(ex.day_number)!.push(ex); }

  const handleSave = async(id:string,frames:WorkoutFrame[])=>{ await updateExerciseFrames(id,frames); await load(); };
  const handleDelete = async(id:string,day:number)=>{ await deleteExercise(id); if(activePlan) await reindexExercises(activePlan,day); await load(); };
  const handleCopy = (ex:WorkoutExercise)=>{ setClipboard(ex); };
  const handlePaste = async(targetPlan:string,targetDay:number,targetIdx:number)=>{ if(!clipboard)return; await copyExerciseToDay(clipboard,targetPlan,targetDay,targetIdx); await load(); };
  const handleToggle = async(id:string,active:boolean)=>{ await togglePlanVisibility(id,!active); await load(); };
  const handleLogout = ()=>{ localStorage.removeItem(LS_KEY); try{sessionStorage.removeItem(LS_KEY);}catch{}; setAuthed(false); };

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0F', fontFamily:"'Inter',sans-serif", color:'#fff' }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(10,10,15,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:'#C8A84E' }}>LYNX AI</span>
          <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Admin Panel</span>
          {clipboard && <span style={{ fontSize:10, fontWeight:700, color:'#34D399', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:4, padding:'2px 8px' }}>📋 Copied: {clipboard.name}</span>}
        </div>
        <button onClick={handleLogout} style={{ padding:'5px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:5, color:'#EF4444', fontSize:11, fontWeight:600, cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ display:'flex', maxWidth:1200, margin:'0 auto' }}>
        {/* Sidebar */}
        <div style={{ width:240, flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)', padding:'12px 0', minHeight:'calc(100vh - 50px)' }}>
          <div style={{ padding:'0 14px', fontSize:9, fontWeight:700, letterSpacing:1.5, color:'#555', marginBottom:10 }}>PLANS ({plans.length})</div>
          {plans.map(p=>(
            <div key={p.id} style={{ padding:'8px 14px', cursor:'pointer', background:activePlan===p.id?'rgba(200,168,78,0.08)':'transparent', borderLeft:activePlan===p.id?'3px solid #C8A84E':'3px solid transparent', opacity:p.is_active?1:0.4, transition:'all 0.15s' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div onClick={()=>setActivePlan(p.id)} style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:activePlan===p.id?'#fff':'#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize:10, color:'#444', marginTop:1 }}>{exercises.get(p.id)?.length||0} ex{!p.is_active?' · HIDDEN':''}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();handleToggle(p.id,p.is_active);}} title={p.is_active?'Hide':'Show'} style={{ background:p.is_active?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:p.is_active?'1px solid rgba(34,197,94,0.25)':'1px solid rgba(239,68,68,0.25)', borderRadius:5, padding:'3px 6px', fontSize:12, cursor:'pointer', flexShrink:0, lineHeight:1 }}>{p.is_active?'👁':'🚫'}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex:1, padding:'16px 20px', maxWidth:900, overflowY:'auto' }}>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'#555' }}>Loading...</div>
          : activePlan && currentPlan ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{currentPlan.name}</span>
                {!currentPlan.is_active && <span style={{ fontSize:9, fontWeight:700, color:'#EF4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:3, padding:'1px 6px' }}>HIDDEN</span>}
                <span style={{ fontSize:11, color:'#555', marginLeft:'auto' }}>{planExercises.length} total exercises across {dayMap.size} days</span>
              </div>
              {Array.from({length:30},(_,i)=>i+1).map(day=>(
                <DaySection key={day} planId={activePlan} day={day} exercises={dayMap.get(day)||[]} clipboard={clipboard} onCopy={handleCopy} onPaste={handlePaste} onSave={handleSave} onDelete={handleDelete} onReload={load} />
              ))}
            </>
          ) : <div style={{ padding:60, textAlign:'center', color:'#555' }}>Select a plan</div>}
        </div>
      </div>
    </div>
  );
}
