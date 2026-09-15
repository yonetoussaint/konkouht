import { Audio as AudioBarsLoader } from "react-loader-spinner";

export default function RoomAvatar({ name, size = 56, speaking = false, ring, badge }) {
  const initials = (name || "").trim() ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: speaking ? `2px solid ${ring || "#2ecc71"}` : "2px solid transparent",
        boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", height: "100%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: size * 0.32, fontWeight: 700, color: "#fff" }}>{initials}</span>
        </div>
      </div>
      {badge}
      {speaking && (
        <div style={{
          position: "absolute", bottom: -3, right: -3,
          width: 20, height: 20, borderRadius: "50%", background: "#111",
          border: "2px solid #111",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AudioBarsLoader height="11" width="11" color="#2ecc71" ariaLabel="parle" visible={true} />
        </div>
      )}
    </div>
  );
}

