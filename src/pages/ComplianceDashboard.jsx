import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

const NAV_ROUTES = {
  dashboard: "/",
  tasks: "/my-tasks",
  rp: "/rp-log",
  temp: "/temperature",
  training: "/training",
  cleaning: "/cleaning",
  documents: "/documents",
  incidents: "/incidents",
  safeguarding: "/safeguarding",
  stafftraining: "/staff-training",
  nearmisses: "/near-misses",
  report: "/compliance-report",
};

const STAFF_INITIALS = {
  SS: { bg: "#6366f1", label: "Salma Shakoor" },
  AS: { bg: "#059669", label: "Amjid Shakoor" },
  JA: { bg: "#0ea5e9", label: "Jamila Adwan" },
  MH: { bg: "#f59e0b", label: "Marian Hadaway" },
  UK: { bg: "#8b5cf6", label: "Unknown" },
};

const SHIFT_TASKS = [
  { id: 1, label: "Temperature Log", priority: "HIGH", category: "Cleaning", byTime: "09:00", assignee: "SS", section: "time", done: false },
  { id: 2, label: "Daily RP Checks", priority: "HIGH", category: "RP Check", byTime: "10:00", assignee: "AS", section: "time", done: false },
  { id: 3, label: "Dispensary Clean", priority: "MED", category: "Cleaning", assignee: "UK", section: "anytime", done: false },
  { id: 4, label: "Counter & Surfaces Wipe", priority: "MED", category: "Cleaning", assignee: "SS", section: "anytime", done: false },
];

const WEEKLY_TASKS = [
  { id: 5, label: "CD Register Balance Check", priority: "HIGH", category: "CD Check", assignee: "AS", done: false },
  { id: 6, label: "Fridge Temperature Review", priority: "HIGH", category: "Cleaning", assignee: "JA", done: false },
  { id: 7, label: "Near Miss Log Review", priority: "MED", category: "Compliance", assignee: "AS", done: false },
  { id: 8, label: "Robot Dispenser Wipe-Down", priority: "MED", category: "Cleaning", assignee: "MH", done: false },
  { id: 9, label: "Waste Disposal Check", priority: "LOW", category: "Waste", assignee: "MH", done: false },
  { id: 10, label: "PPE Stock Check", priority: "MED", category: "H&S", assignee: "MH", done: false },
];

const FORTNIGHTLY_TASKS = [
  { id: 11, label: "SOP Review Sign-off", priority: "HIGH", category: "Compliance", assignee: "AS", done: false },
  { id: 12, label: "Sharps Bin Check", priority: "MED", category: "H&S", assignee: "MH", done: false },
];

const MONTHLY_TASKS = [
  { id: 13, label: "Controlled Drug Audit", priority: "HIGH", category: "CD Check", assignee: "AS", done: false },
  { id: 14, label: "Staff Training Records Review", priority: "MED", category: "Compliance", assignee: "AS", done: false },
  { id: 15, label: "Complaint & Incident Summary", priority: "MED", category: "Compliance", assignee: "AS", done: false },
];

const COMPLIANCE_HEALTH = [
  { key: "documents", label: "Documents", pct: 87, trend: "Stable", sub: "32 expiring", subColor: "#d97706", icon: "📄", detail: "4 expired · 28 due within 90 days", color: "#059669" },
  { key: "training", label: "Training", pct: 68, trend: "Needs attention", sub: "483 modules outstanding", subColor: "#ef4444", icon: "📚", detail: "14 staff tracked — bulk import incomplete", color: "#047857" },
  { key: "cleaning", label: "Cleaning", pct: 42, trend: "Needs attention", sub: "19 overdue tasks", subColor: "#ef4444", icon: "🧹", detail: "Daily & weekly rotas not being marked complete", color: "#f59e0b" },
  { key: "safeguarding", label: "Safeguarding", pct: 100, trend: "All current", sub: "All current", subColor: "#059669", icon: "🛡️", detail: "All staff certificates valid", color: "#16a34a" },
];

const ALERTS = [
  { level: "red", msg: "Training completion rate critically low — 483 modules outstanding" },
  { level: "red", msg: "Cleaning at 42% — 19 tasks overdue across Daily & Weekly rota" },
  { level: "amber", msg: "32 documents expiring within 90 days" },
  { level: "amber", msg: "No RP signed in — Daily RP Checks not started (0/5)" },
  { level: "yellow", msg: "Last GPhC inspection was 14 months ago — consider mock inspection" },
];

