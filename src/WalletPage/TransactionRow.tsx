import { Copy, ArrowDownLeft, ArrowUpRight, Gift, Trophy, Ticket, Percent } from "lucide-react";
import { txReference, splitLabelNote } from "./utils";
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

const TX_VISUALS: Record<string, { icon: any; color: string; bg: string }> = {
  deposit: { icon: ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.08)" },
  withdrawal: { icon: ArrowUpRight, color: "#f6465d", bg: "rgba(246, 70, 93, 0.08)" },
  withdrawal_refund: { icon: ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.08)" },
  gift_sent: { icon: Gift, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.08)" },
  competition_prize: { icon: Trophy, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.08)" },
  registration_fee: { icon: Ticket, color: "#1e80ff", bg: "rgba(30, 128, 255, 0.08)" },
  registration_refund: { icon: Percent, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.08)" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#f0b90b", bg: "rgba(240, 185, 11, 0.12)" },
  rejected: { label: "Rejected", color: "#f6465d", bg: "rgba(246, 70, 93, 0.12)" },
  failed: { label: "Failed", color: "#f6465d", bg: "rgba(246, 70, 93, 0.12)" },
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
    icon: ArrowUpRight,
    color: "#848e9c",
    bg: "rgba(132, 142, 156, 0.08)",
  };
  const Icon = visual.icon;
  const time = tx.date.includes(",") ? tx.date.split(",").slice(1).join(",").trim() : tx.date;
  const reference = txReference(tx.id);
  const { main: labelMain, note: labelNote } = splitLabelNote(tx.label);
  const statusPill = tx.status && tx.status !== "completed" ? STATUS_LABELS[tx.status] : null;

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
        padding: `${SPACING.sm}px 0`,
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
        cursor: onSelect ? "pointer" : "default",
        transition: "background 0.15s",
        borderRadius: 6,
        paddingLeft: SPACING.xs,
        paddingRight: SPACING.xs,
      }}
      onMouseEnter={(e) => {
        if (onSelect) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: visual.bg,
        }}
      >
        <Icon size={16} color={visual.color} strokeWidth={2} />
      </div>
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ 
            fontFamily: "Inter, sans-serif", 
            fontSize: 14, 
            fontWeight: 500, 
            color: "#eaecef" 
          }}>
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
          <span style={{ color: "rgba(255,255,255,0.08)" }}>·</span>
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