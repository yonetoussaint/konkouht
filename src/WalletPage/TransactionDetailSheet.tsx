import { Copy, CheckCircle, Clock } from "lucide-react";
import { txReference, splitLabelNote, extractCompetitionTitle } from "./utils";
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

function EquationRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const isNeg = value < 0;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderBottom: "1px solid #2b3139",
        background: bold ? "#1e2329" : "transparent",
      }}
    >
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: bold ? 600 : 400,
          color: "#eaecef",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: isNeg ? "#848e9c" : "#0ecb81",
          flexShrink: 0,
        }}
      >
        {isNeg ? "" : "+"}
        {value.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

interface TransactionDetailSheetProps {
  tx: Transaction | null;
  allTransactions: Transaction[];
  onClose: () => void;
}

export default function TransactionDetailSheet({
  tx,
  allTransactions,
  onClose,
}: TransactionDetailSheetProps) {
  if (!tx) return null;

  const visual = TX_VISUALS[tx.type] || {
    icon: require("lucide-react").ArrowUpRight,
    color: "#848e9c",
    bg: "rgba(132, 142, 156, 0.1)",
  };
  const Icon = visual.icon;
  const { main: labelMain, note: labelNote } = splitLabelNote(tx.label);
  const reference = txReference(tx.id);
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const statusPill = tx.type === "withdrawal" ? WITHDRAWAL_STATUS_LABELS[tx.status] : null;

  const title = extractCompetitionTitle(labelMain);
  const related = title
    ? allTransactions.filter(
        (t) => t.id !== tx.id && extractCompetitionTitle(splitLabelNote(t.label).main) === title
      )
    : [];
  const feeTx = related.find((t) => t.type === "registration_fee");
  const discountTx = related.find(
    (t) => t.type === "registration_refund" && splitLabelNote(t.label).main.startsWith("Réduction early bird")
  );
  const showEquation = tx.type === "registration_refund" && !!labelNote && !!feeTx && !!discountTx;

  function copyReference() {
    if (navigator.clipboard) navigator.clipboard.writeText(reference).catch(() => {});
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1400 }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#1e2329",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "12px 20px 24px",
          zIndex: 1401,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#2b3139", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: "50%",
              background: visual.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={22} color={visual.color} strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 600, color: "#eaecef" }}>
              {labelMain}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#848e9c" }}>{tx.date}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 20px", borderBottom: "1px solid #2b3139", marginBottom: 20 }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: isCredit ? "#0ecb81" : tx.type === "withdrawal" ? "#f6465d" : "#eaecef",
            }}
          >
            {isCredit ? "+" : ""}
            {tx.amount.toLocaleString("fr-FR")} HTG
          </div>
          {statusPill && (
            <div
              style={{
                display: "inline-block",
                marginTop: 8,
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: statusPill.color,
                background: statusPill.bg,
                borderRadius: 4,
                padding: "4px 12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {statusPill.label}
            </div>
          )}
          {tx.status === "pending" && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#848e9c", marginTop: 10, lineHeight: 1.6 }}>
              Amount deducted from your balance and awaiting admin confirmation.
            </div>
          )}
          {tx.status === "rejected" && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#848e9c", marginTop: 10, lineHeight: 1.6 }}>
              This withdrawal was rejected and the amount has been refunded to your balance.
            </div>
          )}
        </div>

        {labelNote && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#848e9c",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Details
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                color: "#eaecef",
                background: visual.bg,
                borderRadius: 8,
                padding: "12px 16px",
                border: `1px solid ${visual.color}33`,
              }}
            >
              {labelNote}
            </div>
          </div>
        )}

        {showEquation && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#848e9c",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Calculation
            </div>
            <div style={{ border: "1px solid #2b3139", borderRadius: 8, overflow: "hidden" }}>
              <EquationRow label="Registration fee paid" value={feeTx.amount} />
              <EquationRow label="Early bird discount (received)" value={discountTx.amount} />
              <EquationRow label="Refund" value={tx.amount} bold />
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c", marginTop: 8, lineHeight: 1.6 }}>
              {Math.abs(feeTx.amount).toLocaleString("fr-FR")} − {discountTx.amount.toLocaleString("fr-FR")} ={" "}
              {tx.amount.toLocaleString("fr-FR")} — the discount already received is not refunded a second time.
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
            borderTop: "1px solid #2b3139",
          }}
        >
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#848e9c" }}>Reference</span>
          <span
            onClick={copyReference}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 13,
              color: "#eaecef",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            {reference}
            <Copy size={13} strokeWidth={2} />
          </span>
        </div>
      </div>
    </>
  );
}

export default TransactionDetailSheet;