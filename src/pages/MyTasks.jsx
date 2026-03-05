import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { supabase } from "../lib/supabase";
import { getStaffInitials, getRPAssignee } from "../utils/rotationManager";
import { generateId } from "../utils/helpers";
import DashCardHeader from "../components/DashCardHeader";
import Avatar from "../components/Avatar";
import PriorityBadge from "../components/PriorityBadge";
import CategoryTag from "../components/CategoryTag";

// ── Spinner keyframe ─────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('task-spinner-css')) {
  const s = document.createElement('style');
  s.id = 'task-spinner-css';
  s.textContent = '@keyframes taskSpin { to { transform: rotate(360deg) } }';
  document.head.appendChild(s);
}

// ── Shared constants ──────────────────────────────────────────────────────

const STAFF_ASSIGNEES = [
  { initials: "SS", name: "Salma Shakoor" },
  { initials: "AS", name: "Amjid Shakoor" },
  { initials: "JA", name: "Jamila Adwan" },
  { initials: "MH", name: "Marian Hadaway" },
  { initials: "MJ", name: "Moniba Jamil" },
  { initials: "UK", name: "Umama Khan" },
  { initials: "SuS", name: "Sadaf Subhani" },
  { initials: "UKh", name: "Urooj Khan" },
  { initials: "SN", name: "Shain Nawaz" },
];

const CATEGORIES = ["CD Check", "Cleaning", "Compliance", "H&S", "Waste", "RP Check"];
const PRIORITIES = ["HIGH", "MED", "LOW"];
const STATUSES = ["pending", "in_progress", "done"];

