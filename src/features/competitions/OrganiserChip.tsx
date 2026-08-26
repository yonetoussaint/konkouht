// Small right-aligned "Par {organisateur}" chip for the À propos heading —
export default function OrganiserChip({ name, accent }) {
  if (!name) return null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
        background: accent, color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {(name || "?").trim().split(/\s+/)[0]?.charAt(0)?.toUpperCase() || "?"}
      </span>
      <span style={{
        fontFamily: "Inter, sans-serif", fontSize: 10.5, fontWeight: 700,
        color: "#7a7a7a",
      }}>
        Par {name}
      </span>
    </span>
  );
}
