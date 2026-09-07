import { useState } from "react";
import { Search } from "lucide-react";
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
}

export default function TransactionHistory({
  transactions,
  onSelectTransaction,
  showToast,
}: TransactionHistoryProps) {
  const [txFilter, setTxFilter] = useState("all");
  const [txQuery, setTxQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredTx = transactions
    .filter((t) => txFilter === "all" || t.type === txFilter)
    .filter((t) => !txQuery.trim() || t.label.toLowerCase().includes(txQuery.trim().toLowerCase()));
  const groups = groupTransactionsByDay(filteredTx);

  return (
    <div>
      {/* Search bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #2a2a2e",
          padding: "0 0 12px",
        }}
      >
        <Search size={16} color="#8a8a90" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search transactions..."
          value={txQuery}
          onChange={(e) => setTxQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            color: "#eaecef",
            background: "transparent",
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2a2a2e", paddingBottom: 12, marginBottom: 12 }}>
        {TX_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            style={{
              flexShrink: 0,
              border: "none",
              background: "transparent",
              color: txFilter === f.id ? "#f0b90b" : "#8a8a90",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 13,
              padding: "6px 12px",
              cursor: "pointer",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
              borderRight: "1px solid #2a2a2e",
            }}
            onMouseEnter={(e) => {
              if (txFilter !== f.id) {
                e.currentTarget.style.color = "#eaecef";
              }
            }}
            onMouseLeave={(e) => {
              if (txFilter !== f.id) {
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
            color: "#8a8a90",
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
        <div>
          {groups.map((g) => (
            <div key={g.day}>
              {/* Day header */}
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#8a8a90",
                  padding: "8px 0 6px",
                  borderTop: "1px solid #2a2a2e",
                }}
              >
                {g.day}
              </div>
              <div>
                {g.items.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
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