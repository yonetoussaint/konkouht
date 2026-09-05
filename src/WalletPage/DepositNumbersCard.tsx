import { useState } from "react";
import { Plus, Copy, CheckCircle, Clock } from "lucide-react";
import { DEPOSIT_METHODS, PAYMENT_METHODS } from "../../App";
import type { User } from "./types";

interface DepositNumbersCardProps {
  currentUser: User | null;
  onUpdateNumber: (method: string, number: string) => Promise<void>;
  showToast?: (message: string) => void;
}

export default function DepositNumbersCard({
  currentUser,
  onUpdateNumber,
  showToast,
}: DepositNumbersCardProps) {
  const [method, setMethod] = useState("moncash");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const current = PAYMENT_METHODS.find((m) => m.id === method);
  const userNumber = method === "moncash" ? currentUser?.moncashNumber : currentUser?.natcashNumber;
  const isVerified = method === "moncash" ? currentUser?.moncashVerified : currentUser?.natcashVerified;

  function startEditing() {
    const local = (userNumber || "").replace(/\D/g, "").replace(/^509(?=\d{8}$)/, "");
    setInputValue(local);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setInputValue("");
  }

  async function handleSave() {
    const digitsOnly = inputValue.replace(/\D/g, "");
    if (!digitsOnly) return;
    setSaving(true);
    try {
      await onUpdateNumber(method, `+509${digitsOnly}`);
      showToast?.(`${current?.label} number saved`);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save mobile money number:", err);
      showToast?.(err?.message ? `Error: ${err.message}` : "Error saving number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #2b3139",
        background: "#181a1e",
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {DEPOSIT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMethod(m.id);
                setEditing(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: active ? `1px solid ${m.accent}` : "1px solid #2b3139",
                borderRadius: 8,
                background: active ? m.accent : "transparent",
                color: active ? "#fff" : "#848e9c",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "rgba(255,255,255,0.2)" : m.accent,
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.label.charAt(0)}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#848e9c",
          marginBottom: 8,
        }}
      >
        Your {current?.label} number
      </div>

      {editing ? (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #2b3139",
              borderRadius: 8,
              marginBottom: 12,
              overflow: "hidden",
              background: "#1e2329",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "10px 12px",
                background: "#2b3139",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#eaecef",
              }}
            >
              +509
            </div>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="XX XX XX XX"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                padding: "10px 12px",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "#eaecef",
                background: "transparent",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || inputValue.length !== 8}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 8,
                background: "#f0b90b",
                color: "#181a1e",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 0",
                cursor: saving || inputValue.length !== 8 ? "default" : "pointer",
                opacity: saving || inputValue.length !== 8 ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #2b3139",
                borderRadius: 8,
                background: "transparent",
                color: "#848e9c",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {userNumber ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#eaecef",
                  }}
                >
                  {userNumber}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    padding: "2px 10px",
                    borderRadius: 4,
                    background: isVerified ? "rgba(14, 203, 129, 0.15)" : "rgba(240, 185, 11, 0.15)",
                    color: isVerified ? "#0ecb81" : "#f0b90b",
                  }}
                >
                  {isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#848e9c" }}>
                No {current?.label} number saved
              </div>
            )}
          </div>
          <button
            onClick={startEditing}
            style={{
              flexShrink: 0,
              border: "1px solid #2b3139",
              borderRadius: 8,
              background: "transparent",
              color: "#eaecef",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2b3139")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {userNumber ? <Copy size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            {userNumber ? "Edit" : "Add"}
          </button>
        </div>
      )}

      {!editing && (
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            color: "#848e9c",
            lineHeight: 1.6,
            marginTop: 12,
          }}
        >
          {userNumber
            ? isVerified
              ? `⚠ Your ${current?.label} deposits will only be accepted if they come from this number.`
              : `This number will be automatically verified after your first real ${current?.label} deposit.`
            : `Add your ${current?.label} number to start depositing with this method.`}
        </div>
      )}
    </div>
  );
}

export default DepositNumbersCard;