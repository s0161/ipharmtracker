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
import { calculateComplianceScores, getComplianceDetails } from "../utils/complianceScore";
import {
  getTaskAssignee,
  getRPAssignee,
  getStaffInitials,
  getStaffColor,
} from "../utils/rotationManager";
import DashCardHeader from "../components/DashCardHeader";
import Avatar from "../components/Avatar";
import PriorityBadge from "../components/PriorityBadge";
import CategoryTag from "../components/CategoryTag";

// Inter font loaded via index.html

// ── SVG Icons ─────────────────────────────────────────────────────────────

const SvgCheck = ({ size = 10, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.5 3.5 6.5-7"/></svg>
);

const SvgClock = ({ size = 10, color = "var(--ec-t3)" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>
);

const SvgBell = ({ size = 17, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
);

const SvgChart = ({ size = 32, color = "var(--ec-z6)" }) => (
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


function CircleProgress({ pct, color, size = 52 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const pctColor = pct >= 80 ? "var(--ec-em)" : pct >= 50 ? "var(--ec-warn)" : "var(--ec-crit)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ec-div)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: pctColor, fontFamily: "'DM Mono', 'SF Mono', monospace",
      }}>{pct}%</div>
    </div>
  );
}

// CardHeader is now imported as DashCardHeader
const CardHeader = DashCardHeader;

function TaskRow({ task, onToggle }) {
  return (
    <div onClick={() => onToggle && !task.done && onToggle(task.id)} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
      borderRadius: 8, cursor: task.done ? "default" : "pointer",
      background: task.done ? "var(--ec-em-bg)" : "var(--ec-card)",
      border: `1px solid ${task.done ? "var(--ec-em-border)" : "var(--ec-t5)"}`,
      marginBottom: 4, transition: "background 0.12s",
    }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: task.done ? "none" : "2px solid var(--ec-t4)",
        background: task.done ? "var(--ec-em)" : "var(--surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {task.done && <SvgCheck size={10} color="white" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: task.done ? "var(--ec-em-border)" : "var(--ec-t1)", textDecoration: task.done ? "line-through" : "none" }}>{task.label}</div>
        {task.sub && !task.done && <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 1 }}>› {task.sub}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <PriorityBadge level={task.priority} />
        <CategoryTag label={task.category} />
        {task.byTime && <span style={{ fontSize: 9, color: "var(--ec-t3)", fontFamily: "'DM Mono', 'SF Mono', monospace", display: "inline-flex", alignItems: "center", gap: 2 }}><SvgClock size={9} />{task.byTime}</span>}
        <Avatar name={task.assigneeName} size={22} />
      </div>
    </div>
  );
}

function ComplianceCard({ item, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      background: "linear-gradient(145deg, var(--surface) 0%, #f8fffe 100%)",
      borderRadius: 10, padding: "10px 12px",
      border: "1.5px solid rgba(16,185,129,0.2)", cursor: "pointer",
      boxShadow: expanded ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: item.color, borderRadius: "10px 0 0 10px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6 }}>
        <CircleProgress pct={item.pct} color={item.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ec-t1)", marginBottom: 2 }}>{item.icon} {item.label}</div>
          <div style={{ fontSize: 10, color: item.subColor, fontWeight: 600 }}>{item.sub}</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3,
            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 20,
            background: item.trend === "Needs attention" ? "var(--ec-crit-bg)" : "var(--ec-em-bg)",
            color: item.trend === "Needs attention" ? "var(--ec-crit)" : "var(--ec-em)",
            border: `1px solid ${item.trend === "Needs attention" ? "var(--ec-crit-border)" : "var(--ec-em-border)"}`,
          }}>
            {item.trend === "Needs attention" ? <SvgWarning size={9} /> : <SvgCheck size={9} />} {item.trend}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-div)", fontSize: 11, color: "var(--ec-t2)", paddingLeft: 6, lineHeight: 1.6 }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

