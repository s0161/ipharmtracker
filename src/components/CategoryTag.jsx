export default function CategoryTag({ label }) {
  const cfg = {
    "Cleaning":   { bg: "var(--ec-info-bg)", color: "var(--ec-info)", border: "var(--ec-info-border)" },
    "RP Check":   { bg: "var(--ec-cat-purple-bg)", color: "var(--ec-cat-purple)", border: "var(--ec-cat-purple-border)" },
    "CD Check":   { bg: "var(--ec-warn-bg)", color: "var(--ec-warn)", border: "var(--ec-warn-border)" },
    "Compliance": { bg: "var(--ec-em-bg)", color: "var(--ec-em)", border: "var(--ec-em-border)" },
    "H&S":        { bg: "var(--ec-warn-bg)", color: "var(--ec-warn)", border: "var(--ec-warn-border)" },
    "Waste":      { bg: "var(--ec-card)", color: "var(--ec-t1)", border: "var(--ec-t5)" },
  }[label] || { bg: "var(--ec-card)", color: "var(--ec-t1)", border: "var(--ec-t5)" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>{label}</span>
  );
}
