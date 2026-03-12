const GRAD = {
  em: 'var(--ec-grad-em)', warn: 'var(--ec-grad-warn)', crit: 'var(--ec-grad-crit)',
  info: 'var(--ec-grad-info)', blue: 'var(--ec-grad-blue)', muted: 'var(--ec-grad-muted)',
  hero: 'var(--ec-grad-hero)', teal: 'var(--ec-grad-teal)', purple: 'var(--ec-grad-purple)',
};

export default function DashCardHeader({ variant, gradient, icon, title, right }) {
  const bg = variant ? GRAD[variant] : gradient;
  return (
    <div style={{
      margin: "-14px -16px 12px", padding: "9px 16px",
      background: bg, display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "white", fontSize: 13, fontWeight: 700 }}>
        <span>{icon}</span>{title}
      </div>
      {right && <div style={{ color: "rgba(255,255,255,0.9)" }}>{right}</div>}
    </div>
  );
}
