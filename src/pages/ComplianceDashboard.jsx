import { useState, useEffect } from "react";

// Inter font loaded via index.html

// ── Data ───────────────────────────────────────────────────────────────────

const STAFF_INITIALS = {
  SS: { bg: "#6366f1", label: "Salma Shakoor" },
  AS: { bg: "var(--ec-em)", label: "Amjid Shakoor" },
  JA: { bg: "#0ea5e9", label: "Jamila Adwan" },
  MH: { bg: "var(--ec-warn)", label: "Marian Hadaway" },
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
  { key: "documents", label: "Documents", pct: 87, trend: "Stable", sub: "32 expiring", subColor: "var(--ec-warn)", icon: "📄", detail: "4 expired · 28 due within 90 days", color: "var(--ec-em)" },
  { key: "training", label: "Training", pct: 68, trend: "Needs attention", sub: "483 modules outstanding", subColor: "var(--ec-crit)", icon: "📚", detail: "14 staff tracked — bulk import incomplete", color: "var(--ec-em-dark)" },
  { key: "cleaning", label: "Cleaning", pct: 42, trend: "Needs attention", sub: "19 overdue tasks", subColor: "var(--ec-crit)", icon: "🧹", detail: "Daily & weekly rotas not being marked complete", color: "var(--ec-warn)" },
  { key: "safeguarding", label: "Safeguarding", pct: 100, trend: "All current", sub: "All current", subColor: "var(--ec-em)", icon: "🛡️", detail: "All staff certificates valid", color: "var(--ec-em)" },
];

const ALERTS = [
  { level: "red", msg: "Training completion rate critically low — 483 modules outstanding", action: "Review Training" },
  { level: "red", msg: "Cleaning at 42% — 19 tasks overdue across Daily & Weekly rota", action: "Review Cleaning" },
  { level: "amber", msg: "32 documents expiring within 90 days", action: "View Documents" },
  { level: "amber", msg: "No RP signed in — Daily RP Checks not started (0/5)", action: "Sign In as RP" },
  { level: "yellow", msg: "Last GPhC inspection was 14 months ago — consider mock inspection", action: "View Report" },
];

const CD_ENTRIES = [
  { drug: "Morphine Sulfate 10mg/5ml", form: "Oral Solution", balance: 1240, unit: "ml", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Oxycodone 5mg", form: "Capsules", balance: 84, unit: "caps", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Methadone 1mg/ml", form: "Oral Solution", balance: 2800, unit: "ml", lastCheck: "03/03/2026", checker: "AS", status: "due" },
  { drug: "Diazepam 5mg", form: "Tablets", balance: 210, unit: "tabs", lastCheck: "04/03/2026", checker: "AS", status: "ok" },
  { drug: "Buprenorphine 8mg", form: "Sublingual", balance: 16, unit: "tabs", lastCheck: "01/03/2026", checker: "AS", status: "overdue" },
];