const CD_ENTRIES = [
  { drug: "Morphine Sulfate 10mg/5ml", form: "Oral Solution", balance: 1240, unit: "ml", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Oxycodone 5mg", form: "Capsules", balance: 84, unit: "caps", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Methadone 1mg/ml", form: "Oral Solution", balance: 2800, unit: "ml", lastCheck: "03/03/2026", checker: "AS", status: "due" },
  { drug: "Diazepam 5mg", form: "Tablets", balance: 210, unit: "tabs", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Buprenorphine 8mg", form: "Sublingual", balance: 16, unit: "tabs", lastCheck: "01/03/2026", checker: "AS", status: "overdue" },
];

const NAV_ITEMS = [
  { section: "DAILY", items: [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "tasks", label: "My Tasks", icon: "✓" },
    { id: "rp", label: "RP Log", icon: "⚕" },
    { id: "temp", label: "Temp Log", icon: "🌡", badge: 1 },
  ]},
  { section: "RECORDS", items: [
    { id: "training", label: "Training Logs", icon: "📚" },
    { id: "cleaning", label: "Cleaning Rota", icon: "🧹" },
    { id: "documents", label: "Documents", icon: "📄", badge: 32 },
    { id: "incidents", label: "Incidents", icon: "⚠️" },
  ]},
  { section: "COMPLIANCE", items: [
    { id: "safeguarding", label: "Safeguarding", icon: "🛡" },
    { id: "stafftraining", label: "Staff Training", icon: "👥", badge: 483 },
    { id: "nearmisses", label: "Near Misses", icon: "🔔" },
    { id: "report", label: "Compliance Report", icon: "📋" },
  ]},
];

