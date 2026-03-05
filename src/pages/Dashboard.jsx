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

  const { unreadCount } = useDocumentReminders(documents);

  const [openSection, setOpenSection] = useState("daily");
  const [expandedCard, setExpandedCard] = useState(null);
  const [todoInput, setTodoInput] = useState("");
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [expiringExpanded, setExpiringExpanded] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const today = todayStr();
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
        key: "documents", label: "Documents", pct: docPct, icon: "📄",
        color: docPct >= 80 ? "#059669" : docPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: docPct >= 80 ? "Stable" : "Needs attention",
        sub: expiredCount > 0 ? `${expiredCount} expired · ${amberCount} expiring` : amberCount > 0 ? `${amberCount} expiring soon` : "All current",
        subColor: expiredCount > 0 ? "#ef4444" : amberCount > 0 ? "#d97706" : "#059669",
        detail: `${docGreen} valid · ${amberCount} due within 30 days · ${expiredCount} expired`,
      },
      {
        key: "training", label: "Training", pct: trainPct, icon: "📚",
        color: trainPct >= 80 ? "#047857" : trainPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: trainPct >= 80 ? "On track" : "Needs attention",
        sub: trainOutstanding > 0 ? `${trainOutstanding} modules outstanding` : "All complete",
        subColor: trainOutstanding > 0 ? "#ef4444" : "#059669",
        detail: `${trainComplete} complete · ${trainOutstanding} outstanding`,
      },
      {
        key: "cleaning", label: "Cleaning", pct: cleanPct, icon: "🧹",
        color: cleanPct >= 80 ? "#059669" : cleanPct >= 50 ? "#f59e0b" : "#ef4444",
        trend: cleanPct >= 80 ? "On track" : "Needs attention",
        sub: cleanOverdue > 0 ? `${cleanOverdue} overdue tasks` : "All on schedule",
        subColor: cleanOverdue > 0 ? "#ef4444" : "#059669",
        detail: `${cleanGood} on track · ${cleanOverdue} overdue`,
      },
      {
        key: "safeguarding", label: "Safeguarding", pct: sgPct, icon: "🛡️",
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
    Math.round(complianceHealth.reduce((s, i) => s + i.pct, 0) / complianceHealth.length),
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

  const card = {
    background: "white", borderRadius: 12, padding: "14px 16px",
    border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(5,150,105,0.06)",
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0faf4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
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
            <span style={{ fontSize: 17 }}>🔔</span>
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
              ✓ Signed In
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
            <span style={{ fontSize: 13 }}>{redAlerts > 0 ? "🔴" : "🟡"}</span>
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
            icon="✅" title="To Do"
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
                  {todo.completed && <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>✓</span>}
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
                📋 <span style={{ fontWeight: 500 }}>{shiftDone}/{shiftTotal} tasks completed</span>
                {shiftPct === 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#059669", fontWeight: 600 }}>All done!</span>}
                {shiftPct < 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "#9ca3af" }}>{shiftTotal - shiftDone} remaining</span>}
              </div>
            </div>

            {/* ── CD Balance Check ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                gradient="linear-gradient(90deg, #064e3b, #0f766e)"
                icon="💊" title="CD Balance Check"
                right={
                  cdCheckStatus.isDone
                    ? <span style={{ fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#059669", padding: "1px 8px", borderRadius: 20, border: "1px solid #a7f3d0" }}>✓ Done</span>
                    : cdCheckStatus.status === "overdue"
                      ? <span style={{ fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "1px 8px", borderRadius: 20, border: "1px solid #fecaca" }}>Overdue</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#d97706", padding: "1px 8px", borderRadius: 20, border: "1px solid #fde68a" }}>Due</span>
                }
              />
              {/* Status */}
              {cdCheckStatus.isDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, flexShrink: 0 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>Balance check completed</div>
                    <div style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>
                      {cdCheckStatus.latest?.staffMember} · {new Date(cdCheckStatus.latest?.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {new Date(cdCheckStatus.latest?.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
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
                      <span style={{ color: "#a7f3d0" }}>●</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{new Date(e.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      <span>—</span>
                      <span>{e.staffMember}</span>
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>at {new Date(e.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1fae5", fontSize: 10, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#6ee7b7" }}>●</span> Register maintained in PharmSmart · Physical register in CD cabinet
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Compliance Health */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                gradient="linear-gradient(90deg, #064e3b, #047857)"
                icon="🏥" title="Compliance Health"
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
              <CardHeader gradient="linear-gradient(90deg, #166534, #16a34a)" icon="📅" title="Expiring Soon" />
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
      </div>
    </div>
  );
}
