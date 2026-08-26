import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DateTimePills({ value, onChange, minDate }) {
  const date = value ? new Date(value) : null;
  const isMin = minDate ? (date && date.toISOString().slice(0, 16) <= minDate) : false;

  function adjust(days) {
    if (!date) return;
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    if (minDate && next.toISOString().slice(0, 16) < minDate) return;
    onChange(next.toISOString().slice(0, 16));
  }

  function setTime(hours, minutes) {
    if (!date) return;
    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    if (minDate && next.toISOString().slice(0, 16) < minDate) return;
    onChange(next.toISOString().slice(0, 16));
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button type="button" onClick={() => adjust(-1)} disabled={isMin} style={{
          border: "1px solid #3a3a3a", background: "#242424", color: isMin ? "#4a4a4a" : "#c4c4c4",
          width: 30, height: 32, borderRadius: 8, fontSize: 18, cursor: isMin ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronLeft size={15} />
        </button>
        <button type="button" onClick={() => adjust(1)} style={{
          border: "1px solid #3a3a3a", background: "#242424", color: "#c4c4c4",
          width: 30, height: 32, borderRadius: 8, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronRight size={15} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", border: "1px solid #3a3a3a", borderRadius: 8, overflow: "hidden" }}>
        <button type="button" onClick={() => setTime(9, 0)} style={{
          border: "none", background: "#242424", color: "#c4c4c4",
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "0 8px", height: 32, cursor: "pointer",
        }}>
          09:00
        </button>
        <button type="button" onClick={() => setTime(12, 0)} style={{
          border: "none", borderLeft: "1px solid #3a3a3a", background: "#242424", color: "#c4c4c4",
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "0 8px", height: 32, cursor: "pointer",
        }}>
          12:00
        </button>
        <button type="button" onClick={() => setTime(18, 0)} style={{
          border: "none", borderLeft: "1px solid #3a3a3a", background: "#242424", color: "#c4c4c4",
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "0 8px", height: 32, cursor: "pointer",
        }}>
          18:00
        </button>
        <button type="button" onClick={() => setTime(23, 59)} style={{
          border: "none", borderLeft: "1px solid #3a3a3a", background: "#242424", color: "#c4c4c4",
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "0 8px", height: 32, cursor: "pointer",
        }}>
          23:59
        </button>
      </div>
    </div>
  );
}
