const ACCENT = {
  em: '#10b981', warn: '#f59e0b', crit: '#ef4444',
  info: '#0073e6', blue: '#0073e6', muted: 'var(--ec-t3)',
  hero: '#10b981', teal: '#10b981', purple: '#635bff',
};

export default function DashCardHeader({ variant, icon, title, right }) {
  const accent = variant ? ACCENT[variant] : '#10b981';
  return (
    <div style={{
      margin: "-14px -16px 12px", padding: "9px 16px",
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      borderLeft: `4px solid ${accent}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text)", fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: accent }}>{icon}</span>{title}
      </div>
      {right && <div style={{ color: "var(--text-2)" }}>{right}</div>}
    </div>
  );
}
