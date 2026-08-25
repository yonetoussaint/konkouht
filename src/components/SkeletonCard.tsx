// ─── SkeletonCard ─────────────────────────────────────────────────────────
// Loading placeholder card shown while the home feed fetches data.

export default function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 272, border: "1px solid #2a2a2e", borderRadius: 18, overflow: "hidden", background: "#1c1c1f" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; }
      `}</style>
      <div className="sk" style={{ height: 132 }} />
      <div style={{ display: "flex", gap: 8, padding: "9px 12px" }}>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "60%" }} /></div>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "70%" }} /></div>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "50%" }} /></div>
      </div>
      <div className="sk" style={{ height: 40 }} />
    </div>
  );
}