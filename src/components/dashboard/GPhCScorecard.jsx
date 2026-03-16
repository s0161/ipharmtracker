import { useState } from "react";
import { useGPhCScores, getScoreColor } from "../../hooks/useGPhCScores";

const MONO = "'DM Mono', 'SF Mono', monospace";

const SvgShield = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SvgChevron = ({ size = 12, color = "currentColor", down }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: down ? "rotate(90deg)" : "rotate(0)" }}>
    <path d="M6 4l4 4-4 4" />
  </svg>
);

const THRESHOLDS = [
  { label: "80+ Ready", color: "#10b981" },
  { label: "60+ Mostly", color: "#f59e0b" },
  { label: "40+ Attention", color: "#f97316" },
  { label: "<40 At Risk", color: "#ef4444" },
];

export default function GPhCScorecard() {
  const { standards, overall, loading } = useGPhCScores();
  const [expanded, setExpanded] = useState(null);

  const card = {
    background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "14px 16px",
    border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden",
  };

  if (loading) {
    return (
      <div style={card}>
        <div style={{
          margin: "-14px -16px 12px", padding: "9px 16px",
          background: "linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #065f46 100%)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 13, fontWeight: 700 }}>
            <SvgShield size={14} color="#6ee7b7" /> GPhC Readiness
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>…</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--ec-t3)", textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>
          Loading scores…
        </div>
      </div>
    );
  }

  const ratingColor = getScoreColor(overall.score);

  return (
    <div style={card}>
      <div style={{
        margin: "-14px -16px 12px", padding: "9px 16px",
        background: "linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #065f46 100%)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#fff", fontSize: 13, fontWeight: 700 }}>
          <SvgShield size={14} color="#6ee7b7" /> GPhC Readiness
        </div>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#6ee7b7" }}>{overall.score}%</span>
      </div>

      {/* Overall rating pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 10px",
          borderRadius: 99, color: "#fff", background: ratingColor, letterSpacing: 0.3,
        }}>
          {overall.rating}
        </span>
        <span style={{ fontSize: 10, color: "var(--ec-t3)" }}>across 5 GPhC standards</span>
      </div>

      {/* Standard rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {standards.map((std) => {
          const color = getScoreColor(std.score);
          const isOpen = expanded === std.id;
          return (
            <div key={std.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : std.id)}
                style={{
                  width: "100%", background: "none", border: "none", cursor: "pointer",
                  padding: "6px 4px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ec-hover, rgba(0,0,0,0.03))")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {/* Number badge */}
                <span style={{
                  width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
                  background: color + "18", color,
                }}>
                  {std.id}
                </span>

                {/* Name + bar */}
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ec-t1)", marginBottom: 3 }}>
                    {std.name}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--ec-div, #e2e8f0)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2, background: color,
                      width: `${std.score}%`, transition: "width 0.4s ease",
                    }} />
                  </div>
                </div>

                {/* Score */}
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color, minWidth: 32, textAlign: "right" }}>
                  {std.score}%
                </span>

                <SvgChevron size={10} color="var(--ec-t3)" down={isOpen} />
              </button>

              {/* Expanded metrics */}
              {isOpen && (
                <div style={{
                  padding: "4px 8px 8px 36px", display: "flex", flexDirection: "column", gap: 3,
                  animation: "fadeIn 0.15s ease",
                }}>
                  <div style={{ fontSize: 9, color: "var(--ec-t3)", marginBottom: 2, fontStyle: "italic" }}>
                    {std.subtitle}
                  </div>
                  {std.metrics.map((m, i) => {
                    const mColor = getScoreColor((m.earned / Math.max(m.max, 1)) * 100);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%", background: mColor, flexShrink: 0,
                        }} />
                        <span style={{ flex: 1, color: "var(--ec-t2)" }}>{m.name}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--ec-t2)" }}>
                          {m.earned}/{m.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Threshold legend */}
      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--ec-div)",
        display: "flex", flexWrap: "wrap", gap: 8, fontSize: 9, color: "var(--ec-t3)",
      }}>
        {THRESHOLDS.map((t) => (
          <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
