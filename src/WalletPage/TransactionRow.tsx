import { Copy } from "lucide-react";
import { txReference, splitLabelNote } from "./utils";
import type { Transaction } from "./types";

const TX_VISUALS: Record<string, { icon: any; color: string; bg: string }> = {
  deposit: { icon: require("lucide-react").ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
  withdrawal: { icon: require("lucide-react").ArrowUpRight, color: "#f6465d", bg: "rgba(246, 70, 93, 0.12)" },
  withdrawal_refund: { icon: require("lucide-react").ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
  gift_sent: { icon: require("lucide-react").Gift, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.12)" },
  competition_prize: { icon: require("lucide-react").Trophy, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.12)" },
  registration_fee: { icon: require("lucide-react").Ticket, color: "#1e80ff", bg: "rgba(30, 128, 255, 0.12)" },
  registration_refund: { icon: require("lucide-react").Percent, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
};

const WITHDRAWAL_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#f0b90b", bg: "rgba(240, 185, 11, 0.15)" },
  rejected: { label: "Rejected", color: "#f6465d", bg: "rgba(246, 70, 93, 0.15)" },
};

interface TransactionRowProps {
  tx: Transaction;
  isLast: boolean;
  showToast?: (message: string) => void;
  onSelect?: (tx: Transaction) => void;
}

export default function TransactionRow({ tx, isLast, showToast, onSelect }: TransactionRowProps) {
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const visual = TX_VISUALS[tx.type] || {
    icon: require("lucide-react").ArrowUpRight,
    color: "#848e9c",
    bg: "rgba(132, 142, 156, 0.1)",
  };
  const Icon = visual.icon;
  const time = tx.date.includes(",") ? tx.date.split(",").slice(1).join(",").trim() : tx.date;
  const reference = txReference(tx.id);
  const { main: labelMain, note: labelNote } = splitLabelNote(tx.label);
  const statusPill = tx.type === "withdrawal" ? WITHDRAWAL_STATUS_LABELS[tx.status] : null;

  function copyReference(e: React.MouseEvent) {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference).catch(() => {});
    }
    showToast?.("Reference copied");
  }

  return (
    <div
      onClick={() => onSelect?.(tx)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid #2b3139",
        cursor: onSelect ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#2b3139")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: visual.bg,
        }}
      >
        <Icon size={18} color={visual.color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: "#eaecef" }}>
            {labelMain}
          </span>
          {statusPill && (
            <span
              style={{
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: statusPill.color,
                background: statusPill.bg,
                borderRadius: 4,
                padding: "2px 8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {statusPill.label}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>{time}</span>
          <span style={{ color: "#2b3139" }}>·</span>
          <span
            onClick={copyReference}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "#848e9c",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {reference}
            <Copy size={11} strokeWidth={2} />
          </span>
        </div>
        {labelNote && (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 500,
              color: visual.color,
              background: visual.bg,
              borderRadius: 4,
              padding: "2px 8px",
              display: "inline-block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {labelNote}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: isCredit ? "#0ecb81" : tx.type === "withdrawal" ? "#f6465d" : "#eaecef",
          flexShrink: 0,
        }}
      >
        {isCredit ? "+" : ""}
        {tx.amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

export default TransactionRow;