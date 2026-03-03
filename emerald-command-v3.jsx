import { useState, useEffect, useCallback, useRef } from "react";

// ─── THEME ───
const C = {
  bg: '#0a0a0a', sidebar: '#070707',
  card: 'rgba(255,255,255,0.025)', cardBorder: 'rgba(255,255,255,0.06)',
  cardHover: 'rgba(255,255,255,0.045)', div: 'rgba(255,255,255,0.04)',
  t1: '#e4e4e7', t2: 'rgba(255,255,255,0.5)', t3: 'rgba(255,255,255,0.25)',
  t4: 'rgba(255,255,255,0.15)', t5: 'rgba(255,255,255,0.08)',
  em: '#10b981', emDark: '#059669', emFaint: 'rgba(16,185,129,0.06)',
  warn: '#f59e0b', warnLight: '#fcd34d', warnFaint: 'rgba(245,158,11,0.08)',
  crit: '#ef4444', critLight: '#fca5a5', critFaint: 'rgba(239,68,68,0.06)',
  info: '#6366f1', infoLight: '#a5b4fc',
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
  z6: '#52525b', z9: '#18181b',
};
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif';

// ─── INJECT KEYFRAMES ───
const styleId = 'ec-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const st = document.createElement('style');
  st.id = styleId;
  st.textContent = `
    @keyframes ecPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes ecFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ecRingFill { from{stroke-dashoffset:var(--ec-circ)} to{stroke-dashoffset:var(--ec-off)} }
    @keyframes ecBreath { 0%,100%{box-shadow:0 0 16px rgba(239,68,68,0.03)} 50%{box-shadow:0 0 24px rgba(239,68,68,0.1)} }
    @keyframes ecCheckPop { 0%{transform:scale(0.8)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
    @keyframes ecDraw { to{stroke-dashoffset:0} }
    @keyframes ecConfetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-120px) rotate(720deg);opacity:0} }
    @keyframes ecFlash { 0%{opacity:0} 20%{opacity:1} 100%{opacity:0} }
    @keyframes ecSlideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ecBellShake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(12deg)} 40%{transform:rotate(-10deg)} 60%{transform:rotate(6deg)} 80%{transform:rotate(-3deg)} }
    .ec-ring-anim { animation: ecRingFill 1s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ec-fadeup { animation: ecFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
    .ec-breath { animation: ecBreath 3s ease-in-out infinite; }
    .ec-checkpop { animation: ecCheckPop 0.25s cubic-bezier(0.34,1.56,0.64,1); }
    .ec-draw { animation: ecDraw 1.2s ease-in-out forwards; }
    .ec-confetti { animation: ecConfetti 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
    .ec-flash { animation: ecFlash 0.8s ease-out forwards; }
    .ec-slidedown { animation: ecSlideDown 0.2s ease-out; }
    .ec-bellshake { animation: ecBellShake 0.5s ease-in-out; }
  `;
  document.head.appendChild(st);
}

// ─── SVG HELPERS ───
function Ring({ pct, size = 52, sw = 4, delay = 0 }) {
  const r = (size - sw) / 2, ci = 2 * Math.PI * r, off = ci - (pct / 100) * ci;
  const col = pct >= 80 ? C.em : pct >= 50 ? C.warn : C.crit;
  const [counting, setCounting] = useState(0);
  useEffect(() => {
    let frame = 0; const total = Math.max(1, Math.round(pct));
    const step = 800 / total;
    const t = setTimeout(() => {
      const id = setInterval(() => { frame++; setCounting(frame); if (frame >= total) clearInterval(id); }, step);
    }, delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={sw}
          strokeDasharray={ci} strokeDashoffset={ci}
          strokeLinecap="round" className="ec-ring-anim"
          style={{ '--ec-circ': ci, '--ec-off': off, animationDelay: `${delay}ms` }}/>
      </svg>
      <span style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
        fontSize: size < 40 ? 9 : size < 48 ? 11 : 13, fontWeight:800, color:C.t1, fontFamily:F,
        letterSpacing: -0.5 }}>{counting}%</span>
    </div>
  );
}

function Spark({ data, color, w = 80, h = 22, delay = 0 }) {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-mn)/rng)*(h-4)+2}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display:'block', marginTop: 8, overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="100" strokeDashoffset="100"
        className="ec-draw" style={{ animationDelay: `${delay}ms` }}/>
    </svg>
  );
}

function Dot({ color, size = 8 }) {
  return <div style={{ width:size,height:size,borderRadius:'50%',backgroundColor:color,animation:'ecPulse 2s ease-in-out infinite',flexShrink:0,
    boxShadow:`0 0 6px ${color}40` }}/>;
}

