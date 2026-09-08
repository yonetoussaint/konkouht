import { useState } from "react";
import TransactionRow from "./TransactionRow";
import { groupTransactionsByDay } from "./utils";
import type { Transaction } from "./types";

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
  showHeader?: boolean; // New prop to control header visibility
}

export default function TransactionHistory({
  transactions,
  onSelectTransaction,
  showToast,
  showHeader = true, // Default to true for backward compatibility
}: TransactionHistoryProps) {
  const [txFilter, setTxFilter] = useState("all");

  const filteredTx = transactions.filter(
    (t) => txFilter === "all" || t.type === txFilter
  );
  const groups = groupTransactionsByDay(filteredTx);

  return (
    <div>
      {/* Removed the internal "Transactions" header */}
      {/* Filter buttons now appear directly */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {TX_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            style={{
              flexShrink: 0,
              border: txFilter === f.id ? "1px solid #f0b90b" : "1px solid #2a2a2e",
              borderRadius: 8,
              background: txFilter === f.id ? "rgba(240, 185, 11, 0.1)" : "transparent",
              color: txFilter === f.id ? "#f0b90b" : "#8a8a90",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (txFilter !== f.id) {
                e.currentTarget.style.borderColor = "#3b434c";
                e.currentTarget.style.color = "#eaecef";
              }
            }}
            onMouseLeave={(e) => {
              if (txFilter !== f.id) {
                e.currentTarget.style.borderColor = "#2a2a2e";
                e.currentTarget.style.color = "#8a8a90";
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
            border: "1px solid #2a2a2e",
            borderRadius: 12,
            background: "#1e2329",
          }}
        >
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#8a8a90" }}>
            No transactions yet
          </div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8a8a90", marginTop: 4 }}>
            Your transactions will appear here
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((g) => (
            <div
              key={g.day}
              style={{
                border: "1px solid #2a2a2e",
                borderRadius: 12,
                overflow: "hidden",
                background: "#1e2329",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#8a8a90",
                  padding: "10px 16px",
                  background: "#181a1e",
                  borderBottom: "1px solid #2a2a2e",
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