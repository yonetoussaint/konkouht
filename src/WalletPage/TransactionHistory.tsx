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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#eaecef",
          }}
        >
          Transaction History
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
          {filteredTx.length} transactions
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${searchFocused ? "#f0b90b" : "#2b3139"}`,
            background: "#1e2329",
            borderRadius: 8,
            padding: "0 12px",
            height: 40,
            transition: "border-color 0.2s",
          }}
        >
          <Search size={16} color="#848e9c" strokeWidth={2} />
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
              height: "100%",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {TX_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setTxFilter(f.id)}
            style={{
              flexShrink: 0,
              border: txFilter === f.id ? "1px solid #f0b90b" : "1px solid #2b3139",
              borderRadius: 8,
              background: txFilter === f.id ? "rgba(240, 185, 11, 0.1)" : "transparent",
              color: txFilter === f.id ? "#f0b90b" : "#848e9c",
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
                e.currentTarget.style.borderColor = "#2b3139";
                e.currentTarget.style.color = "#848e9c";
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
            border: "1px solid #2b3139",
            borderRadius: 12,
            background: "#1e2329",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((g) => (
            <div
              key={g.day}
              style={{
                border: "1px solid #2b3139",
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
                  color: "#848e9c",
                  padding: "10px 16px",
                  background: "#181a1e",
                  borderBottom: "1px solid #2b3139",
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

export default TransactionHistory;