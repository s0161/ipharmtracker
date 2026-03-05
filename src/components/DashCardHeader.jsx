export default function DashCardHeader({ gradient, icon, title, right }) {
  return (
    <div style={{
      margin: "-14px -16px 12px", padding: "9px 16px",
      background: gradient, display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "white", fontSize: 13, fontWeight: 700 }}>
        <span>{icon}</span>{title}
      </div>
      {right && <div style={{ color: "rgba(255,255,255,0.9)" }}>{right}</div>}
    </div>
  );
}
