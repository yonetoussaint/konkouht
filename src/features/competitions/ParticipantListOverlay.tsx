import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import EntityAvatar from "./EntityAvatar";

export default function ParticipantListOverlay({ comp, participants, onClose }) {
  const accent = comp.accent;
  const ranked = participants || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#242424", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#1a1a1a",
          borderBottom: "1px solid #2a2a2a",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#c4c4c4", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #2a2a2a", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#7a7a7a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#7a7a7a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Participant</span>
          <span style={{ width: 90, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#7a7a7a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Votes</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#7a7a7a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points</span>
        </div>

        {ranked.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#7a7a7a" }}>
            Aucun participant pour le moment.
          </div>
        ) : ranked.map((p, rank) => (
          <div
            key={p.id ?? p.index}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #2a2a2a",
            }}
          >
            <span
              style={{
                width: 32,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: rank < 3 ? accent : "#7a7a7a",
              }}
            >
              {rank + 1}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0, overflow: "hidden",
                  border: "1px solid #2a2a2a",
                }}>
                <EntityAvatar url={p.avatarUrl} name={p.name} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#c4c4c4", fontWeight: 600 }}>{p.name}</span>
            </div>
            <span style={{ width: 90, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#c4c4c4" }}>
              {p.votes?.toLocaleString("fr-FR")}
            </span>
            <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#7a7a7a" }}>
              {p.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
