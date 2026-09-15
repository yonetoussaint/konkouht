import { useState } from "react";
import { ChevronLeft, Hand, Volume2, VolumeX } from "lucide-react";
import { hashStr } from "../App";
import RoomAvatar from "./RoomAvatar";

export default function CommentaryStreamSheet({ comp, commentator, coSpeakers, accent, muted, onToggleMute, onClose }) {
  const [requestSent, setRequestSent] = useState(false);
  const baseSeed = Math.abs(hashStr(comp.id));
  const listenerCount = 40 + (baseSeed % 900);
  const listenerFaces = Array.from({ length: 6 }, (_, i) => (baseSeed + i * 13) % 60);
  const speakers = [
    { name: commentator.name, role: "Hôte", index: baseSeed % 40, speaking: true },
    ...coSpeakers.map((s, i) => ({ name: s.name, role: "Intervenant", index: (baseSeed + (i + 1) * 9) % 40, speaking: i === 0 })),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#111",
          borderTop: "1px solid #2a2a2a",
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 18px 12px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 800, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Salle audio en direct
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Réduire"
            style={{
              width: 26, height: 26, border: "none", background: "#1c1c1c", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={14} color="#999" style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>

        <div style={{ padding: "0 18px 22px", overflowY: "auto" }}>
          {/* Speakers grid */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            À l'antenne · {speakers.length}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {speakers.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64 }}>
                <RoomAvatar name={s.name} size={56} speaking={s.speaking} ring={accent} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {s.name.split(" ")[0]}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#777" }}>{s.role}</div>
              </div>
            ))}
          </div>

          {/* Listeners */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 22, paddingTop: 16, borderTop: "1px solid #222",
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {listenerFaces.map((idx, i) => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid #111", borderRadius: "50%" }}>
                  <RoomAvatar name="" size={26} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>
              {listenerCount} auditeurs
            </div>
          </div>

          {/* Description */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#bbb", lineHeight: 1.5, marginTop: 16 }}>
            Suivez le commentaire audio en direct de cette compétition — analyses, moments forts et ambiance, commentés en temps réel.
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setRequestSent(true)}
              disabled={requestSent}
              style={{
                flex: 1, height: 44, borderRadius: 22, border: "1px solid #333",
                background: requestSent ? "#1c1c1c" : accent,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: requestSent ? "default" : "pointer",
              }}
            >
              <Hand size={16} color={requestSent ? "#888" : "#111"} strokeWidth={2.2} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: requestSent ? "#888" : "#111" }}>
                {requestSent ? "Demande envoyée" : "Demander à parler"}
              </span>
            </button>
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              style={{
                width: 44, height: 44, borderRadius: 22, border: "1px solid #333",
                background: muted ? "#1c1c1c" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {muted ? <VolumeX size={16} color="#fff" strokeWidth={2.2} /> : <Volume2 size={16} color="#111" strokeWidth={2.2} />}
            </button>
          </div>

          {/* Leave */}
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              marginTop: 14, padding: "8px 0",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#e74c3c",
            }}
          >
            Quitter la salle
          </button>
        </div>
      </div>
    </div>
  );
}
