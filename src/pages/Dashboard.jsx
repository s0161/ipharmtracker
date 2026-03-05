import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { usePharmacyConfig } from "../hooks/usePharmacyConfig";
import { useDocumentReminders } from "../hooks/useDocumentReminders";
import {
  getTrafficLight,
  getTaskStatus,
  getSafeguardingStatus,
  DEFAULT_CLEANING_TASKS,
  generateId,
} from "../utils/helpers";
import {
  getTaskAssignee,
  getRPAssignee,
  getStaffInitials,
  getStaffColor,
} from "../utils/rotationManager";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── SVG Icons ─────────────────────────────────────────────────────────────

const SvgCheck = ({ size = 10, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>
);

const SvgClock = ({ size = 10, color = "#94a3b8" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>
);

const SvgBell = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
);

const SvgChart = ({ size = 32, color = "#6b7280" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17V13M12 17V9M17 17V7"/></svg>
);

const SvgClipboard = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
);

const SvgPill = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 1.5l-8 8a5.66 5.66 0 008 8l8-8a5.66 5.66 0 00-8-8z"/><path d="M6.5 13.5l5-5"/></svg>
);

const SvgHospital = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 7v10M7 12h10"/></svg>
);

const SvgCalendar = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
);

const SvgCheckSquare = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>
);

const SvgDoc = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
);

const SvgBook = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
);

const SvgBroom = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8M5 14h14l-1.5 8H6.5z"/></svg>
);

