export default function EntityAvatar({ url, name, bg = "#242424", color = "#9a9a9a" }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || "Avatar"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
    );
  }
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.9em",
        fontWeight: 700,
        fontFamily: "Inter, sans-serif",
        userSelect: "none",
      }}
    >
      {initials}
    </div>
  );
}
