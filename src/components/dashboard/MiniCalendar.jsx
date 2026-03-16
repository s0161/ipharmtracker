import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useComplianceCalendar } from "../../hooks/useComplianceCalendar";
import DashCardHeader from "../DashCardHeader";

export default function MiniCalendar() {
  const { events, loading } = useComplianceCalendar();
  const navigate = useNavigate();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  // Build month grid
  const { dayHeaders, cells } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0 ... Sunday = 6
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;

    const cells = [];
    // Empty cells before month starts
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return {
      dayHeaders: ["M", "T", "W", "T", "F", "S", "S"],
      cells,
    };
  }, [year, month]);

  // Group events by date, determine dot colour per day
  const dotMap = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!ev.date) continue;
      const d = ev.date;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const existing = map[day];
      // Priority: red > amber > green
      if (ev.status === "overdue") {
        map[day] = "red";
      } else if ((ev.status === "due_soon" || ev.status === "due_today") && existing !== "red") {
        map[day] = "amber";
      } else if (ev.status === "done" && !existing) {
        map[day] = "green";
      }
    }
    return map;
  }, [events, year, month]);

  const dotColorMap = { red: "#ef4444", amber: "#f59e0b", green: "#10b981" };

  // Next 2 upcoming events (not done, date >= today)
  const upcoming = useMemo(() => {
    const today = new Date(year, month, todayDate);
    return events
      .filter(ev => ev.date >= today && ev.status !== "done")
      .slice(0, 2);
  }, [events, year, month, todayDate]);

  const monthName = new Date(year, month).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const card = {
    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "14px 16px",
    border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)",
  };

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <DashCardHeader
        variant="warn"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
        title="Upcoming"
        right={
          <span
            onClick={() => navigate("/calendar")}
            style={{ fontSize: 10, fontWeight: 600, color: "var(--ec-em)", cursor: "pointer" }}
          >
            View Calendar →
          </span>
        }
      />

      {loading ? (
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 11, color: "var(--ec-t3)" }}>Loading…</div>
        </div>
      ) : (
        <>
          {/* Month label */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ec-t1)", marginBottom: 8, textAlign: "center" }}>
            {monthName}
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 4 }}>
            {dayHeaders.map((h, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: "var(--ec-t3)", textTransform: "uppercase", padding: "2px 0" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const isToday = day === todayDate;
              const dot = dotMap[day];
              return (
                <div key={day} style={{
                  textAlign: "center", padding: "3px 0", borderRadius: 4,
                  background: isToday ? "#ecfdf5" : "transparent",
                  border: isToday ? "1px solid #10b981" : "1px solid transparent",
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#059669" : "var(--ec-t2)",
                    fontFamily: "'DM Mono', 'SF Mono', monospace",
                  }}>
                    {day}
                  </div>
                  {dot && (
                    <div style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: dotColorMap[dot],
                      margin: "1px auto 0",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--ec-div)" }}>
              {upcoming.map(ev => (
                <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: dotColorMap[ev.colour] || "var(--ec-t3)",
                  }} />
                  <div style={{
                    flex: 1, fontSize: 10, color: "var(--ec-t1)", fontWeight: 500,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {ev.title}
                  </div>
                  <span style={{
                    fontSize: 9, color: "var(--ec-t3)", fontFamily: "'DM Mono', 'SF Mono', monospace", flexShrink: 0,
                  }}>
                    {ev.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
