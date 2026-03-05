export default function CategoryTag({ label }) {
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
