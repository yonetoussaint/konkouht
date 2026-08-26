// Shared header row for the home-preview sections (Participants, Médias,
// Donateurs, Live) — one component so the icon/label/action treatment can't
// drift between hand-rolled copies of the same row.
export default function PreviewSectionHeader({ icon, label, accent, actionLabel = "Voir plus", onAction, right, marginBottom = 4, paddingX = 10 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom, paddingLeft: paddingX, paddingRight: paddingX,
    }}>
      <span style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
        color: "#7a7a7a", textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {icon}{label}
      </span>
      {onAction ? (
        <button
          onClick={onAction}
          style={{
            border: "none", background: "none", color: accent,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {actionLabel}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
          </svg>
        </button>
      ) : right || null}
    </div>
  );
}
