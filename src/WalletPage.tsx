import { useState } from "react";
import WalletHeader from "./WalletPage/WalletHeader";
import BalanceCard from "./WalletPage/BalanceCard";
import QuickActions from "./WalletPage/QuickActions";
import StatsCards from "./WalletPage/StatsCards";
import DepositNumbersCard from "./WalletPage/DepositNumbersCard";
import TransactionHistory from "./WalletPage/TransactionHistory";
import TransactionDetailSheet from "./WalletPage/TransactionDetailSheet";
import { dedupeTransactions } from "./WalletPage/utils";
import type { WalletPageProps } from "./WalletPage/types";

export default function WalletPage({
  balance,
  transactions,
  currentUser,
  isAuthenticated,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenSwap,
  onOpenSettings,
  onOpenNotifications,
  onUpdateNumber,
  onRequireAuth,
  showToast,
  onBack,
}: WalletPageProps) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [showBalance, setShowBalance] = useState(true);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];

  const dedupedTransactions = dedupeTransactions(effectiveTransactions);

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
      <WalletHeader
        onBack={onBack}
        onOpenNotifications={onOpenNotifications}
        showToast={showToast}
      />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 12px" }}>
        <BalanceCard
          balance={effectiveBalance}
          dayChange={dayChange}
          dayChangePct={dayChangePct}
          showBalance={showBalance}
          onToggleBalance={() => setShowBalance(!showBalance)}
        />

        <QuickActions
          isAuthenticated={isAuthenticated}
          onOpenDeposit={onOpenDeposit}
          onOpenWithdraw={onOpenWithdraw}
          onOpenTransfer={onOpenTransfer}
          onOpenSwap={onOpenSwap}
          onOpenSettings={onOpenSettings}
          onRequireAuth={onRequireAuth}
        />

        <StatsCards
          totalDeposited={totalDeposited}
          totalGifted={totalGifted}
        />

        {isAuthenticated ? (
          <DepositNumbersCard
            currentUser={currentUser}
            onUpdateNumber={onUpdateNumber}
            showToast={showToast}
          />
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
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Connect Wallet
            </button>
          </div>
        )}

        <TransactionHistory
          transactions={dedupedTransactions}
          onSelectTransaction={setSelectedTx}
          showToast={showToast}
        />
      </div>

      <TransactionDetailSheet
        tx={selectedTx}
        allTransactions={dedupedTransactions}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}