// ── Automated pharmacy task definitions ──────────────────────────────────
// freq: daily | weekly | fortnightly | monthly
// day: JS getDay() value for weekly/fortnightly (1=Mon..5=Fri)
// role: rp | manager | any
const PHARMACY_TASKS = [
  // ── Daily (10) ──
  { title: "Temperature Log",              freq: "daily", cat: "Compliance", pri: "HIGH", role: "any",     notes: "Record fridge min/max/current temp" },
  { title: "Daily RP Checks",              freq: "daily", cat: "RP Check",   pri: "HIGH", role: "rp",      notes: "Complete all 14 RP checklist items" },
  { title: "Dispensary Clean",              freq: "daily", cat: "Cleaning",   pri: "MED",  role: "any",     notes: null },
  { title: "Counter & Surfaces Wipe",       freq: "daily", cat: "Cleaning",   pri: "MED",  role: "any",     notes: null },
  { title: "CD Register Balance Check",     freq: "daily", cat: "CD Check",   pri: "HIGH", role: "rp",      notes: "Check all 5 CD entries in PharmSmart" },
  { title: "Near Miss Log Review",          freq: "daily", cat: "Compliance", pri: "MED",  role: "rp",      notes: null },
  { title: "Check Drug Alerts & Recalls",   freq: "daily", cat: "Compliance", pri: "HIGH", role: "rp",      notes: "Check MHRA alerts and CAS notifications" },
  { title: "Prescription Collection Review",freq: "daily", cat: "Compliance", pri: "LOW",  role: "any",     notes: "Return uncollected items after 28 days" },
  { title: "Check Owing Prescriptions",     freq: "daily", cat: "Compliance", pri: "MED",  role: "any",     notes: "Follow up outstanding owings" },
  { title: "End of Day Till Reconciliation", freq: "daily", cat: "Compliance", pri: "MED",  role: "manager", notes: "Cash & card totals match POS" },

  // ── Weekly — Monday (2) ──
  { title: "Full CD Reconciliation",        freq: "weekly", day: 1, cat: "CD Check",   pri: "HIGH", role: "rp",      notes: "Count all Schedule 2 & 3 CDs against register" },
  { title: "Stock Rotation — Short Dated",  freq: "weekly", day: 1, cat: "Compliance", pri: "MED",  role: "any",     notes: "Move short-dated items to front, flag <3 months" },
  // ── Weekly — Tuesday (2) ──
  { title: "Sharps Bin Level Check",        freq: "weekly", day: 2, cat: "Waste",      pri: "HIGH", role: "any",     notes: "Replace if ¾ full — seal and label" },
  { title: "Fire Exits & Signage Check",    freq: "weekly", day: 2, cat: "H&S",        pri: "HIGH", role: "any",     notes: "All exits unobstructed, signage visible" },
  // ── Weekly — Wednesday (2) ──
  { title: "First Aid Kit Check",           freq: "weekly", day: 3, cat: "H&S",        pri: "MED",  role: "any",     notes: "Reorder any expired or missing items" },
  { title: "Waste Collection Scheduling",   freq: "weekly", day: 3, cat: "Waste",      pri: "MED",  role: "manager", notes: "Confirm DOOP & confidential waste pickup" },
  // ── Weekly — Thursday (2) ──
  { title: "Fridge Quick Clean",            freq: "weekly", day: 4, cat: "Cleaning",   pri: "MED",  role: "any",     notes: "Wipe shelves, check for spills" },
  { title: "Returns Processing",            freq: "weekly", day: 4, cat: "Compliance", pri: "LOW",  role: "any",     notes: "Process supplier returns and credit notes" },
  // ── Weekly — Friday (2) ──
  { title: "Robot Maintenance Check",       freq: "weekly", day: 5, cat: "Compliance", pri: "MED",  role: "manager", notes: "Run diagnostics, clear jams, check cassettes" },
  { title: "Staff Rota Review",             freq: "weekly", day: 5, cat: "Compliance", pri: "LOW",  role: "manager", notes: "Confirm next week's coverage" },

  // ── Fortnightly (3) — even week number ──
  { title: "SOP Spot Check",               freq: "fortnightly", day: 1, cat: "Compliance", pri: "MED", role: "rp",      notes: "Random check of 2 SOPs for currency" },
  { title: "Staff Training Record Review",  freq: "fortnightly", day: 3, cat: "Compliance", pri: "MED", role: "manager", notes: "Check training log completeness" },
  { title: "Consultation Room Check",       freq: "fortnightly", day: 5, cat: "Cleaning",   pri: "LOW", role: "any",     notes: "Clean surfaces, check equipment, restock" },

  // ── Monthly — 1st of month (6) ──
  { title: "Deep Fridge Clean",             freq: "monthly", cat: "Cleaning",   pri: "HIGH", role: "any",     notes: "Full defrost and clean — document" },
  { title: "GPhC Standards Self-Assessment",freq: "monthly", cat: "Compliance", pri: "HIGH", role: "rp",      notes: "Review all 5 GPhC standards with evidence" },
  { title: "Near Miss Trend Analysis",      freq: "monthly", cat: "Compliance", pri: "MED",  role: "rp",      notes: "Identify patterns, update risk register" },
  { title: "Equipment Calibration Check",   freq: "monthly", cat: "H&S",        pri: "MED",  role: "manager", notes: "Verify scales, thermometers, BP monitors" },
  { title: "Monthly Audit Summary",         freq: "monthly", cat: "Compliance", pri: "MED",  role: "manager", notes: "Compile compliance metrics for month" },
  { title: "Insurance & Registration Review",freq: "monthly", cat: "Compliance", pri: "LOW",  role: "manager", notes: "Check policy dates and renewal schedules" },
];

// Which tasks are due today based on frequency + day-of-week
function getTasksDueToday() {
  const now = new Date();
  const dow = now.getDay();               // 0=Sun..6=Sat
  const dom = now.getDate();              // 1-31
  const wk = Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7);

  return PHARMACY_TASKS.filter(t => {
    if (t.freq === "daily") return true;
    if (t.freq === "weekly") return dow === (t.day ?? 1);
    if (t.freq === "fortnightly") return wk % 2 === 0 && dow === (t.day ?? 1);
    if (t.freq === "monthly") return dom === 1;
    return false;
  });
}

