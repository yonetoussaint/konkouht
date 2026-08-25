// ─── PinField ─────────────────────────────────────────────────────────────
// Numeric PIN input used across the admin/withdrawal flows.

export default function PinField({ value, onChange, autoFocus, error, placeholder = "••••" }) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoFocus={autoFocus}
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1px solid ${error ? "#E74C3C" : "#ddd"}`,
        padding: "14px 14px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "0.4em",
        textAlign: "center",
        color: "#f2f2f2",
        outline: "none",
        boxSizing: "border-box",
        marginBottom: 10,
      }}
    />
  );
}