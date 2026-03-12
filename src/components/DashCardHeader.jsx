const ACCENT = {
  em: 'var(--em)', warn: 'var(--amber)', crit: 'var(--red)',
  info: 'var(--blue)', blue: 'var(--blue)', muted: 'var(--ec-t3)',
  hero: 'var(--em)', teal: 'var(--em)', purple: 'var(--purple)',
};

export default function DashCardHeader({ variant, icon, title, right }) {
  const accent = variant ? ACCENT[variant] : 'var(--em)';
  return (
    <div style={{
      margin: "-14px -16px 12px", padding: "9px 16px",
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      borderLeft: `3px solid ${accent}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text)", fontSize: 13, fontWeight: 700 }}>
        <span>{icon}</span>{title}
      </div>
      {right && <div style={{ color: "var(--text-2)" }}>{right}</div>}
    </div>
  );
}
