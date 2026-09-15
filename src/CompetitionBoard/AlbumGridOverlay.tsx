import { ArrowLeft } from "lucide-react";

export default function AlbumGridOverlay({ items, onClose, onOpenItem }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky", top: 0, background: "#fff",
          borderBottom: "1px solid #e0e0e0", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111" }}>
          Médias des participants
        </span>
      </div>

      <div style={{
        maxWidth: 800, margin: "0 auto", padding: 12,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onOpenItem(item)} style={{ position: "relative", cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
            {item.media_type === "video" ? (
              <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
            ) : (
              <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.uploader_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
