import { useState } from "react";
import PageHeader from "./components/PageHeader";
import BalanceCard from "./WalletPage/BalanceCard";
import QuickActions from "./WalletPage/QuickActions";
import DepositNumbersCard from "./WalletPage/DepositNumbersCard";
import DepositPanel from "./WalletPage/DepositPanel";
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
  const [activeWalletId, setActiveWalletId] = useState('htg');
  const [showDeposit, setShowDeposit] = useState(false);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];

  const dedupedTransactions = dedupeTransactions(effectiveTransactions);

  const dayChange = dedupedTransactions
    .filter((t) => t.date && t.date.startsWith("Aujourd'hui"))
    .reduce((sum, t) => sum + t.amount, 0);
  const priorBalance = effectiveBalance - dayChange;
  const dayChangePct = priorBalance !== 0 ? (dayChange / Math.abs(priorBalance)) * 100 : 0;

  // Mock USDT wallet data (you can replace with real data from your backend)
  const usdtWalletData = {
    id: 'usdt',
    currency: 'TetherUSD',
    symbol: 'USDT',
    balance: isAuthenticated ? 2500 : 0, // Example USDT balance
    dayChange: isAuthenticated ? -45 : 0,
    dayChangePct: isAuthenticated ? -1.8 : 0,
    chartData: [
      { time: '00:00', value: 2550 },
      { time: '04:00', value: 2530 },
      { time: '08:00', value: 2520 },
      { time: '12:00', value: 2510 },
      { time: '16:00', value: 2500 },
      { time: '20:00', value: 2490 },
      { time: '24:00', value: 2455 },
    ],
  };

  // Mock HTG wallet data
  const htgWalletData = {
    id: 'htg',
    currency: 'Haitian Gourde',
    symbol: 'HTG',
    balance: effectiveBalance,
    dayChange: dayChange,
    dayChangePct: dayChangePct,
    chartData: [
      { time: '00:00', value: effectiveBalance - 5000 },
      { time: '04:00', value: effectiveBalance - 2000 },
      { time: '08:00', value: effectiveBalance + 3000 },
      { time: '12:00', value: effectiveBalance + 1000 },
      { time: '16:00', value: effectiveBalance - 1000 },
      { time: '20:00', value: effectiveBalance + 2000 },
      { time: '24:00', value: effectiveBalance },
    ],
  };

  // Combine wallets
  const wallets = isAuthenticated 
    ? [htgWalletData, usdtWalletData]
    : [htgWalletData]; // Show only HTG when not authenticated

  // Refresh handler (you can implement actual refresh logic)
  const handleRefresh = async () => {
    // In a real app, you'd fetch latest balances here
    // For now, we'll just simulate a refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast?.('Balances refreshed', 'success');
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <PageHeader
        title="Wallet"
        onSettings={onOpenSettings}
        background="#111"
        borderColor="#2b3139"
      />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 0" }}>
        <BalanceCard
          accounts={wallets.map((w) => ({
            id: w.id,
            props: {
              wallet: w,
              showBalance,
              onToggleBalance: () => setShowBalance(!showBalance),
              isLoading: false,
              onRefresh: handleRefresh,
            },
          }))}
          cardWidth={300}
          onActiveChange={(walletId) => {
            setActiveWalletId(walletId);
            console.log('Active wallet:', walletId);
          }}
        />

        <QuickActions
          isAuthenticated={isAuthenticated}
          onOpenDeposit={() => setShowDeposit(true)}
          onOpenWithdraw={onOpenWithdraw}
          onOpenTransfer={onOpenTransfer}
          onOpenSwap={onOpenSwap}
          onOpenSettings={onOpenSettings}
          onRequireAuth={onRequireAuth}
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

      {showDeposit && (
        <DepositPanel onClose={() => setShowDeposit(false)} />
      )}
    </div>
  );
}