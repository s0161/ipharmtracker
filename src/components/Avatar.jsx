import { getStaffInitials, getStaffColor } from "../utils/rotationManager";

export default function Avatar({ name, size = 24 }) {
  const initials = getStaffInitials(name);
  const bg = getStaffColor(name);
  return (
    <div title={name || initials} style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>{initials}</div>
  );
}
