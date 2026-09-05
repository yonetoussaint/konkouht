import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";

interface BalanceCardProps {
  balance: number;
  dayChange: number;
  dayChangePct: number;
  showBalance: boolean;
  onToggleBalance: () => void;
}

export default function BalanceCard({
  balance,
  dayChange,
  dayChangePct,
  showBalance,
  onToggleBalance,
}: BalanceCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e2329 0%, #181a1e 100%)",
        border: "1px solid #2b3139",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(240, 185, 11, 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#848e9c",
          }}
        >
          Total Balance
        </span>
        <button
          onClick={onToggleBalance}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "#848e9c",
            padding: 4,
            display: "flex",
          }}
        >
          {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 32,
            fontWeight: 700,
            color: "#eaecef",
            letterSpacing: "-0.02em",
          }}
        >
          {showBalance ? balance.toLocaleString("fr-FR") : "••••••"}
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#848e9c",
          }}
        >
          HTG
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {dayChange >= 0 ? (
            <TrendingUp size={14} color="#0ecb81" />
          ) : (
            <TrendingDown size={14} color="#f6465d" />
          )}
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: dayChange >= 0 ? "#0ecb81" : "#f6465d",
            }}
          >
            {dayChange >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
            Today
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: "#2b3139" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
            24h Change
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: dayChange >= 0 ? "#0ecb81" : "#f6465d",
            }}
          >
            {dayChange >= 0 ? "+" : ""}{dayChange.toLocaleString("fr-FR")}
          </span>
        </div>
      </div>
    </div>
  );
}