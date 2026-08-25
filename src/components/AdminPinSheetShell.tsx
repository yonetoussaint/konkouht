// ─── AdminPinSheetShell ───────────────────────────────────────────────────
// Bottom-sheet wrapper used by the admin PIN setup and withdrawal flows.

import { X } from "lucide-react";

export default function AdminPinSheetShell({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1500,
        background: "rgba(17,17,17,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#1c1c1f",
          borderTop: "2px solid #2a2a2e", padding: 16,
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #2a2a2e" }}>
          <span style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {title}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#f2f2f2", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}