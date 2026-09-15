import { X } from "lucide-react";

export default function MediaLightbox({ item, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1150,
        background: "rgba(0,0,0,0.9)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.15)", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={18} />
      </button>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.media_type === "video" ? (
          <video src={item.media_url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        ) : (
          <img src={item.media_url} alt="" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        )}
      </div>
      <div style={{ marginTop: 12, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
        {item.uploader_name}
      </div>
    </div>
  );
}