const SvgShield = ({ size = 13, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

const SvgWarning = ({ size = 11, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
);

const SvgDot = ({ size = 6, color }) => (
  <svg width={size} height={size} viewBox="0 0 6 6"><circle cx="3" cy="3" r="3" fill={color}/></svg>
);

const SvgVan = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 5v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
);

const SvgCircleAlert = ({ size = 13, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill={color}/></svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function Avatar({ name, size = 24 }) {
  const initials = getStaffInitials(name);
  const bg = getStaffColor(name);
  return (
    <div title={name || initials} style={{
      width: size, height: size, borderRadius: "50%", background: bg,
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
    <div onClick={() => onToggle && !task.done && onToggle(task.id)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      borderRadius: 8, cursor: task.done ? "default" : "pointer",
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
        {task.done && <SvgCheck size={10} color="white" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: task.done ? "#6ee7b7" : "#1e293b", textDecoration: task.done ? "line-through" : "none" }}>{task.label}</div>
        {task.sub && !task.done && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>› {task.sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <PriorityBadge level={task.priority} />
        <CategoryTag label={task.category} />
        {task.byTime && <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "'DM Mono', monospace", display: "inline-flex", alignItems: "center", gap: 2 }}><SvgClock size={9} />{task.byTime}</span>}
        <Avatar name={task.assigneeName} size={22} />
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
            {item.trend === "Needs attention" ? <SvgWarning size={9} /> : <SvgCheck size={9} />} {item.trend}
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

const STAFF_ASSIGNEES = [
  { initials: "SS", name: "Salma Shakoor" },
  { initials: "AS", name: "Amjid Shakoor" },
  { initials: "JA", name: "Jamila Adwan" },
  { initials: "MH", name: "Marian Hadaway" },
];

function initialsToName(initials) {
  return STAFF_ASSIGNEES.find(s => s.initials === initials)?.name || initials;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [pharmacyConfig, , configLoading] = usePharmacyConfig();

  // ── Supabase subscriptions ──
  const [documents, , docsLoading] = useSupabase("documents", []);
  const [cleaningTasks, , tasksLoading] = useSupabase("cleaning_tasks", []);
  const [cleaningEntries, setCleaningEntries, entriesLoading] = useSupabase("cleaning_entries", []);
  const [staffTraining, , trainingLoading] = useSupabase("staff_training", []);
  const [safeguardingRecords, , sgLoading] = useSupabase("safeguarding_records", []);
  const [rpLog, , rpLoading] = useSupabase("rp_log", []);
  const [actionItems, setActionItems, todosLoading] = useSupabase("action_items", []);
  const [staffTasks, setStaffTasks, stLoading] = useSupabase("staff_tasks", []);
  const [careHomes, setCareHomes] = useSupabase("care_homes", []);
  const [careDeliveries, setCareDeliveries] = useSupabase("care_home_deliveries", []);

  const { unreadCount } = useDocumentReminders(documents);

  const [openSection, setOpenSection] = useState("daily");
  const [expandedCard, setExpandedCard] = useState(null);
  const [todoInput, setTodoInput] = useState("");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [expiringExpanded, setExpiringExpanded] = useState(false);
  const [now, setNow] = useState(new Date());
  const [stFormOpen, setStFormOpen] = useState(false);
  const [stTitle, setStTitle] = useState("");
  const [stAssignTo, setStAssignTo] = useState("SS");
  const [stPriority, setStPriority] = useState("MED");
  const [stDueDate, setStDueDate] = useState("");
  const [stNotes, setStNotes] = useState("");
  const [stOpenSections, setStOpenSections] = useState({ pending: true, in_progress: true, done: false });
  const [chFormOpen, setChFormOpen] = useState(false);
  const [chHomeId, setChHomeId] = useState("");
  const [chDate, setChDate] = useState("");
  const [chNotes, setChNotes] = useState("");
  const [chNewHomeName, setChNewHomeName] = useState("");
  const [chAddingHome, setChAddingHome] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const today = useMemo(() => todayStr(), [now]);
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const loading = docsLoading || tasksLoading || entriesLoading || trainingLoading || sgLoading || rpLoading || todosLoading || configLoading;

  // ── RP status ──
  const rpSigned = useMemo(() => {
    return rpLog.some(e => e.date === today || e.signInTime?.startsWith(today));
  }, [rpLog, today]);

  // ── Compliance Health (computed from live data) ──
  const complianceHealth = useMemo(() => {
    // Documents: green count / total
    const docTotal = documents.length || 1;
    const docGreen = documents.filter(d => getTrafficLight(d.expiryDate) === "green").length;
    const docPct = Math.round((docGreen / docTotal) * 100);
    const expiredCount = documents.filter(d => getTrafficLight(d.expiryDate) === "red").length;
    const amberCount = documents.filter(d => getTrafficLight(d.expiryDate) === "amber").length;

    // Training: complete / total
    const trainTotal = staffTraining.length || 1;
    const trainComplete = staffTraining.filter(t => t.status === "Complete").length;
    const trainPct = Math.round((trainComplete / trainTotal) * 100);
    const trainOutstanding = trainTotal - trainComplete;

    // Cleaning: done+upcoming / total tasks
    const tasksToCheck = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS;
    const cleanTotal = tasksToCheck.length || 1;
    const cleanGood = tasksToCheck.filter(t => {
      const status = getTaskStatus(t.name, t.frequency, cleaningEntries);
      return status === "done" || status === "upcoming";
    }).length;
    const cleanPct = Math.round((cleanGood / cleanTotal) * 100);
    const cleanOverdue = tasksToCheck.filter(t => getTaskStatus(t.name, t.frequency, cleaningEntries) === "overdue").length;

    // Safeguarding: current / total
    const sgTotal = safeguardingRecords.length || 1;
    const sgCurrent = safeguardingRecords.filter(r => getSafeguardingStatus(r.trainingDate) === "current").length;
    const sgPct = Math.round((sgCurrent / sgTotal) * 100);

    return [
      {
        key: "documents", label: "Documents", pct: docPct, icon: <SvgDoc size={13} color="#064e3b" />,
        color: docPct >= 80 ? "#059669" : docPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: docPct >= 80 ? "Stable" : "Needs attention",
        sub: expiredCount > 0 ? `${expiredCount} expired · ${amberCount} expiring` : amberCount > 0 ? `${amberCount} expiring soon` : "All current",
        subColor: expiredCount > 0 ? "#ef4444" : amberCount > 0 ? "#d97706" : "#059669",
        detail: `${docGreen} valid · ${amberCount} due within 30 days · ${expiredCount} expired`,
      },
      {
        key: "training", label: "Training", pct: trainPct, icon: <SvgBook size={13} color="#064e3b" />,
        color: trainPct >= 80 ? "#047857" : trainPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: trainPct >= 80 ? "On track" : "Needs attention",
        sub: trainOutstanding > 0 ? `${trainOutstanding} modules outstanding` : "All complete",
        subColor: trainOutstanding > 0 ? "#ef4444" : "#059669",
        detail: `${trainComplete} complete · ${trainOutstanding} outstanding`,
      },
      {
        key: "cleaning", label: "Cleaning", pct: cleanPct, icon: <SvgBroom size={13} color="#064e3b" />,
        color: cleanPct >= 80 ? "#059669" : cleanPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: cleanPct >= 80 ? "On track" : "Needs attention",
        sub: cleanOverdue > 0 ? `${cleanOverdue} overdue tasks` : "All on schedule",
        subColor: cleanOverdue > 0 ? "#ef4444" : "#059669",
        detail: `${cleanGood} on track · ${cleanOverdue} overdue`,
      },
      {
        key: "safeguarding", label: "Safeguarding", pct: sgPct, icon: <SvgShield size={13} color="#064e3b" />,
        color: sgPct >= 80 ? "#16a34a" : sgPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: sgPct === 100 ? "All current" : sgPct >= 80 ? "Mostly current" : "Needs attention",
        sub: sgPct === 100 ? "All current" : `${sgTotal - sgCurrent} need renewal`,
        subColor: sgPct === 100 ? "#059669" : "#ef4444",
        detail: `${sgCurrent} current · ${sgTotal - sgCurrent} need renewal`,
      },
    ];
  }, [documents, staffTraining, cleaningTasks, cleaningEntries, safeguardingRecords]);

  // ── KPI Stats ──
  const overallPct = useMemo(() =>
    Math.round(complianceHealth.reduce((s, i) => s + i.pct, 0) / (complianceHealth.length || 1)),
    [complianceHealth]
  );

  const overdueCount = useMemo(() => {
    const expiredDocs = documents.filter(d => getTrafficLight(d.expiryDate) === "red").length;
    const tasksToCheck = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS;
    const overdueCleaning = tasksToCheck.filter(t => getTaskStatus(t.name, t.frequency, cleaningEntries) === "overdue").length;
    const overdueTraining = staffTraining.filter(t => t.status !== "Complete").length;
    return expiredDocs + overdueCleaning + overdueTraining;
  }, [documents, cleaningTasks, cleaningEntries, staffTraining]);

  const dueTodayCount = useMemo(() => {
    const tasksToCheck = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS;
    return tasksToCheck.filter(t => getTaskStatus(t.name, t.frequency, cleaningEntries) === "due").length;
  }, [cleaningTasks, cleaningEntries]);

  // ── Alerts (dynamic) ──
  const alerts = useMemo(() => {
    const list = [];
    const trainPct = complianceHealth.find(c => c.key === "training")?.pct ?? 100;
    const cleanPct = complianceHealth.find(c => c.key === "cleaning")?.pct ?? 100;
    const cleanOverdue = complianceHealth.find(c => c.key === "cleaning");
    const expiringDocs = documents.filter(d => {
      const tl = getTrafficLight(d.expiryDate);
      return tl === "red" || tl === "amber";
    }).length;

    if (trainPct < 80) list.push({ level: "red", msg: `Training completion at ${trainPct}% — ${complianceHealth.find(c => c.key === "training")?.sub}`, action: "Review Training" });
    if (cleanPct < 80) list.push({ level: "red", msg: `Cleaning at ${cleanPct}% — ${cleanOverdue?.sub}`, action: "Review Cleaning" });
    if (expiringDocs > 0) list.push({ level: "amber", msg: `${expiringDocs} documents expired or expiring soon`, action: "View Documents" });
    if (!rpSigned) list.push({ level: "amber", msg: "No RP signed in today", action: "Sign In as RP" });

    return list;
  }, [complianceHealth, documents, rpSigned]);

  // ── Shift Checklist (from cleaning_tasks + cleaning_entries) ──
  const shiftTaskGroups = useMemo(() => {
    const tasks = cleaningTasks.length > 0 ? cleaningTasks : DEFAULT_CLEANING_TASKS;

    // Group by frequency
    const byFreq = { daily: [], weekly: [], fortnightly: [], monthly: [] };
    tasks.forEach((t, idx) => {
      const freq = t.frequency || "daily";
      if (byFreq[freq]) {
        const status = getTaskStatus(t.name, freq, cleaningEntries);
        const assigneeName = getTaskAssignee(t.name, freq, byFreq[freq].length);
        byFreq[freq].push({
          id: t.id || `task-${freq}-${idx}`,
          label: t.name,
          priority: freq === "daily" ? "HIGH" : freq === "weekly" ? "MED" : "MED",
          category: "Cleaning",
          assigneeName,
          done: status === "done",
          frequency: freq,
          taskName: t.name,
        });
      }
    });

    // Add synthetic RP Checks task to daily
    byFreq.daily.unshift({
      id: "rp-checks",
      label: "Daily RP Checks",
      priority: "HIGH",
      category: "RP Check",
      assigneeName: getRPAssignee(),
      done: rpSigned,
      byTime: "10:00",
      sub: rpSigned ? "RP signed in — checks in progress" : "No RP signed in",
      isRP: true,
    });

    return byFreq;
  }, [cleaningTasks, cleaningEntries, rpSigned]);

  const allShiftTasks = useMemo(() => [
    ...shiftTaskGroups.daily, ...shiftTaskGroups.weekly,
    ...shiftTaskGroups.fortnightly, ...shiftTaskGroups.monthly,
  ], [shiftTaskGroups]);

  const shiftDone = allShiftTasks.filter(t => t.done).length;
  const shiftTotal = allShiftTasks.length;
  const shiftPct = shiftTotal > 0 ? Math.round((shiftDone / shiftTotal) * 100) : 0;

  // ── Toggle handler: creates cleaning_entry ──
  function handleToggleTask(taskId) {
    const allTasks = [...shiftTaskGroups.daily, ...shiftTaskGroups.weekly, ...shiftTaskGroups.fortnightly, ...shiftTaskGroups.monthly];
    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.done || task.isRP) return;

    const entry = {
      id: generateId(),
      taskName: task.taskName,
      dateTime: new Date().toISOString().slice(0, 16),
      staffMember: user?.name || "Unknown",
      result: "Pass",
      notes: "",
      createdAt: new Date().toISOString(),
    };
    setCleaningEntries(prev => [...prev, entry]);
  }

  function handleCDCheck() {
    if (cdCheckStatus.isDone) return;
    const now = new Date().toISOString();
    const entry = {
      id: generateId(),
      taskName: "CD Balance Check",
      dateTime: now.slice(0, 16),
      staffMember: user?.name || "Unknown",
      result: "Pass",
      notes: "",
      createdAt: now,
    };
    setCleaningEntries(prev => [...prev, entry]);
  }

  // ── Tabs ──
  const TABS = useMemo(() => [
    { key: "daily",       label: "Daily",        tasks: shiftTaskGroups.daily },
    { key: "weekly",      label: "Weekly",        tasks: shiftTaskGroups.weekly },
    { key: "fortnightly", label: "Fortnightly",   tasks: shiftTaskGroups.fortnightly },
    { key: "monthly",     label: "Monthly",       tasks: shiftTaskGroups.monthly },
  ], [shiftTaskGroups]);

  // ── To Do handlers ──
  function addTodo() {
    if (!todoInput.trim()) return;
    const item = {
      id: generateId(),
      title: todoInput.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setActionItems(prev => [...prev, item]);
    setTodoInput("");
  }

  function toggleTodo(id) {
    setActionItems(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTodo(id) {
    setActionItems(prev => prev.filter(t => t.id !== id));
  }

  // ── Expiring docs (computed from documents) ──
  const expiringDocs = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return documents
      .filter(d => {
        if (!d.expiryDate) return false;
        const expiry = new Date(d.expiryDate + "T00:00:00");
        const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return days <= 90; // within 90 days or already expired
      })
      .map(d => {
        const expiry = new Date(d.expiryDate + "T00:00:00");
        const days = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return { name: d.documentName, days, owner: d.owner || d.category || "" };
      })
      .sort((a, b) => a.days - b.days);
  }, [documents]);

  // ── CD Balance Check status ──
  const cdCheckStatus = useMemo(() => {
    const cdEntries = cleaningEntries
      .filter(e => e.taskName === "CD Balance Check")
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    const status = getTaskStatus("CD Balance Check", "weekly", cleaningEntries);
    const latest = cdEntries[0] || null;
    const isDone = status === "done" || status === "upcoming";
    return { status, isDone, latest, recentChecks: cdEntries.slice(0, 5) };
  }, [cleaningEntries]);

  const redAlerts = alerts.filter(a => a.level === "red").length;

  // ── Staff Tasks ──
  const userInitials = getStaffInitials(user?.name || "");
  const isRP = user?.name === getRPAssignee();
  const canAssign = isRP || !!user?.isManager;

  const sortedStaffTasks = useMemo(() =>
    [...staffTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [staffTasks]
  );

  const stPending = sortedStaffTasks.filter(t => t.status === "pending");
  const stInProgress = sortedStaffTasks.filter(t => t.status === "in_progress");
  const stDone = sortedStaffTasks.filter(t => t.status === "done");
  const stTotal = sortedStaffTasks.length;
  const stDoneCount = stDone.length;
  const stProgressPct = stTotal > 0 ? Math.round((stDoneCount / stTotal) * 100) : 0;

  function canModifyTask(task) {
    if (isRP || user?.isManager) return true;
    return task.assignedTo === userInitials;
  }

  function handleAssignTask() {
    if (!stTitle.trim()) return;
    const newTask = {
      id: generateId(),
      title: stTitle.trim(),
      assignedTo: stAssignTo,
      assignedBy: userInitials,
      roleRequired: "any",
      priority: stPriority,
      status: "pending",
      dueDate: stDueDate || null,
      notes: stNotes.trim() || null,
      createdAt: new Date().toISOString(),
    };
    setStaffTasks(prev => [newTask, ...prev]);
    setStTitle(""); setStAssignTo("SS"); setStPriority("MED"); setStDueDate(""); setStNotes("");
    setStFormOpen(false);
  }

  function handleStStatusChange(taskId, newStatus) {
    setStaffTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  function toggleStSection(section) {
    setStOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  // ── Care Home Deliveries ──
  const chMonthLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const chYear = now.getFullYear();
  const chMonth = now.getMonth();

  const chHomeMap = useMemo(() => {
    const m = {};
    careHomes.forEach(h => { m[h.id] = h.name; });
    return m;
  }, [careHomes]);

  const chMonthDeliveries = useMemo(() => {
    const monthStart = `${chYear}-${String(chMonth + 1).padStart(2, "0")}-01`;
    const nextMonth = chMonth === 11 ? `${chYear + 1}-01-01` : `${chYear}-${String(chMonth + 2).padStart(2, "0")}-01`;
    return careDeliveries
      .filter(d => d.deliveryDate >= monthStart && d.deliveryDate < nextMonth)
      .map(d => ({ ...d, homeName: chHomeMap[d.careHomeId] || "Unknown" }))
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  }, [careDeliveries, chHomeMap, chYear, chMonth]);

  const chByWeek = useMemo(() => {
    const weeks = {};
    const daysInMonth = new Date(chYear, chMonth + 1, 0).getDate();
    chMonthDeliveries.forEach(d => {
      const day = parseInt(d.deliveryDate.slice(8, 10), 10);
      const wk = Math.ceil(day / 7);
      const wkStart = (wk - 1) * 7 + 1;
      const wkEnd = Math.min(wk * 7, daysInMonth);
      const monthShort = now.toLocaleDateString("en-GB", { month: "short" });
      const key = `Week ${wk} (${wkStart}–${wkEnd} ${monthShort})`;
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(d);
    });
    return weeks;
  }, [chMonthDeliveries, chYear, chMonth, now]);

  const chDelivered = chMonthDeliveries.filter(d => d.status === "delivered").length;
  const chTotal = chMonthDeliveries.length;
  const chPct = chTotal > 0 ? Math.round((chDelivered / chTotal) * 100) : 0;

  function handleAddDelivery() {
    if (!chHomeId || !chDate) return;
    const newDel = {
      id: generateId(),
      careHomeId: chHomeId,
      deliveryDate: chDate,
      status: "pending",
      notes: chNotes.trim() || null,
      createdAt: new Date().toISOString(),
    };
    setCareDeliveries(prev => [...prev, newDel]);
    setChHomeId(""); setChDate(""); setChNotes("");
    setChFormOpen(false);
  }

  function handleAddCareHome() {
    if (!chNewHomeName.trim()) return;
    const newHome = { id: generateId(), name: chNewHomeName.trim(), createdAt: new Date().toISOString() };
    setCareHomes(prev => [...prev, newHome]);
    setChHomeId(newHome.id);
    setChNewHomeName("");
    setChAddingHome(false);
  }

  function handleChStatusChange(delId, newStatus) {
    setCareDeliveries(prev => prev.map(d => d.id === delId ? { ...d, status: newStatus } : d));
  }

  const card = {
    background: "white", borderRadius: 12, padding: "14px 16px",
    border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(5,150,105,0.06)",
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0faf4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ marginBottom: 8 }}><SvgChart size={32} /></div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0faf4", minHeight: "100vh" }}>

      {/* Topbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 22px",
        background: "linear-gradient(135deg, #064e3b 0%, #059669 60%, #10b981 100%)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>{getGreeting()}, {firstName}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{dateStr} · {timeStr}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { label: "Overall", val: `${overallPct}%`, bg: "rgba(255,255,255,0.18)" },
            { label: "Overdue", val: String(overdueCount), bg: overdueCount > 0 ? "#ef4444" : "rgba(255,255,255,0.18)" },
            { label: "Due Today", val: String(dueTodayCount), bg: dueTodayCount > 0 ? "#f59e0b" : "rgba(255,255,255,0.18)" },
          ].map(k => (
            <div key={k.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 12px", borderRadius: 9, background: k.bg }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{k.label}</span>
            </div>
          ))}
          <div style={{ position: "relative", cursor: "pointer", padding: "5px 8px" }}>
            <SvgBell size={17} color="white" />
            {unreadCount > 0 && (
              <div style={{ position: "absolute", top: 1, right: 3, width: 15, height: 15, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</div>
            )}
          </div>
          <div style={{ padding: "4px 9px", borderRadius: 7, background: "rgba(255,255,255,0.18)", color: "white", fontSize: 11, fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)" }}>{pharmacyConfig.gphcNumber || "—"}</div>
        </div>
      </div>

      <div style={{ padding: "14px 20px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── RP Banner ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
          borderRadius: 10, marginBottom: 10,
          background: rpSigned ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${rpSigned ? "#6ee7b7" : "#fecaca"}`,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: rpSigned ? "#059669" : "#ef4444", boxShadow: rpSigned ? "0 0 0 3px #a7f3d0" : "0 0 0 3px #fee2e2" }} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: rpSigned ? "#166534" : "#991b1b" }}>
            {rpSigned ? `RP signed in — ${getRPAssignee()}` : `No RP signed in · Last: ${getRPAssignee()}`}
          </div>
          {!rpSigned && (
            <button onClick={() => navigate("/rp-log")} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "#dc2626", color: "white",
              fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            }}>
              Sign In as RP →
            </button>
          )}
          {rpSigned && (
            <span style={{
              padding: "6px 14px", borderRadius: 8,
              background: "#059669", color: "white",
              fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><SvgCheck size={10} color="white" /> Signed In</span>
            </span>
          )}
        </div>

        {/* ── Collapsed Alert Banner ── */}
        {!alertsDismissed && alerts.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
            borderRadius: 10, marginBottom: 12,
            background: redAlerts > 0 ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${redAlerts > 0 ? "#fecaca" : "#fde68a"}`,
          }}>
            <SvgCircleAlert size={13} color={redAlerts > 0 ? "#ef4444" : "#f59e0b"} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: redAlerts > 0 ? "#991b1b" : "#92400e" }}>
                {redAlerts > 0 ? `${redAlerts} critical` : ""}{redAlerts > 0 && alerts.length - redAlerts > 0 ? " · " : ""}{alerts.length - redAlerts > 0 ? `${alerts.length - redAlerts} warning${alerts.length - redAlerts !== 1 ? "s" : ""}` : ""}
              </span>
              <span style={{ fontSize: 11, color: "#b91c1c" }}>—</span>
              {alerts.slice(0, 2).map((a, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500, color: "#7f1d1d",
                  background: "#fee2e2", padding: "2px 8px", borderRadius: 20, border: "1px solid #fecaca",
                }}>{a.msg.split("—")[0].trim()}</span>
              ))}
              {alerts.length > 2 && <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 600 }}>+{alerts.length - 2} more</span>}
            </div>
            <button onClick={() => setAlertsDismissed(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#ef4444", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0,
            }}>×</button>
          </div>
        )}

        {/* ── To Do ── */}
        <div style={{ ...card, marginBottom: 12, overflow: "hidden" }}>
          <CardHeader
            gradient="linear-gradient(90deg, #b45309, #d97706)"
            icon={<SvgCheckSquare size={14} />} title="To Do"
            right={actionItems.filter(t => !t.completed).length > 0
              ? <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.2)", padding: "1px 7px", borderRadius: 20 }}>{actionItems.filter(t => !t.completed).length} remaining</span>
              : null}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: actionItems.length ? 8 : 0 }}>
            <input value={todoInput} onChange={e => setTodoInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTodo(); }}
              placeholder="Add an action item and press Enter…"
              style={{ flex: 1, padding: "7px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #d1fae5", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "#f9fafb" }}
            />
            <button onClick={addTodo}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "#059669", color: "white", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              + Add
            </button>
          </div>
          {actionItems.length === 0
            ? <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>Nothing here yet — add an action item above</div>
            : actionItems.map(todo => (
              <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: todo.completed ? "#f0fdf4" : "#f9fafb", border: `1px solid ${todo.completed ? "#6ee7b7" : "#e2e8f0"}` }}>
                <div onClick={() => toggleTodo(todo.id)} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: todo.completed ? "none" : "2px solid #d1d5db", background: todo.completed ? "#059669" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {todo.completed && <SvgCheck size={10} color="white" />}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: todo.completed ? "#6ee7b7" : "#1e293b", textDecoration: todo.completed ? "line-through" : "none" }}>{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", fontSize: 15 }}>×</button>
              </div>
            ))
          }
        </div>

        {/* ── Two-col grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 12, alignItems: "start" }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── Shift Checklist ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                gradient="linear-gradient(90deg, #064e3b, #059669)"
                icon={<SvgClipboard size={14} />} title="Shift Checklist"
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${shiftPct}%`, height: "100%", background: shiftPct === 100 ? "#4ade80" : "white", borderRadius: 99, transition: "width 0.4s" }} />
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

              {/* Active tab tasks */}
              {(() => {
                const active = TABS.find(t => t.key === openSection);
                if (!active) return null;
                return active.tasks.map(t => (
                  <TaskRow key={t.id} task={t} onToggle={t.isRP ? () => navigate("/rp-log") : handleToggleTask} />
                ));
              })()}

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5", fontSize: 10, color: "#6b7280", display: "flex", alignItems: "center", gap: 5 }}>
                <SvgClipboard size={11} color="#6b7280" /> <span style={{ fontWeight: 500 }}>{shiftDone}/{shiftTotal} tasks completed</span>
                {shiftPct === 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#059669", fontWeight: 600 }}>All done!</span>}
                {shiftPct < 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#9ca3af" }}>{shiftTotal - shiftDone} remaining</span>}
              </div>
            </div>

            {/* ── CD Balance Check ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                gradient="linear-gradient(90deg, #064e3b, #0f766e)"
                icon={<SvgPill size={14} />} title="CD Balance Check"
                right={
                  cdCheckStatus.isDone
                    ? <span style={{ fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "1px 8px", borderRadius: 20, border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: 3 }}><SvgCheck size={9} color="#059669" /> Done</span>
                    : cdCheckStatus.status === "overdue"
                      ? <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "1px 8px", borderRadius: 20, border: "1px solid #fecaca" }}>Overdue</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#d97706", padding: "1px 8px", borderRadius: 20, border: "1px solid #fde68a" }}>Due</span>
                }
              />
              {/* Status */}
              {cdCheckStatus.isDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><SvgCheck size={14} color="white" /></div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>Balance check completed</div>
                    <div style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>
                      {cdCheckStatus.latest?.staffMember}{cdCheckStatus.latest?.dateTime ? <> · {new Date(cdCheckStatus.latest.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {new Date(cdCheckStatus.latest.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: cdCheckStatus.status === "overdue" ? "#fef2f2" : "#fffbeb", border: `1px solid ${cdCheckStatus.status === "overdue" ? "#fecaca" : "#fde68a"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: cdCheckStatus.status === "overdue" ? "#dc2626" : "#d97706", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, flexShrink: 0 }}>!</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: cdCheckStatus.status === "overdue" ? "#991b1b" : "#92400e" }}>
                      Balance check {cdCheckStatus.status === "overdue" ? "overdue" : "due this week"}
                    </div>
                  </div>
                  <button
                    onClick={handleCDCheck}
                    style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 8, border: "none", background: "#059669", color: "white", cursor: "pointer" }}
                  >
                    Mark Complete
                  </button>
                </div>
              )}
              {/* Recent checks */}
              {cdCheckStatus.recentChecks.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Recent checks</div>
                  {cdCheckStatus.recentChecks.map((e, i) => (
                    <div key={e.id || i} style={{ fontSize: 11, color: "#64748b", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <SvgDot size={6} color="#a7f3d0" />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{e.dateTime ? new Date(e.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                      <span>—</span>
                      <span>{e.staffMember}</span>
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>{e.dateTime ? <>at {new Date(e.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</> : null}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5", fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                <SvgDot size={6} color="#6ee7b7" /> Register maintained in PharmSmart · Physical register in CD cabinet
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Compliance Health */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                gradient="linear-gradient(90deg, #064e3b, #047857)"
                icon={<SvgHospital size={14} />} title="Compliance Health"
                right={<span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{overallPct}% <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>overall</span></span>}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {complianceHealth.map(item => (
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

            {/* Expiring Soon */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader gradient="linear-gradient(90deg, #166534, #16a34a)" icon={<SvgCalendar size={14} />} title="Expiring Soon" />
              {expiringDocs.length === 0
                ? <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>No documents expiring within 90 days</div>
                : <>
                  {(expiringExpanded ? expiringDocs : expiringDocs.slice(0, 3)).map((doc, i) => {
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
                        <span style={{ fontSize: 10, fontWeight: 700, color: r.text, fontFamily: "'DM Mono', monospace", minWidth: 54, textAlign: "right" }}>{r.label}</span>
                      </div>
                    );
                  })}
                  {expiringDocs.length > 3 && (
                    <button
                      onClick={() => setExpiringExpanded(e => !e)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#16a34a", fontWeight: 600, padding: "4px 0 2px", width: "100%", textAlign: "center" }}
                    >
                      {expiringExpanded ? "Show less" : `View all ${expiringDocs.length} expiring`}
                    </button>
                  )}
                </>
              }
            </div>

          </div>
        </div>

        {/* ── Side-by-side: Care Homes + Staff Tasks ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start", marginTop: 12 }}>

        {/* ── Care Home Deliveries ── */}
        <div style={{ ...card, overflow: "hidden" }}>
          <CardHeader
            gradient="linear-gradient(90deg, #0f766e, #14b8a6)"
            icon={<SvgVan size={14} />}
            title="Care Home Deliveries"
            right={<span style={{ fontSize: 11, color: "white" }}>{chMonthLabel}</span>}
          />

          {/* Toggle form */}
          <button
            onClick={() => setChFormOpen(o => !o)}
            style={{ fontSize: 10, fontWeight: 700, color: "#0f766e", background: "none", border: "none", cursor: "pointer", padding: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}
          >
            {chFormOpen ? "– Hide Form" : "+ Add Delivery"}
          </button>

          {/* Inline add form */}
          {chFormOpen && (
            <div style={{ background: "#f0fdf9", border: "1px solid #99f6e4", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Care home *</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {!chAddingHome ? (
                      <>
                        <select value={chHomeId} onChange={e => setChHomeId(e.target.value)}
                          style={{ flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #d1fae5", background: "white", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                        >
                          <option value="">Select…</option>
                          {careHomes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                        <button onClick={() => setChAddingHome(true)}
                          style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "1px solid #99f6e4", background: "white", color: "#0f766e", cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
                        >+ New</button>
                      </>
                    ) : (
                      <>
                        <input value={chNewHomeName} onChange={e => setChNewHomeName(e.target.value)} placeholder="Care home name…"
                          style={{ flex: 1, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #d1fae5", background: "white", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                        />
                        <button onClick={handleAddCareHome} disabled={!chNewHomeName.trim()}
                          style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "none", background: chNewHomeName.trim() ? "#0f766e" : "#d1d5db", color: "white", cursor: chNewHomeName.trim() ? "pointer" : "default", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
                        >Save</button>
                        <button onClick={() => { setChAddingHome(false); setChNewHomeName(""); }}
                          style={{ fontSize: 10, padding: "4px 6px", borderRadius: 6, border: "1px solid #d1fae5", background: "white", color: "#64748b", cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
                        >Cancel</button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Date *</label>
                  <input type="date" value={chDate} onChange={e => setChDate(e.target.value)}
                    style={{ width: "100%", fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #d1fae5", background: "white", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Notes</label>
                  <input value={chNotes} onChange={e => setChNotes(e.target.value)} placeholder="Special instructions…"
                    style={{ width: "100%", fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #d1fae5", background: "white", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  />
                </div>
                <button onClick={handleAddDelivery} disabled={!chHomeId || !chDate}
                  style={{ background: (chHomeId && chDate) ? "#0f766e" : "#d1d5db", color: "white", fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "6px 14px", border: "none", cursor: (chHomeId && chDate) ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                >Add</button>
              </div>
            </div>
          )}

          {/* Delivery list */}
          {chTotal === 0 ? (
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>No deliveries scheduled for this month.</div>
          ) : (
            <>
              {Object.entries(chByWeek).map(([weekLabel, dels]) => (
                <div key={weekLabel}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8, marginBottom: 4 }}>{weekLabel}</div>
                  {dels.map(d => {
                    const isToday = d.deliveryDate === today;
                    const isPastUndelivered = d.deliveryDate < today && d.status !== "delivered";
                    const rowBg = isPastUndelivered ? "#fef2f2" : d.status === "dispatched" ? "#eff6ff" : d.status === "delivered" ? "#f0fdf4" : "white";
                    const rowBorder = isPastUndelivered ? "#fecaca" : d.status === "dispatched" ? "#bfdbfe" : d.status === "delivered" ? "#6ee7b7" : "#e2e8f0";
                    const dotColor = d.status === "delivered" ? "#059669" : d.status === "dispatched" ? "#3b82f6" : "#f59e0b";
                    const dateObj = new Date(d.deliveryDate + "T00:00:00");
                    const dateLabel = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
                    return (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, marginBottom: 4, background: rowBg, border: `1px solid ${rowBorder}` }}>
                        <SvgDot size={7} color={dotColor} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{d.homeName}</span>
                            {isToday && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "#ccfbf1", color: "#0f766e" }}>Today</span>}
                            {isPastUndelivered && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>Overdue</span>}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{dateLabel}</div>
                          {d.notes && <div style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", marginTop: 1 }}>{d.notes}</div>}
                        </div>
                        <select value={d.status} onChange={e => handleChStatusChange(d.id, e.target.value)}
                          style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid #d1fae5", background: "#f9fafb", color: "#1e293b", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <option value="pending">Pending</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Summary */}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{chDelivered} of {chTotal} deliveries completed this month</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "#e8f5e9", overflow: "hidden" }}>
                  <div style={{ width: `${chPct}%`, height: "100%", background: "#059669", borderRadius: 99, transition: "width 0.4s" }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Staff Task Progress ── */}
        <div style={{ ...card, overflow: "hidden" }}>
          <CardHeader
            gradient="linear-gradient(90deg, #064e3b, #059669)"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>}
            title="Staff Tasks"
            right={canAssign ? (
              <button
                onClick={() => setStFormOpen(o => !o)}
                style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: "white", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
              >
                {stFormOpen ? "Cancel" : "+ Assign"}
              </button>
            ) : null}
          />

          {/* Progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#e8f5e9", overflow: "hidden" }}>
                <div style={{ width: `${stProgressPct}%`, height: "100%", background: "#059669", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#64748b", marginLeft: 10, flexShrink: 0 }}>{stDoneCount}/{stTotal} tasks complete</span>
            </div>
          </div>

          {/* Inline assign form (rp/manager only) */}
          {stFormOpen && canAssign && (
            <div style={{ background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Task title *</label>
                  <input value={stTitle} onChange={e => setStTitle(e.target.value)} placeholder="Enter task title…"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #d1fae5", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "white", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Assign to *</label>
                  <select value={stAssignTo} onChange={e => setStAssignTo(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #d1fae5", background: "white", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  >
                    {STAFF_ASSIGNEES.map(s => <option key={s.initials} value={s.initials}>{s.initials} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Priority *</label>
                  <select value={stPriority} onChange={e => setStPriority(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #d1fae5", background: "white", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MED">MED</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Due date</label>
                  <input type="date" value={stDueDate} onChange={e => setStDueDate(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #d1fae5", background: "white", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 2, display: "block" }}>Notes</label>
                  <input value={stNotes} onChange={e => setStNotes(e.target.value)} placeholder="Optional notes…"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid #d1fae5", outline: "none", fontFamily: "'DM Sans', sans-serif", background: "white", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleAssignTask} disabled={!stTitle.trim()}
                  style={{ padding: "6px 16px", borderRadius: 7, border: "none", cursor: stTitle.trim() ? "pointer" : "default", background: stTitle.trim() ? "#059669" : "#d1d5db", color: "white", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Task list */}
          {stTotal === 0 ? (
            <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>No tasks assigned yet.</div>
          ) : (
            <>
              {/* Pending section */}
              {stPending.length > 0 && (
                <>
                  <div onClick={() => toggleStSection("pending")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 4, userSelect: "none" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8" style={{ transition: "transform 0.15s", transform: stOpenSections.pending ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}>{stPending.length}</span>
                  </div>
                  {stOpenSections.pending && stPending.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < today;
                    return (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                        borderRadius: 8, marginBottom: 4,
                        background: isOverdue ? "#fef2f2" : "white",
                        border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                          <PriorityBadge level={task.priority} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{task.title}</div>
                            {task.notes && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{task.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: isOverdue ? "#dc2626" : "#94a3b8" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                          <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                            style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid #d1fae5", background: "#f9fafb", color: "#1e293b", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* In Progress section */}
              {stInProgress.length > 0 && (
                <>
                  <div onClick={() => toggleStSection("in_progress")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 8, userSelect: "none" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8" style={{ transition: "transform 0.15s", transform: stOpenSections.in_progress ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>In Progress</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}>{stInProgress.length}</span>
                  </div>
                  {stOpenSections.in_progress && stInProgress.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < today;
                    return (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                        borderRadius: 8, marginBottom: 4,
                        background: isOverdue ? "#fef2f2" : "white",
                        border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                          <PriorityBadge level={task.priority} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{task.title}</div>
                            {task.notes && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{task.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: isOverdue ? "#dc2626" : "#94a3b8" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                          <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                            style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid #d1fae5", background: "#f9fafb", color: "#1e293b", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Done section */}
              {stDone.length > 0 && (
                <>
                  <div onClick={() => toggleStSection("done")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 8, userSelect: "none" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8" style={{ transition: "transform 0.15s", transform: stOpenSections.done ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Done</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}>{stDone.length}</span>
                  </div>
                  {stOpenSections.done && stDone.map(task => (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                      borderRadius: 8, marginBottom: 4, opacity: 0.5,
                      background: "white", border: "1px solid #e2e8f0",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                        <PriorityBadge level={task.priority} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", textDecoration: "line-through" }}>{task.title}</div>
                          {task.notes && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{task.notes}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <Avatar name={initialsToName(task.assignedBy)} size={16} />
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 3l2 2-2 2" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <Avatar name={initialsToName(task.assignedTo)} size={22} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: "#94a3b8" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                        <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                          style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid #d1fae5", background: "#f9fafb", color: "#1e293b", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        </div>{/* end side-by-side grid */}

      </div>
    </div>
  );
}
