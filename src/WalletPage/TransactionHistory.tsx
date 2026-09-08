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
          {groups.map((g) => (
            <div key={g.day}>
              {/* Day header - clean, minimal */}
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#848e9c",
                  paddingBottom: SPACING.sm,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: SPACING.sm,
                }}
              >
                {g.day}
              </div>
              <div>
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
          ))}
        </div>
      )}
    </div>
  );
}