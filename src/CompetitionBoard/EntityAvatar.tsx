export default function EntityAvatar({ url, name, bg = "#ddd", color = "#666" }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || ""}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: "100%", height: "100%",
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}
