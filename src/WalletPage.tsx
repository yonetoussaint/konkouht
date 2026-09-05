import { useState } from "react";
import {
  Trophy, User, Bell, Plus, Gift, ArrowDownLeft, ArrowUpRight, Copy,
  HelpCircle, Search, Menu, MessageCircle, Info, Ticket, Percent,
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  Eye, EyeOff, Settings, ChevronRight, Sparkles, CreditCard,
  Landmark, ArrowRight, BarChart3, PieChart, MoreHorizontal
} from "lucide-react";
import { MOBILE_MONEY_NUMBERS, PAYMENT_METHODS, DEPOSIT_METHODS } from "./App";

const TX_VISUALS = {
  deposit:            { icon: ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
  withdrawal:         { icon: ArrowUpRight, color: "#f6465d", bg: "rgba(246, 70, 93, 0.12)" },
  withdrawal_refund:  { icon: ArrowDownLeft, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
  gift_sent:          { icon: Gift, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.12)" },
  competition_prize:  { icon: Trophy, color: "#f0b90b", bg: "rgba(240, 185, 11, 0.12)" },
  registration_fee:   { icon: Ticket, color: "#1e80ff", bg: "rgba(30, 128, 255, 0.12)" },
  registration_refund:{ icon: Percent, color: "#0ecb81", bg: "rgba(14, 203, 129, 0.12)" },
};

const WITHDRAWAL_STATUS_LABELS = {
  pending:   { label: "Pending", color: "#f0b90b", bg: "rgba(240, 185, 11, 0.15)" },
  rejected:  { label: "Rejected", color: "#f6465d", bg: "rgba(246, 70, 93, 0.15)" },
};

function txReference(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `TXN-${code}`;
}

function splitLabelNote(label) {
  const match = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(label || "");
  if (!match) return { main: label, note: null };
  return { main: match[1], note: match[2] };
}

function extractCompetitionTitle(mainLabel) {
  const m = /^(?:Inscription|Réduction early bird|Remboursement)\s*—\s*(.+)$/.exec(mainLabel || "");
  return m ? m[1].trim() : null;
}

function TransactionRow({ tx, isLast, showToast, onSelect }) {
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#848e9c", bg: "rgba(132, 142, 156, 0.1)" };
  const Icon = visual.icon;
  const time = tx.date.includes(",") ? tx.date.split(",").slice(1).join(",").trim() : tx.date;
  const reference = txReference(tx.id);
  const { main: labelMain, note: labelNote } = splitLabelNote(tx.label);
  const statusPill = tx.type === "withdrawal" ? WITHDRAWAL_STATUS_LABELS[tx.status] : null;

  function copyReference(e) {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference).catch(() => {});
    }
    showToast && showToast("Reference copied");
  }

  return (
    <div
      onClick={() => onSelect && onSelect(tx)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: isLast ? "none" : "1px solid #2b3139",
        cursor: onSelect ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#2b3139"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
            {time}
          </span>
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
        {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

function EquationRow({ label, value, bold }) {
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
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: bold ? 600 : 400, color: "#eaecef" }}>
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
        {isNeg ? "" : "+"}{value.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

function TransactionDetailSheet({ tx, allTransactions, onClose }) {
  if (!tx) return null;

  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#848e9c", bg: "rgba(132, 142, 156, 0.1)" };
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
            {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")} HTG
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
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#848e9c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
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
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#848e9c", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Calculation
            </div>
            <div style={{ border: "1px solid #2b3139", borderRadius: 8, overflow: "hidden" }}>
              <EquationRow label="Registration fee paid" value={feeTx.amount} />
              <EquationRow label="Early bird discount (received)" value={discountTx.amount} />
              <EquationRow label="Refund" value={tx.amount} bold />
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c", marginTop: 8, lineHeight: 1.6 }}>
              {Math.abs(feeTx.amount).toLocaleString("fr-FR")} − {discountTx.amount.toLocaleString("fr-FR")} = {tx.amount.toLocaleString("fr-FR")} — the discount already received is not refunded a second time.
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #2b3139" }}>
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

const TX_FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "gift_sent", label: "Gifts" },
];

function groupTransactionsByDay(list) {
  const groups = [];
  const map = new Map();
  for (const tx of list) {
    const day = tx.date.includes(",") ? tx.date.split(",")[0].trim() : tx.date;
    if (!map.has(day)) {
      const group = { day, items: [] };
      map.set(day, group);
      groups.push(group);
    }
    map.get(day).items.push(tx);
  }
  return groups;
}

function dedupeTransactions(list) {
  const seen = new Set();
  const result = [];
  for (const tx of list) {
    const key = [tx.type, tx.label, tx.amount, tx.rawDate || tx.date].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tx);
  }
  return result;
}

function DepositNumbersCard({ currentUser, onUpdateNumber, showToast }) {
  const [method, setMethod] = useState("moncash");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const current = PAYMENT_METHODS.find((m) => m.id === method);
  const userNumber = method === "moncash" ? currentUser?.moncashNumber : currentUser?.natcashNumber;
  const isVerified = method === "moncash" ? currentUser?.moncashVerified : currentUser?.natcashVerified;

  function startEditing() {
    const local = (userNumber || "").replace(/\D/g, "").replace(/^509(?=\d{8}$)/, "");
    setInputValue(local);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setInputValue("");
  }

  async function handleSave() {
    const digitsOnly = inputValue.replace(/\D/g, "");
    if (!digitsOnly) return;
    setSaving(true);
    try {
      await onUpdateNumber?.(method, `+509${digitsOnly}`);
      showToast && showToast(`${current?.label} number saved`);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save mobile money number:", err);
      showToast && showToast(err?.message ? `Error: ${err.message}` : "Error saving number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #2b3139",
        background: "#181a1e",
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {DEPOSIT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setEditing(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: active ? `1px solid ${m.accent}` : "1px solid #2b3139",
                borderRadius: 8,
                background: active ? m.accent : "transparent",
                color: active ? "#fff" : "#848e9c",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "rgba(255,255,255,0.2)" : m.accent,
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.label.charAt(0)}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#848e9c", marginBottom: 8 }}>
        Your {current?.label} number
      </div>

      {editing ? (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #2b3139",
              borderRadius: 8,
              marginBottom: 12,
              overflow: "hidden",
              background: "#1e2329",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "10px 12px",
                background: "#2b3139",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#eaecef",
              }}
            >
              +509
            </div>
            <input
              autoFocus
              type="tel"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="XX XX XX XX"
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                padding: "10px 12px",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "#eaecef",
                background: "transparent",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || inputValue.length !== 8}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 8,
                background: "#f0b90b",
                color: "#181a1e",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 0",
                cursor: saving || inputValue.length !== 8 ? "default" : "pointer",
                opacity: saving || inputValue.length !== 8 ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #2b3139",
                borderRadius: 8,
                background: "transparent",
                color: "#848e9c",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {userNumber ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 600, color: "#eaecef" }}>
                  {userNumber}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    padding: "2px 10px",
                    borderRadius: 4,
                    background: isVerified ? "rgba(14, 203, 129, 0.15)" : "rgba(240, 185, 11, 0.15)",
                    color: isVerified ? "#0ecb81" : "#f0b90b",
                  }}
                >
                  {isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {isVerified ? "Verified" : "Pending"}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#848e9c" }}>
                No {current?.label} number saved
              </div>
            )}
          </div>
          <button
            onClick={startEditing}
            style={{
              flexShrink: 0,
              border: "1px solid #2b3139",
              borderRadius: 8,
              background: "transparent",
              color: "#eaecef",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#2b3139"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {userNumber ? <Copy size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            {userNumber ? "Edit" : "Add"}
          </button>
        </div>
      )}

      {!editing && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c", lineHeight: 1.6, marginTop: 12 }}>
          {userNumber
            ? isVerified
              ? `⚠ Your ${current?.label} deposits will only be accepted if they come from this number.`
              : `This number will be automatically verified after your first real ${current?.label} deposit.`
            : `Add your ${current?.label} number to start depositing with this method.`}
        </div>
      )}
    </div>
  );
}

