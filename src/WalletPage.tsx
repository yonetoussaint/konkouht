import { useState } from "react";
import {
  Trophy, User, Bell, Plus, Gift, ArrowDownLeft, ArrowUpRight, Copy,
  HelpCircle, Search, Menu, MessageCircle, Info, Ticket, Percent,
} from "lucide-react";
import { MOBILE_MONEY_NUMBERS, PAYMENT_METHODS, DEPOSIT_METHODS } from "./App";

const TX_VISUALS = {
  deposit:            { icon: ArrowDownLeft, color: "#00B894", bg: "#f0fbf7" },
  withdrawal:         { icon: ArrowUpRight, color: "#E17055", bg: "#fff4f0" },
  withdrawal_refund:  { icon: ArrowDownLeft, color: "#00B894", bg: "#f0fbf7" },
  gift_sent:          { icon: Gift, color: "#6C63FF", bg: "#f0ebff" },
  competition_prize:  { icon: Trophy, color: "#FDCB6E", bg: "#fffaf0" },
  registration_fee:   { icon: Ticket, color: "#0984E3", bg: "#eef7ff" },
  registration_refund:{ icon: Percent, color: "#00B894", bg: "#f0fbf7" },
};

// Small status pill shown on a withdrawal row/detail while it's waiting on
// admin review, or if it was rejected (money already refunded separately).
const WITHDRAWAL_STATUS_LABELS = {
  pending:   { label: "En attente", color: "#C07A00", bg: "#fff8e8" },
  rejected:  { label: "Rejeté",     color: "#C0392B", bg: "#fdf0ef" },
};

function txReference(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `TXN-${code}`;
}

// Backend labels sometimes carry a trailing clarifying note in parens, e.g.
// "Remboursement — Concours de Beauté (montant inscrit uniquement, réduction
// early bird annulée)". Split that off so it can be shown as its own tag
// instead of wrapped inline with the main label.
function splitLabelNote(label) {
  const match = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(label || "");
  if (!match) return { main: label, note: null };
  return { main: match[1], note: match[2] };
}

// "Inscription — X", "Réduction early bird — X", "Remboursement — X" all
// share the same trailing "X" (competition title). Used to find related
// rows for a given transaction so the detail sheet can show the full
// fee/discount/refund breakdown, not just the one row.
function extractCompetitionTitle(mainLabel) {
  const m = /^(?:Inscription|Réduction early bird|Remboursement)\s*—\s*(.+)$/.exec(mainLabel || "");
  return m ? m[1].trim() : null;
}

function TransactionRow({ tx, isLast, showToast, onSelect }) {
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#888", bg: "#f7f7f5" };
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
    showToast && showToast("Référence copiée");
  }

  return (
    <div
      onClick={() => onSelect && onSelect(tx)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
        cursor: onSelect ? "pointer" : "default",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          border: `1px solid ${visual.color}33`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: visual.bg,
        }}
      >
        <Icon size={15} color={visual.color} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0, gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {labelMain}
          </span>
          {statusPill && (
            <span
              style={{
                flexShrink: 0,
                fontFamily: "Inter, sans-serif",
                fontSize: 9,
                fontWeight: 700,
                color: statusPill.color,
                background: statusPill.bg,
                borderRadius: 999,
                padding: "2px 7px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {statusPill.label}
            </span>
          )}
        </div>
        {labelNote && (
          <span
            style={{
              alignSelf: "flex-start",
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              fontWeight: 600,
              color: visual.color,
              background: visual.bg,
              border: `1px solid ${visual.color}33`,
              borderRadius: 6,
              padding: "2px 6px",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {labelNote}
          </span>
        )}
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
          <span>{time}</span>
          <span style={{ color: "#ddd" }}>·</span>
          <span
            onClick={copyReference}
            title="Copier la référence"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: "#bbb",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {reference}
            <Copy size={10} strokeWidth={2} />
          </span>
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: isCredit ? "#00B894" : tx.type === "withdrawal" ? "#FF5252" : "#333",
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
        padding: "10px 12px",
        borderBottom: "1px solid #f5f5f5",
        background: bold ? "#fafafa" : "#fff",
      }}
    >
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: bold ? 700 : 500, color: "#555" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: isNeg ? "#333" : "#00B894",
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

  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#888", bg: "#f7f7f5" };
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
  // Only show the breakdown when this row is itself a removal refund
  // (carries the "annulée" note) and we can actually find the fee + the
  // discount that was already paid out — otherwise there's nothing to
  // explain.
  const showEquation = tx.type === "registration_refund" && !!labelNote && !!feeTx && !!discountTx;

  function copyReference() {
    if (navigator.clipboard) navigator.clipboard.writeText(reference).catch(() => {});
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1400 }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "10px 18px 28px",
          zIndex: 1401,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 18px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: 12,
              border: `1px solid ${visual.color}33`, background: visual.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon size={20} color={visual.color} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: "#222" }}>
              {labelMain}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#999" }}>{tx.date}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "10px 0 20px", borderBottom: "1px solid #f0f0f0", marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800,
              color: isCredit ? "#00B894" : tx.type === "withdrawal" ? "#FF5252" : "#222",
            }}
          >
            {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")} HTG
          </div>
          {statusPill && (
            <div
              style={{
                display: "inline-block", marginTop: 8,
                fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                color: statusPill.color, background: statusPill.bg,
                borderRadius: 999, padding: "3px 10px",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}
            >
              {statusPill.label}
            </div>
          )}
          {tx.status === "pending" && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 8, lineHeight: 1.5 }}>
              Le montant a été déduit de votre solde et est en attente de confirmation par un administrateur.
            </div>
          )}
          {tx.status === "rejected" && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 8, lineHeight: 1.5 }}>
              Ce retrait a été rejeté et le montant a été recrédité sur votre solde.
            </div>
          )}
        </div>

        {labelNote && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Détail
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444",
                background: visual.bg, border: `1px solid ${visual.color}33`,
                borderRadius: 10, padding: "10px 12px",
              }}
            >
              {labelNote}
            </div>
          </div>
        )}

        {showEquation && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Pourquoi ce montant
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
              <EquationRow label="Frais d'inscription payé" value={feeTx.amount} />
              <EquationRow label="Réduction early bird (déjà reçue)" value={discountTx.amount} />
              <EquationRow label="Remboursement" value={tx.amount} bold />
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb", marginTop: 8, lineHeight: 1.5 }}>
              {Math.abs(feeTx.amount).toLocaleString("fr-FR")} − {discountTx.amount.toLocaleString("fr-FR")} = {tx.amount.toLocaleString("fr-FR")} — la réduction déjà reçue n'est pas remboursée une seconde fois.
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 0", borderTop: "1px solid #f0f0f0" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#999" }}>Référence</span>
          <span
            onClick={copyReference}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#666",
              display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
            }}
          >
            {reference}
            <Copy size={11} strokeWidth={2} />
          </span>
        </div>
      </div>
    </>
  );
}

