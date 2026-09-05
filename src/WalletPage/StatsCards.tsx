import { ArrowDownLeft, Gift } from "lucide-react";

interface StatsCardsProps {
  totalDeposited: number;
  totalGifted: number;
}

export default function StatsCards({ totalDeposited, totalGifted }: StatsCardsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <div
        style={{
          border: "1px solid #2b3139",
          borderRadius: 12,
          padding: "14px 16px",
          background: "#1e2329",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <ArrowDownLeft size={14} color="#0ecb81" />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
            Total Deposited
          </span>
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: "#0ecb81" }}>
          +{totalDeposited.toLocaleString("fr-FR")}
        </span>
      </div>
      <div
        style={{
          border: "1px solid #2b3139",
          borderRadius: 12,
          padding: "14px 16px",
          background: "#1e2329",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Gift size={14} color="#f0b90b" />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
            Gifts Sent
          </span>
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: "#eaecef" }}>
          -{totalGifted.toLocaleString("fr-FR")}
        </span>
      </div>
    </div>
  );
}