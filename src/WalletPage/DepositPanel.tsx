import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function DepositPanel({ onClose }) {
  const [entered, setEntered] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setEntered(false);
    setTimeout(() => onClose?.(), 200);
  }

  const methods = [
    {
      key: "moncash",
      label: "MonCash",
      color: "#e63946",
    },
    {
      key: "natcash",
      label: "NatCash",
      color: "#2a9d8f",
    },
  ];

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: `rgba(0,0,0,${entered ? 0.55 : 0})`,
        transition: "background 0.2s ease",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1c1c1f",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 12px",
            borderBottom: "1px solid #2a2a2e",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "#f2f2f2",
            }}
          >
            Dépôt
          </span>
          <button
            onClick={handleClose}
            style={{
              border: "none",
              background: "#2a2a2e",
              borderRadius: 0,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#8a8a90" />
          </button>
        </div>

        {/* Amount input */}
        <div style={{ padding: "20px 16px 16px" }}>
          <label
            style={{
              display: "block",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#8a8a90",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Montant à déposer
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                flex: 1,
                background: "#111",
                border: "1px solid #2a2a2e",
                borderRadius: 0,
                padding: "12px 14px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 20,
                fontWeight: 600,
                color: "#f2f2f2",
                outline: "none",
              }}
            />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#8a8a90",
              }}
            >
              HTG
            </span>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ padding: "0 16px 24px" }}>
          <label
            style={{
              display: "block",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#8a8a90",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Moyen de paiement
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {methods.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setSelectedMethod(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  background: selectedMethod === key ? "#111" : "transparent",
                  border: `1px solid ${selectedMethod === key ? color : "#2a2a2e"}`,
                  borderRadius: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 0,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  {label === "MonCash" ? "MC" : "NC"}
                </div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f2f2f2",
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    marginLeft: "auto",
                    width: 18,
                    height: 18,
                    borderRadius: 0,
                    border: `2px solid ${selectedMethod === key ? color : "#3a3a3e"}`,
                    background: selectedMethod === key ? color : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedMethod === key && (
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div style={{ padding: "0 16px 24px" }}>
          <button
            disabled={!amount || !selectedMethod}
            style={{
              width: "100%",
              padding: "14px",
              background: amount && selectedMethod ? "#0ecb81" : "#2a2a2e",
              border: "none",
              borderRadius: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: amount && selectedMethod ? "#111" : "#5a5a5e",
              cursor: amount && selectedMethod ? "pointer" : "default",
            }}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