const TX_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "deposit", label: "Dépôts" },
  { id: "withdrawal", label: "Retraits" },
  { id: "gift_sent", label: "Cadeaux" },
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

// Defensive de-dup: if the backend fires a duplicate write (e.g. a
// double-submit on registration), the wallet can end up with two
// transactions that share type + label + amount + timestamp but have
// different ids/references. Those are visually identical to the user,
// so collapse them here rather than showing the same line twice.
// This does NOT fix the underlying double-insert — it just stops the
// symptom from reaching the UI.
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
    // The field only ever holds the local number — strip any 509 the
    // stored value might carry so re-editing doesn't show it doubled up.
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
      // 509 is fixed and never typed by the user — it's added here, once,
      // right before saving.
      await onUpdateNumber?.(method, `+509${digitsOnly}`);
      showToast && showToast(`Numéro ${current?.label} enregistré`);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save mobile money number:", err);
      showToast && showToast(err?.message ? `Erreur : ${err.message}` : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        background: "#fff",
        borderRadius: 14,
        marginBottom: 16,
        padding: 14,
      }}
    >
      {/* Pill tabs: MonCash / NatCash */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {DEPOSIT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setEditing(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: active ? `1px solid ${m.accent}` : "1px solid #e0e0e0",
                borderRadius: 999,
                background: active ? m.accent : "#fff",
                color: active ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "rgba(255,255,255,0.25)" : m.accent,
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 9,
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

      {/* User's own number for the active method */}
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6 }}>
        Votre numéro {current?.label}
      </div>

      {editing ? (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ddd",
              borderRadius: 10,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "10px 10px",
                background: "#f5f5f5",
                borderRight: "1px solid #ddd",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#888",
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
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#111",
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
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: saving ? "default" : "pointer",
                opacity: saving || inputValue.length !== 8 ? 0.5 : 1,
              }}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 999,
                background: "#fff",
                color: "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {userNumber ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.04em", color: "#111" }}>
                  {userNumber}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: isVerified ? "#E8F7EE" : "#FFF6E5",
                    color: isVerified ? "#1E8449" : "#B7791F",
                  }}
                >
                  {isVerified ? "✓ Vérifié" : "⏳ En attente"}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#999", fontStyle: "italic" }}>
                Aucun numéro {current?.label} enregistré
              </div>
            )}
          </div>
          <button
            onClick={startEditing}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${current?.accent ?? "#111"}`,
              borderRadius: 999,
              background: "#fff",
              color: current?.accent ?? "#111",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            {userNumber ? <Copy size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
            {userNumber ? "Modifier" : "Ajouter"}
          </button>
        </div>
      )}

      {!editing && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: userNumber ? "#C0392B" : "#888", lineHeight: 1.5, marginTop: 10 }}>
          {userNumber
            ? isVerified
              ? `⚠ Vos dépôts ${current?.label} ne seront acceptés que s'ils proviennent de ce numéro.`
              : `Ce numéro sera vérifié automatiquement dès votre premier dépôt réel ${current?.label} depuis celui-ci.`
            : `Ajoutez votre numéro ${current?.label} pour pouvoir déposer avec cette méthode.`}
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
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "8px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => showToast && showToast("Menu bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Menu size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Messagerie bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <MessageCircle size={20} strokeWidth={2.25} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onOpenNotifications}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Bell size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Aide bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <HelpCircle size={20} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 8px" }}>
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "14px 16px",
            marginBottom: 10,
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
              }}
            >
              Solde disponible
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "3px 7px",
                borderRadius: 6,
                background: dayChange >= 0 ? "#00B89418" : "#FF525218",
                flexShrink: 0,
              }}
            >
              {dayChange >= 0 ? (
                <ArrowUpRight size={12} strokeWidth={2.75} color="#00B894" style={{ flexShrink: 0 }} />
              ) : (
                <ArrowDownLeft size={12} strokeWidth={2.75} color="#FF5252" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: dayChange >= 0 ? "#00B894" : "#FF5252",
                  whiteSpace: "nowrap",
                }}
              >
                {dayChangePct >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px, 7vw, 32px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#111", wordBreak: "break-all" }}>
              {effectiveBalance.toLocaleString("fr-FR")}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#999" }}>
              HTG
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: dayChange >= 0 ? "#00B894" : "#FF5252", marginLeft: "auto" }}>
              {dayChange >= 0 ? "+" : ""}{dayChange.toLocaleString("fr-FR")} aujourd'hui
            </span>
          </div>
        </div>

        {/* Deposit numbers — MonCash / NatCash tabs */}
        {isAuthenticated ? (
          <DepositNumbersCard currentUser={currentUser} onUpdateNumber={onUpdateNumber} showToast={showToast} />
        ) : (
          <div
            style={{
              border: "1px solid #e0e0e0",
              background: "#fafafa",
              borderRadius: 14,
              marginBottom: 16,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#666", marginBottom: 10 }}>
              Connectez-vous pour voir votre portefeuille et gérer vos numéros de dépôt.
            </div>
            <button
              onClick={onRequireAuth}
              style={{
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Total déposé
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#00B894", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              +{totalDeposited.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Cadeaux envoyés
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              -{totalGifted.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Déposer", icon: Plus, onClick: isAuthenticated ? onOpenDeposit : onRequireAuth, filled: true },
            { label: "Retirer", icon: ArrowUpRight, onClick: isAuthenticated ? onOpenWithdraw : onRequireAuth, filled: false },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              style={{
                flex: "1 1 130px",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                borderRadius: 24,
                border: action.filled ? "1px solid #111" : "1px solid #e0e0e0",
                background: action.filled ? "#111" : "#fff",
                color: action.filled ? "#fff" : "#333",
                cursor: "pointer",
                padding: "0 20px",
              }}
            >
              <action.icon size={18} strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Info note */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "12px 14px",
            marginBottom: 24,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#aaa",
            lineHeight: 1.5,
            borderRadius: 12,
          }}
        >
          Votre solde est en gourdes haïtiennes (HTG) et représente de l'argent réel. Déposez via MonCash, NatCash ou carte bancaire, et retirez à tout moment vers votre compte mobile money.
        </div>

        {/* Transaction history */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#888",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Historique
        </div>

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${searchFocused ? "#111" : "#e0e0e0"}`,
            background: "#f9f9f9",
            height: 38,
            borderRadius: 10,
            padding: "0 10px",
            marginBottom: 12,
            transition: "border-color 0.15s",
          }}
        >
          <Search size={15} color={searchFocused ? "#333" : "#aaa"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={txQuery}
            onChange={(e) => setTxQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "#333",
              background: "transparent",
              height: "100%",
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
          {TX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTxFilter(f.id)}
              style={{
                flexShrink: 0,
                border: `1px solid ${txFilter === f.id ? "#111" : "#e0e0e0"}`,
                background: txFilter === f.id ? "#111" : "#fff",
                color: txFilter === f.id ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px", border: "1px solid #e0e0e0", background: "#fff", color: "#aaa", fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 12 }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {groups.map((g) => (
              <div
                key={g.day}
                style={{
                  border: "1px solid #e0e0e0",
                  background: "#fff",
                  overflow: "hidden",
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#999",
                    padding: "10px 14px",
                    background: "#fafafa",
                    borderBottom: "1px solid #eee",
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



// The home banner slider used to fall back to static stock photos per niche.
// It now only features competitions that have a real uploaded image in the
// competition-images storage bucket — computed inside App() from `compImages`
// (see `homeBannerSlides`) so nothing fake ever shows up here.

/* ─── NOTIFICATIONS DATA ────────────────────────────────────────────────── */