const EXPIRING_DOCS = [
  { name: "Fire Risk Assessment", days: -5, owner: "AS" },
  { name: "Safeguarding Policy", days: 6, owner: "JA" },
  { name: "CD SOP", days: 12, owner: "AS" },
  { name: "GPhC Registration", days: 45, owner: "AS" },
  { name: "Waste Contract (Shred-it)", days: 60, owner: "MH" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Avatar({ initials, size = 24 }) {
  const cfg = STAFF_INITIALS[initials] || { bg: "#94a3b8", label: initials };
  return (
    <div title={cfg.label} style={{
      width: size, height: size, borderRadius: "50%", background: cfg.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{initials}</div>
  );
}

function PriorityBadge({ level }) {
  const cfg = {
    HIGH: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    MED:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    LOW:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  }[level] || { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace",
    }}>{level}</span>
  );
}

function CategoryTag({ label }) {
  const cfg = {
    "Cleaning":   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    "RP Check":   { bg: "#fdf4ff", color: "#9333ea", border: "#e9d5ff" },
    "CD Check":   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
    "Compliance": { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
    "H&S":        { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
    "Waste":      { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  }[label] || { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>{label}</span>
  );
}

function CircleProgress({ pct, color, size = 52 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const pctColor = pct >= 80 ? "#059669" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8f5e9" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: pctColor, fontFamily: "'DM Mono', monospace",
      }}>{pct}%</div>
    </div>
  );
}

function CardHeader({ gradient, icon, title, right }) {
  return (
    <div style={{
      margin: "-14px -16px 12px", padding: "9px 16px",
      background: gradient, display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "white", fontSize: 13, fontWeight: 700 }}>
        <span>{icon}</span>{title}
      </div>
      {right && <div style={{ color: "rgba(255,255,255,0.9)" }}>{right}</div>}
    </div>
  );
}

function TaskRow({ task, onToggle }) {
  return (
    <div onClick={() => onToggle && onToggle(task.id)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      borderRadius: 8, cursor: "pointer",
      background: task.done ? "#f0fdf4" : "white",
      border: `1px solid ${task.done ? "#6ee7b7" : "#e2e8f0"}`,
      marginBottom: 4, transition: "background 0.12s",
    }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: task.done ? "none" : "2px solid #d1d5db",
        background: task.done ? "#059669" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {task.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: task.done ? "#6ee7b7" : "#1e293b", textDecoration: task.done ? "line-through" : "none" }}>{task.label}</div>
        {task.sub && !task.done && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>› {task.sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <PriorityBadge level={task.priority} />
        <CategoryTag label={task.category} />
        {task.byTime && <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>⏱{task.byTime}</span>}
        <Avatar initials={task.assignee} size={22} />
      </div>
    </div>
  );
}

function ComplianceCard({ item, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      background: "white", borderRadius: 10, padding: "10px 12px",
      border: "1px solid #d1fae5", cursor: "pointer",
      boxShadow: expanded ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: item.color, borderRadius: "10px 0 0 10px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
        <CircleProgress pct={item.pct} color={item.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#064e3b", marginBottom: 2 }}>{item.icon} {item.label}</div>
          <div style={{ fontSize: 10, color: item.subColor, fontWeight: 600 }}>{item.sub}</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3,
            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20,
            background: item.trend === "Needs attention" ? "#fef2f2" : "#f0fdf4",
            color: item.trend === "Needs attention" ? "#dc2626" : "#059669",
            border: `1px solid ${item.trend === "Needs attention" ? "#fecaca" : "#6ee7b7"}`,
          }}>
            {item.trend === "Needs attention" ? "⚠" : "✓"} {item.trend}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0fdf4", fontSize: 11, color: "#64748b", paddingLeft: 6, lineHeight: 1.6 }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

export default function ComplianceDashboard() {
  const navigate = useNavigate();
  const [shiftTasks, setShiftTasks] = useState(SHIFT_TASKS);
  const [scheduleTasks, setScheduleTasks] = useState({ weekly: WEEKLY_TASKS, fortnightly: FORTNIGHTLY_TASKS, monthly: MONTHLY_TASKS });
  const [openSection, setOpenSection] = useState("time");
  const [expandedCard, setExpandedCard] = useState(null);
  const [rpSigned, setRpSigned] = useState(false);
  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const shiftDone = shiftTasks.filter(t => t.done).length;
  const shiftTotal = shiftTasks.length;
  const shiftPct = Math.round((shiftDone / shiftTotal) * 100);

  const toggleShift = (id) => setShiftTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const SCHEDULE_KEYS = ["weekly", "fortnightly", "monthly"];
  const safeToggleSchedule = (grp, id) => {
    if (!SCHEDULE_KEYS.includes(grp)) return;
    setScheduleTasks(prev => ({ ...prev, [grp]: prev[grp].map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  };

  const overallPct = Math.round(COMPLIANCE_HEALTH.reduce((s, i) => s + i.pct, 0) / COMPLIANCE_HEALTH.length);
  const redAlerts = ALERTS.filter(a => a.level === "red").length;
  const cdOverdue = CD_ENTRIES.filter(e => e.status === "overdue").length;
  const cdDue = CD_ENTRIES.filter(e => e.status === "due").length;
  const totalOverdue = cdOverdue + 19;
  const streakDays = shiftTasks.every(t => t.done) ? 1 : 0;

  const TABS = [
    { key: "time",        label: "Time-Sensitive", tasks: shiftTasks.filter(t => t.section === "time") },
    { key: "anytime",     label: "Anytime",         tasks: shiftTasks.filter(t => t.section === "anytime") },
    { key: "weekly",      label: "Weekly",           tasks: scheduleTasks.weekly },
    { key: "fortnightly", label: "Fortnightly",      tasks: scheduleTasks.fortnightly },
    { key: "monthly",     label: "Monthly",          tasks: scheduleTasks.monthly },
  ];

  const card = {
    background: "white", borderRadius: 12, padding: "14px 16px",
    border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(5,150,105,0.06)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0faf4" }}>

      <aside style={{
        width: 214, flexShrink: 0,
        background: "linear-gradient(180deg, #064e3b 0%, #065f46 100%)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>iP</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>iPharmacy Direct</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Compliance Tracker</div>
            </div>
          </div>
        </div>
        {NAV_ITEMS.map(group => (
          <div key={group.section} style={{ padding: "12px 10px 4px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 6px", marginBottom: 3 }}>{group.section}</div>
            {group.items.map(item => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); navigate(NAV_ROUTES[item.id] || "/"); }} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                borderRadius: 8, cursor: "pointer", marginBottom: 1, width: "100%", textAlign: "left",
                background: activeNav === item.id ? "rgba(255,255,255,0.18)" : "transparent",
                color: activeNav === item.id ? "white" : "rgba(255,255,255,0.6)",
                fontWeight: activeNav === item.id ? 600 : 400, fontSize: 12.5,
                border: "none", fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ fontSize: 12 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "white" }}>{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar initials="SS" size={28} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>Salma Shakoor</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Staff · FED07</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 22px",
          background: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #10b981 100%)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{getGreeting()}, Salma</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{dateStr} · {timeStr}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: "Overall", val: `${overallPct}%`, bg: "rgba(255,255,255,0.18)" },
              { label: "Overdue", val: String(totalOverdue), bg: "#ef4444" },
              { label: "Due Today", val: String(cdDue + 1), bg: "#f59e0b" },
            ].map(k => (
              <div key={k.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 12px", borderRadius: 9, background: k.bg }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{k.label}</span>
              </div>
            ))}
            <div style={{ position: "relative", cursor: "pointer", padding: "5px 8px" }}>
              <span style={{ fontSize: 17 }}>🔔</span>
              <div style={{ position: "absolute", top: 1, right: 3, width: 15, height: 15, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
            </div>
            <div style={{ padding: "4px 9px", borderRadius: 7, background: "rgba(255,255,255,0.18)", color: "white", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)" }}>FED07</div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", maxWidth: 1100, margin: "0 auto" }}>

          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
            borderRadius: 10, marginBottom: 10,
            background: rpSigned ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${rpSigned ? "#6ee7b7" : "#fecaca"}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: rpSigned ? "#059669" : "#ef4444", boxShadow: rpSigned ? "0 0 0 3px #a7f3d0" : "0 0 0 3px #fee2e2" }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: rpSigned ? "#166534" : "#991b1b" }}>
              {rpSigned ? "RP signed in — Amjid Shakoor" : "No RP signed in · Last: Amjid Shakoor"}
            </div>
            <button onClick={() => setRpSigned(!rpSigned)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: rpSigned ? "#059669" : "#dc2626", color: "white",
              fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            }}>
              {rpSigned ? "✓ Signed In" : "Sign In as RP →"}
            </button>
          </div>

          {!alertsDismissed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
              borderRadius: 10, marginBottom: 12,
              background: "#fef2f2", border: "1px solid #fecaca",
            }}>
              <span style={{ fontSize: 13 }}>🔴</span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#991b1b" }}>
                  {redAlerts} critical · {ALERTS.length - redAlerts} warnings
                </span>
                <span style={{ fontSize: 11, color: "#b91c1c" }}>—</span>
                {ALERTS.slice(0, 2).map((a, i) => (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 500, color: "#7f1d1d",
                    background: "#fee2e2", padding: "2px 8px", borderRadius: 20, border: "1px solid #fecaca",
                  }}>{a.msg.split("—")[0].trim()}</span>
                ))}
                {ALERTS.length > 2 && <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 600 }}>+{ALERTS.length - 2} more</span>}
              </div>
              <button onClick={() => setAlertsDismissed(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#ef4444", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0,
              }}>×</button>
            </div>
          )}

          <div style={{ ...card, marginBottom: 12, overflow: "hidden" }}>
            <CardHeader
              gradient="linear-gradient(90deg, #b45309, #d97706)"
              icon="✅" title="To Do"
              right={todos.filter(t => !t.done).length > 0
                ? <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: 20 }}>{todos.filter(t => !t.done).length} remaining</span>
                : null}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: todos.length ? 8 : 0 }}>
              <input value={todoInput} onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && todoInput.trim()) { setTodos(ts => [...ts, { id: Date.now(), text: todoInput.trim(), done: false }]); setTodoInput(""); }}}
                placeholder="Add an action item and press Enter…"
                style={{ flex: 1, padding: "7px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #d1fae5", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f9fafb" }}
              />
              <button onClick={() => { if (todoInput.trim()) { setTodos(ts => [...ts, { id: Date.now(), text: todoInput.trim(), done: false }]); setTodoInput(""); }}}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#059669", color: "white", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                + Add
              </button>
            </div>
            {todos.length === 0
              ? <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>Nothing here yet — add an action item above</div>
              : todos.map(todo => (
                <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: todo.done ? "#f0fdf4" : "#f9fafb", border: `1px solid ${todo.done ? "#6ee7b7" : "#e2e8f0"}` }}>
                  <div onClick={() => setTodos(ts => ts.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: todo.done ? "none" : "2px solid #d1d5db", background: todo.done ? "#059669" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {todo.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: todo.done ? "#6ee7b7" : "#1e293b", textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                  <button onClick={() => setTodos(ts => ts.filter(t => t.id !== todo.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 15 }}>×</button>
                </div>
              ))
            }
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 12, alignItems: "start" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  gradient="linear-gradient(90deg, #064e3b, #059669)"
                  icon="📋" title="Shift Checklist"
                  right={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${shiftPct}%`, height: "100%", background: shiftPct === 100 ? "#4ade80" : "white", borderRadius: 99, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{shiftDone}/{shiftTotal}</span>
                    </div>
                  }
                />
                <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                  {TABS.map(tab => {
                    const done = tab.tasks.filter(t => t.done).length;
                    const isActive = openSection === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setOpenSection(tab.key)}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0fdf4"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "white"; }}
                        style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          border: isActive ? "none" : "1px solid #d1fae5",
                          background: isActive ? "#059669" : "white",
                          color: isActive ? "white" : "#059669",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          transition: "background 0.12s",
                        }}>
                        {tab.label} <span style={{ opacity: 0.7, fontFamily: "'DM Mono', monospace", fontSize: 9 }}>{done}/{tab.tasks.length}</span>
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const active = TABS.find(t => t.key === openSection);
                  if (!active) return null;
                  if (openSection === "time" || openSection === "anytime") {
                    return active.tasks.map(t => {
                      const enriched = t.id === 2
                        ? { ...t, sub: rpSigned ? "RP signed in — checks in progress" : "0/5 RP checks complete — no RP signed in" }
                        : t;
                      return <TaskRow key={t.id} task={enriched} onToggle={toggleShift} />;
                    });
                  }
                  return active.tasks.map(t => <TaskRow key={t.id} task={t} onToggle={(id) => safeToggleSchedule(openSection, id)} />);
                })()}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5", fontSize: 10, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                  🔥 <span style={{ fontWeight: 500 }}>{streakDays} day{streakDays !== 1 ? "s" : ""} fully completed this week</span>
                  {streakDays === 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#9ca3af" }}>Complete all tasks to build your streak</span>}
                  {streakDays > 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#059669", fontWeight: 600 }}>Keep it up!</span>}
                </div>
              </div>

              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  gradient="linear-gradient(90deg, #064e3b, #0f766e)"
                  icon="💊" title="CD Balance Check"
                  right={
                    <div style={{ display: "flex", gap: 5 }}>
                      {cdOverdue > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "1px 8px", borderRadius: 20, border: "1px solid #fecaca" }}>{cdOverdue} overdue</span>}
                      {cdDue > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#d97706", padding: "1px 8px", borderRadius: 20, border: "1px solid #fde68a" }}>{cdDue} due today</span>}
                    </div>
                  }
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {CD_ENTRIES.map((e, i) => {
                    const s = {
                      ok:      { dot: "#059669", bg: "white",   border: "#e2e8f0", label: "✓ Checked", lc: "#059669" },
                      due:     { dot: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Due today",  lc: "#d97706" },
                      overdue: { dot: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Overdue",    lc: "#dc2626" },
                    }[e.status];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: s.bg, border: `1px solid ${s.border}` }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{e.drug}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.form}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
                            {e.balance} <span style={{ fontSize: 9, fontWeight: 400, color: "#94a3b8" }}>{e.unit}</span>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: s.lc }}>{s.label}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                          <div style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{e.lastCheck}</div>
                          <Avatar initials={e.checker} size={20} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5", fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#6ee7b7" }}>●</span> Register maintained in PharmSmart · Physical register in CD cabinet
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  gradient="linear-gradient(90deg, #064e3b, #047857)"
                  icon="🏥" title="Compliance Health"
                  right={<span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{overallPct}% <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>overall</span></span>}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {COMPLIANCE_HEALTH.map(item => (
                    <ComplianceCard key={item.key} item={item}
                      expanded={expandedCard === item.key}
                      onToggle={() => setExpandedCard(expandedCard === item.key ? null : item.key)}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #f0fdf4", fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                  Last GPhC inspection: <strong style={{ color: "#64748b" }}>14 months ago</strong>
                </div>
              </div>

              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader gradient="linear-gradient(90deg, #166534, #16a34a)" icon="📅" title="Expiring Soon" />
                {EXPIRING_DOCS.map((doc, i) => {
                  const r = doc.days < 0
                    ? { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "EXPIRED", sublabel: `${Math.abs(doc.days)}d ago` }
                    : doc.days <= 14
                    ? { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: `in ${doc.days}d`, sublabel: "Urgent" }
                    : doc.days <= 30
                    ? { bg: "#fffbeb", border: "#fde68a", text: "#d97706", label: `in ${doc.days}d`, sublabel: "Soon" }
                    : { bg: "white", border: "#d1fae5", text: "#059669", label: `in ${doc.days}d`, sublabel: "OK" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, marginBottom: 4, background: r.bg, border: `1px solid ${r.border}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{doc.name}</div>
                        <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{r.sublabel}</div>
                      </div>
                      <Avatar initials={doc.owner} size={20} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.text, fontFamily: "'DM Mono', monospace", minWidth: 54, textAlign: "right" }}>{r.label}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