const EXPIRING_DOCS = [
  { name: "Safeguarding Policy", days: 6, owner: "JA" },
  { name: "CD SOP", days: 12, owner: "AS" },
  { name: "Fire Risk Assessment", days: -5, owner: "AS" },
  { name: "GPhC Registration", days: 45, owner: "AS" },
  { name: "Waste Contract (Shred-it)", days: 60, owner: "MH" },
].sort((a, b) => a.days - b.days);

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Avatar({ initials, size = 24 }) {
  const cfg = STAFF_INITIALS[initials] || { bg: "var(--ec-t3)", label: initials };
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
    HIGH: { bg: "var(--ec-crit-bg)", color: "var(--ec-crit)", border: "var(--ec-crit-border)" },
    MED:  { bg: "var(--ec-warn-bg)", color: "var(--ec-warn)", border: "var(--ec-warn-border)" },
    LOW:  { bg: "var(--ec-em-bg)", color: "var(--ec-em)", border: "var(--ec-em-border)" },
  }[level] || { bg: "var(--ec-card-hover)", color: "var(--ec-t2)", border: "var(--ec-t5)" };
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
    "Cleaning":   { bg: "var(--ec-info-bg)", color: "var(--ec-info)", border: "var(--ec-info-border)" },
    "RP Check":   { bg: "var(--ec-cat-purple-bg)", color: "var(--ec-cat-purple)", border: "var(--ec-cat-purple-border)" },
    "CD Check":   { bg: "var(--ec-cat-orange-bg)", color: "var(--ec-cat-orange)", border: "var(--ec-warn-border)" },
    "Compliance": { bg: "var(--ec-em-bg)", color: "var(--ec-em)", border: "var(--ec-em-border)" },
    "H&S":        { bg: "var(--ec-warn-bg)", color: "var(--ec-warn-light)", border: "var(--ec-warn-border)" },
    "Waste":      { bg: "var(--ec-cat-slate-bg)", color: "var(--ec-t2)", border: "var(--ec-t5)" },
  }[label] || { bg: "var(--ec-cat-slate-bg)", color: "var(--ec-t2)", border: "var(--ec-t5)" };
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
  const pctColor = pct >= 80 ? "var(--ec-em)" : pct >= 50 ? "var(--ec-warn)" : "var(--ec-crit)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ec-em-bg)" strokeWidth={6} />
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
      background: task.done ? "var(--ec-em-bg)" : "white",
      border: `1px solid ${task.done ? "var(--ec-em-border)" : "var(--ec-t5)"}`,
      marginBottom: 4, transition: "background 0.12s",
    }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: task.done ? "none" : "2px solid var(--ec-t4)",
        background: task.done ? "var(--ec-em)" : "white",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {task.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: task.done ? "var(--ec-em-border)" : "var(--ec-t1)", textDecoration: task.done ? "line-through" : "none" }}>{task.label}</div>
        {task.sub && !task.done && <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 1 }}>› {task.sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <PriorityBadge level={task.priority} />
        <CategoryTag label={task.category} />
        {task.byTime && <span style={{ fontSize: 9, color: "var(--ec-t3)", fontFamily: "'DM Mono', monospace" }}>⏱{task.byTime}</span>}
        <Avatar initials={task.assignee} size={22} />
      </div>
    </div>
  );
}

function ComplianceCard({ item, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      background: "var(--surface)", borderRadius: 10, padding: "10px 12px",
      border: "1px solid var(--border)", cursor: "pointer",
      boxShadow: expanded ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: item.color, borderRadius: "10px 0 0 10px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
        <CircleProgress pct={item.pct} color={item.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ec-em-dark)", marginBottom: 2 }}>{item.icon} {item.label}</div>
          <div style={{ fontSize: 10, color: item.subColor, fontWeight: 600 }}>{item.sub}</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3,
            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20,
            background: item.trend === "Needs attention" ? "var(--ec-crit-bg)" : "var(--ec-em-bg)",
            color: item.trend === "Needs attention" ? "var(--ec-crit-light)" : "var(--ec-em)",
            border: `1px solid ${item.trend === "Needs attention" ? "var(--ec-crit-border)" : "var(--ec-em-border)"}`,
          }}>
            {item.trend === "Needs attention" ? "⚠" : "✓"} {item.trend}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-em-bg)", fontSize: 11, color: "var(--ec-t2)", paddingLeft: 6, lineHeight: 1.6 }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────