// STAFF_ASSIGNEES now derived dynamically inside Dashboard from staff_members DB table

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
  const [staffMembers] = useSupabase("staff_members", [], { valueField: "name" });

  // ── Derive STAFF_ASSIGNEES dynamically from DB ──
  const staffAssignees = useMemo(() => {
    const names = staffMembers.length > 0 ? staffMembers : ["Salma Shakoor", "Amjid Shakoor", "Jamila Adwan", "Marian Hadaway"];
    return names.map(name => ({
      initials: getStaffInitials(name),
      name,
    }));
  }, [staffMembers]);

  function initialsToName(initials) {
    return staffAssignees.find(s => s.initials === initials)?.name || initials;
  }

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
  const [bankHolidays, setBankHolidays] = useState([]);
  const [bhLoading, setBhLoading] = useState(true);
  const [bhError, setBhError] = useState(false);
  const [bhShowAll, setBhShowAll] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  // ── Fetch UK bank holidays ──
  useEffect(() => {
    let cancelled = false;
    fetch("https://www.gov.uk/bank-holidays.json")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (cancelled) return;
        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        const cutoff = new Date(todayDate); cutoff.setDate(cutoff.getDate() + 90);
        const events = (data["england-and-wales"]?.events || [])
          .filter(e => { const d = new Date(e.date + "T00:00:00"); return d >= todayDate && d <= cutoff; })
          .sort((a, b) => a.date.localeCompare(b.date));
        setBankHolidays(events);
        setBhLoading(false);
      })
      .catch(() => { if (!cancelled) { setBhError(true); setBhLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const today = useMemo(() => todayStr(), [now]);
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const loading = docsLoading || tasksLoading || entriesLoading || trainingLoading || sgLoading || rpLoading || todosLoading || configLoading;

  // ── RP status ──
  const rpSigned = useMemo(() => {
    return rpLog.some(e => e.date === today || e.signInTime?.startsWith(today));
  }, [rpLog, today]);

  // ── Compliance Health (computed via shared utility) ──
  const complianceHealth = useMemo(() => {
    const scoreData = { documents, staffTraining, cleaningEntries, safeguardingRecords, cleaningTasks };
    const scores = calculateComplianceScores(scoreData);
    const details = getComplianceDetails(scoreData);
    const d = details.documents, tr = details.training, cl = details.cleaning, sg = details.safeguarding;

    return [
      {
        key: "documents", label: "Documents", pct: scores.documents, icon: <SvgDoc size={13} color="var(--ec-t1)" />,
        color: scores.documents >= 80 ? "var(--ec-em)" : scores.documents >= 50 ? "var(--ec-warn)" : "var(--ec-crit)",
        trend: scores.documents >= 80 ? "Stable" : "Needs attention",
        sub: d.red > 0 ? `${d.red} expired · ${d.amber} expiring` : d.amber > 0 ? `${d.amber} expiring soon` : "All current",
        subColor: d.red > 0 ? "var(--ec-crit)" : d.amber > 0 ? "var(--ec-warn)" : "var(--ec-em)",
        detail: `${d.green} valid · ${d.amber} due within 30 days · ${d.red} expired`,
      },
      {
        key: "training", label: "Training", pct: scores.training, icon: <SvgBook size={13} color="var(--ec-t1)" />,
        color: scores.training >= 80 ? "var(--ec-em-dark)" : scores.training >= 50 ? "var(--ec-warn)" : "var(--ec-crit)",
        trend: scores.training >= 80 ? "On track" : "Needs attention",
        sub: tr.outstanding > 0 ? `${tr.outstanding} modules outstanding` : "All complete",
        subColor: tr.outstanding > 0 ? "var(--ec-crit)" : "var(--ec-em)",
        detail: `${tr.complete} complete · ${tr.outstanding} outstanding`,
      },
      {
        key: "cleaning", label: "Cleaning", pct: scores.cleaning, icon: <SvgBroom size={13} color="var(--ec-t1)" />,
        color: scores.cleaning >= 80 ? "var(--ec-em)" : scores.cleaning >= 50 ? "var(--ec-warn)" : "var(--ec-crit)",
        trend: scores.cleaning >= 80 ? "On track" : "Needs attention",
        sub: cl.overdue > 0 ? `${cl.overdue} overdue tasks` : "All on schedule",
        subColor: cl.overdue > 0 ? "var(--ec-crit)" : "var(--ec-em)",
        detail: `${cl.done} on track · ${cl.overdue} overdue`,
      },
      {
        key: "safeguarding", label: "Safeguarding", pct: scores.safeguarding, icon: <SvgShield size={13} color="var(--ec-t1)" />,
        color: scores.safeguarding >= 80 ? "var(--ec-em)" : scores.safeguarding >= 50 ? "var(--ec-warn)" : "var(--ec-crit)",
        trend: scores.safeguarding === 100 ? "All current" : scores.safeguarding >= 80 ? "Mostly current" : "Needs attention",
        sub: scores.safeguarding === 100 ? "All current" : `${sg.total - sg.current} need renewal`,
        subColor: scores.safeguarding === 100 ? "var(--ec-em)" : "var(--ec-crit)",
        detail: `${sg.current} current · ${sg.total - sg.current} need renewal`,
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
      done: false,
      createdAt: new Date().toISOString(),
    };
    setActionItems(prev => [...prev, item]);
    setTodoInput("");
  }

  function toggleTodo(id) {
    setActionItems(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
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

  const card = {
    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "14px 16px",
    border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)",
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "var(--ec-z6)" }}>
          <div style={{ marginBottom: 8 }}><SvgChart size={32} /></div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>

      <div style={{ padding: "14px 20px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Hero Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, #0a2540 0%, #0f3d2b 50%, #1a1a4e 100%)",
          borderRadius: 16, padding: "28px 32px", marginBottom: 24,
          position: "relative", overflow: "hidden",
          boxShadow: "0 8px 32px rgba(10,37,64,0.2)",
        }}>
          {/* Glow blobs */}
          <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, background: "radial-gradient(circle, rgba(16,185,129,0.28) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", bottom: -60, left: "30%", width: 240, height: 240, background: "radial-gradient(circle, rgba(99,91,255,0.2) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "absolute", top: -40, left: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(0,115,230,0.15) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Top row: greeting left, RP + stats right */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              {/* Left — greeting */}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 20, padding: "3px 10px", marginBottom: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
                    {pharmacyConfig.pharmacyName || "iPharmacy Direct"} · {pharmacyConfig.gphcNumber || "FED07"}
                  </span>
                </div>
                <div style={{ color: "white", fontSize: 24, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                  {getGreeting()}, {firstName}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4, fontFamily: "'DM Mono', 'SF Mono', monospace" }}>
                  {dateStr} · {timeStr}
                </div>
              </div>

              {/* Right — RP pill + stat badges */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                {/* RP status pill */}
                {rpSigned ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 20, padding: "5px 12px" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.8)", display: "inline-block" }} />
                    <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>RP: {getRPAssignee()}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 20, padding: "5px 12px" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.7)", display: "inline-block" }} />
                    <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>No RP signed in</span>
                  </div>
                )}
                {/* Stat badges */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "5px 14px", textAlign: "center" }}>
                    <div style={{ color: "white", fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', 'SF Mono', monospace" }}>{overallPct}%</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em" }}>OVERALL</div>
                  </div>
                  <div style={{ background: overdueCount > 0 ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)", border: `1px solid ${overdueCount > 0 ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.18)"}`, backdropFilter: "blur(4px)", borderRadius: 20, padding: "5px 14px", textAlign: "center" }}>
                    <div style={{ color: "white", fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', 'SF Mono', monospace" }}>{overdueCount}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em" }}>OVERDUE</div>
                  </div>
                  <div style={{ background: dueTodayCount > 0 ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.1)", border: `1px solid ${dueTodayCount > 0 ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.18)"}`, backdropFilter: "blur(4px)", borderRadius: 20, padding: "5px 14px", textAlign: "center" }}>
                    <div style={{ color: "white", fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono', 'SF Mono', monospace" }}>{dueTodayCount}</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em" }}>DUE TODAY</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider + Quick Actions */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 16 }} />
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 10 }}>QUICK ACTIONS</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate(rpSigned ? "/rp-log" : "/rp-log")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <span style={{ fontSize: 15 }}>{rpSigned ? "📋" : "✅"}</span>
                {rpSigned ? "View RP Log" : "Sign RP In"}
              </button>
              <button
                onClick={() => navigate("/temperature")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <span style={{ fontSize: 15 }}>🌡️</span>
                Log Temperature
              </button>
              <button
                onClick={() => navigate("/incidents")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <span style={{ fontSize: 15 }}>⚠️</span>
                Log Incident
              </button>
              <button
                onClick={() => navigate("/my-tasks")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <span style={{ fontSize: 15 }}>✔️</span>
                My Tasks
              </button>
              <button
                onClick={() => navigate("/training")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                <span style={{ fontSize: 15 }}>🎓</span>
                Training
              </button>
              <button
                onClick={() => navigate("/alerts")}
                style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", color: "white", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", backdropFilter: "blur(4px)", fontFamily: "'Inter', sans-serif", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                {alerts.length > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", position: "absolute", top: -3, right: -3 }} />
                )}
                <span style={{ fontSize: 15 }}>🔔</span>
                Alerts
              </button>
            </div>
          </div>
        </div>

        {/* ── Collapsed Alert Banner ── */}
        {!alertsDismissed && alerts.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
            borderRadius: 10, marginBottom: 12,
            background: redAlerts > 0 ? "var(--ec-crit-bg)" : "var(--ec-warn-bg)",
            border: `1px solid ${redAlerts > 0 ? "var(--ec-crit-border)" : "var(--ec-warn-border)"}`,
          }}>
            <SvgCircleAlert size={13} color={redAlerts > 0 ? "var(--ec-crit)" : "var(--ec-warn)"} />
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: redAlerts > 0 ? "var(--ec-crit)" : "var(--ec-warn)" }}>
                {redAlerts > 0 ? `${redAlerts} critical` : ""}{redAlerts > 0 && alerts.length - redAlerts > 0 ? " · " : ""}{alerts.length - redAlerts > 0 ? `${alerts.length - redAlerts} warning${alerts.length - redAlerts !== 1 ? "s" : ""}` : ""}
              </span>
              <span style={{ fontSize: 11, color: "var(--ec-crit-light)" }}>—</span>
              {alerts.slice(0, 2).map((a, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500, color: "var(--ec-crit)",
                  background: "var(--ec-crit-bg)", padding: "2px 8px", borderRadius: 20, border: "1px solid var(--ec-crit-border)",
                }}>{a.msg.split("—")[0].trim()}</span>
              ))}
              {alerts.length > 2 && <span style={{ fontSize: 10, color: "var(--ec-crit-light)", fontWeight: 600 }}>+{alerts.length - 2} more</span>}
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
            variant="purple"
            icon={<SvgCheckSquare size={14} />} title="To Do"
            right={actionItems.filter(t => !t.done).length > 0
              ? <span style={{ fontSize: 10, fontFamily: "'DM Mono', 'SF Mono', monospace", background: "var(--amber-light)", color: "var(--amber)", padding: "1px 7px", borderRadius: 20, fontWeight: 600 }}>{actionItems.filter(t => !t.done).length} remaining</span>
              : null}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: actionItems.length ? 8 : 0 }}>
            <input value={todoInput} onChange={e => setTodoInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTodo(); }}
              placeholder="Add an action item and press Enter…"
              style={{ flex: 1, padding: "7px 12px", borderRadius: 8, fontSize: 12, border: "1px solid var(--ec-div)", outline: "none", fontFamily: "'Inter', sans-serif", background: "var(--ec-card)" }}
            />
            <button onClick={addTodo}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "var(--ec-btn-primary)", color: "white", boxShadow: "0 2px 8px rgba(16,185,129,0.3)", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
              + Add
            </button>
          </div>
          {actionItems.length === 0
            ? <div style={{ fontSize: 11, color: "var(--ec-t3)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>Nothing here yet — add an action item above</div>
            : actionItems.map(todo => (
              <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: todo.done ? "var(--ec-em-bg)" : "var(--ec-card)", border: `1px solid ${todo.done ? "var(--ec-em-border)" : "var(--ec-t5)"}` }}>
                <div onClick={() => toggleTodo(todo.id)} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: todo.done ? "none" : "2px solid var(--ec-t4)", background: todo.done ? "var(--ec-em)" : "var(--ec-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {todo.done && <SvgCheck size={10} color="white" />}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: todo.done ? "var(--ec-em-border)" : "var(--ec-t1)", textDecoration: todo.done ? "line-through" : "none" }}>{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ec-t4)", fontSize: 15 }}>×</button>
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
                variant="em"
                icon={<SvgClipboard size={14} />} title="Shift Checklist"
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 80, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${shiftPct}%`, height: "100%", background: "var(--em)", borderRadius: 99, transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', 'SF Mono', monospace", color: "var(--text-2)" }}>{shiftDone}/{shiftTotal}</span>
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
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "var(--ec-card)"; }}
                      style={{
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        border: isActive ? "none" : "1px solid var(--ec-div)",
                        background: isActive ? "var(--ec-em)" : "var(--ec-card)",
                        color: isActive ? "white" : "var(--ec-em)",
                        cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        transition: "background 0.12s",
                      }}>
                      {tab.label} <span style={{ opacity: 0.7, fontFamily: "'DM Mono', 'SF Mono', monospace", fontSize: 9 }}>{done}/{tab.tasks.length}</span>
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

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-div)", fontSize: 10, color: "var(--ec-z6)", display: "flex", alignItems: "center", gap: 5 }}>
                <SvgClipboard size={11} color="var(--ec-z6)" /> <span style={{ fontWeight: 500 }}>{shiftDone}/{shiftTotal} tasks completed</span>
                {shiftPct === 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--ec-em)", fontWeight: 600 }}>All done!</span>}
                {shiftPct < 100 && <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--ec-t3)" }}>{shiftTotal - shiftDone} remaining</span>}
              </div>
            </div>

            {/* ── CD Balance Check ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                variant="crit"
                icon={<SvgPill size={14} />} title="CD Balance Check"
                right={
                  cdCheckStatus.isDone
                    ? <span style={{ fontSize: 10, fontWeight: 700, background: "var(--ec-em-bg)", color: "var(--ec-em)", padding: "1px 8px", borderRadius: 20, border: "1px solid var(--ec-em-border)", display: "inline-flex", alignItems: "center", gap: 3 }}><SvgCheck size={9} color="var(--ec-em)" /> Done</span>
                    : cdCheckStatus.status === "overdue"
                      ? <span style={{ fontSize: 10, fontWeight: 700, background: "var(--ec-crit-bg)", color: "var(--ec-crit)", padding: "1px 8px", borderRadius: 20, border: "1px solid var(--ec-crit-border)" }}>Overdue</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, background: "var(--ec-warn-bg)", color: "var(--ec-warn)", padding: "1px 8px", borderRadius: 20, border: "1px solid var(--ec-warn-border)" }}>Due</span>
                }
              />
              {/* Status */}
              {cdCheckStatus.isDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: "var(--ec-em-bg)", border: "1px solid var(--ec-em-border)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ec-em)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><SvgCheck size={14} color="white" /></div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ec-em)" }}>Balance check completed</div>
                    <div style={{ fontSize: 11, color: "var(--ec-em-dark)", marginTop: 2 }}>
                      {cdCheckStatus.latest?.staffMember}{cdCheckStatus.latest?.dateTime ? <> · {new Date(cdCheckStatus.latest.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {new Date(cdCheckStatus.latest.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</> : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, background: cdCheckStatus.status === "overdue" ? "var(--ec-crit-bg)" : "var(--ec-warn-bg)", border: `1px solid ${cdCheckStatus.status === "overdue" ? "var(--ec-crit-border)" : "var(--ec-warn-border)"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: cdCheckStatus.status === "overdue" ? "var(--ec-crit)" : "var(--ec-warn)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, flexShrink: 0 }}>!</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: cdCheckStatus.status === "overdue" ? "var(--ec-crit)" : "var(--ec-warn)" }}>
                      Balance check {cdCheckStatus.status === "overdue" ? "overdue" : "due this week"}
                    </div>
                  </div>
                  <button
                    onClick={handleCDCheck}
                    style={{ fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 8, border: "none", background: "var(--ec-btn-primary)", color: "white", boxShadow: "0 2px 8px rgba(16,185,129,0.3)", cursor: "pointer" }}
                  >
                    Mark Complete
                  </button>
                </div>
              )}
              {/* Recent checks */}
              {cdCheckStatus.recentChecks.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Recent checks</div>
                  {cdCheckStatus.recentChecks.map((e, i) => (
                    <div key={e.id || i} style={{ fontSize: 11, color: "var(--ec-t2)", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                      <SvgDot size={6} color="var(--ec-em-border)" />
                      <span style={{ fontFamily: "'DM Mono', 'SF Mono', monospace", fontSize: 10 }}>{e.dateTime ? new Date(e.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                      <span>—</span>
                      <span>{e.staffMember}</span>
                      <span style={{ color: "var(--ec-t3)", fontSize: 10 }}>{e.dateTime ? <>at {new Date(e.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</> : null}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--ec-div)", fontSize: 10, color: "var(--ec-t3)", display: "flex", alignItems: "center", gap: 4 }}>
                <SvgDot size={6} color="var(--ec-em-border)" /> Register maintained in PharmSmart · Physical register in CD cabinet
              </div>
            </div>

            {/* ── Bank Holiday Warning ── */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                variant="blue"
                icon={<span>🏦</span>}
                title="Bank Holidays"
              />
              {bhLoading ? (
                <div style={{ padding: "10px 0" }}>
                  <div style={{ height: 14, borderRadius: 6, background: "var(--ec-t5)", animation: "ecPulse 1.5s ease-in-out infinite" }} />
                </div>
              ) : bhError ? (
                <div style={{ fontSize: 11, color: "var(--ec-t3)", fontStyle: "italic", padding: "8px 0" }}>Unable to load bank holidays</div>
              ) : bankHolidays.length === 0 ? (
                <div style={{ fontSize: 11, color: "var(--ec-t3)", fontStyle: "italic", padding: "8px 0" }}>No bank holidays in the next 90 days.</div>
              ) : (() => {
                const todayISO = todayStr();
                const soonHoliday = bankHolidays.find(h => {
                  const diff = Math.round((new Date(h.date + "T00:00:00") - new Date(todayISO + "T00:00:00")) / 86400000);
                  return diff >= 0 && diff <= 7;
                });
                const visible = bhShowAll ? bankHolidays : bankHolidays.slice(0, 4);
                return (
                  <>
                    {soonHoliday && (() => {
                      const hDate = new Date(soonHoliday.date + "T00:00:00");
                      return (
                        <div style={{ background: "var(--ec-warn-bg)", border: "1px solid var(--ec-warn-border)", borderRadius: 8, padding: "7px 12px", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--ec-warn)", fontWeight: 500 }}>⚠ {soonHoliday.title} on {hDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} — check prescription batch and delivery schedule</span>
                        </div>
                      );
                    })()}
                    {visible.map(h => {
                      const hDate = new Date(h.date + "T00:00:00");
                      const diff = Math.round((hDate - new Date(todayISO + "T00:00:00")) / 86400000);
                      const isToday = diff === 0;
                      const isSoon = diff >= 1 && diff <= 7;
                      const pillStyle = isToday
                        ? { background: "var(--ec-crit-bg)", color: "var(--ec-crit)", border: "1px solid var(--ec-crit-border)" }
                        : diff <= 7
                          ? { background: "var(--ec-warn-bg)", color: "var(--ec-warn)", border: "1px solid var(--ec-warn-border)" }
                          : diff <= 30
                            ? { background: "var(--ec-info-bg)", color: "var(--ec-info)", border: "1px solid var(--ec-info-border)" }
                            : { background: "var(--ec-em-bg)", color: "var(--ec-em)", border: "1px solid var(--ec-div)" };
                      return (
                        <div key={h.date} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "7px 12px", borderRadius: 8, marginBottom: 4,
                          background: isToday ? "var(--ec-crit-bg)" : isSoon ? "var(--ec-warn-bg)" : "var(--ec-card)",
                          border: `1px solid ${isToday ? "var(--ec-crit-border)" : isSoon ? "var(--ec-warn-border)" : "var(--ec-div)"}`,
                        }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ec-t1)", fontFamily: "'DM Mono', 'SF Mono', monospace" }}>
                              {hDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                            </div>
                            <div style={{ fontSize: 10, color: "var(--ec-t3)" }}>{h.title}</div>
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20,
                            fontFamily: "'DM Mono', 'SF Mono', monospace", ...pillStyle,
                          }}>
                            {isToday ? "TODAY" : `in ${diff}d`}
                          </span>
                        </div>
                      );
                    })}
                    {bankHolidays.length > 4 && (
                      <button onClick={() => setBhShowAll(v => !v)} style={{
                        fontSize: 10, color: "var(--ec-em)", fontWeight: 600, background: "none", border: "none",
                        cursor: "pointer", padding: "4px 0", fontFamily: "'Inter', sans-serif",
                      }}>
                        {bhShowAll ? "Show less" : `View all ${bankHolidays.length} upcoming`}
                      </button>
                    )}
                    <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 4 }}>England &amp; Wales · Source: GOV.UK</div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Compliance Health */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader
                variant="em"
                icon={<SvgHospital size={14} />} title="Compliance Health"
                right={<span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono', 'SF Mono', monospace", color: "var(--em)" }}>{overallPct}% <span style={{ fontSize: 9, fontWeight: 400, color: "var(--text-3)" }}>overall</span></span>}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {complianceHealth.map(item => (
                  <ComplianceCard key={item.key} item={item}
                    expanded={expandedCard === item.key}
                    onToggle={() => setExpandedCard(expandedCard === item.key ? null : item.key)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--ec-div)", fontSize: 10, color: "var(--ec-t3)", display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ec-warn)" }} />
                Last GPhC inspection: <strong style={{ color: "var(--ec-t2)" }}>14 months ago</strong>
              </div>
            </div>

            {/* Expiring Soon */}
            <div style={{ ...card, overflow: "hidden" }}>
              <CardHeader variant="warn" icon={<SvgCalendar size={14} />} title="Expiring Soon" />
              {expiringDocs.length === 0
                ? <div style={{ fontSize: 11, color: "var(--ec-t3)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>No documents expiring within 90 days</div>
                : <>
                  {(expiringExpanded ? expiringDocs : expiringDocs.slice(0, 3)).map((doc, i) => {
                    const r = doc.days < 0
                      ? { bg: "var(--ec-crit-bg)", border: "var(--ec-crit-border)", text: "var(--ec-crit)", label: "EXPIRED", sublabel: `${Math.abs(doc.days)}d ago` }
                      : doc.days <= 14
                      ? { bg: "var(--ec-crit-bg)", border: "var(--ec-crit-border)", text: "var(--ec-crit)", label: `in ${doc.days}d`, sublabel: "Urgent" }
                      : doc.days <= 30
                      ? { bg: "var(--ec-warn-bg)", border: "var(--ec-warn-border)", text: "var(--ec-warn)", label: `in ${doc.days}d`, sublabel: "Soon" }
                      : { bg: "var(--ec-card)", border: "var(--ec-div)", text: "var(--ec-em)", label: `in ${doc.days}d`, sublabel: "OK" };
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, marginBottom: 4, background: r.bg, border: `1px solid ${r.border}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ec-t1)" }}>{doc.name}</div>
                          <div style={{ fontSize: 9, color: "var(--ec-t3)", marginTop: 1 }}>{r.sublabel}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: r.text, fontFamily: "'DM Mono', 'SF Mono', monospace", minWidth: 54, textAlign: "right" }}>{r.label}</span>
                      </div>
                    );
                  })}
                  {expiringDocs.length > 3 && (
                    <button
                      onClick={() => setExpiringExpanded(e => !e)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "var(--ec-em)", fontWeight: 600, padding: "4px 0 2px", width: "100%", textAlign: "center" }}
                    >
                      {expiringExpanded ? "Show less" : `View all ${expiringDocs.length} expiring`}
                    </button>
                  )}
                </>
              }
            </div>

          </div>
        </div>

        {/* ── Staff Tasks ── */}
        <div style={{ marginTop: 12 }}>

        <div style={{ ...card, overflow: "hidden" }}>
          <CardHeader
            variant="em"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>}
            title="Staff Tasks"
            right={canAssign ? (
              <button
                onClick={() => setStFormOpen(o => !o)}
                style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                {stFormOpen ? "Cancel" : "+ Assign"}
              </button>
            ) : null}
          />

          {/* Progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ec-div)", overflow: "hidden" }}>
                <div style={{ width: `${stProgressPct}%`, height: "100%", background: "var(--ec-em)", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', 'SF Mono', monospace", color: "var(--ec-t2)", marginLeft: 10, flexShrink: 0 }}>{stDoneCount}/{stTotal} tasks complete</span>
            </div>
          </div>

          {/* Inline assign form (rp/manager only) */}
          {stFormOpen && canAssign && (
            <div style={{ background: "var(--ec-em-bg)", border: "1px solid var(--ec-div)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t2)", marginBottom: 2, display: "block" }}>Task title *</label>
                  <input value={stTitle} onChange={e => setStTitle(e.target.value)} placeholder="Enter task title…"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid var(--ec-div)", outline: "none", fontFamily: "'Inter', sans-serif", background: "var(--ec-card)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t2)", marginBottom: 2, display: "block" }}>Assign to *</label>
                  <select value={stAssignTo} onChange={e => setStAssignTo(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid var(--ec-div)", background: "var(--ec-card)", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                  >
                    {staffAssignees.map(s => <option key={s.initials} value={s.initials}>{s.initials} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t2)", marginBottom: 2, display: "block" }}>Priority *</label>
                  <select value={stPriority} onChange={e => setStPriority(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid var(--ec-div)", background: "var(--ec-card)", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MED">MED</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t2)", marginBottom: 2, display: "block" }}>Due date</label>
                  <input type="date" value={stDueDate} onChange={e => setStDueDate(e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid var(--ec-div)", background: "var(--ec-card)", fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-t2)", marginBottom: 2, display: "block" }}>Notes</label>
                  <input value={stNotes} onChange={e => setStNotes(e.target.value)} placeholder="Optional notes…"
                    style={{ width: "100%", padding: "6px 10px", borderRadius: 7, fontSize: 12, border: "1px solid var(--ec-div)", outline: "none", fontFamily: "'Inter', sans-serif", background: "var(--ec-card)", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleAssignTask} disabled={!stTitle.trim()}
                  style={{ padding: "6px 16px", borderRadius: 7, border: "none", cursor: stTitle.trim() ? "pointer" : "default", background: stTitle.trim() ? "var(--ec-em)" : "var(--ec-t4)", color: "white", fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                >
                  Assign
                </button>
              </div>
            </div>
          )}

          {/* Task list */}
          {stTotal === 0 ? (
            <div style={{ fontSize: 11, color: "var(--ec-t3)", textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>No tasks assigned yet.</div>
          ) : (
            <>
              {/* Pending section */}
              {stPending.length > 0 && (
                <>
                  <div onClick={() => toggleStSection("pending")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, marginTop: 4, userSelect: "none" }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--ec-t3)" style={{ transition: "transform 0.15s", transform: stOpenSections.pending ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ec-t2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pending</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "var(--ec-em-bg)", color: "var(--ec-em)", border: "1px solid var(--ec-em-border)" }}>{stPending.length}</span>
                  </div>
                  {stOpenSections.pending && stPending.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < today;
                    return (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                        borderRadius: 8, marginBottom: 4,
                        background: isOverdue ? "var(--ec-crit-bg)" : "var(--ec-card)",
                        border: `1px solid ${isOverdue ? "var(--ec-crit-border)" : "var(--ec-t5)"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                          <PriorityBadge level={task.priority} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ec-t1)" }}>{task.title}</div>
                            {task.notes && <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 1 }}>{task.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', 'SF Mono', monospace", color: isOverdue ? "var(--ec-crit)" : "var(--ec-t3)" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                          <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                            style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid var(--ec-div)", background: "var(--ec-card)", color: "var(--ec-t1)", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}
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
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--ec-t3)" style={{ transition: "transform 0.15s", transform: stOpenSections.in_progress ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ec-t2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>In Progress</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "var(--ec-em-bg)", color: "var(--ec-em)", border: "1px solid var(--ec-em-border)" }}>{stInProgress.length}</span>
                  </div>
                  {stOpenSections.in_progress && stInProgress.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < today;
                    return (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                        borderRadius: 8, marginBottom: 4,
                        background: isOverdue ? "var(--ec-crit-bg)" : "var(--ec-card)",
                        border: `1px solid ${isOverdue ? "var(--ec-crit-border)" : "var(--ec-t5)"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                          <PriorityBadge level={task.priority} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ec-t1)" }}>{task.title}</div>
                            {task.notes && <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 1 }}>{task.notes}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', 'SF Mono', monospace", color: isOverdue ? "var(--ec-crit)" : "var(--ec-t3)" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                          <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                            style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid var(--ec-div)", background: "var(--ec-card)", color: "var(--ec-t1)", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}
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
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="var(--ec-t3)" style={{ transition: "transform 0.15s", transform: stOpenSections.done ? "rotate(90deg)" : "rotate(0deg)" }}><path d="M2 1l4 3-4 3z"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ec-t2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Done</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "var(--ec-em-bg)", color: "var(--ec-em)", border: "1px solid var(--ec-em-border)" }}>{stDone.length}</span>
                  </div>
                  {stOpenSections.done && stDone.map(task => (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                      borderRadius: 8, marginBottom: 4, opacity: 0.5,
                      background: "var(--ec-card)", border: "1px solid var(--ec-t5)",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flex: 1, minWidth: 0 }}>
                        <PriorityBadge level={task.priority} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ec-t1)", textDecoration: "line-through" }}>{task.title}</div>
                          {task.notes && <div style={{ fontSize: 10, color: "var(--ec-t3)", marginTop: 1 }}>{task.notes}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                        <Avatar name={initialsToName(task.assignedBy)} size={16} />
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 3l2 2-2 2" stroke="var(--ec-t3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <Avatar name={initialsToName(task.assignedTo)} size={22} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {task.dueDate && <span style={{ fontSize: 9, fontFamily: "'DM Mono', 'SF Mono', monospace", color: "var(--ec-t3)" }}>{new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                        <select value={task.status} onChange={e => handleStStatusChange(task.id, e.target.value)} disabled={!canModifyTask(task)}
                          style={{ fontSize: 10, padding: "2px 4px", borderRadius: 6, border: "1px solid var(--ec-div)", background: "var(--ec-card)", color: "var(--ec-t1)", cursor: canModifyTask(task) ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}
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

        </div>{/* end Staff Tasks wrapper */}

      </div>
    </div>
  );
}
