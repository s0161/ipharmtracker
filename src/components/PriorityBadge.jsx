export default function PriorityBadge({ level }) {
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
