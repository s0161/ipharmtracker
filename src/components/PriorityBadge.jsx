export default function PriorityBadge({ level }) {
  const cfg = {
    HIGH: { bg: "var(--ec-crit-bg)", color: "var(--ec-crit)", border: "var(--ec-crit-border)" },
    MED:  { bg: "var(--ec-warn-bg)", color: "var(--ec-warn)", border: "var(--ec-warn-border)" },
    LOW:  { bg: "var(--ec-em-bg)", color: "var(--ec-em)", border: "var(--ec-em-border)" },
  }[level] || { bg: "var(--ec-card)", color: "var(--ec-t2)", border: "var(--ec-t5)" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.05em", fontFamily: "'DM Mono', monospace",
    }}>{level}</span>
  );
}
