import { Plus, X } from "lucide-react";

export default function AlbumSheet({ accent, uploads = [], uploading = false, onUpload, onClose }) {
  const subtitle = `${uploads.length} média${uploads.length > 1 ? "s" : ""} envoyé${uploads.length > 1 ? "s" : ""}`;
  const statusLabel = { pending: "En attente", approved: "Approuvé", rejected: "Rejeté" };
  const statusColor = { pending: "#e74c3c", approved: "#27ae60", rejected: "#999" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#fff",
          borderTop: `2px solid #111`,
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #e0e0e0",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              Mon album
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          overflowY: "auto",
          padding: "16px 16px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{
            background: "#faf9f7", border: "1px solid #eee",
            padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12,
            color: "#777", lineHeight: 1.6,
          }}>
            Ajoutez vos propres photos ou vidéos — elles seront visibles publiquement une fois approuvées par l'organisateur.
          </div>

          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            border: `1.5px dashed ${accent}`, background: `${accent}0a`,
            padding: "14px 0", cursor: uploading ? "default" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload?.(f); e.target.value = ""; }}
              style={{ display: "none" }}
            />
            <Plus size={16} color={accent} strokeWidth={2.5} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: accent }}>
              {uploading ? "Envoi en cours…" : "Ajouter un média"}
            </span>
          </label>

          {uploads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
              Aucun média envoyé pour l'instant.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {uploads.map((u) => (
                <div key={u.id} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
                  {u.media_type === "video" ? (
                    <video src={u.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                  ) : (
                    <img src={u.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <span style={{
                    position: "absolute", top: 6, right: 6,
                    background: statusColor[u.status], color: "#fff",
                    fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                    padding: "2px 6px",
                  }}>
                    {statusLabel[u.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