export default function WalletPage({ balance, transactions, currentUser, isAuthenticated, onOpenDeposit, onOpenWithdraw, onOpenNotifications, onUpdateNumber, onRequireAuth, showToast, onBack }) {
  const [txFilter, setTxFilter] = useState("all");
  const [txQuery, setTxQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showBalance, setShowBalance] = useState(true);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];

  const dedupedTransactions = dedupeTransactions(effectiveTransactions);

  const filteredTx = dedupedTransactions
    .filter((t) => txFilter === "all" || t.type === txFilter)
    .filter((t) => !txQuery.trim() || t.label.toLowerCase().includes(txQuery.trim().toLowerCase()));
  const groups = groupTransactionsByDay(filteredTx);

  const totalDeposited = dedupedTransactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalGifted = dedupedTransactions
    .filter((t) => t.type === "gift_sent")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const dayChange = dedupedTransactions
    .filter((t) => t.date && t.date.startsWith("Aujourd'hui"))
    .reduce((sum, t) => sum + t.amount, 0);
  const priorBalance = effectiveBalance - dayChange;
  const dayChangePct = priorBalance !== 0 ? (dayChange / Math.abs(priorBalance)) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#181a1e", paddingBottom: 80 }}>
      {/* Binance-style header */}
      <header
        style={{
          background: "#1e2329",
          borderBottom: "1px solid #2b3139",
          padding: "0 16px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 8,
              color: "#eaecef",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} />
            Wallet
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onOpenNotifications}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 8,
              color: "#eaecef",
              display: "flex",
              position: "relative",
            }}
          >
            <Bell size={20} strokeWidth={2} />
            <span style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "#f6465d",
              borderRadius: "50%",
              border: "2px solid #1e2329",
            }} />
          </button>
          <button
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 8,
              color: "#eaecef",
              display: "flex",
            }}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 12px" }}>
        {/* Balance Card - Binance style */}
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
          <div style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: "radial-gradient(circle, rgba(240, 185, 11, 0.05) 0%, transparent 70%)",
            borderRadius: "50%",
          }} />
          
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
              onClick={() => setShowBalance(!showBalance)}
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
              {showBalance ? effectiveBalance.toLocaleString("fr-FR") : "••••••"}
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

        {/* Quick Actions - Binance style */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button
            onClick={isAuthenticated ? onOpenDeposit : onRequireAuth}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: "#f0b90b",
              color: "#181a1e",
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <ArrowDownLeft size={18} strokeWidth={2.5} />
            Deposit
          </button>
          <button
            onClick={isAuthenticated ? onOpenWithdraw : onRequireAuth}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              border: "1px solid #2b3139",
              background: "transparent",
              color: "#eaecef",
              fontFamily: "Inter, sans-serif",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2b3139";
              e.currentTarget.style.borderColor = "#3b434c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#2b3139";
            }}
          >
            <ArrowUpRight size={18} strokeWidth={2.5} />
            Withdraw
          </button>
        </div>

        {/* Stats Cards - Binance style */}
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

        {/* Deposit Numbers */}
        {isAuthenticated ? (
          <DepositNumbersCard currentUser={currentUser} onUpdateNumber={onUpdateNumber} showToast={showToast} />
        ) : (
          <div
            style={{
              border: "1px solid #2b3139",
              borderRadius: 12,
              padding: 20,
              textAlign: "center",
              marginBottom: 16,
              background: "#1e2329",
            }}
          >
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#848e9c", marginBottom: 12 }}>
              Connect to manage your wallet and payment methods
            </div>
            <button
              onClick={onRequireAuth}
              style={{
                border: "none",
                borderRadius: 8,
                background: "#f0b90b",
                color: "#181a1e",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                padding: "10px 24px",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Transaction History */}
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

        {/* Search and Filter */}
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

        {/* Filter Chips */}
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

        {/* Transaction List */}
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
                    <TransactionRow key={tx.id} tx={tx} isLast={i === g.items.length - 1} showToast={showToast} onSelect={setSelectedTx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <TransactionDetailSheet
        tx={selectedTx}
        allTransactions={dedupedTransactions}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}