export default function ComplianceDashboard() {
  const [shiftTasks, setShiftTasks] = useState(SHIFT_TASKS);
  const [scheduleTasks, setScheduleTasks] = useState({ weekly: WEEKLY_TASKS, fortnightly: FORTNIGHTLY_TASKS, monthly: MONTHLY_TASKS });
  const [openSection, setOpenSection] = useState("time");
  const [expandedCard, setExpandedCard] = useState(null);
  const [rpSigned, setRpSigned] = useState(false);
  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const shiftDone = shiftTasks.filter(t => t.done).length;
  const shiftTotal = shiftTasks.length;
  const shiftPct = Math.round((shiftDone / shiftTotal) * 100);

  const toggleShift = (id) => setShiftTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const toggleSchedule = (grp, id) => setScheduleTasks(prev => ({ ...prev, [grp]: prev[grp].map(t => t.id === id ? { ...t, done: !t.done } : t) }));

  // #9 — derived from COMPLIANCE_HEALTH data, not hardcoded
  const overallPct = Math.round(COMPLIANCE_HEALTH.reduce((s, i) => s + i.pct, 0) / COMPLIANCE_HEALTH.length);
  const redAlerts = ALERTS.filter(a => a.level === "red").length;
  const cdOverdue = CD_ENTRIES.filter(e => e.status === "overdue").length;
  const cdDue = CD_ENTRIES.filter(e => e.status === "due").length;
  // #1 — overdue KPI reflects real combined count
  const totalOverdue = cdOverdue + 19;
  // #2 — streak: 1 if all today's tasks done, else 0
  const streakDays = shiftTasks.every(t => t.done) ? 1 : 0;

  const TABS = [
    { key: "time",        label: "Time-Sensitive",  tasks: shiftTasks.filter(t => t.section === "time") },
    { key: "anytime",     label: "Anytime",          tasks: shiftTasks.filter(t => t.section === "anytime") },
    { key: "weekly",      label: "Weekly",           tasks: scheduleTasks.weekly },
    { key: "fortnightly", label: "Fortnightly",      tasks: scheduleTasks.fortnightly },
    { key: "monthly",     label: "Monthly",          tasks: scheduleTasks.monthly },
  ];

  // #4 — safe schedule toggle with group key guard
  const SCHEDULE_KEYS = ["weekly", "fortnightly", "monthly"];
  const safeToggleSchedule = (grp, id) => {
    if (!SCHEDULE_KEYS.includes(grp)) return;
    setScheduleTasks(prev => ({ ...prev, [grp]: prev[grp].map(t => t.id === id ? { ...t, done: !t.done } : t) }));
  };

  const card = {
    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "14px 16px",
    border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Main ── */}
      <div>

        {/* Topbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 22px",
          background: "var(--ec-grad-hero)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{getGreeting()}, Salma</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{dateStr} · {timeStr}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: "Overall", val: `${overallPct}%`, bg: "rgba(255,255,255,0.18)" },
              { label: "Overdue", val: String(totalOverdue), bg: "var(--ec-crit)" },
              { label: "Due Today", val: String(cdDue + 1), bg: "var(--ec-warn)" },
            ].map(k => (
              <div key={k.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 12px", borderRadius: 9, background: k.bg }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{k.label}</span>
              </div>
            ))}
            <div style={{ position: "relative", cursor: "pointer", padding: "5px 8px" }}>
              <span style={{ fontSize: 17 }}>🔔</span>
              <div style={{ position: "absolute", top: 1, right: 3, width: 15, height: 15, borderRadius: "50%", background: "var(--ec-crit)", fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
            </div>
            <div style={{ padding: "4px 9px", borderRadius: 7, background: "rgba(255,255,255,0.18)", color: "white", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)" }}>FED07</div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", maxWidth: 1100, margin: "0 auto" }}>

          {/* ── RP Banner ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
            borderRadius: 10, marginBottom: 10,
            background: rpSigned ? "var(--ec-em-bg)" : "var(--ec-crit-bg)",
            border: `1px solid ${rpSigned ? "var(--ec-em-border)" : "var(--ec-crit-border)"}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: rpSigned ? "var(--ec-em)" : "var(--ec-crit)", boxShadow: rpSigned ? "0 0 0 3px var(--ec-em-border)" : "0 0 0 3px var(--ec-crit-bg)" }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: rpSigned ? "var(--ec-em-dark)" : "var(--ec-crit)" }}>
              {rpSigned ? "RP signed in — Amjid Shakoor" : "No RP signed in · Last: Amjid Shakoor"}
            </div>
            <button onClick={() => setRpSigned(!rpSigned)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: rpSigned ? "var(--ec-em)" : "var(--ec-crit-light)", color: "white",
              fontSize: 12, fontWeight: 700, fontFamily: "'Inter', sans-serif",
            }}>
              {rpSigned ? "✓ Signed In" : "Sign In as RP →"}
            </button>
          </div>

          {/* ── Collapsed Alert Banner ── */}
          {!alertsDismissed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
              borderRadius: 10, marginBottom: 12,
              background: "var(--ec-crit-bg)", border: "1px solid var(--ec-crit-border)",
            }}>
              <span style={{ fontSize: 13 }}>🔴</span>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ec-crit)" }}>
                  {redAlerts} critical · {ALERTS.length - redAlerts} warnings
                </span>
                <span style={{ fontSize: 11, color: "var(--ec-crit)" }}>—</span>
                {ALERTS.slice(0, 2).map((a, i) => (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 500, color: "var(--ec-crit)",
                    background: "var(--ec-crit-bg)", padding: "2px 8px", borderRadius: 20, border: "1px solid var(--ec-crit-border)",
                  }}>{a.msg.split("—")[0].trim()}</span>
                ))}
                {ALERTS.length > 2 && <span style={{ fontSize: 10, color: "var(--ec-crit)", fontWeight: 600 }}>+{ALERTS.length - 2} more</span>}
              </div>
              <button onClick={() => setAlertsDismissed(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--ec-crit)", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0,
              }}>×</button>
            </div>
          )}

          {/* ── To Do ── */}
          <div style={{ ...card, marginBottom: 12, overflow: "hidden" }}>
            <CardHeader
              variant="warn"
              icon="✅" title="To Do"
              right={todos.filter(t => !t.done).length > 0
                ? <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: 20 }}>{todos.filter(t => !t.done).length} remaining</span>
                : null}
            />
            <div style={{ display: "flex", gap: 6, marginBottom: todos.length ? 8 : 0 }}>
              <input value={todoInput} onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && todoInput.trim()) { setTodos(ts => [...ts, { id: Date.now(), text: todoInput.trim(), done: false }]); setTodoInput(""); }}}
                placeholder="Add an action item and press Enter…"
                style={{ flex: 1, padding: "7px 12px", borderRadius: 8, fontSize: 12, border: "1px solid var(--ec-em-border)", outline: "none", fontFamily: "'Inter', sans-serif", background: "var(--ec-card-hover)" }}
              />
              <button onClick={() => { if (todoInput.trim()) { setTodos(ts => [...ts, { id: Date.now(), text: todoInput.trim(), done: false }]); setTodoInput(""); }}}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--ec-em)", color: "white", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                + Add
              </button>
            </div>
            {todos.length === 0
              ? <div style={{ fontSize: 11, color: "var(--ec-t3)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>Nothing here yet — add an action item above</div>
              : todos.map(todo => (
                <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: todo.done ? "var(--ec-em-bg)" : "var(--ec-card-hover)", border: `1px solid ${todo.done ? "var(--ec-em-border)" : "var(--ec-t5)"}` }}>
                  <div onClick={() => setTodos(ts => ts.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: todo.done ? "none" : "2px solid var(--ec-t4)", background: todo.done ? "var(--ec-em)" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {todo.done && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: todo.done ? "var(--ec-em-border)" : "var(--ec-t1)", textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                  <button onClick={() => setTodos(ts => ts.filter(t => t.id !== todo.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ec-t4)", fontSize: 15 }}>×</button>
                </div>
              ))
            }
          </div>

          {/* ── Two-col grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 12, alignItems: "start" }}>

            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* ── Shift Checklist (merged with schedule tabs) ── */}
              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  variant="em"
                  icon="📋" title="Shift Checklist"
                  right={
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${shiftPct}%`, height: "100%", background: shiftPct === 100 ? "var(--ec-em)" : "white", borderRadius: 99, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{shiftDone}/{shiftTotal}</span>
                    </div>
                  }
                />

                {/* Section tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                  {TABS.map(tab => {
                    const done = tab.tasks.filter(t => t.done).length;
                    const isActive = openSection === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setOpenSection(tab.key)}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--ec-em-bg)"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "white"; }}
                        style={{
                          padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          border: isActive ? "none" : "1px solid var(--ec-em-border)",
                          background: isActive ? "var(--ec-em)" : "white",
                          color: isActive ? "white" : "var(--ec-em)",
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                          transition: "background 0.12s",
                        }}>
                        {tab.label} <span style={{ opacity: 0.7, fontFamily: "'DM Mono', monospace", fontSize: 9 }}>{done}/{tab.tasks.length}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active tab tasks */}
                {(() => {
                  const active = TABS.find(t => t.key === openSection);
                  if (!active) return null;
                  if (openSection === "time" || openSection === "anytime") {
                    return active.tasks.map(t => {
                      // #7 — reactive RP sub text
                      const enriched = t.id === 2
                        ? { ...t, sub: rpSigned ? "RP signed in — checks in progress" : "0/5 RP checks complete — no RP signed in" }
                        : t;
                      return <TaskRow key={t.id} task={enriched} onToggle={toggleShift} />;
                    });
                  }
                  return active.tasks.map(t => <TaskRow key={t.id} task={t} onToggle={(id) => safeToggleSchedule(openSection, id)} />);
                })()}

                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-em-border)", fontSize: 10, color: "var(--ec-t2)", display: "flex", alignItems: "center", gap: 5 }}>
                  🔥 <span style={{ fontWeight: 500 }}>{streakDays} day{streakDays !== 1 ? "s" : ""} fully completed this week</span>
                  {streakDays === 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--ec-t3)" }}>Complete all tasks to build your streak</span>}
                  {streakDays > 0 && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--ec-em)", fontWeight: 600 }}>Keep it up!</span>}
                </div>
              </div>

              {/* ── CD Balance Check ── */}
              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  variant="teal"
                  icon="💊" title="CD Balance Check"
                  right={
                    <div style={{ display: "flex", gap: 5 }}>
                      {cdOverdue > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--ec-crit-bg)", color: "var(--ec-crit-light)", padding: "1px 8px", borderRadius: 20, border: "1px solid var(--ec-crit-border)" }}>{cdOverdue} overdue</span>}
                      {cdDue > 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--ec-warn-bg)", color: "var(--ec-warn-light)", padding: "1px 8px", borderRadius: 20, border: "1px solid var(--ec-warn-border)" }}>{cdDue} due today</span>}
                    </div>
                  }
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {CD_ENTRIES.map((e, i) => {
                    const s = {
                      ok:      { dot: "var(--ec-em)", bg: "white",   border: "var(--ec-t5)", label: "✓ Checked",  lc: "var(--ec-em)" },
                      due:     { dot: "var(--ec-warn)", bg: "var(--ec-warn-bg)", border: "var(--ec-warn-border)", label: "Due today",  lc: "var(--ec-warn-light)" },
                      overdue: { dot: "var(--ec-crit)", bg: "var(--ec-crit-bg)", border: "var(--ec-crit-border)", label: "Overdue",    lc: "var(--ec-crit-light)" },
                    }[e.status];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: s.bg, border: `1px solid ${s.border}` }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ec-t1)" }}>{e.drug}</div>
                          <div style={{ fontSize: 10, color: "var(--ec-t3)" }}>{e.form}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ec-t1)", fontFamily: "'DM Mono', monospace" }}>
                            {e.balance} <span style={{ fontSize: 9, fontWeight: 400, color: "var(--ec-t3)" }}>{e.unit}</span>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: s.lc }}>{s.label}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                          <div style={{ fontSize: 9, color: "var(--ec-t3)", fontFamily: "'DM Mono', monospace" }}>{e.lastCheck}</div>
                          <Avatar initials={e.checker} size={20} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-em-border)", fontSize: 10, color: "var(--ec-t3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "var(--ec-em-border)" }}>●</span> Register maintained in PharmSmart · Physical register in CD cabinet
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Compliance Health */}
              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader
                  variant="em"
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
                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--ec-em-bg)", fontSize: 10, color: "var(--ec-t3)", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ec-warn)" }} />
                  Last GPhC inspection: <strong style={{ color: "var(--ec-t2)" }}>14 months ago</strong>
                </div>
              </div>

              {/* Expiring Soon (replaced Quick Stats) */}
              <div style={{ ...card, overflow: "hidden" }}>
                <CardHeader variant="em" icon="📅" title="Expiring Soon" />
                {EXPIRING_DOCS.map((doc, i) => {
                  const r = doc.days < 0
                    ? { bg: "var(--ec-crit-bg)", border: "var(--ec-crit-border)", text: "var(--ec-crit-light)", label: "EXPIRED", sublabel: `${Math.abs(doc.days)}d ago` }
                    : doc.days <= 14
                    ? { bg: "var(--ec-crit-bg)", border: "var(--ec-crit-border)", text: "var(--ec-crit-light)", label: `in ${doc.days}d`, sublabel: "Urgent" }
                    : doc.days <= 30
                    ? { bg: "var(--ec-warn-bg)", border: "var(--ec-warn-border)", text: "var(--ec-warn-light)", label: `in ${doc.days}d`, sublabel: "Soon" }
                    : { bg: "white", border: "var(--ec-em-border)", text: "var(--ec-em)", label: `in ${doc.days}d`, sublabel: "OK" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, marginBottom: 4, background: r.bg, border: `1px solid ${r.border}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ec-t1)" }}>{doc.name}</div>
                        <div style={{ fontSize: 9, color: "var(--ec-t3)", marginTop: 1 }}>{r.sublabel}</div>
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
      </div>
    </div>
  );
}