// Auto-assign based on role; general tasks rotate daily across staff
const GENERAL_ROTATION = ["SS", "MJ", "UK", "SuS", "UKh", "SN", "MH", "JA"];
function assignTaskTo(task, index) {
  if (task.role === "rp") return "AS";
  if (task.role === "manager") return "SS";
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return GENERAL_ROTATION[(doy + index) % GENERAL_ROTATION.length];
}

function initialsToName(initials) {
  return STAFF_ASSIGNEES.find(s => s.initials === initials)?.name || initials;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Styles ────────────────────────────────────────────────────────────────

const card = {
  background: "white", borderRadius: 12, padding: "14px 16px",
  border: "1px solid #d1fae5", boxShadow: "0 1px 4px rgba(5,150,105,0.06)",
};

const inputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
  border: "1px solid #d1fae5", outline: "none", fontFamily: "'DM Sans', sans-serif",
  background: "white", boxSizing: "border-box",
};

// ── Component ─────────────────────────────────────────────────────────────

export default function MyTasks() {
  const { user } = useUser();
  const [staffTasks, setStaffTasks, loading] = useSupabase("staff_tasks", []);
  const [now, setNow] = useState(new Date());
  const seededRef = useRef(false);
  const [savingTaskId, setSavingTaskId] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => todayStr(), [now]);
  const userInitials = getStaffInitials(user?.name || "");
  const isRP = user?.name === getRPAssignee();
  const canAssign = isRP || !!user?.isManager;

  // ── Seed automated tasks for today ──
  useEffect(() => {
    if (loading || seededRef.current) return;
    seededRef.current = true;
    const t = todayStr();
    if (staffTasks.some(task => task.dueDate === t)) return;

    const dueTasks = getTasksDueToday();
    const ts = new Date().toISOString();
    const defaults = dueTasks.map((task, i) => ({
      id: generateId(),
      title: task.title,
      assignedTo: assignTaskTo(task, i),
      assignedBy: "AS",
      roleRequired: task.role,
      priority: task.pri,
      category: task.cat,
      dueDate: t,
      status: "pending",
      notes: task.notes,
      createdAt: ts,
    }));
    if (defaults.length > 0) {
      setStaffTasks(prev => [...prev, ...defaults]);
    }
  }, [loading]);

  // ── Filters ──
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState(null);
  const filtersActive = filterPriority !== "ALL" || filterAssignee !== "ALL" || filterCategory !== "ALL" || filterStatus !== "All" || filterDate !== null;

  // ── Calendar ──
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  // ── Assign modal ──
  const [modalOpen, setModalOpen] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mAssignTo, setMAssignTo] = useState("SS");
  const [mPriority, setMPriority] = useState("MED");
  const [mCategory, setMCategory] = useState("");
  const [mDueDate, setMDueDate] = useState("");
  const [mNotes, setMNotes] = useState("");

  // ── Sections ──
  const [openSections, setOpenSections] = useState({ pending: true, in_progress: true, done: false });

  // ── Filtered tasks ──
  const allTasks = useMemo(() =>
    [...staffTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [staffTasks]
  );

  // Show all tasks to rp/manager, only own tasks to regular staff
  const visibleTasks = useMemo(() => {
    let list = canAssign ? allTasks : allTasks.filter(t => t.assignedTo === userInitials);
    if (filterPriority !== "ALL") list = list.filter(t => t.priority === filterPriority);
    if (filterAssignee !== "ALL") list = list.filter(t => t.assignedTo === filterAssignee);
    if (filterCategory !== "ALL") list = list.filter(t => (t.category || "") === filterCategory);
    if (filterStatus !== "All") {
      const s = filterStatus.toLowerCase().replace(/ /g, "_");
      list = list.filter(t => t.status === s);
    }
    if (filterDate) list = list.filter(t => t.dueDate === filterDate);
    return list;
  }, [allTasks, canAssign, userInitials, filterPriority, filterAssignee, filterCategory, filterStatus, filterDate]);

  const pending = visibleTasks.filter(t => t.status === "pending");
  const inProgress = visibleTasks.filter(t => t.status === "in_progress");
  const done = visibleTasks.filter(t => t.status === "done");

  // ── PART 2: KPI chips — live counts ──
  const myTasks = canAssign ? allTasks : allTasks.filter(t => t.assignedTo === userInitials);
  const totalAssigned = myTasks.filter(t => t.status !== "done").length;
  const overdueCount = myTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done").length;
  const dueTodayCount = myTasks.filter(t => t.dueDate === today && t.status !== "done").length;

  // ── Handlers ──
  function canModifyTask(task) {
    if (isRP || user?.isManager) return true;
    return task.assignedTo === userInitials;
  }

  // PART 3: Optimistic status update with revert on failure
  async function handleStatusChange(taskId, newStatus) {
    setSavingTaskId(taskId);
    const snapshot = staffTasks.map(t => ({ ...t }));
    setStaffTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const { error } = await supabase.from('staff_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
    } catch (e) {
      console.error('Status update failed:', e);
      setStaffTasks(snapshot);
    } finally {
      setSavingTaskId(null);
    }
  }

  function handleAssignTask() {
    if (!mTitle.trim()) return;
    const newTask = {
      id: generateId(),
      title: mTitle.trim(),
      assignedTo: mAssignTo,
      assignedBy: userInitials,
      roleRequired: "any",
      priority: mPriority,
      status: "pending",
      dueDate: mDueDate || null,
      notes: mNotes.trim() || null,
      category: mCategory || null,
      createdAt: new Date().toISOString(),
    };
    setStaffTasks(prev => [newTask, ...prev]);
    setMTitle(""); setMAssignTo("SS"); setMPriority("MED"); setMCategory(""); setMDueDate(""); setMNotes("");
    setModalOpen(false);
  }

  function clearFilters() {
    setFilterPriority("ALL"); setFilterAssignee("ALL"); setFilterCategory("ALL"); setFilterStatus("All"); setFilterDate(null);
  }

  function toggleSection(section) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  // ── Calendar helpers ──
  const calDays = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, inMonth: false, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, inMonth: true, date: iso });
    }
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) for (let d = 1; d <= remaining; d++) cells.push({ day: d, inMonth: false, date: null });
    return cells;
  }, [calMonth, calYear]);

  // PART 4: Include ALL tasks (including done) so we can show grey dots
  const tasksByDate = useMemo(() => {
    const map = {};
    const relevantTasks = canAssign ? allTasks : allTasks.filter(t => t.assignedTo === userInitials);
    relevantTasks.filter(t => t.dueDate).forEach(t => {
      if (!map[t.dueDate]) map[t.dueDate] = [];
      map[t.dueDate].push(t);
    });
    return map;
  }, [allTasks, canAssign, userInitials]);

  // PART 4: Dot color with grey for all-done days
  function getDotColor(date) {
    const tasks = tasksByDate[date];
    if (!tasks?.length) return null;
    const allDone = tasks.every(t => t.status === "done");
    if (allDone) return "#94a3b8";
    const active = tasks.filter(t => t.status !== "done");
    if (active.some(t => t.priority === "HIGH" || (t.dueDate < today))) return "#ef4444";
    if (active.some(t => t.priority === "MED")) return "#f59e0b";
    return "#16a34a";
  }

  // ── Escape key for modal ──
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e) => { if (e.key === "Escape") setModalOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  // ── Date formatting ──
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const firstName = user?.name?.split(" ")[0] || "there";

  // ── PART 6: Team progress data ──
  const teamProgress = useMemo(() => {
    if (!canAssign) return [];
    return STAFF_ASSIGNEES.map(staff => {
      const dayTasks = allTasks.filter(t => t.assignedTo === staff.initials && t.dueDate === today);
      const doneCount = dayTasks.filter(t => t.status === "done").length;
      return { ...staff, total: dayTasks.length, done: doneCount };
    }).filter(s => s.total > 0);
  }, [allTasks, canAssign, today]);

  // ── Render ──
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0faf4", minHeight: "100vh" }}>
      <div style={{ padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{getGreeting()}, {firstName}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{dateStr}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[
              { label: "Assigned", val: String(totalAssigned), bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
              { label: "Overdue", val: String(overdueCount), bg: overdueCount > 0 ? "#fef2f2" : "#f8fafc", color: overdueCount > 0 ? "#dc2626" : "#94a3b8", border: overdueCount > 0 ? "#fecaca" : "#e2e8f0" },
              { label: "Due Today", val: String(dueTodayCount), bg: dueTodayCount > 0 ? "#fffbeb" : "#f8fafc", color: dueTodayCount > 0 ? "#d97706" : "#94a3b8", border: dueTodayCount > 0 ? "#fde68a" : "#e2e8f0" },
            ].map(k => (
              <div key={k.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px", borderRadius: 10, background: k.bg, border: `1px solid ${k.border}` }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{k.val}</span>
                <span style={{ fontSize: 9, color: k.color, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.8 }}>{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div style={{ ...card, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Priority pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {["ALL", ...PRIORITIES].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: filterPriority === p ? "none" : "1px solid #d1fae5",
                background: filterPriority === p ? "#059669" : "white",
                color: filterPriority === p ? "white" : "#059669",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>{p}</button>
            ))}
          </div>

          {/* Assignee filter (rp/manager only) */}
          {canAssign && (
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "4px 10px", fontSize: 11 }}>
              <option value="ALL">All Staff</option>
              {STAFF_ASSIGNEES.map(s => <option key={s.initials} value={s.initials}>{s.initials} — {s.name}</option>)}
            </select>
          )}

          {/* Category dropdown */}
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ ...inputStyle, width: "auto", padding: "4px 10px", fontSize: 11 }}>
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {["All", "Pending", "In Progress", "Done"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: filterStatus === s ? "none" : "1px solid #d1fae5",
                background: filterStatus === s ? "#059669" : "white",
                color: filterStatus === s ? "white" : "#059669",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>{s}</button>
            ))}
          </div>

          {/* Clear filters */}
          {filtersActive && (
            <button onClick={clearFilters} style={{ fontSize: 11, color: "#059669", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Clear filters
            </button>
          )}
          {filterDate && (
            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              Date: {new Date(filterDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>

          {/* LEFT — Task List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {visibleTasks.length === 0 ? (
              /* PART 5: Improved empty state */
              <div style={{ ...card, padding: "40px 20px", textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                </div>
                {filtersActive ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>No matches</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      No tasks match your current filters. <button onClick={clearFilters} style={{ color: "#059669", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Clear filters</button>
                    </div>
                  </>
                ) : canAssign ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>No tasks assigned yet</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
                      Use '+ Assign Task' to create the first task.
                    </div>
                    <button onClick={() => setModalOpen(true)} style={{
                      padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600,
                      border: "none", background: "#059669", color: "white",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      display: "inline-flex", alignItems: "center", gap: 6,
                      boxShadow: "0 4px 14px rgba(5,150,105,0.4)",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                      Assign First Task
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>All caught up!</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>
                      No tasks assigned to you yet. Check back later or ask your manager.
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <TaskGroup label="Pending" tasks={pending} open={openSections.pending} onToggle={() => toggleSection("pending")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} savingTaskId={savingTaskId} />
                <TaskGroup label="In Progress" tasks={inProgress} open={openSections.in_progress} onToggle={() => toggleSection("in_progress")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} savingTaskId={savingTaskId} />
                <TaskGroup label="Done" tasks={done} open={openSections.done} onToggle={() => toggleSection("done")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} savingTaskId={savingTaskId} />
              </>
            )}
          </div>

          {/* RIGHT — Calendar View */}
          <div style={{ ...card, overflow: "hidden" }}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #064e3b, #059669)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
              title="Calendar"
            />
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b", padding: "2px 6px" }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                {new Date(calYear, calMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b", padding: "2px 6px" }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {calDays.map((cell, i) => {
                const isToday = cell.date === today;
                const isSelected = cell.date === filterDate;
                const dot = cell.date ? getDotColor(cell.date) : null;
                return (
                  <div key={i}
                    onClick={() => { if (cell.inMonth && cell.date) setFilterDate(filterDate === cell.date ? null : cell.date); }}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: cell.inMonth ? "pointer" : "default",
                      background: isToday ? "#059669" : isSelected ? "#d1fae5" : "transparent",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: isToday ? 700 : 400,
                      color: isToday ? "white" : cell.inMonth ? "#1e293b" : "#cbd5e1",
                    }}>{cell.day}</span>
                    {dot && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "white" : dot, marginTop: 1 }} />}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 8, borderTop: "1px solid #d1fae5" }}>
              {[{ label: "High", color: "#ef4444" }, { label: "Med", color: "#f59e0b" }, { label: "Low", color: "#16a34a" }, { label: "Done", color: "#94a3b8" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#94a3b8" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PART 6: Team Progress Today (rp/manager only) ── */}
        {canAssign && teamProgress.length > 0 && (
          <div style={{ ...card, marginTop: 14, padding: 0, overflow: "hidden" }}>
            <DashCardHeader
              gradient="linear-gradient(90deg, #064e3b, #059669)"
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              title="Team Progress Today"
            />
            <div style={{ padding: "10px 16px" }}>
              {teamProgress.map((staff, i) => {
                const pct = Math.round((staff.done / staff.total) * 100);
                return (
                  <div key={staff.initials} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                    borderBottom: i < teamProgress.length - 1 ? "1px solid #f0fdf4" : "none",
                  }}>
                    <Avatar name={staff.name} size={28} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", width: 130, flexShrink: 0 }}>{staff.name}</span>
                    <div style={{ flex: 1, height: 6, background: "#f0fdf4", borderRadius: 3 }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 3, transition: "width 0.3s",
                        background: pct === 100 ? "#16a34a" : pct > 0 ? "#f59e0b" : "#ef4444",
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", fontFamily: "'DM Mono', monospace", width: 32, textAlign: "right" }}>{pct}%</span>
                    {staff.done === staff.total ? (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", whiteSpace: "nowrap" }}>✓ Complete</span>
                    ) : staff.done === 0 ? (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", whiteSpace: "nowrap" }}>Not started</span>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", whiteSpace: "nowrap" }}>{staff.done}/{staff.total} done</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FAB (rp/manager only) ── */}
      {canAssign && (
        <button onClick={() => setModalOpen(true)} style={{
          position: "fixed", bottom: 24, right: 24, background: "#059669", color: "white",
          borderRadius: 99, padding: "10px 20px", fontSize: 13, fontWeight: 600,
          border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.4)",
          fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
          zIndex: 50,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          Assign Task
        </button>
      )}

      {/* ── Assign Modal ── */}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 16, padding: 24, width: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Assign Task</div>

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Task title *</label>
              <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Enter task title…" style={inputStyle} />
            </div>

            {/* Assign to */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Assign to *</label>
              <select value={mAssignTo} onChange={e => setMAssignTo(e.target.value)} style={inputStyle}>
                {STAFF_ASSIGNEES.map(s => <option key={s.initials} value={s.initials}>{s.initials} — {s.name}</option>)}
              </select>
            </div>

            {/* Priority segmented */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Priority *</label>
              <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #d1fae5" }}>
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setMPriority(p)} style={{
                    flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                    background: mPriority === p ? "#059669" : "white",
                    color: mPriority === p ? "white" : "#64748b",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Category</label>
              <select value={mCategory} onChange={e => setMCategory(e.target.value)} style={inputStyle}>
                <option value="">None</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Due date */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Due date</label>
              <input type="date" value={mDueDate} onChange={e => setMDueDate(e.target.value)} style={inputStyle} />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4, display: "block" }}>Notes</label>
              <textarea value={mNotes} onChange={e => setMNotes(e.target.value)} placeholder="Optional notes…" rows={2}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setModalOpen(false)} style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "1px solid #d1fae5", background: "white", color: "#64748b",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>Cancel</button>
              <button onClick={handleAssignTask} disabled={!mTitle.trim()} style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none",
                background: mTitle.trim() ? "#059669" : "#d1d5db", color: "white",
                cursor: mTitle.trim() ? "pointer" : "default", fontFamily: "'DM Sans', sans-serif",
              }}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Task Group (collapsible section) ──────────────────────────────────────

function TaskGroup({ label, tasks, open, onToggle, today, canModifyTask, onStatusChange, savingTaskId }) {
  if (tasks.length === 0) return null;
  const statusKey = label.toLowerCase().replace(/ /g, "_");
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={onToggle} style={{
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        padding: "6px 0", userSelect: "none",
      }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8" style={{ transition: "transform 0.15s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
          <path d="M2 1l4 3-4 3z"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20,
          background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0",
        }}>{tasks.length}</span>
      </div>
      {open && tasks.map(task => (
        <TaskCard key={task.id} task={task} today={today} canModify={canModifyTask(task)} onStatusChange={onStatusChange} savingTaskId={savingTaskId} />
      ))}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────

function TaskCard({ task, today, canModify, onStatusChange, savingTaskId }) {
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== "done";
  const isDone = task.status === "done";
  const isSaving = savingTaskId === task.id;

  // PART 3: Due date pill renderer
  function renderDueDate() {
    if (!task.dueDate) return null;
    if (task.dueDate === today && task.status !== "done") {
      return <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>Due today</span>;
    }
    if (task.dueDate < today && task.status !== "done") {
      const days = Math.floor((new Date(today + "T00:00:00") - new Date(task.dueDate + "T00:00:00")) / (1000 * 60 * 60 * 24));
      return <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{days}d overdue</span>;
    }
    return (
      <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "#94a3b8" }}>
        {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
      </span>
    );
  }

  return (
    <div style={{
      background: "white", borderRadius: 10, padding: "12px 14px", marginBottom: 6,
      border: `1px solid ${isOverdue ? "#fecaca" : "#d1fae5"}`,
      boxShadow: "0 1px 4px rgba(5,150,105,0.06)",
      opacity: isDone ? 0.6 : 1,
      position: "relative", overflow: "hidden",
    }}>
      {/* Overdue accent bar */}
      {isOverdue && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#ef4444", borderRadius: "10px 0 0 10px" }} />
      )}

      {/* Row 1: priority + category + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: isOverdue ? 6 : 0 }}>
        <PriorityBadge level={task.priority} />
        {task.category && <CategoryTag label={task.category} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", textDecoration: isDone ? "line-through" : "none" }}>{task.title}</span>
      </div>

      {/* Row 2: assigned by → assigned to */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4, fontSize: 10, color: "#94a3b8", paddingLeft: isOverdue ? 6 : 0 }}>
        <Avatar name={initialsToName(task.assignedBy)} size={18} />
        <span>{initialsToName(task.assignedBy)}</span>
        <span style={{ color: "#cbd5e1" }}>→</span>
        <Avatar name={initialsToName(task.assignedTo)} size={18} />
        <span>{initialsToName(task.assignedTo)}</span>
      </div>

      {/* Row 3: due date pill + notes */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: isOverdue ? 6 : 0 }}>
        {renderDueDate()}
        {task.notes && (
          <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {task.notes}
          </span>
        )}
      </div>

      {/* Row 4: status buttons with spinner */}
      <div style={{ display: "flex", gap: 4, paddingLeft: isOverdue ? 6 : 0 }}>
        {STATUSES.map(s => {
          const label = s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);
          const isActive = task.status === s;
          return (
            <button key={s} onClick={() => canModify && !isSaving && onStatusChange(task.id, s)} disabled={!canModify || isSaving} style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
              border: isActive ? "none" : "1px solid #d1fae5",
              background: isActive ? "#059669" : "white",
              color: isActive ? "white" : "#64748b",
              cursor: canModify && !isSaving ? "pointer" : "default",
              fontFamily: "'DM Sans', sans-serif",
              opacity: canModify ? 1 : 0.5,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>
              {isSaving && isActive && <span style={{
                width: 8, height: 8, border: "1.5px solid currentColor", borderTopColor: "transparent",
                borderRadius: "50%", animation: "taskSpin 0.6s linear infinite", display: "inline-block", flexShrink: 0,
              }} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
