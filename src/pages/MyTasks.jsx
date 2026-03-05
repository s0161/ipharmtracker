import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "../contexts/UserContext";
import { useSupabase } from "../hooks/useSupabase";
import { getStaffInitials, getRPAssignee } from "../utils/rotationManager";
import { generateId } from "../utils/helpers";
import DashCardHeader from "../components/DashCardHeader";
import Avatar from "../components/Avatar";
import PriorityBadge from "../components/PriorityBadge";
import CategoryTag from "../components/CategoryTag";

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
  const [staffTasks, setStaffTasks] = useSupabase("staff_tasks", []);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => todayStr(), [now]);
  const userInitials = getStaffInitials(user?.name || "");
  const isRP = user?.name === getRPAssignee();
  const canAssign = isRP || !!user?.isManager;

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

  // ── KPI chips ──
  const myTasks = canAssign ? allTasks : allTasks.filter(t => t.assignedTo === userInitials);
  const totalAssigned = myTasks.filter(t => t.status !== "done").length;
  const overdueCount = myTasks.filter(t => t.dueDate && t.dueDate < today && t.status !== "done").length;
  const dueTodayCount = myTasks.filter(t => t.dueDate === today && t.status !== "done").length;

  // ── Handlers ──
  function canModifyTask(task) {
    if (isRP || user?.isManager) return true;
    return task.assignedTo === userInitials;
  }

  function handleStatusChange(taskId, newStatus) {
    setStaffTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
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

  const tasksByDate = useMemo(() => {
    const map = {};
    (canAssign ? allTasks : allTasks.filter(t => t.assignedTo === userInitials))
      .filter(t => t.dueDate && t.status !== "done")
      .forEach(t => {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      });
    return map;
  }, [allTasks, canAssign, userInitials]);

  function getDotColor(date) {
    const tasks = tasksByDate[date];
    if (!tasks?.length) return null;
    if (tasks.some(t => t.priority === "HIGH" || (t.dueDate < today))) return "#ef4444";
    if (tasks.some(t => t.priority === "MED")) return "#f59e0b";
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
              /* Empty state */
              <div style={{ ...card, padding: "40px 20px", textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>All caught up!</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {filtersActive ? (
                    <>No tasks match your current filters. <button onClick={clearFilters} style={{ color: "#059669", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Clear filters</button></>
                  ) : "You have no tasks assigned right now."}
                </div>
              </div>
            ) : (
              <>
                <TaskGroup label="Pending" tasks={pending} open={openSections.pending} onToggle={() => toggleSection("pending")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} />
                <TaskGroup label="In Progress" tasks={inProgress} open={openSections.in_progress} onToggle={() => toggleSection("in_progress")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} />
                <TaskGroup label="Done" tasks={done} open={openSections.done} onToggle={() => toggleSection("done")}
                  today={today} canModifyTask={canModifyTask} onStatusChange={handleStatusChange} />
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
              {[{ label: "High", color: "#ef4444" }, { label: "Med", color: "#f59e0b" }, { label: "Low", color: "#16a34a" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#94a3b8" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </div>
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

function TaskGroup({ label, tasks, open, onToggle, today, canModifyTask, onStatusChange }) {
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
        <TaskCard key={task.id} task={task} today={today} canModify={canModifyTask(task)} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────

function TaskCard({ task, today, canModify, onStatusChange }) {
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== "done";
  const isDone = task.status === "done";

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

      {/* Row 3: due date + notes */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: isOverdue ? 6 : 0 }}>
        {task.dueDate && (
          <span style={{
            fontSize: 10, fontFamily: "'DM Mono', monospace",
            color: isOverdue ? "#dc2626" : "#94a3b8",
          }}>
            {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
        )}
        {task.notes && (
          <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {task.notes}
          </span>
        )}
      </div>

      {/* Row 4: status buttons */}
      <div style={{ display: "flex", gap: 4, paddingLeft: isOverdue ? 6 : 0 }}>
        {STATUSES.map(s => {
          const label = s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);
          const isActive = task.status === s;
          return (
            <button key={s} onClick={() => canModify && onStatusChange(task.id, s)} disabled={!canModify} style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
              border: isActive ? "none" : "1px solid #d1fae5",
              background: isActive ? "#059669" : "white",
              color: isActive ? "white" : "#64748b",
              cursor: canModify ? "pointer" : "default",
              fontFamily: "'DM Sans', sans-serif",
              opacity: canModify ? 1 : 0.5,
            }}>{label}</button>
          );
        })}
      </div>
    </div>
  );
}