function Chev({ open, color = C.t3, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
      style={{ transform: open?'rotate(90deg)':'rotate(0)', transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)', flexShrink:0 }}>
      <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const Check = ({s=12,c='white'}) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Clock = () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const WarningTri = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L1 14h14L8 1.5z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v3.5M8 11.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const BellIcon = ({size=16,color=C.t2}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 0 1 8 0c0 2.5 1 4 2 5H2c1-1 2-2.5 2-5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
const NoteIcon = ({size=10,color=C.t3}) => <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 2h8v8H6l-4-4V2z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 5h4M4 7h2" stroke={color} strokeWidth="1" strokeLinecap="round"/></svg>;

// ─── NAV ICONS ───
function NI({ name, color }) {
  const p = { stroke:color, strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round', fill:'none' };
  const m = {
    grid:<><rect x="2" y="2" width="5" height="5" rx="1" {...p}/><rect x="9" y="2" width="5" height="5" rx="1" {...p}/><rect x="2" y="9" width="5" height="5" rx="1" {...p}/><rect x="9" y="9" width="5" height="5" rx="1" {...p}/></>,
    check:<path d="M4 8l2.5 2.5L12 4" {...p}/>,
    clip:<><rect x="4" y="2" width="8" height="12" rx="1" {...p}/><path d="M6 2V1h4v1M7 7h2M7 10h4" {...p}/></>,
    therm:<path d="M8 2v7.5a2.5 2.5 0 1 1-2 0V2a1 1 0 0 1 2 0z" {...p}/>,
    book:<><path d="M2 3h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H2V3z" {...p}/><path d="M14 3h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H14V3z" {...p}/></>,
    spark:<path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" {...p}/>,
    file:<><path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" {...p}/><path d="M10 2v4h4" {...p}/></>,
    shield:<path d="M8 1L2 4v4c0 4.5 3 7.5 6 9 3-1.5 6-4.5 6-9V4L8 1z" {...p}/>,
    users:<><circle cx="6" cy="5" r="2.5" {...p}/><path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" {...p}/></>,
    gear:<><circle cx="8" cy="8" r="2.5" {...p}/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" {...p}/></>,
    sun:<><circle cx="8" cy="8" r="3" {...p}/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" {...p}/></>,
  };
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{m[name]}</svg>;
}

// ─── PRIORITY CONFIG ───
const PRIO = {
  high: { color: C.high, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.12)', label: 'High' },
  medium: { color: C.medium, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.12)', label: 'Med' },
  low: { color: C.low, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.12)', label: 'Low' },
};

// ─── DATA ───
const NAV = [
  { s:'DAILY', items:[{l:'Dashboard',i:'grid',active:true},{l:'My Tasks',i:'check',b:4},{l:'RP Log',i:'clip'},{l:'Temp Log',i:'therm',b:1,bc:'amber'}] },
  { s:'RECORDS', items:[{l:'Training Logs',i:'book'},{l:'Cleaning Rota',i:'spark',b:20,bc:'red'},{l:'Documents',i:'file'}] },
  { s:'COMPLIANCE', items:[{l:'Safeguarding',i:'shield'},{l:'Staff Training',i:'users'}] },
  { s:'SYSTEM', items:[{l:'Settings',i:'gear'},{l:'Light Mode',i:'sun'}] },
];

const KEYS = [
  {id:'rpNotice',label:'RP Notice',em:'📋'},{id:'cdCheck',label:'CD Check',em:'💊'},
  {id:'opening',label:'Opening',em:'🔓'},{id:'closing',label:'Closing',em:'🔒'},
  {id:'fridgeTemp',label:'Fridge Temp',em:'🌡️'},
];

const ASSIGNEE = { SN:C.em, MH:C.em, MJ:C.em, SS:C.em, AS:C.info, UK:'#0ea5e9' };

// RP Sub-checks for Daily RP Checks
const RP_SUBCHECKS = [
  {id:'rpsub1',label:'RP notice displayed and visible'},
  {id:'rpsub2',label:'RP signed in on PMR system'},
  {id:'rpsub3',label:'CD register checked and balanced'},
  {id:'rpsub4',label:'Dispensary area secure and compliant'},
  {id:'rpsub5',label:'Fridge temperature within range'},
];

const TODAY_TASKS = [
  {id:'t1',title:'Temperature Log',assignee:'MJ',tag:'Cleaning',time:'by 09:00',urgent:'red',priority:'high',
    note:'Record fridge temp on RxWeb. If outside 2-8°C range, escalate immediately to pharmacist. Check both main fridge and backup unit.'},
  {id:'t2',title:'Daily RP Checks',assignee:'AS',tag:'RP Check',time:'by 10:00',urgent:'amber',sub:'0/5',priority:'high',hasSubchecks:true,
    note:'Complete all 5 RP obligation checks. Must be done by the Responsible Pharmacist on duty. Log completion on PharmSmart.'},
  {id:'t3',title:'Dispensary Clean',assignee:'MH',tag:'Cleaning',priority:'medium',
    note:'Wipe down all dispensary surfaces, check for spillages, ensure workspace is clear. Use approved cleaning solution.'},
  {id:'t4',title:'Counter & Surfaces Wipe',assignee:'UK',tag:'Cleaning',priority:'low',
    note:'Clean all customer-facing surfaces and counter tops. Check hand sanitiser levels.'},
];

const WEEKLY = [
  {id:'w1',title:'Kitchen Clean',assignee:'SS',priority:'medium',note:'Deep clean kitchen area including sink, worktops, and appliances.'},
  {id:'w2',title:'Bathroom Clean',assignee:'SS',priority:'medium',note:'Full bathroom clean including toilet, sink, floor, and supplies check.'},
  {id:'w3',title:'Floor Clean',assignee:'UK',priority:'medium',note:'Sweep and mop all dispensary and public area floors.'},
  {id:'w4',title:'Tidy Cream Shelves',assignee:'SN',priority:'low',note:'Reorganise cream shelves. Check expiry dates. Rotate stock.'},
  {id:'w5',title:'Tidy Liquid Shelf',assignee:'MH',priority:'low',note:'Reorganise liquid medicines shelf. Check for leaks and expiries.'},
  {id:'w6',title:'Empty Waste',assignee:'MJ',priority:'medium',note:'Empty all waste bins. Separate pharmaceutical waste correctly.'},
  {id:'w7',title:'Empty Recycling',assignee:'SS',priority:'low',note:'Empty all recycling bins. Ensure correct waste segregation.'},
  {id:'w8',title:'Confidential Waste',assignee:'SN',priority:'high',note:'Collect all confidential waste and place in Shred-it bin. Never overfill.'},
  {id:'w9',title:'Put Splits Away',assignee:'SS',priority:'low',note:'Return split pack items to correct shelf locations.'},
  {id:'w10',title:'Extra Stock in Robot',assignee:'SS',priority:'medium',note:'Load additional stock into dispensing robot. Verify barcode scanning.'},
  {id:'w11',title:'Robot Maintenance',assignee:'SS',priority:'high',note:'Run robot diagnostic. Clean dispensing mechanism. Check error logs.'},
  {id:'w12',title:'Consultation Room Clean',assignee:'SN',priority:'medium',note:'Clean and prepare consultation room. Check equipment.'},
  {id:'w13',title:'CD Balance Check',assignee:'MH',priority:'high',note:'Verify CD register balances against physical stock. Report any discrepancies to pharmacist.'},
];

const FORT = [
  {id:'f1',title:'Fridge Quick Clean',assignee:'UK',tag:'Cleaning',priority:'medium',note:'Quick wipe of fridge shelves. Remove expired items.'},
  {id:'f2',title:'Straighten Up Fridge Stock',assignee:'SN',tag:'Cleaning',priority:'low',note:'Reorganise fridge stock by expiry date. FEFO rotation.'},
  {id:'f3',title:'Fortnightly RP Checks',assignee:'AS',tag:'RP Check',sub:'0/4',priority:'high',note:'Extended RP compliance review covering SOPs, incidents, and training records.'},
];

const MONTHLY = [
  {id:'m1',title:'Deep Fridge Clean',assignee:'SS',tag:'Cleaning',priority:'high',note:'Complete fridge deep clean. Remove all stock, clean shelves, check seals and temperature probe.'},
  {id:'m2',title:'Monthly To Do List',assignee:'SS',tag:'Cleaning',priority:'medium',note:'Review and update monthly admin checklist. File completed records.'},
  {id:'m3',title:'Replace Near Miss Record',assignee:'UK',tag:'Cleaning',priority:'medium',note:'Archive current near miss log and start new recording sheet on PharmSmart.'},
];

const TODOS = [
  {id:'td1',title:'Chase up patient feedback',days:'6d'},
  {id:'td2',title:'Chase up website',days:'6d'},
  {id:'td3',title:'Parking bay council request',days:'6d'},
  {id:'td4',title:'Chase up medicinal waste disposal',days:'6d'},
];

const COMPLIANCE_DATA = [
  {label:'DOCUMENTS',pct:100,detail:'All current',trend:'up',trendVal:'15%',data:[85,88,92,95,100,100],color:C.em},
  {label:'TRAINING',pct:100,detail:'All complete',trend:'up',trendVal:'8%',data:[60,70,80,90,100,100],color:C.em},
  {label:'CLEANING',pct:0,detail:'20 overdue',trend:'down',trendVal:'20%',data:[40,35,25,18,10,0],color:C.crit,alert:true},
  {label:'SAFEGUARDING',pct:100,detail:'All current',trend:'stable',trendVal:'',data:[95,98,100,100,100,100],color:C.em},
];

const SESSIONS = [
  {start:'09:02',end:'13:15',name:'Amjid Shakoor',dur:'4h 13m'},
  {start:'13:20',end:'ongoing',name:'Amjid Shakoor',dur:null},
];

const NOTIFICATIONS = [
  {id:'n1',type:'critical',title:'Cleaning at 0%',desc:'20 cleaning tasks are overdue',time:'2h ago',read:false},
  {id:'n2',type:'warning',title:'Temperature log due',desc:'Fridge temp not recorded today',time:'3h ago',read:false},
  {id:'n3',type:'warning',title:'GPhC inspection due',desc:'Last inspection was 14 months ago',time:'1d ago',read:false},
  {id:'n4',type:'info',title:'Training complete',desc:'Safeguarding training 100% across all staff',time:'2d ago',read:true},
  {id:'n5',type:'info',title:'Documents updated',desc:'All pharmacy documents are now current',time:'3d ago',read:true},
];

// ─── CONFETTI COMPONENT ───
function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({length:24}, (_,i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.4,
    color: [C.em, C.emDark, '#34d399', '#6ee7b7', C.warnLight, '#a78bfa'][i % 6],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:100}}>
      {pieces.map(p => (
        <div key={p.id} className="ec-confetti" style={{
          position:'absolute', bottom:'40%', left:`${p.left}%`,
          width:p.size, height:p.size, borderRadius: p.id%3===0 ? '50%' : 1,
          backgroundColor:p.color, animationDelay:`${p.delay}s`,
          transform:`rotate(${p.rotation}deg)`,
        }}/>
      ))}
      <div className="ec-flash" style={{
        position:'absolute',inset:0,
        background:'radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.15), transparent 60%)',
      }}/>
    </div>
  );
}

// ─── MAIN ───
export default function Dashboard() {
  const [mob, setMob] = useState(false);
  const [sb, setSb] = useState(false);
  const [rp, setRp] = useState(true);
  const [elapsed, setElapsed] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [keys, setKeys] = useState({rpNotice:{d:false,t:null},cdCheck:{d:false,t:null},opening:{d:false,t:null},closing:{d:false,t:null},fridgeTemp:{d:false,t:null,v:null}});
  const [showFridge, setShowFridge] = useState(false);
  const [fridgeVal, setFridgeVal] = useState('');
  const [sessOpen, setSessOpen] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [justCompleted, setJustCompleted] = useState(null);
  const [hovNav, setHovNav] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [justChecked, setJustChecked] = useState(null);
  const [rpSubChecks, setRpSubChecks] = useState(new Set());
  const [checkedTodo, setCheckedTodo] = useState(new Set());
  const [acc, setAcc] = useState({today:true,weekly:false,fort:false,monthly:false});
  const [hovCard, setHovCard] = useState(null);
  const [hovTile, setHovTile] = useState(null);
  const [hovRow, setHovRow] = useState(null);
  const [hovStat, setHovStat] = useState(null);
  const [scrollFade, setScrollFade] = useState(true);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedSubchecks, setExpandedSubchecks] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [notifRead, setNotifRead] = useState(new Set(['n4','n5']));
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevAllDone, setPrevAllDone] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => { const c=()=>setMob(window.innerWidth<768); c(); window.addEventListener('resize',c); return()=>window.removeEventListener('resize',c); }, []);

  // Live clock
  useEffect(() => {
    const update = () => {
      const n = new Date();
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      setLiveTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setLiveDate(`${days[n.getDay()]}, ${n.getDate()} ${months[n.getMonth()]} ${n.getFullYear()}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // RP elapsed time
  useEffect(() => {
    const calc=()=>{ const n=new Date(),s=new Date(); s.setHours(9,2,0,0); const d=Math.max(0,n-s); setElapsed(`${Math.floor(d/3600000)}h ${Math.floor((d%3600000)/60000)}m`); };
    calc(); const id=setInterval(calc,60000); return()=>clearInterval(id);
  }, []);

  // Scroll fade
  const onScroll = useCallback(() => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
    setScrollFade(!atBottom);
  }, []);
  useEffect(() => { window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, [onScroll]);

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Bell shake on mount
  useEffect(() => { setTimeout(()=>{setBellShake(true); setTimeout(()=>setBellShake(false),600);}, 1500); }, []);

  // Confetti detection
  const todayChecked = TODAY_TASKS.filter(t=>checked.has(t.id)).length;
  const allTodayDone = todayChecked === TODAY_TASKS.length;

  useEffect(() => {
    if (allTodayDone && !prevAllDone) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
    }
    setPrevAllDone(allTodayDone);
  }, [allTodayDone, prevAllDone]);

  const now = () => { const n=new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; };

  const toggleCheck = (id) => {
    setChecked(p => { const n=new Set(p); if(n.has(id)){n.delete(id)}else{n.add(id); setJustChecked(id); setTimeout(()=>setJustChecked(null),350);} return n; });
  };
  const toggleTodo = (id) => setCheckedTodo(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleRpSub = (id) => setRpSubChecks(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  const handleKey = (id) => {
    if(keys[id].d) return;
    if(id==='fridgeTemp'){setShowFridge(true);return;}
    setPressed(id); setTimeout(()=>{ setPressed(null); setJustCompleted(id); setTimeout(()=>setJustCompleted(null),400); },150);
    setKeys(p=>({...p,[id]:{d:true,t:now()}}));
  };

  const submitFridge = () => {
    if(!fridgeVal) return;
    setKeys(p=>({...p,fridgeTemp:{d:true,t:now(),v:fridgeVal}}));
    setShowFridge(false); setFridgeVal('');
  };

  const markNotifRead = (id) => setNotifRead(p => new Set([...p, id]));
  const unreadCount = NOTIFICATIONS.filter(n => !notifRead.has(n.id)).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ─── SUBCOMPONENTS ───
  const PrioBadge = ({level}) => {
    const p = PRIO[level]; if (!p) return null;
    return <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,letterSpacing:0.5,textTransform:'uppercase',
      backgroundColor:p.bg,color:p.color,border:`1px solid ${p.border}`}}>{p.label}</span>;
  };

  const Tag = ({t}) => {
    const isRP = t==='RP Check';
    return <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,whiteSpace:'nowrap',fontWeight:500,letterSpacing:0.2,
      backgroundColor:isRP?'rgba(99,102,241,0.1)':C.z9,
      color:isRP?C.infoLight:'#a1a1aa',
      border:`1px solid ${isRP?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.06)'}`}}>{t}</span>;
  };

  const TimeBadge = ({time,urg}) => {
    const isRed = urg==='red';
    return <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap',fontWeight:500,
      backgroundColor:isRed?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)',
      color:isRed?C.critLight:C.warnLight,
      border:`1px solid ${isRed?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)'}`}}>
      <Clock/>{time}</span>;
  };

  const Av = ({initials}) => (
    <div style={{width:26,height:26,borderRadius:'50%',backgroundColor:ASSIGNEE[initials]||C.em,
      display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',flexShrink:0,
      boxShadow:`0 0 0 2px ${C.bg}, 0 0 0 3px ${(ASSIGNEE[initials]||C.em)}30`}}>{initials}</div>
  );

  const CB = ({id,isChecked,onToggle}) => (
    <div onClick={onToggle} style={{width:18,height:18,borderRadius:5,flexShrink:0,cursor:'pointer',position:'relative',
      border:`2px solid ${isChecked?C.em:'rgba(255,255,255,0.12)'}`,
      backgroundColor:isChecked?C.em:'transparent',
      display:'flex',alignItems:'center',justifyContent:'center',
      transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)'}}>
      {isChecked && <div className="ec-checkpop"><Check s={10}/></div>}
      {justChecked===id && <div style={{position:'absolute',inset:-4,borderRadius:8,
        border:`2px solid ${C.em}`,opacity:0,animation:'ecFadeUp 0.35s ease forwards',
        pointerEvents:'none'}}/>}
    </div>
  );

  // ─── TASK ROW (enhanced with notes, priority, subchecks) ───
  const TaskRow = ({task, isChecked, onToggle, showTag=true}) => {
    const isHov = hovRow===task.id;
    const isNoteOpen = expandedNote===task.id;
    const isSubOpen = expandedSubchecks===task.id;
    const borderCol = isHov ? (task.urgent==='red'?'rgba(239,68,68,0.25)':task.urgent==='amber'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)') : 'transparent';
    const rpSubDone = task.hasSubchecks ? RP_SUBCHECKS.filter(s=>rpSubChecks.has(s.id)).length : 0;

    return (
      <div style={{marginBottom:2}}>
        <div onMouseEnter={()=>setHovRow(task.id)} onMouseLeave={()=>setHovRow(null)}
          style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',borderRadius:8,
            borderLeft:`3px solid ${borderCol}`,
            backgroundColor:isHov?'rgba(255,255,255,0.02)':'transparent',
            transition:'all 0.15s ease'}}>
          <CB id={task.id} isChecked={isChecked} onToggle={onToggle}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:13,fontWeight:500,color:C.t1,
                textDecoration:isChecked?'line-through':'none',opacity:isChecked?0.3:1,transition:'opacity 0.3s'}}>{task.title}</span>
              {task.hasSubchecks && <span style={{fontSize:10,color:C.infoLight,fontWeight:500}}>{rpSubDone}/5</span>}
            </div>
          </div>
          <PrioBadge level={task.priority}/>
          {task.note && <button onClick={(e)=>{e.stopPropagation();setExpandedNote(expandedNote===task.id?null:task.id);}}
            style={{background:'none',border:'none',cursor:'pointer',padding:2,opacity:isNoteOpen?1:0.4,transition:'opacity 0.15s',display:'flex'}}>
            <NoteIcon size={12} color={isNoteOpen?C.em:C.t3}/></button>}
          {showTag && task.tag && <Tag t={task.tag}/>}
          {task.time && <TimeBadge time={task.time} urg={task.urgent}/>}
          <Av initials={task.assignee}/>
        </div>

        {/* Expandable note */}
        <div style={{maxHeight:isNoteOpen?'120px':'0',opacity:isNoteOpen?1:0,overflow:'hidden',
          transition:'max-height 0.25s ease, opacity 0.2s ease'}}>
          <div style={{margin:'0 0 4px 41px',padding:'8px 12px',borderRadius:6,
            backgroundColor:'rgba(255,255,255,0.015)',border:`1px solid ${C.div}`,
            fontSize:12,color:C.t2,lineHeight:1.5}}>{task.note}</div>
        </div>

        {/* RP Subchecks */}
        {task.hasSubchecks && (
          <div style={{marginLeft:41,marginBottom:4}}>
            <button onClick={()=>setExpandedSubchecks(expandedSubchecks===task.id?null:task.id)}
              style={{background:'none',border:'none',cursor:'pointer',fontFamily:F,
                fontSize:10,color:C.infoLight,padding:'2px 0',display:'flex',alignItems:'center',gap:4,
                opacity:0.7,transition:'opacity 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
              <Chev open={isSubOpen} color={C.infoLight} size={9}/>
              {rpSubDone}/5 RP checks complete
            </button>
            <div style={{maxHeight:isSubOpen?'300px':'0',opacity:isSubOpen?1:0,overflow:'hidden',
              transition:'max-height 0.3s ease, opacity 0.2s ease'}}>
              <div style={{padding:'6px 0',display:'flex',flexDirection:'column',gap:3}}>
                {RP_SUBCHECKS.map(sc => (
                  <div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'3px 8px',borderRadius:5,
                    transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(99,102,241,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <div onClick={()=>toggleRpSub(sc.id)} style={{width:14,height:14,borderRadius:3,flexShrink:0,cursor:'pointer',
                      border:`1.5px solid ${rpSubChecks.has(sc.id)?C.info:'rgba(255,255,255,0.1)'}`,
                      backgroundColor:rpSubChecks.has(sc.id)?C.info:'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      transition:'all 0.15s ease'}}>
                      {rpSubChecks.has(sc.id) && <Check s={8}/>}
                    </div>
                    <span style={{fontSize:11,color:rpSubChecks.has(sc.id)?C.t3:C.t2,
                      textDecoration:rpSubChecks.has(sc.id)?'line-through':'none',
                      opacity:rpSubChecks.has(sc.id)?0.5:1,transition:'all 0.2s'}}>{sc.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Trend = ({trend,val}) => {
    if(trend==='stable') return <span style={{fontSize:10,color:C.t3,display:'flex',alignItems:'center',gap:2}}>
      <span style={{width:8,height:1.5,backgroundColor:C.t3,borderRadius:1}}/>Stable</span>;
    const up = trend==='up';
    return <span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,fontWeight:600,color:up?C.em:C.crit}}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d={up?"M4 7V1M1.5 3.5L4 1L6.5 3.5":"M4 1V7M1.5 4.5L4 7L6.5 4.5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>{val}</span>;
  };

  const MiniBar = ({done,total}) => (
    <div style={{width:50,height:3,borderRadius:2,backgroundColor:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
      <div style={{height:'100%',width:`${total?done/total*100:0}%`,backgroundColor:done===total&&total>0?C.em:'rgba(16,185,129,0.6)',borderRadius:2,
        transition:'width 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}/>
    </div>
  );

  const AccPanel = ({id,title,tasks,isToday}) => {
    const open = acc[id];
    const total = tasks.length;
    const done = tasks.filter(t=>checked.has(t.id)).length;
    return (
      <div className="ec-fadeup" style={{borderRadius:12,
        backgroundColor:'rgba(255,255,255,0.015)',
        border:`1px solid rgba(255,255,255,0.04)`,overflow:'hidden',
        ...(isToday?{borderLeft:`3px solid ${C.em}`,boxShadow:'inset 3px 0 12px -4px rgba(16,185,129,0.08)'}:{}),
        animationDelay: isToday?'0.4s':'0.5s'}}>
        <div onClick={()=>setAcc(p=>({...p,[id]:!p[id]}))} style={{display:'flex',alignItems:'center',gap:8,
          padding:'12px 16px',cursor:'pointer',transition:'background 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.025)'}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
          <Chev open={open}/>
          <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{title}</span>
          <div style={{flex:1}}/>
          <span style={{fontSize:10,fontWeight:600,color:done===total&&total>0?C.em:'rgba(255,255,255,0.35)',
            padding:'2px 8px',borderRadius:10,
            backgroundColor:done===total&&total>0?C.emFaint:'rgba(255,255,255,0.05)',
            border:done===total&&total>0?'1px solid rgba(16,185,129,0.15)':'1px solid transparent',
            transition:'all 0.3s'}}>{done}/{total}</span>
          <MiniBar done={done} total={total}/>
        </div>
        <div style={{maxHeight:open?'3000px':'0',opacity:open?1:0,overflow:'hidden',
          transition:'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease'}}>
          <div style={{borderTop:`1px solid ${C.div}`,padding:'6px 12px 12px'}}>
            {tasks.map(t => <TaskRow key={t.id} task={{...t,tag:t.tag||'Cleaning'}} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)} showTag={!!t.tag}/>)}
          </div>
        </div>
      </div>
    );
  };

  const cardS = (id) => ({
    backgroundColor: hovCard===id ? C.cardHover : C.card,
    border: `1px solid ${hovCard===id ? 'rgba(255,255,255,0.08)' : C.cardBorder}`,
    borderRadius: 16, padding: 20,
    boxShadow: hovCard===id ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)' : '0 1px 3px rgba(0,0,0,0.4)',
    transform: hovCard===id ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
  });

  // ─── SIDEBAR ───
  const sidebar = (
    <div style={{width:220,height:'100vh',position:'fixed',left:0,top:0,backgroundColor:C.sidebar,zIndex:50,
      display:'flex',flexDirection:'column',borderRight:`1px solid ${C.div}`,fontFamily:F,
      transform:mob&&!sb?'translateX(-100%)':'translateX(0)',transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: mob&&sb ? '8px 0 32px rgba(0,0,0,0.5)' : 'none'}}>
      <div style={{position:'absolute',left:0,top:0,width:1,height:'50%',
        background:'linear-gradient(to bottom,#10b981 0%,rgba(16,185,129,0.2) 40%,transparent 100%)'}}/>
      <div style={{position:'absolute',left:0,top:0,width:'100%',height:120,
        background:'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.04), transparent 70%)',pointerEvents:'none'}}/>

      <div style={{padding:'20px 16px',borderBottom:`1px solid ${C.div}`,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#10b981,#059669)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'white',letterSpacing:-0.5,
          boxShadow:'0 2px 8px rgba(16,185,129,0.3)'}}>IPD</div>
        <div><div style={{fontSize:13,fontWeight:700,color:C.t1,lineHeight:1.2}}>iPharmacy</div>
          <div style={{fontSize:9,fontWeight:600,color:C.t3,letterSpacing:1.5,textTransform:'uppercase'}}>Direct</div></div>
        {mob && <button onClick={()=>setSb(false)} style={{marginLeft:'auto',background:'none',border:'none',color:C.t3,cursor:'pointer',fontSize:18,padding:4}}>✕</button>}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
        {NAV.map(g=>(
          <div key={g.s}>
            <div style={{fontSize:9,fontWeight:700,color:C.t4,letterSpacing:1.5,textTransform:'uppercase',padding:'22px 16px 6px'}}>{g.s}</div>
            {g.items.map(it=>{
              const act=it.active, hov=hovNav===it.l;
              return <button key={it.l} onMouseEnter={()=>setHovNav(it.l)} onMouseLeave={()=>setHovNav(null)}
                style={{display:'flex',alignItems:'center',gap:8,width:'calc(100% - 16px)',margin:'1px 8px',padding:'8px 12px',
                  borderRadius:7,border:'none',cursor:'pointer',fontFamily:F,fontSize:13,textAlign:'left',
                  backgroundColor:act?'rgba(255,255,255,0.06)':hov?'rgba(255,255,255,0.03)':'transparent',
                  color:act?C.t1:hov?'#a1a1aa':C.z6,fontWeight:act?600:400,
                  transition:'all 0.15s ease',
                  boxShadow:act?'inset 0 0 0 1px rgba(255,255,255,0.04)':'none'}}>
                <NI name={it.i} color={act?C.t1:hov?'#a1a1aa':C.z6}/>
                <span style={{flex:1}}>{it.l}</span>
                {it.b!=null && <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:8,minWidth:18,textAlign:'center',
                  backgroundColor:it.bc==='red'?'rgba(239,68,68,0.12)':it.bc==='amber'?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.05)',
                  color:it.bc==='red'?C.critLight:it.bc==='amber'?C.warnLight:'rgba(255,255,255,0.35)'}}>{it.b}</span>}
              </button>;
            })}
          </div>
        ))}
      </div>

      <div style={{padding:'14px 16px',borderTop:`1px solid ${C.div}`,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:`linear-gradient(135deg,${C.em},${C.emDark})`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:10,fontWeight:700,color:'white',flexShrink:0,
          boxShadow:'0 2px 8px rgba(16,185,129,0.2)'}}>SS</div>
        <div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>Salma Shakoor</div>
          <div style={{fontSize:10,color:C.t3}}>Admin Support</div></div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',fontFamily:F,background:C.bg,
      backgroundImage:'radial-gradient(ellipse at 25% -5%, rgba(16,185,129,0.035), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.02), transparent 50%)'}}>

      <Confetti show={showConfetti}/>

      {mob && sb && <div onClick={()=>setSb(false)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',zIndex:49,backdropFilter:'blur(2px)'}}/>}
      {sidebar}

      <div style={{marginLeft:mob?0:220,padding:mob?'0 16px 60px':'0 36px 60px',maxWidth:1200}}>

        {/* ═══ HEADER ═══ */}
        <div className="ec-fadeup" style={{display:'flex',alignItems:mob?'flex-start':'center',justifyContent:'space-between',
          flexDirection:mob?'column':'row',gap:mob?16:0,padding:'28px 0 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {mob && <button onClick={()=>setSb(true)} style={{background:'none',border:'none',color:C.t3,cursor:'pointer',padding:4,display:'flex',flexDirection:'column',gap:3.5}}>
              <div style={{width:18,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/><div style={{width:18,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/><div style={{width:13,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/></button>}
            <div>
              <div style={{fontSize:28,fontWeight:800,color:C.t1,lineHeight:1.1,letterSpacing:-0.5}}>{getGreeting()}, Salma</div>
              <div style={{fontSize:11,color:C.t3,marginTop:5,letterSpacing:0.3,display:'flex',alignItems:'center',gap:6}}>
                {liveDate} · <span style={{color:C.t2,fontVariantNumeric:'tabular-nums',fontWeight:500}}>{liveTime}</span>
              </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,...(mob?{width:'100%',justifyContent:'space-between'}:{})}}>
            <Ring pct={75} size={52} delay={200}/>
            <div style={{width:1,height:28,backgroundColor:C.div}}/>
            <div style={{textAlign:'center',position:'relative',cursor:'default'}} onMouseEnter={()=>setHovStat('over')} onMouseLeave={()=>setHovStat(null)}>
              <div style={{fontSize:26,fontWeight:800,color:C.crit,lineHeight:1,letterSpacing:-1}}>{20}</div>
              <div style={{fontSize:9,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Overdue</div>
              {hovStat==='over' && <div className="ec-slidedown" style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,
                padding:'6px 12px',borderRadius:8,backgroundColor:'rgba(15,15,15,0.95)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)',fontSize:11,color:C.t2,whiteSpace:'nowrap',zIndex:10,
                backdropFilter:'blur(8px)'}}>20 cleaning tasks overdue</div>}
            </div>
            <div style={{textAlign:'center',position:'relative',cursor:'default'}} onMouseEnter={()=>setHovStat('due')} onMouseLeave={()=>setHovStat(null)}>
              <div style={{fontSize:26,fontWeight:800,color:C.warn,lineHeight:1,letterSpacing:-1}}>{5}</div>
              <div style={{fontSize:9,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Due Today</div>
              {hovStat==='due' && <div className="ec-slidedown" style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,
                padding:'6px 12px',borderRadius:8,backgroundColor:'rgba(15,15,15,0.95)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)',fontSize:11,color:C.t2,whiteSpace:'nowrap',zIndex:10,
                backdropFilter:'blur(8px)'}}>2 time-sensitive, 3 routine</div>}
            </div>
            <div style={{width:1,height:28,backgroundColor:C.div}}/>

            {/* NOTIFICATION BELL */}
            <div ref={bellRef} style={{position:'relative'}}>
              <button onClick={()=>setBellOpen(!bellOpen)}
                style={{background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,
                  backgroundColor:bellOpen?'rgba(255,255,255,0.06)':'transparent',
                  transition:'background 0.15s',position:'relative',display:'flex'}}>
                <div className={bellShake?'ec-bellshake':''}><BellIcon size={18} color={bellOpen?C.t1:C.t2}/></div>
                {unreadCount > 0 && <div style={{position:'absolute',top:2,right:2,width:14,height:14,borderRadius:'50%',
                  backgroundColor:C.crit,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:8,fontWeight:800,color:'white',border:`2px solid ${C.bg}`}}>{unreadCount}</div>}
              </button>
              {bellOpen && (
                <div className="ec-slidedown" style={{position:'absolute',top:'100%',right:0,marginTop:8,width:320,
                  borderRadius:12,backgroundColor:'rgba(15,15,15,0.97)',border:'1px solid rgba(255,255,255,0.08)',
                  boxShadow:'0 12px 40px rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:60,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.div}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Notifications</span>
                    {unreadCount > 0 && <span style={{fontSize:10,color:C.em,cursor:'pointer',fontWeight:500}}
                      onClick={()=>setNotifRead(new Set(NOTIFICATIONS.map(n=>n.id)))}>Mark all read</span>}
                  </div>
                  <div style={{maxHeight:300,overflowY:'auto'}}>
                    {NOTIFICATIONS.map(n => {
                      const isRead = notifRead.has(n.id);
                      const typeCol = n.type==='critical'?C.crit:n.type==='warning'?C.warn:C.info;
                      return (
                        <div key={n.id} onClick={()=>markNotifRead(n.id)}
                          style={{padding:'10px 16px',borderBottom:`1px solid ${C.div}`,cursor:'pointer',
                            backgroundColor:isRead?'transparent':'rgba(255,255,255,0.015)',
                            transition:'background 0.15s'}}
                          onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.03)'}
                          onMouseLeave={e=>e.currentTarget.style.backgroundColor=isRead?'transparent':'rgba(255,255,255,0.015)'}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{width:6,height:6,borderRadius:'50%',backgroundColor:isRead?'transparent':typeCol,marginTop:5,flexShrink:0,
                              boxShadow:isRead?'none':`0 0 4px ${typeCol}40`}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:isRead?400:600,color:isRead?C.t3:C.t1}}>{n.title}</div>
                              <div style={{fontSize:11,color:C.t3,marginTop:2}}>{n.desc}</div>
                            </div>
                            <span style={{fontSize:10,color:C.t4,whiteSpace:'nowrap',flexShrink:0}}>{n.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{fontSize:11,color:C.z6,padding:'4px 12px',borderRadius:20,
              backgroundColor:'rgba(255,255,255,0.03)',border:`1px solid ${C.cardBorder}`,
              fontWeight:500,letterSpacing:0.5}}>FED07</div>
          </div>
        </div>

        {/* ═══ RP BAR ═══ */}
        <div className="ec-fadeup" style={{borderRadius:12,padding:'16px 20px',
          transition:'background-color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
          backgroundColor:rp?'rgba(16,185,129,0.035)':'rgba(239,68,68,0.05)',
          border:`1px solid ${rp?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.12)'}`,
          boxShadow:rp?'0 0 40px rgba(16,185,129,0.04), inset 0 1px 0 rgba(16,185,129,0.08)':'inset 0 1px 0 rgba(239,68,68,0.08)',
          animationDelay:'0.1s'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:200}}>
              <Dot color={rp?C.em:C.crit}/>
              {rp ? <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:14,fontWeight:600,color:C.t1}}>Amjid Shakoor</span>
                <span style={{fontSize:11,color:C.t3}}>RP since 09:02</span>
                <span style={{fontSize:14,fontWeight:700,color:C.em,fontVariantNumeric:'tabular-nums',letterSpacing:-0.3}}>{elapsed}</span>
              </div> : <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:14,fontWeight:600,color:C.critLight}}>No RP signed in</span>
                <span style={{fontSize:11,color:C.t3}}>Last: Amjid Shakoor out at 13:15</span>
              </div>}
            </div>
            <button onClick={()=>setRp(!rp)} style={{padding:rp?'7px 16px':'8px 22px',borderRadius:8,border:'none',cursor:'pointer',
              fontSize:13,fontWeight:600,fontFamily:F,transition:'all 0.2s ease',
              ...(rp?{backgroundColor:'rgba(255,255,255,0.05)',color:C.t2}:{backgroundColor:C.crit,color:'white',boxShadow:'0 2px 12px rgba(239,68,68,0.3)'})}}>
              {rp?'Sign Out':'Sign In as RP →'}</button>
          </div>

          {rp && <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
            {KEYS.map(k=>{
              const st=keys[k.id], pr=pressed===k.id, jc=justCompleted===k.id, isFr=k.id==='fridgeTemp';
              return <button key={k.id} onClick={()=>handleKey(k.id)} style={{flex:'1 1 0',minWidth:mob?'calc(33% - 8px)':0,
                height:58,borderRadius:10,cursor:st.d?'default':'pointer',fontFamily:F,
                border:`1px solid ${st.d?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.06)'}`,
                backgroundColor:st.d?'rgba(16,185,129,0.05)':'rgba(255,255,255,0.025)',
                boxShadow:st.d?'0 0 12px rgba(16,185,129,0.06)':'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.03)',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,
                transform:pr?'scale(0.95)':jc?'scale(1.02)':'scale(1)',
                transition:'all 0.15s cubic-bezier(0.34,1.56,0.64,1)'}}>
                {st.d ? <><div className="ec-checkpop"><Check s={14} c={C.em}/></div>
                  <span style={{fontSize:10,color:C.em,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{st.t}{isFr&&st.v?` · ${st.v}°C`:''}</span></>
                : isFr&&showFridge ? <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                  <input autoFocus value={fridgeVal} onChange={e=>setFridgeVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submitFridge();}}
                    placeholder="°C" style={{width:44,padding:'3px 4px',borderRadius:5,border:'1px solid rgba(255,255,255,0.1)',
                    backgroundColor:'rgba(255,255,255,0.06)',color:C.t1,fontSize:12,textAlign:'center',outline:'none',fontFamily:F}}/>
                  <button onClick={submitFridge} style={{background:C.em,border:'none',borderRadius:5,color:'white',fontSize:11,padding:'3px 8px',cursor:'pointer',fontWeight:600}}>✓</button>
                </div>
                : <><span style={{fontSize:17,lineHeight:1}}>{k.em}</span><span style={{fontSize:10,color:C.t3,fontWeight:500}}>{k.label}</span></>}
              </button>;
            })}
          </div>}

          {rp && <div style={{marginTop:12}}>
            <button onClick={()=>setSessOpen(!sessOpen)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:F,
              fontSize:11,color:C.t3,padding:'2px 0',display:'flex',alignItems:'center',gap:4,transition:'color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.color=C.t1} onMouseLeave={e=>e.currentTarget.style.color=C.t3}>
              <Chev open={sessOpen} color="currentColor" size={10}/>Today's sessions</button>
            <div style={{maxHeight:sessOpen?'200px':'0',opacity:sessOpen?1:0,overflow:'hidden',transition:'max-height 0.3s ease, opacity 0.2s ease'}}>
              <div style={{marginTop:6,padding:'8px 12px',borderRadius:8,backgroundColor:'rgba(255,255,255,0.015)',border:`1px solid ${C.div}`}}>
                {SESSIONS.map((s,i)=><div key={i} style={{display:'flex',gap:12,fontSize:11,color:C.t3,padding:'5px 0',
                  borderBottom:i<SESSIONS.length-1?`1px solid ${C.div}`:'none'}}>
                  <span style={{color:C.t2,fontWeight:500,minWidth:100,fontVariantNumeric:'tabular-nums'}}>{s.start} – {s.end}</span>
                  <span style={{flex:1}}>{s.name}</span>
                  <span style={{color:s.end==='ongoing'?C.em:C.t3,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{s.dur||elapsed}</span>
                </div>)}
              </div>
            </div>
          </div>}
        </div>

        {/* ═══ ZONE 2 ═══ */}
        <div style={{display:'flex',gap:16,marginTop:20,flexDirection:mob?'column':'row'}}>

          {/* SHIFT CHECKLIST */}
          <div className="ec-fadeup" style={{flex:'0 0 58%',...(mob?{flex:'1 1 auto'}:{}),
            ...cardS('shift'),animationDelay:'0.2s'}}
            onMouseEnter={()=>setHovCard('shift')} onMouseLeave={()=>setHovCard(null)}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:13,fontWeight:700,color:C.t1,letterSpacing:0.2}}>Shift Checklist</span>
              <div style={{flex:1}}/>
              {allTodayDone && <span style={{fontSize:10,color:C.em,fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
                <Check s={10} c={C.em}/>Complete</span>}
              <span style={{fontSize:11,color:allTodayDone?C.em:C.t3,fontWeight:600,fontVariantNumeric:'tabular-nums',
                transition:'color 0.3s'}}>{todayChecked}/{TODAY_TASKS.length}</span>
              <MiniBar done={todayChecked} total={TODAY_TASKS.length}/>
            </div>
            <div style={{height:1,backgroundColor:C.div,margin:'14px 0'}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.crit,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8,
              display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:4,height:4,borderRadius:'50%',backgroundColor:C.crit}}/>TIME-SENSITIVE
            </div>
            {TODAY_TASKS.slice(0,2).map(t=><TaskRow key={t.id} task={t} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)}/>)}
            <div style={{height:1,backgroundColor:C.div,margin:'10px 0'}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8,
              display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:4,height:4,borderRadius:'50%',backgroundColor:C.t3}}/>ANYTIME
            </div>
            {TODAY_TASKS.slice(2).map(t=><TaskRow key={t.id} task={t} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)}/>)}
            <div style={{marginTop:18,paddingTop:12,borderTop:`1px solid ${C.div}`,fontSize:11,color:'rgba(255,255,255,0.18)',
              display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:14}}>🔥</span> 7 days fully completed
            </div>
          </div>

          {/* COMPLIANCE HEALTH */}
          <div className="ec-fadeup" style={{flex:'0 0 calc(42% - 16px)',...(mob?{flex:'1 1 auto'}:{}),
            ...cardS('comp'),animationDelay:'0.25s'}}
            onMouseEnter={()=>setHovCard('comp')} onMouseLeave={()=>setHovCard(null)}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.t1,letterSpacing:0.2}}>Compliance Health</span>
              <div style={{flex:1}}/>
              <Ring pct={75} size={36} sw={3} delay={400}/>
              <span style={{fontSize:11,color:C.t3}}>Overall</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:18}}>
              {COMPLIANCE_DATA.map((c,i)=>{
                const isHov = hovTile===i;
                return <div key={i} className={c.alert?'ec-breath':''}
                  style={{padding:14,borderRadius:12,
                  backgroundColor:c.alert?'rgba(239,68,68,0.035)':'rgba(255,255,255,0.015)',
                  border:`1px solid ${c.alert?(isHov?'rgba(239,68,68,0.25)':'rgba(239,68,68,0.08)'):(isHov?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)')}`,
                  transform:isHov?'translateY(-2px)':'translateY(0)',
                  transition:'transform 0.2s ease, border-color 0.2s ease',
                  display:'flex',flexDirection:'column',alignItems:'center'}}
                  onMouseEnter={()=>setHovTile(i)} onMouseLeave={()=>setHovTile(null)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%'}}>
                    <span style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:1,textTransform:'uppercase'}}>{c.label}</span>
                    <Trend trend={c.trend} val={c.trendVal}/>
                  </div>
                  <div style={{margin:'10px 0'}}><Ring pct={c.pct} size={48} sw={3.5} delay={500+i*120}/></div>
                  <span style={{fontSize:11,color:c.alert?C.critLight:C.t3,fontWeight:c.alert?500:400}}>{c.detail}</span>
                  <Spark data={c.data} color={c.color} w={76} h={20} delay={700+i*150}/>
                </div>;
              })}
            </div>
            <div style={{height:1,backgroundColor:C.div,marginTop:16}}/>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}>
              <div style={{width:6,height:6,borderRadius:'50%',backgroundColor:C.warn,boxShadow:'0 0 4px rgba(245,158,11,0.3)'}}/>
              <span style={{fontSize:11,color:C.t3}}>Last GPhC inspection: <span style={{color:C.warnLight,fontWeight:500}}>14 months ago</span></span>
            </div>
          </div>
        </div>

        {/* ═══ ALERT BANNER ═══ */}
        <div className="ec-fadeup" style={{borderRadius:12,padding:'14px 20px',marginTop:20,
          backgroundColor:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.08)',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,
          boxShadow:'inset 0 1px 0 rgba(239,68,68,0.06)',animationDelay:'0.35s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <WarningTri/>
            <span style={{fontSize:13,fontWeight:600,color:C.critLight}}>Attention:</span>
            <span style={{fontSize:13,color:C.t2}}>Cleaning at 0% — 20 tasks overdue</span>
          </div>
          <span style={{fontSize:12,fontWeight:600,color:C.crit,cursor:'pointer',padding:'4px 12px',borderRadius:6,
            backgroundColor:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.12)',
            transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(239,68,68,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor='rgba(239,68,68,0.08)'}>Review Cleaning →</span>
        </div>

        {/* ═══ TASK SCHEDULE ═══ */}
        <div>
          <div className="ec-fadeup" style={{fontSize:13,fontWeight:700,color:C.t1,marginTop:28,marginBottom:14,
            display:'flex',alignItems:'center',gap:8,animationDelay:'0.4s'}}>
            Task Schedule
            <div style={{flex:1,height:1,backgroundColor:C.div}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <AccPanel id="today" title="Today" tasks={TODAY_TASKS} isToday/>
            <AccPanel id="weekly" title="Weekly" tasks={WEEKLY}/>
            <AccPanel id="fort" title="Fortnightly" tasks={FORT}/>
            <AccPanel id="monthly" title="Monthly" tasks={MONTHLY}/>
          </div>
        </div>

        {/* ═══ TO DO ═══ */}
        <div className="ec-fadeup" style={{borderRadius:16,backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,padding:20,marginTop:20,
          animationDelay:'0.5s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700,color:C.t1}}>To Do</span>
            <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,
              backgroundColor:C.warnFaint,color:C.warnLight,border:'1px solid rgba(245,158,11,0.12)'}}>4</span>
            <div style={{flex:1,height:1,backgroundColor:C.div,marginLeft:8}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:4}}>
            {TODOS.map(td=>(
              <div key={td.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 4px',borderRadius:6,
                transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <CB id={td.id} isChecked={checkedTodo.has(td.id)} onToggle={()=>toggleTodo(td.id)}/>
                <span style={{fontSize:13,fontWeight:400,color:C.t2,flex:1,
                  textDecoration:checkedTodo.has(td.id)?'line-through':'none',
                  opacity:checkedTodo.has(td.id)?0.25:1,transition:'opacity 0.3s'}}>{td.title}</span>
                <span style={{fontSize:10,color:C.t4,fontVariantNumeric:'tabular-nums'}}>{td.days}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="ec-fadeup" style={{marginTop:48,padding:'20px 0',borderTop:`1px solid ${C.div}`,textAlign:'center',
          animationDelay:'0.55s'}}>
          <span style={{fontSize:11,color:C.t5,letterSpacing:0.5}}>Compliance Tracker v4.0 · iPharmacy Direct</span>
        </div>
      </div>

      {/* SCROLL FADE */}
      <div style={{position:'fixed',bottom:0,left:mob?0:220,right:0,height:48,
        background:`linear-gradient(to top, ${C.bg}, transparent)`,
        pointerEvents:'none',opacity:scrollFade?1:0,transition:'opacity 0.4s ease'}}/>
    </div>
  );
}
" user notes: import { useState, useEffect, useCallback, useRef } from "react";

// ─── THEME ───
const C = {
  bg: '#0a0a0a', sidebar: '#070707',
  card: 'rgba(255,255,255,0.025)', cardBorder: 'rgba(255,255,255,0.06)',
  cardHover: 'rgba(255,255,255,0.045)', div: 'rgba(255,255,255,0.04)',
  t1: '#e4e4e7', t2: 'rgba(255,255,255,0.5)', t3: 'rgba(255,255,255,0.25)',
  t4: 'rgba(255,255,255,0.15)', t5: 'rgba(255,255,255,0.08)',
  em: '#10b981', emDark: '#059669', emFaint: 'rgba(16,185,129,0.06)',
  warn: '#f59e0b', warnLight: '#fcd34d', warnFaint: 'rgba(245,158,11,0.08)',
  crit: '#ef4444', critLight: '#fca5a5', critFaint: 'rgba(239,68,68,0.06)',
  info: '#6366f1', infoLight: '#a5b4fc',
  high: '#ef4444', medium: '#f59e0b', low: '#10b981',
  z6: '#52525b', z9: '#18181b',
};
const F = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,sans-serif';

// ─── INJECT KEYFRAMES ───
const styleId = 'ec-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const st = document.createElement('style');
  st.id = styleId;
  st.textContent = `
    @keyframes ecPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes ecFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ecRingFill { from{stroke-dashoffset:var(--ec-circ)} to{stroke-dashoffset:var(--ec-off)} }
    @keyframes ecBreath { 0%,100%{box-shadow:0 0 16px rgba(239,68,68,0.03)} 50%{box-shadow:0 0 24px rgba(239,68,68,0.1)} }
    @keyframes ecCheckPop { 0%{transform:scale(0.8)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
    @keyframes ecDraw { to{stroke-dashoffset:0} }
    @keyframes ecConfetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-120px) rotate(720deg);opacity:0} }
    @keyframes ecFlash { 0%{opacity:0} 20%{opacity:1} 100%{opacity:0} }
    @keyframes ecSlideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ecBellShake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(12deg)} 40%{transform:rotate(-10deg)} 60%{transform:rotate(6deg)} 80%{transform:rotate(-3deg)} }
    .ec-ring-anim { animation: ecRingFill 1s cubic-bezier(0.4,0,0.2,1) forwards; }
    .ec-fadeup { animation: ecFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
    .ec-breath { animation: ecBreath 3s ease-in-out infinite; }
    .ec-checkpop { animation: ecCheckPop 0.25s cubic-bezier(0.34,1.56,0.64,1); }
    .ec-draw { animation: ecDraw 1.2s ease-in-out forwards; }
    .ec-confetti { animation: ecConfetti 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
    .ec-flash { animation: ecFlash 0.8s ease-out forwards; }
    .ec-slidedown { animation: ecSlideDown 0.2s ease-out; }
    .ec-bellshake { animation: ecBellShake 0.5s ease-in-out; }
  `;
  document.head.appendChild(st);
}

// ─── SVG HELPERS ───
function Ring({ pct, size = 52, sw = 4, delay = 0 }) {
  const r = (size - sw) / 2, ci = 2 * Math.PI * r, off = ci - (pct / 100) * ci;
  const col = pct >= 80 ? C.em : pct >= 50 ? C.warn : C.crit;
  const [counting, setCounting] = useState(0);
  useEffect(() => {
    let frame = 0; const total = Math.max(1, Math.round(pct));
    const step = 800 / total;
    const t = setTimeout(() => {
      const id = setInterval(() => { frame++; setCounting(frame); if (frame >= total) clearInterval(id); }, step);
    }, delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={sw}
          strokeDasharray={ci} strokeDashoffset={ci}
          strokeLinecap="round" className="ec-ring-anim"
          style={{ '--ec-circ': ci, '--ec-off': off, animationDelay: `${delay}ms` }}/>
      </svg>
      <span style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
        fontSize: size < 40 ? 9 : size < 48 ? 11 : 13, fontWeight:800, color:C.t1, fontFamily:F,
        letterSpacing: -0.5 }}>{counting}%</span>
    </div>
  );
}

function Spark({ data, color, w = 80, h = 22, delay = 0 }) {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h-((v-mn)/rng)*(h-4)+2}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display:'block', marginTop: 8, overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="100" strokeDashoffset="100"
        className="ec-draw" style={{ animationDelay: `${delay}ms` }}/>
    </svg>
  );
}

function Dot({ color, size = 8 }) {
  return <div style={{ width:size,height:size,borderRadius:'50%',backgroundColor:color,animation:'ecPulse 2s ease-in-out infinite',flexShrink:0,
    boxShadow:`0 0 6px ${color}40` }}/>;
}

function Chev({ open, color = C.t3, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
      style={{ transform: open?'rotate(90deg)':'rotate(0)', transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)', flexShrink:0 }}>
      <path d="M4.5 2.5L8 6L4.5 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const Check = ({s=12,c='white'}) => <svg width={s} height={s} viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Clock = () => <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const WarningTri = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L1 14h14L8 1.5z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v3.5M8 11.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const BellIcon = ({size=16,color=C.t2}) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M4 6a4 4 0 0 1 8 0c0 2.5 1 4 2 5H2c1-1 2-2.5 2-5z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
const NoteIcon = ({size=10,color=C.t3}) => <svg width={size} height={size} viewBox="0 0 12 12" fill="none"><path d="M2 2h8v8H6l-4-4V2z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 5h4M4 7h2" stroke={color} strokeWidth="1" strokeLinecap="round"/></svg>;

// ─── NAV ICONS ───
function NI({ name, color }) {
  const p = { stroke:color, strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round', fill:'none' };
  const m = {
    grid:<><rect x="2" y="2" width="5" height="5" rx="1" {...p}/><rect x="9" y="2" width="5" height="5" rx="1" {...p}/><rect x="2" y="9" width="5" height="5" rx="1" {...p}/><rect x="9" y="9" width="5" height="5" rx="1" {...p}/></>,
    check:<path d="M4 8l2.5 2.5L12 4" {...p}/>,
    clip:<><rect x="4" y="2" width="8" height="12" rx="1" {...p}/><path d="M6 2V1h4v1M7 7h2M7 10h4" {...p}/></>,
    therm:<path d="M8 2v7.5a2.5 2.5 0 1 1-2 0V2a1 1 0 0 1 2 0z" {...p}/>,
    book:<><path d="M2 3h4a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H2V3z" {...p}/><path d="M14 3h-4a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H14V3z" {...p}/></>,
    spark:<path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" {...p}/>,
    file:<><path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" {...p}/><path d="M10 2v4h4" {...p}/></>,
    shield:<path d="M8 1L2 4v4c0 4.5 3 7.5 6 9 3-1.5 6-4.5 6-9V4L8 1z" {...p}/>,
    users:<><circle cx="6" cy="5" r="2.5" {...p}/><path d="M1 14c0-3 2.5-5 5-5s5 2 5 5" {...p}/></>,
    gear:<><circle cx="8" cy="8" r="2.5" {...p}/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" {...p}/></>,
    sun:<><circle cx="8" cy="8" r="3" {...p}/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" {...p}/></>,
  };
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{m[name]}</svg>;
}

// ─── PRIORITY CONFIG ───
const PRIO = {
  high: { color: C.high, bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.12)', label: 'High' },
  medium: { color: C.medium, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.12)', label: 'Med' },
  low: { color: C.low, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.12)', label: 'Low' },
};

// ─── DATA ───
const NAV = [
  { s:'DAILY', items:[{l:'Dashboard',i:'grid',active:true},{l:'My Tasks',i:'check',b:4},{l:'RP Log',i:'clip'},{l:'Temp Log',i:'therm',b:1,bc:'amber'}] },
  { s:'RECORDS', items:[{l:'Training Logs',i:'book'},{l:'Cleaning Rota',i:'spark',b:20,bc:'red'},{l:'Documents',i:'file'}] },
  { s:'COMPLIANCE', items:[{l:'Safeguarding',i:'shield'},{l:'Staff Training',i:'users'}] },
  { s:'SYSTEM', items:[{l:'Settings',i:'gear'},{l:'Light Mode',i:'sun'}] },
];

const KEYS = [
  {id:'rpNotice',label:'RP Notice',em:'📋'},{id:'cdCheck',label:'CD Check',em:'💊'},
  {id:'opening',label:'Opening',em:'🔓'},{id:'closing',label:'Closing',em:'🔒'},
  {id:'fridgeTemp',label:'Fridge Temp',em:'🌡️'},
];

const ASSIGNEE = { SN:C.em, MH:C.em, MJ:C.em, SS:C.em, AS:C.info, UK:'#0ea5e9' };

// RP Sub-checks for Daily RP Checks
const RP_SUBCHECKS = [
  {id:'rpsub1',label:'RP notice displayed and visible'},
  {id:'rpsub2',label:'RP signed in on PMR system'},
  {id:'rpsub3',label:'CD register checked and balanced'},
  {id:'rpsub4',label:'Dispensary area secure and compliant'},
  {id:'rpsub5',label:'Fridge temperature within range'},
];

const TODAY_TASKS = [
  {id:'t1',title:'Temperature Log',assignee:'MJ',tag:'Cleaning',time:'by 09:00',urgent:'red',priority:'high',
    note:'Record fridge temp on RxWeb. If outside 2-8°C range, escalate immediately to pharmacist. Check both main fridge and backup unit.'},
  {id:'t2',title:'Daily RP Checks',assignee:'AS',tag:'RP Check',time:'by 10:00',urgent:'amber',sub:'0/5',priority:'high',hasSubchecks:true,
    note:'Complete all 5 RP obligation checks. Must be done by the Responsible Pharmacist on duty. Log completion on PharmSmart.'},
  {id:'t3',title:'Dispensary Clean',assignee:'MH',tag:'Cleaning',priority:'medium',
    note:'Wipe down all dispensary surfaces, check for spillages, ensure workspace is clear. Use approved cleaning solution.'},
  {id:'t4',title:'Counter & Surfaces Wipe',assignee:'UK',tag:'Cleaning',priority:'low',
    note:'Clean all customer-facing surfaces and counter tops. Check hand sanitiser levels.'},
];

const WEEKLY = [
  {id:'w1',title:'Kitchen Clean',assignee:'SS',priority:'medium',note:'Deep clean kitchen area including sink, worktops, and appliances.'},
  {id:'w2',title:'Bathroom Clean',assignee:'SS',priority:'medium',note:'Full bathroom clean including toilet, sink, floor, and supplies check.'},
  {id:'w3',title:'Floor Clean',assignee:'UK',priority:'medium',note:'Sweep and mop all dispensary and public area floors.'},
  {id:'w4',title:'Tidy Cream Shelves',assignee:'SN',priority:'low',note:'Reorganise cream shelves. Check expiry dates. Rotate stock.'},
  {id:'w5',title:'Tidy Liquid Shelf',assignee:'MH',priority:'low',note:'Reorganise liquid medicines shelf. Check for leaks and expiries.'},
  {id:'w6',title:'Empty Waste',assignee:'MJ',priority:'medium',note:'Empty all waste bins. Separate pharmaceutical waste correctly.'},
  {id:'w7',title:'Empty Recycling',assignee:'SS',priority:'low',note:'Empty all recycling bins. Ensure correct waste segregation.'},
  {id:'w8',title:'Confidential Waste',assignee:'SN',priority:'high',note:'Collect all confidential waste and place in Shred-it bin. Never overfill.'},
  {id:'w9',title:'Put Splits Away',assignee:'SS',priority:'low',note:'Return split pack items to correct shelf locations.'},
  {id:'w10',title:'Extra Stock in Robot',assignee:'SS',priority:'medium',note:'Load additional stock into dispensing robot. Verify barcode scanning.'},
  {id:'w11',title:'Robot Maintenance',assignee:'SS',priority:'high',note:'Run robot diagnostic. Clean dispensing mechanism. Check error logs.'},
  {id:'w12',title:'Consultation Room Clean',assignee:'SN',priority:'medium',note:'Clean and prepare consultation room. Check equipment.'},
  {id:'w13',title:'CD Balance Check',assignee:'MH',priority:'high',note:'Verify CD register balances against physical stock. Report any discrepancies to pharmacist.'},
];

const FORT = [
  {id:'f1',title:'Fridge Quick Clean',assignee:'UK',tag:'Cleaning',priority:'medium',note:'Quick wipe of fridge shelves. Remove expired items.'},
  {id:'f2',title:'Straighten Up Fridge Stock',assignee:'SN',tag:'Cleaning',priority:'low',note:'Reorganise fridge stock by expiry date. FEFO rotation.'},
  {id:'f3',title:'Fortnightly RP Checks',assignee:'AS',tag:'RP Check',sub:'0/4',priority:'high',note:'Extended RP compliance review covering SOPs, incidents, and training records.'},
];

const MONTHLY = [
  {id:'m1',title:'Deep Fridge Clean',assignee:'SS',tag:'Cleaning',priority:'high',note:'Complete fridge deep clean. Remove all stock, clean shelves, check seals and temperature probe.'},
  {id:'m2',title:'Monthly To Do List',assignee:'SS',tag:'Cleaning',priority:'medium',note:'Review and update monthly admin checklist. File completed records.'},
  {id:'m3',title:'Replace Near Miss Record',assignee:'UK',tag:'Cleaning',priority:'medium',note:'Archive current near miss log and start new recording sheet on PharmSmart.'},
];

const TODOS = [
  {id:'td1',title:'Chase up patient feedback',days:'6d'},
  {id:'td2',title:'Chase up website',days:'6d'},
  {id:'td3',title:'Parking bay council request',days:'6d'},
  {id:'td4',title:'Chase up medicinal waste disposal',days:'6d'},
];

const COMPLIANCE_DATA = [
  {label:'DOCUMENTS',pct:100,detail:'All current',trend:'up',trendVal:'15%',data:[85,88,92,95,100,100],color:C.em},
  {label:'TRAINING',pct:100,detail:'All complete',trend:'up',trendVal:'8%',data:[60,70,80,90,100,100],color:C.em},
  {label:'CLEANING',pct:0,detail:'20 overdue',trend:'down',trendVal:'20%',data:[40,35,25,18,10,0],color:C.crit,alert:true},
  {label:'SAFEGUARDING',pct:100,detail:'All current',trend:'stable',trendVal:'',data:[95,98,100,100,100,100],color:C.em},
];

const SESSIONS = [
  {start:'09:02',end:'13:15',name:'Amjid Shakoor',dur:'4h 13m'},
  {start:'13:20',end:'ongoing',name:'Amjid Shakoor',dur:null},
];

const NOTIFICATIONS = [
  {id:'n1',type:'critical',title:'Cleaning at 0%',desc:'20 cleaning tasks are overdue',time:'2h ago',read:false},
  {id:'n2',type:'warning',title:'Temperature log due',desc:'Fridge temp not recorded today',time:'3h ago',read:false},
  {id:'n3',type:'warning',title:'GPhC inspection due',desc:'Last inspection was 14 months ago',time:'1d ago',read:false},
  {id:'n4',type:'info',title:'Training complete',desc:'Safeguarding training 100% across all staff',time:'2d ago',read:true},
  {id:'n5',type:'info',title:'Documents updated',desc:'All pharmacy documents are now current',time:'3d ago',read:true},
];

// ─── CONFETTI COMPONENT ───
function Confetti({ show }) {
  if (!show) return null;
  const pieces = Array.from({length:24}, (_,i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: Math.random() * 0.4,
    color: [C.em, C.emDark, '#34d399', '#6ee7b7', C.warnLight, '#a78bfa'][i % 6],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));
  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:100}}>
      {pieces.map(p => (
        <div key={p.id} className="ec-confetti" style={{
          position:'absolute', bottom:'40%', left:`${p.left}%`,
          width:p.size, height:p.size, borderRadius: p.id%3===0 ? '50%' : 1,
          backgroundColor:p.color, animationDelay:`${p.delay}s`,
          transform:`rotate(${p.rotation}deg)`,
        }}/>
      ))}
      <div className="ec-flash" style={{
        position:'absolute',inset:0,
        background:'radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.15), transparent 60%)',
      }}/>
    </div>
  );
}

// ─── MAIN ───
export default function Dashboard() {
  const [mob, setMob] = useState(false);
  const [sb, setSb] = useState(false);
  const [rp, setRp] = useState(true);
  const [elapsed, setElapsed] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [keys, setKeys] = useState({rpNotice:{d:false,t:null},cdCheck:{d:false,t:null},opening:{d:false,t:null},closing:{d:false,t:null},fridgeTemp:{d:false,t:null,v:null}});
  const [showFridge, setShowFridge] = useState(false);
  const [fridgeVal, setFridgeVal] = useState('');
  const [sessOpen, setSessOpen] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [justCompleted, setJustCompleted] = useState(null);
  const [hovNav, setHovNav] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [justChecked, setJustChecked] = useState(null);
  const [rpSubChecks, setRpSubChecks] = useState(new Set());
  const [checkedTodo, setCheckedTodo] = useState(new Set());
  const [acc, setAcc] = useState({today:true,weekly:false,fort:false,monthly:false});
  const [hovCard, setHovCard] = useState(null);
  const [hovTile, setHovTile] = useState(null);
  const [hovRow, setHovRow] = useState(null);
  const [hovStat, setHovStat] = useState(null);
  const [scrollFade, setScrollFade] = useState(true);
  const [expandedNote, setExpandedNote] = useState(null);
  const [expandedSubchecks, setExpandedSubchecks] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const [notifRead, setNotifRead] = useState(new Set(['n4','n5']));
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevAllDone, setPrevAllDone] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => { const c=()=>setMob(window.innerWidth<768); c(); window.addEventListener('resize',c); return()=>window.removeEventListener('resize',c); }, []);

  // Live clock
  useEffect(() => {
    const update = () => {
      const n = new Date();
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      setLiveTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`);
      setLiveDate(`${days[n.getDay()]}, ${n.getDate()} ${months[n.getMonth()]} ${n.getFullYear()}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // RP elapsed time
  useEffect(() => {
    const calc=()=>{ const n=new Date(),s=new Date(); s.setHours(9,2,0,0); const d=Math.max(0,n-s); setElapsed(`${Math.floor(d/3600000)}h ${Math.floor((d%3600000)/60000)}m`); };
    calc(); const id=setInterval(calc,60000); return()=>clearInterval(id);
  }, []);

  // Scroll fade
  const onScroll = useCallback(() => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
    setScrollFade(!atBottom);
  }, []);
  useEffect(() => { window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, [onScroll]);

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  // Bell shake on mount
  useEffect(() => { setTimeout(()=>{setBellShake(true); setTimeout(()=>setBellShake(false),600);}, 1500); }, []);

  // Confetti detection
  const todayChecked = TODAY_TASKS.filter(t=>checked.has(t.id)).length;
  const allTodayDone = todayChecked === TODAY_TASKS.length;

  useEffect(() => {
    if (allTodayDone && !prevAllDone) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
    }
    setPrevAllDone(allTodayDone);
  }, [allTodayDone, prevAllDone]);

  const now = () => { const n=new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; };

  const toggleCheck = (id) => {
    setChecked(p => { const n=new Set(p); if(n.has(id)){n.delete(id)}else{n.add(id); setJustChecked(id); setTimeout(()=>setJustChecked(null),350);} return n; });
  };
  const toggleTodo = (id) => setCheckedTodo(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleRpSub = (id) => setRpSubChecks(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  const handleKey = (id) => {
    if(keys[id].d) return;
    if(id==='fridgeTemp'){setShowFridge(true);return;}
    setPressed(id); setTimeout(()=>{ setPressed(null); setJustCompleted(id); setTimeout(()=>setJustCompleted(null),400); },150);
    setKeys(p=>({...p,[id]:{d:true,t:now()}}));
  };

  const submitFridge = () => {
    if(!fridgeVal) return;
    setKeys(p=>({...p,fridgeTemp:{d:true,t:now(),v:fridgeVal}}));
    setShowFridge(false); setFridgeVal('');
  };

  const markNotifRead = (id) => setNotifRead(p => new Set([...p, id]));
  const unreadCount = NOTIFICATIONS.filter(n => !notifRead.has(n.id)).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ─── SUBCOMPONENTS ───
  const PrioBadge = ({level}) => {
    const p = PRIO[level]; if (!p) return null;
    return <span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,letterSpacing:0.5,textTransform:'uppercase',
      backgroundColor:p.bg,color:p.color,border:`1px solid ${p.border}`}}>{p.label}</span>;
  };

  const Tag = ({t}) => {
    const isRP = t==='RP Check';
    return <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,whiteSpace:'nowrap',fontWeight:500,letterSpacing:0.2,
      backgroundColor:isRP?'rgba(99,102,241,0.1)':C.z9,
      color:isRP?C.infoLight:'#a1a1aa',
      border:`1px solid ${isRP?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.06)'}`}}>{t}</span>;
  };

  const TimeBadge = ({time,urg}) => {
    const isRed = urg==='red';
    return <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap',fontWeight:500,
      backgroundColor:isRed?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.08)',
      color:isRed?C.critLight:C.warnLight,
      border:`1px solid ${isRed?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)'}`}}>
      <Clock/>{time}</span>;
  };

  const Av = ({initials}) => (
    <div style={{width:26,height:26,borderRadius:'50%',backgroundColor:ASSIGNEE[initials]||C.em,
      display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'white',flexShrink:0,
      boxShadow:`0 0 0 2px ${C.bg}, 0 0 0 3px ${(ASSIGNEE[initials]||C.em)}30`}}>{initials}</div>
  );

  const CB = ({id,isChecked,onToggle}) => (
    <div onClick={onToggle} style={{width:18,height:18,borderRadius:5,flexShrink:0,cursor:'pointer',position:'relative',
      border:`2px solid ${isChecked?C.em:'rgba(255,255,255,0.12)'}`,
      backgroundColor:isChecked?C.em:'transparent',
      display:'flex',alignItems:'center',justifyContent:'center',
      transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)'}}>
      {isChecked && <div className="ec-checkpop"><Check s={10}/></div>}
      {justChecked===id && <div style={{position:'absolute',inset:-4,borderRadius:8,
        border:`2px solid ${C.em}`,opacity:0,animation:'ecFadeUp 0.35s ease forwards',
        pointerEvents:'none'}}/>}
    </div>
  );

  // ─── TASK ROW (enhanced with notes, priority, subchecks) ───
  const TaskRow = ({task, isChecked, onToggle, showTag=true}) => {
    const isHov = hovRow===task.id;
    const isNoteOpen = expandedNote===task.id;
    const isSubOpen = expandedSubchecks===task.id;
    const borderCol = isHov ? (task.urgent==='red'?'rgba(239,68,68,0.25)':task.urgent==='amber'?'rgba(245,158,11,0.25)':'rgba(255,255,255,0.08)') : 'transparent';
    const rpSubDone = task.hasSubchecks ? RP_SUBCHECKS.filter(s=>rpSubChecks.has(s.id)).length : 0;

    return (
      <div style={{marginBottom:2}}>
        <div onMouseEnter={()=>setHovRow(task.id)} onMouseLeave={()=>setHovRow(null)}
          style={{display:'flex',alignItems:'center',gap:10,padding:'7px 10px',borderRadius:8,
            borderLeft:`3px solid ${borderCol}`,
            backgroundColor:isHov?'rgba(255,255,255,0.02)':'transparent',
            transition:'all 0.15s ease'}}>
          <CB id={task.id} isChecked={isChecked} onToggle={onToggle}/>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:13,fontWeight:500,color:C.t1,
                textDecoration:isChecked?'line-through':'none',opacity:isChecked?0.3:1,transition:'opacity 0.3s'}}>{task.title}</span>
              {task.hasSubchecks && <span style={{fontSize:10,color:C.infoLight,fontWeight:500}}>{rpSubDone}/5</span>}
            </div>
          </div>
          <PrioBadge level={task.priority}/>
          {task.note && <button onClick={(e)=>{e.stopPropagation();setExpandedNote(expandedNote===task.id?null:task.id);}}
            style={{background:'none',border:'none',cursor:'pointer',padding:2,opacity:isNoteOpen?1:0.4,transition:'opacity 0.15s',display:'flex'}}>
            <NoteIcon size={12} color={isNoteOpen?C.em:C.t3}/></button>}
          {showTag && task.tag && <Tag t={task.tag}/>}
          {task.time && <TimeBadge time={task.time} urg={task.urgent}/>}
          <Av initials={task.assignee}/>
        </div>

        {/* Expandable note */}
        <div style={{maxHeight:isNoteOpen?'120px':'0',opacity:isNoteOpen?1:0,overflow:'hidden',
          transition:'max-height 0.25s ease, opacity 0.2s ease'}}>
          <div style={{margin:'0 0 4px 41px',padding:'8px 12px',borderRadius:6,
            backgroundColor:'rgba(255,255,255,0.015)',border:`1px solid ${C.div}`,
            fontSize:12,color:C.t2,lineHeight:1.5}}>{task.note}</div>
        </div>

        {/* RP Subchecks */}
        {task.hasSubchecks && (
          <div style={{marginLeft:41,marginBottom:4}}>
            <button onClick={()=>setExpandedSubchecks(expandedSubchecks===task.id?null:task.id)}
              style={{background:'none',border:'none',cursor:'pointer',fontFamily:F,
                fontSize:10,color:C.infoLight,padding:'2px 0',display:'flex',alignItems:'center',gap:4,
                opacity:0.7,transition:'opacity 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.opacity='1'} onMouseLeave={e=>e.currentTarget.style.opacity='0.7'}>
              <Chev open={isSubOpen} color={C.infoLight} size={9}/>
              {rpSubDone}/5 RP checks complete
            </button>
            <div style={{maxHeight:isSubOpen?'300px':'0',opacity:isSubOpen?1:0,overflow:'hidden',
              transition:'max-height 0.3s ease, opacity 0.2s ease'}}>
              <div style={{padding:'6px 0',display:'flex',flexDirection:'column',gap:3}}>
                {RP_SUBCHECKS.map(sc => (
                  <div key={sc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'3px 8px',borderRadius:5,
                    transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(99,102,241,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <div onClick={()=>toggleRpSub(sc.id)} style={{width:14,height:14,borderRadius:3,flexShrink:0,cursor:'pointer',
                      border:`1.5px solid ${rpSubChecks.has(sc.id)?C.info:'rgba(255,255,255,0.1)'}`,
                      backgroundColor:rpSubChecks.has(sc.id)?C.info:'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      transition:'all 0.15s ease'}}>
                      {rpSubChecks.has(sc.id) && <Check s={8}/>}
                    </div>
                    <span style={{fontSize:11,color:rpSubChecks.has(sc.id)?C.t3:C.t2,
                      textDecoration:rpSubChecks.has(sc.id)?'line-through':'none',
                      opacity:rpSubChecks.has(sc.id)?0.5:1,transition:'all 0.2s'}}>{sc.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Trend = ({trend,val}) => {
    if(trend==='stable') return <span style={{fontSize:10,color:C.t3,display:'flex',alignItems:'center',gap:2}}>
      <span style={{width:8,height:1.5,backgroundColor:C.t3,borderRadius:1}}/>Stable</span>;
    const up = trend==='up';
    return <span style={{display:'flex',alignItems:'center',gap:2,fontSize:10,fontWeight:600,color:up?C.em:C.crit}}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d={up?"M4 7V1M1.5 3.5L4 1L6.5 3.5":"M4 1V7M1.5 4.5L4 7L6.5 4.5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>{val}</span>;
  };

  const MiniBar = ({done,total}) => (
    <div style={{width:50,height:3,borderRadius:2,backgroundColor:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
      <div style={{height:'100%',width:`${total?done/total*100:0}%`,backgroundColor:done===total&&total>0?C.em:'rgba(16,185,129,0.6)',borderRadius:2,
        transition:'width 0.4s cubic-bezier(0.34,1.56,0.64,1)'}}/>
    </div>
  );

  const AccPanel = ({id,title,tasks,isToday}) => {
    const open = acc[id];
    const total = tasks.length;
    const done = tasks.filter(t=>checked.has(t.id)).length;
    return (
      <div className="ec-fadeup" style={{borderRadius:12,
        backgroundColor:'rgba(255,255,255,0.015)',
        border:`1px solid rgba(255,255,255,0.04)`,overflow:'hidden',
        ...(isToday?{borderLeft:`3px solid ${C.em}`,boxShadow:'inset 3px 0 12px -4px rgba(16,185,129,0.08)'}:{}),
        animationDelay: isToday?'0.4s':'0.5s'}}>
        <div onClick={()=>setAcc(p=>({...p,[id]:!p[id]}))} style={{display:'flex',alignItems:'center',gap:8,
          padding:'12px 16px',cursor:'pointer',transition:'background 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.025)'}
          onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
          <Chev open={open}/>
          <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{title}</span>
          <div style={{flex:1}}/>
          <span style={{fontSize:10,fontWeight:600,color:done===total&&total>0?C.em:'rgba(255,255,255,0.35)',
            padding:'2px 8px',borderRadius:10,
            backgroundColor:done===total&&total>0?C.emFaint:'rgba(255,255,255,0.05)',
            border:done===total&&total>0?'1px solid rgba(16,185,129,0.15)':'1px solid transparent',
            transition:'all 0.3s'}}>{done}/{total}</span>
          <MiniBar done={done} total={total}/>
        </div>
        <div style={{maxHeight:open?'3000px':'0',opacity:open?1:0,overflow:'hidden',
          transition:'max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease'}}>
          <div style={{borderTop:`1px solid ${C.div}`,padding:'6px 12px 12px'}}>
            {tasks.map(t => <TaskRow key={t.id} task={{...t,tag:t.tag||'Cleaning'}} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)} showTag={!!t.tag}/>)}
          </div>
        </div>
      </div>
    );
  };

  const cardS = (id) => ({
    backgroundColor: hovCard===id ? C.cardHover : C.card,
    border: `1px solid ${hovCard===id ? 'rgba(255,255,255,0.08)' : C.cardBorder}`,
    borderRadius: 16, padding: 20,
    boxShadow: hovCard===id ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)' : '0 1px 3px rgba(0,0,0,0.4)',
    transform: hovCard===id ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
  });

  // ─── SIDEBAR ───
  const sidebar = (
    <div style={{width:220,height:'100vh',position:'fixed',left:0,top:0,backgroundColor:C.sidebar,zIndex:50,
      display:'flex',flexDirection:'column',borderRight:`1px solid ${C.div}`,fontFamily:F,
      transform:mob&&!sb?'translateX(-100%)':'translateX(0)',transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: mob&&sb ? '8px 0 32px rgba(0,0,0,0.5)' : 'none'}}>
      <div style={{position:'absolute',left:0,top:0,width:1,height:'50%',
        background:'linear-gradient(to bottom,#10b981 0%,rgba(16,185,129,0.2) 40%,transparent 100%)'}}/>
      <div style={{position:'absolute',left:0,top:0,width:'100%',height:120,
        background:'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.04), transparent 70%)',pointerEvents:'none'}}/>

      <div style={{padding:'20px 16px',borderBottom:`1px solid ${C.div}`,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#10b981,#059669)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'white',letterSpacing:-0.5,
          boxShadow:'0 2px 8px rgba(16,185,129,0.3)'}}>IPD</div>
        <div><div style={{fontSize:13,fontWeight:700,color:C.t1,lineHeight:1.2}}>iPharmacy</div>
          <div style={{fontSize:9,fontWeight:600,color:C.t3,letterSpacing:1.5,textTransform:'uppercase'}}>Direct</div></div>
        {mob && <button onClick={()=>setSb(false)} style={{marginLeft:'auto',background:'none',border:'none',color:C.t3,cursor:'pointer',fontSize:18,padding:4}}>✕</button>}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'4px 0'}}>
        {NAV.map(g=>(
          <div key={g.s}>
            <div style={{fontSize:9,fontWeight:700,color:C.t4,letterSpacing:1.5,textTransform:'uppercase',padding:'22px 16px 6px'}}>{g.s}</div>
            {g.items.map(it=>{
              const act=it.active, hov=hovNav===it.l;
              return <button key={it.l} onMouseEnter={()=>setHovNav(it.l)} onMouseLeave={()=>setHovNav(null)}
                style={{display:'flex',alignItems:'center',gap:8,width:'calc(100% - 16px)',margin:'1px 8px',padding:'8px 12px',
                  borderRadius:7,border:'none',cursor:'pointer',fontFamily:F,fontSize:13,textAlign:'left',
                  backgroundColor:act?'rgba(255,255,255,0.06)':hov?'rgba(255,255,255,0.03)':'transparent',
                  color:act?C.t1:hov?'#a1a1aa':C.z6,fontWeight:act?600:400,
                  transition:'all 0.15s ease',
                  boxShadow:act?'inset 0 0 0 1px rgba(255,255,255,0.04)':'none'}}>
                <NI name={it.i} color={act?C.t1:hov?'#a1a1aa':C.z6}/>
                <span style={{flex:1}}>{it.l}</span>
                {it.b!=null && <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:8,minWidth:18,textAlign:'center',
                  backgroundColor:it.bc==='red'?'rgba(239,68,68,0.12)':it.bc==='amber'?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.05)',
                  color:it.bc==='red'?C.critLight:it.bc==='amber'?C.warnLight:'rgba(255,255,255,0.35)'}}>{it.b}</span>}
              </button>;
            })}
          </div>
        ))}
      </div>

      <div style={{padding:'14px 16px',borderTop:`1px solid ${C.div}`,display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:`linear-gradient(135deg,${C.em},${C.emDark})`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:10,fontWeight:700,color:'white',flexShrink:0,
          boxShadow:'0 2px 8px rgba(16,185,129,0.2)'}}>SS</div>
        <div><div style={{fontSize:12,fontWeight:600,color:C.t1}}>Salma Shakoor</div>
          <div style={{fontSize:10,color:C.t3}}>Admin Support</div></div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',fontFamily:F,background:C.bg,
      backgroundImage:'radial-gradient(ellipse at 25% -5%, rgba(16,185,129,0.035), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.02), transparent 50%)'}}>

      <Confetti show={showConfetti}/>

      {mob && sb && <div onClick={()=>setSb(false)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.75)',zIndex:49,backdropFilter:'blur(2px)'}}/>}
      {sidebar}

      <div style={{marginLeft:mob?0:220,padding:mob?'0 16px 60px':'0 36px 60px',maxWidth:1200}}>

        {/* ═══ HEADER ═══ */}
        <div className="ec-fadeup" style={{display:'flex',alignItems:mob?'flex-start':'center',justifyContent:'space-between',
          flexDirection:mob?'column':'row',gap:mob?16:0,padding:'28px 0 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {mob && <button onClick={()=>setSb(true)} style={{background:'none',border:'none',color:C.t3,cursor:'pointer',padding:4,display:'flex',flexDirection:'column',gap:3.5}}>
              <div style={{width:18,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/><div style={{width:18,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/><div style={{width:13,height:1.5,backgroundColor:'currentColor',borderRadius:1}}/></button>}
            <div>
              <div style={{fontSize:28,fontWeight:800,color:C.t1,lineHeight:1.1,letterSpacing:-0.5}}>{getGreeting()}, Salma</div>
              <div style={{fontSize:11,color:C.t3,marginTop:5,letterSpacing:0.3,display:'flex',alignItems:'center',gap:6}}>
                {liveDate} · <span style={{color:C.t2,fontVariantNumeric:'tabular-nums',fontWeight:500}}>{liveTime}</span>
              </div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,...(mob?{width:'100%',justifyContent:'space-between'}:{})}}>
            <Ring pct={75} size={52} delay={200}/>
            <div style={{width:1,height:28,backgroundColor:C.div}}/>
            <div style={{textAlign:'center',position:'relative',cursor:'default'}} onMouseEnter={()=>setHovStat('over')} onMouseLeave={()=>setHovStat(null)}>
              <div style={{fontSize:26,fontWeight:800,color:C.crit,lineHeight:1,letterSpacing:-1}}>{20}</div>
              <div style={{fontSize:9,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Overdue</div>
              {hovStat==='over' && <div className="ec-slidedown" style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,
                padding:'6px 12px',borderRadius:8,backgroundColor:'rgba(15,15,15,0.95)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)',fontSize:11,color:C.t2,whiteSpace:'nowrap',zIndex:10,
                backdropFilter:'blur(8px)'}}>20 cleaning tasks overdue</div>}
            </div>
            <div style={{textAlign:'center',position:'relative',cursor:'default'}} onMouseEnter={()=>setHovStat('due')} onMouseLeave={()=>setHovStat(null)}>
              <div style={{fontSize:26,fontWeight:800,color:C.warn,lineHeight:1,letterSpacing:-1}}>{5}</div>
              <div style={{fontSize:9,fontWeight:700,color:C.t3,textTransform:'uppercase',letterSpacing:1,marginTop:2}}>Due Today</div>
              {hovStat==='due' && <div className="ec-slidedown" style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',marginTop:8,
                padding:'6px 12px',borderRadius:8,backgroundColor:'rgba(15,15,15,0.95)',border:'1px solid rgba(255,255,255,0.08)',
                boxShadow:'0 8px 24px rgba(0,0,0,0.6)',fontSize:11,color:C.t2,whiteSpace:'nowrap',zIndex:10,
                backdropFilter:'blur(8px)'}}>2 time-sensitive, 3 routine</div>}
            </div>
            <div style={{width:1,height:28,backgroundColor:C.div}}/>

            {/* NOTIFICATION BELL */}
            <div ref={bellRef} style={{position:'relative'}}>
              <button onClick={()=>setBellOpen(!bellOpen)}
                style={{background:'none',border:'none',cursor:'pointer',padding:6,borderRadius:8,
                  backgroundColor:bellOpen?'rgba(255,255,255,0.06)':'transparent',
                  transition:'background 0.15s',position:'relative',display:'flex'}}>
                <div className={bellShake?'ec-bellshake':''}><BellIcon size={18} color={bellOpen?C.t1:C.t2}/></div>
                {unreadCount > 0 && <div style={{position:'absolute',top:2,right:2,width:14,height:14,borderRadius:'50%',
                  backgroundColor:C.crit,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:8,fontWeight:800,color:'white',border:`2px solid ${C.bg}`}}>{unreadCount}</div>}
              </button>
              {bellOpen && (
                <div className="ec-slidedown" style={{position:'absolute',top:'100%',right:0,marginTop:8,width:320,
                  borderRadius:12,backgroundColor:'rgba(15,15,15,0.97)',border:'1px solid rgba(255,255,255,0.08)',
                  boxShadow:'0 12px 40px rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:60,overflow:'hidden'}}>
                  <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.div}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.t1}}>Notifications</span>
                    {unreadCount > 0 && <span style={{fontSize:10,color:C.em,cursor:'pointer',fontWeight:500}}
                      onClick={()=>setNotifRead(new Set(NOTIFICATIONS.map(n=>n.id)))}>Mark all read</span>}
                  </div>
                  <div style={{maxHeight:300,overflowY:'auto'}}>
                    {NOTIFICATIONS.map(n => {
                      const isRead = notifRead.has(n.id);
                      const typeCol = n.type==='critical'?C.crit:n.type==='warning'?C.warn:C.info;
                      return (
                        <div key={n.id} onClick={()=>markNotifRead(n.id)}
                          style={{padding:'10px 16px',borderBottom:`1px solid ${C.div}`,cursor:'pointer',
                            backgroundColor:isRead?'transparent':'rgba(255,255,255,0.015)',
                            transition:'background 0.15s'}}
                          onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.03)'}
                          onMouseLeave={e=>e.currentTarget.style.backgroundColor=isRead?'transparent':'rgba(255,255,255,0.015)'}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                            <div style={{width:6,height:6,borderRadius:'50%',backgroundColor:isRead?'transparent':typeCol,marginTop:5,flexShrink:0,
                              boxShadow:isRead?'none':`0 0 4px ${typeCol}40`}}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:isRead?400:600,color:isRead?C.t3:C.t1}}>{n.title}</div>
                              <div style={{fontSize:11,color:C.t3,marginTop:2}}>{n.desc}</div>
                            </div>
                            <span style={{fontSize:10,color:C.t4,whiteSpace:'nowrap',flexShrink:0}}>{n.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{fontSize:11,color:C.z6,padding:'4px 12px',borderRadius:20,
              backgroundColor:'rgba(255,255,255,0.03)',border:`1px solid ${C.cardBorder}`,
              fontWeight:500,letterSpacing:0.5}}>FED07</div>
          </div>
        </div>

        {/* ═══ RP BAR ═══ */}
        <div className="ec-fadeup" style={{borderRadius:12,padding:'16px 20px',
          transition:'background-color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease',
          backgroundColor:rp?'rgba(16,185,129,0.035)':'rgba(239,68,68,0.05)',
          border:`1px solid ${rp?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.12)'}`,
          boxShadow:rp?'0 0 40px rgba(16,185,129,0.04), inset 0 1px 0 rgba(16,185,129,0.08)':'inset 0 1px 0 rgba(239,68,68,0.08)',
          animationDelay:'0.1s'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:200}}>
              <Dot color={rp?C.em:C.crit}/>
              {rp ? <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:14,fontWeight:600,color:C.t1}}>Amjid Shakoor</span>
                <span style={{fontSize:11,color:C.t3}}>RP since 09:02</span>
                <span style={{fontSize:14,fontWeight:700,color:C.em,fontVariantNumeric:'tabular-nums',letterSpacing:-0.3}}>{elapsed}</span>
              </div> : <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:14,fontWeight:600,color:C.critLight}}>No RP signed in</span>
                <span style={{fontSize:11,color:C.t3}}>Last: Amjid Shakoor out at 13:15</span>
              </div>}
            </div>
            <button onClick={()=>setRp(!rp)} style={{padding:rp?'7px 16px':'8px 22px',borderRadius:8,border:'none',cursor:'pointer',
              fontSize:13,fontWeight:600,fontFamily:F,transition:'all 0.2s ease',
              ...(rp?{backgroundColor:'rgba(255,255,255,0.05)',color:C.t2}:{backgroundColor:C.crit,color:'white',boxShadow:'0 2px 12px rgba(239,68,68,0.3)'})}}>
              {rp?'Sign Out':'Sign In as RP →'}</button>
          </div>

          {rp && <div style={{display:'flex',gap:8,marginTop:16,flexWrap:'wrap'}}>
            {KEYS.map(k=>{
              const st=keys[k.id], pr=pressed===k.id, jc=justCompleted===k.id, isFr=k.id==='fridgeTemp';
              return <button key={k.id} onClick={()=>handleKey(k.id)} style={{flex:'1 1 0',minWidth:mob?'calc(33% - 8px)':0,
                height:58,borderRadius:10,cursor:st.d?'default':'pointer',fontFamily:F,
                border:`1px solid ${st.d?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.06)'}`,
                backgroundColor:st.d?'rgba(16,185,129,0.05)':'rgba(255,255,255,0.025)',
                boxShadow:st.d?'0 0 12px rgba(16,185,129,0.06)':'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.03)',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,
                transform:pr?'scale(0.95)':jc?'scale(1.02)':'scale(1)',
                transition:'all 0.15s cubic-bezier(0.34,1.56,0.64,1)'}}>
                {st.d ? <><div className="ec-checkpop"><Check s={14} c={C.em}/></div>
                  <span style={{fontSize:10,color:C.em,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{st.t}{isFr&&st.v?` · ${st.v}°C`:''}</span></>
                : isFr&&showFridge ? <div style={{display:'flex',alignItems:'center',gap:4}} onClick={e=>e.stopPropagation()}>
                  <input autoFocus value={fridgeVal} onChange={e=>setFridgeVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submitFridge();}}
                    placeholder="°C" style={{width:44,padding:'3px 4px',borderRadius:5,border:'1px solid rgba(255,255,255,0.1)',
                    backgroundColor:'rgba(255,255,255,0.06)',color:C.t1,fontSize:12,textAlign:'center',outline:'none',fontFamily:F}}/>
                  <button onClick={submitFridge} style={{background:C.em,border:'none',borderRadius:5,color:'white',fontSize:11,padding:'3px 8px',cursor:'pointer',fontWeight:600}}>✓</button>
                </div>
                : <><span style={{fontSize:17,lineHeight:1}}>{k.em}</span><span style={{fontSize:10,color:C.t3,fontWeight:500}}>{k.label}</span></>}
              </button>;
            })}
          </div>}

          {rp && <div style={{marginTop:12}}>
            <button onClick={()=>setSessOpen(!sessOpen)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:F,
              fontSize:11,color:C.t3,padding:'2px 0',display:'flex',alignItems:'center',gap:4,transition:'color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.color=C.t1} onMouseLeave={e=>e.currentTarget.style.color=C.t3}>
              <Chev open={sessOpen} color="currentColor" size={10}/>Today's sessions</button>
            <div style={{maxHeight:sessOpen?'200px':'0',opacity:sessOpen?1:0,overflow:'hidden',transition:'max-height 0.3s ease, opacity 0.2s ease'}}>
              <div style={{marginTop:6,padding:'8px 12px',borderRadius:8,backgroundColor:'rgba(255,255,255,0.015)',border:`1px solid ${C.div}`}}>
                {SESSIONS.map((s,i)=><div key={i} style={{display:'flex',gap:12,fontSize:11,color:C.t3,padding:'5px 0',
                  borderBottom:i<SESSIONS.length-1?`1px solid ${C.div}`:'none'}}>
                  <span style={{color:C.t2,fontWeight:500,minWidth:100,fontVariantNumeric:'tabular-nums'}}>{s.start} – {s.end}</span>
                  <span style={{flex:1}}>{s.name}</span>
                  <span style={{color:s.end==='ongoing'?C.em:C.t3,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{s.dur||elapsed}</span>
                </div>)}
              </div>
            </div>
          </div>}
        </div>

        {/* ═══ ZONE 2 ═══ */}
        <div style={{display:'flex',gap:16,marginTop:20,flexDirection:mob?'column':'row'}}>

          {/* SHIFT CHECKLIST */}
          <div className="ec-fadeup" style={{flex:'0 0 58%',...(mob?{flex:'1 1 auto'}:{}),
            ...cardS('shift'),animationDelay:'0.2s'}}
            onMouseEnter={()=>setHovCard('shift')} onMouseLeave={()=>setHovCard(null)}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:13,fontWeight:700,color:C.t1,letterSpacing:0.2}}>Shift Checklist</span>
              <div style={{flex:1}}/>
              {allTodayDone && <span style={{fontSize:10,color:C.em,fontWeight:600,display:'flex',alignItems:'center',gap:3}}>
                <Check s={10} c={C.em}/>Complete</span>}
              <span style={{fontSize:11,color:allTodayDone?C.em:C.t3,fontWeight:600,fontVariantNumeric:'tabular-nums',
                transition:'color 0.3s'}}>{todayChecked}/{TODAY_TASKS.length}</span>
              <MiniBar done={todayChecked} total={TODAY_TASKS.length}/>
            </div>
            <div style={{height:1,backgroundColor:C.div,margin:'14px 0'}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.crit,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8,
              display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:4,height:4,borderRadius:'50%',backgroundColor:C.crit}}/>TIME-SENSITIVE
            </div>
            {TODAY_TASKS.slice(0,2).map(t=><TaskRow key={t.id} task={t} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)}/>)}
            <div style={{height:1,backgroundColor:C.div,margin:'10px 0'}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:1.2,textTransform:'uppercase',marginBottom:8,
              display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:4,height:4,borderRadius:'50%',backgroundColor:C.t3}}/>ANYTIME
            </div>
            {TODAY_TASKS.slice(2).map(t=><TaskRow key={t.id} task={t} isChecked={checked.has(t.id)} onToggle={()=>toggleCheck(t.id)}/>)}
            <div style={{marginTop:18,paddingTop:12,borderTop:`1px solid ${C.div}`,fontSize:11,color:'rgba(255,255,255,0.18)',
              display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:14}}>🔥</span> 7 days fully completed
            </div>
          </div>

          {/* COMPLIANCE HEALTH */}
          <div className="ec-fadeup" style={{flex:'0 0 calc(42% - 16px)',...(mob?{flex:'1 1 auto'}:{}),
            ...cardS('comp'),animationDelay:'0.25s'}}
            onMouseEnter={()=>setHovCard('comp')} onMouseLeave={()=>setHovCard(null)}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:13,fontWeight:700,color:C.t1,letterSpacing:0.2}}>Compliance Health</span>
              <div style={{flex:1}}/>
              <Ring pct={75} size={36} sw={3} delay={400}/>
              <span style={{fontSize:11,color:C.t3}}>Overall</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:18}}>
              {COMPLIANCE_DATA.map((c,i)=>{
                const isHov = hovTile===i;
                return <div key={i} className={c.alert?'ec-breath':''}
                  style={{padding:14,borderRadius:12,
                  backgroundColor:c.alert?'rgba(239,68,68,0.035)':'rgba(255,255,255,0.015)',
                  border:`1px solid ${c.alert?(isHov?'rgba(239,68,68,0.25)':'rgba(239,68,68,0.08)'):(isHov?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)')}`,
                  transform:isHov?'translateY(-2px)':'translateY(0)',
                  transition:'transform 0.2s ease, border-color 0.2s ease',
                  display:'flex',flexDirection:'column',alignItems:'center'}}
                  onMouseEnter={()=>setHovTile(i)} onMouseLeave={()=>setHovTile(null)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%'}}>
                    <span style={{fontSize:9,fontWeight:700,color:C.t3,letterSpacing:1,textTransform:'uppercase'}}>{c.label}</span>
                    <Trend trend={c.trend} val={c.trendVal}/>
                  </div>
                  <div style={{margin:'10px 0'}}><Ring pct={c.pct} size={48} sw={3.5} delay={500+i*120}/></div>
                  <span style={{fontSize:11,color:c.alert?C.critLight:C.t3,fontWeight:c.alert?500:400}}>{c.detail}</span>
                  <Spark data={c.data} color={c.color} w={76} h={20} delay={700+i*150}/>
                </div>;
              })}
            </div>
            <div style={{height:1,backgroundColor:C.div,marginTop:16}}/>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12}}>
              <div style={{width:6,height:6,borderRadius:'50%',backgroundColor:C.warn,boxShadow:'0 0 4px rgba(245,158,11,0.3)'}}/>
              <span style={{fontSize:11,color:C.t3}}>Last GPhC inspection: <span style={{color:C.warnLight,fontWeight:500}}>14 months ago</span></span>
            </div>
          </div>
        </div>

        {/* ═══ ALERT BANNER ═══ */}
        <div className="ec-fadeup" style={{borderRadius:12,padding:'14px 20px',marginTop:20,
          backgroundColor:'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.08)',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,
          boxShadow:'inset 0 1px 0 rgba(239,68,68,0.06)',animationDelay:'0.35s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <WarningTri/>
            <span style={{fontSize:13,fontWeight:600,color:C.critLight}}>Attention:</span>
            <span style={{fontSize:13,color:C.t2}}>Cleaning at 0% — 20 tasks overdue</span>
          </div>
          <span style={{fontSize:12,fontWeight:600,color:C.crit,cursor:'pointer',padding:'4px 12px',borderRadius:6,
            backgroundColor:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.12)',
            transition:'all 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(239,68,68,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor='rgba(239,68,68,0.08)'}>Review Cleaning →</span>
        </div>

        {/* ═══ TASK SCHEDULE ═══ */}
        <div>
          <div className="ec-fadeup" style={{fontSize:13,fontWeight:700,color:C.t1,marginTop:28,marginBottom:14,
            display:'flex',alignItems:'center',gap:8,animationDelay:'0.4s'}}>
            Task Schedule
            <div style={{flex:1,height:1,backgroundColor:C.div}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <AccPanel id="today" title="Today" tasks={TODAY_TASKS} isToday/>
            <AccPanel id="weekly" title="Weekly" tasks={WEEKLY}/>
            <AccPanel id="fort" title="Fortnightly" tasks={FORT}/>
            <AccPanel id="monthly" title="Monthly" tasks={MONTHLY}/>
          </div>
        </div>

        {/* ═══ TO DO ═══ */}
        <div className="ec-fadeup" style={{borderRadius:16,backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,padding:20,marginTop:20,
          animationDelay:'0.5s'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700,color:C.t1}}>To Do</span>
            <span style={{fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:10,
              backgroundColor:C.warnFaint,color:C.warnLight,border:'1px solid rgba(245,158,11,0.12)'}}>4</span>
            <div style={{flex:1,height:1,backgroundColor:C.div,marginLeft:8}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:mob?'1fr':'1fr 1fr',gap:4}}>
            {TODOS.map(td=>(
              <div key={td.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 4px',borderRadius:6,
                transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <CB id={td.id} isChecked={checkedTodo.has(td.id)} onToggle={()=>toggleTodo(td.id)}/>
                <span style={{fontSize:13,fontWeight:400,color:C.t2,flex:1,
                  textDecoration:checkedTodo.has(td.id)?'line-through':'none',
                  opacity:checkedTodo.has(td.id)?0.25:1,transition:'opacity 0.3s'}}>{td.title}</span>
                <span style={{fontSize:10,color:C.t4,fontVariantNumeric:'tabular-nums'}}>{td.days}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="ec-fadeup" style={{marginTop:48,padding:'20px 0',borderTop:`1px solid ${C.div}`,textAlign:'center',
          animationDelay:'0.55s'}}>
          <span style={{fontSize:11,color:C.t5,letterSpacing:0.5}}>Compliance Tracker v4.0 · iPharmacy Direct</span>
        </div>
      </div>

      {/* SCROLL FADE */}
      <div style={{position:'fixed',bottom:0,left:mob?0:220,right:0,height:48,
        background:`linear-gradient(to top, ${C.bg}, transparent)`,
        pointerEvents:'none',opacity:scrollFade?1:0,transition:'opacity 0.4s ease'}}/>
    </div>
  );
}, "This is a Vite + React project (not Next.js). The task mentions Next.js-specific things like 'CSS modules' and 'global stylesheet'. Your current codebase uses plain CSS with CSS variables in one large `src/index.css` file. How should I handle styling?"="Convert to Tailwind", "This is a massive redesign touching 10+ files with 3000+ lines of changes. How should I approach scope?"="Full integration at once". You can now continue with the user's answers in mind