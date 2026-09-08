import { useState } from "react";
import TransactionRow from "./TransactionRow";
import { groupTransactionsByDay } from "./utils";
import type { Transaction } from "./types";

// Design tokens for consistency
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const TX_FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "gift_sent", label: "Gifts" },
];

interface TransactionHistoryProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  showToast?: (message: string) => void;
}

export default function TransactionHistory({
  transactions,
  onSelectTransaction,
  showToast,
}: TransactionHistoryProps) {
  const [txFilter, setTxFilter] = useState("all");

  const filteredTx = transactions.filter(
    (t) => txFilter === "all" || t.type === txFilter
  );
  const groups = groupTransactionsByDay(filteredTx);

  // Helper to format day display
  const getDayDisplay = (day: string) => {
    const today = new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    if (day === "Aujourd'hui") {
      return { label: "Aujourd'hui", isToday: true };
    }
    
    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    if (day === yesterdayStr) {
      return { label: "Hier", isToday: false };
    }
    
    return { label: day, isToday: false };
  };

  return (
    <div>
      {/* Filter buttons - clean, minimal */}
      <div style={{ 
        display: "flex", 
        gap: SPACING.sm, 
        marginBottom: SPACING.lg,
        overflowX: "auto",
        paddingBottom: SPACING.xs,
      }}>
        {TX_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            style={{
              flexShrink: 0,
              border: "none",
              background: txFilter === f.id ? "rgba(255,255,255,0.08)" : "transparent",
              color: txFilter === f.id ? "#f2f2f2" : "#848e9c",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: 13,
              padding: "6px 12px",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => {
              if (txFilter !== f.id) {
                e.currentTarget.style.color = "#f2f2f2";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (txFilter !== f.id) {
                e.currentTarget.style.color = "#848e9c";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
          }}
        >
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#848e9c" }}>
            No transactions yet
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c", marginTop: 4 }}>
            Your transactions will appear here
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: SPACING.xl }}>
          {groups.map((g) => {
            const dayInfo = getDayDisplay(g.day);
            const dayTotal = g.items.reduce((sum, tx) => sum + tx.amount, 0);
            const isPositive = dayTotal >= 0;
            
            return (
              <div key={g.day}>
                {/* Day header with enhanced visual hierarchy */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: SPACING.sm,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: SPACING.sm,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        color: dayInfo.isToday ? "#0ecb81" : "#eaecef",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {dayInfo.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#848e9c",
                        background: "rgba(255,255,255,0.06)",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {g.items.length} {g.items.length === 1 ? "tx" : "txs"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: isPositive ? "#0ecb81" : "#f6465d",
                    }}
                  >
                    {isPositive ? "+" : ""}
                    {dayTotal.toLocaleString("fr-FR")}
                  </span>
                </div>

                {/* Transaction list container with subtle background */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 8,
                    padding: `${SPACING.xs}px 0`,
                  }}
                >
                  {g.items.map((tx, i) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      isLast={i === g.items.length - 1}
                      showToast={showToast}
                      onSelect={onSelectTransaction}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}