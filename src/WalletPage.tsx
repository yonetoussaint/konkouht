import { useState, useEffect } from "react";
import PageHeader from "./components/PageHeader";
import BalanceCard from "./WalletPage/BalanceCard";
import QuickActions from "./WalletPage/QuickActions";
import DepositPanel from "./WalletPage/DepositPanel";
import TransactionHistory from "./WalletPage/TransactionHistory";
import TransactionDetailSheet from "./WalletPage/TransactionDetailSheet";
import { dedupeTransactions } from "./WalletPage/utils";
import type { WalletPageProps } from "./WalletPage/types";

// Design tokens for consistency
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const BORDER_RADIUS = 12;

export default function WalletPage({
  balance,
  transactions,
  currentUser,
  isAuthenticated,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenSettings,
  onOpenNotifications,
  onUpdateNumber,
  onRequireAuth,
  showToast,
  onBack,
}: WalletPageProps) {
  const [selectedTx, setSelectedTx] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];
  const dedupedTransactions = dedupeTransactions(effectiveTransactions);

  const dayChange = dedupedTransactions
    .filter((t) => t.date && t.date.startsWith("Aujourd'hui"))
    .reduce((sum, t) => sum + t.amount, 0);
  const priorBalance = effectiveBalance - dayChange;
  const dayChangePct = priorBalance !== 0 ? (dayChange / Math.abs(priorBalance)) * 100 : 0;

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast?.('Balances refreshed', 'success');
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#111", 
      paddingBottom: 80 
    }}>
      <PageHeader
        title="Portefeuille"
        onSettings={onOpenSettings}
        background="#111"
        borderColor="#2a2a2e"
      />

      <div style={{ 
        maxWidth: 600, 
        margin: "0 auto", 
        padding: `0 ${SPACING.lg}px`
      }}>
        {/* Balance Card Section */}
        <div style={{ 
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.lg,
          borderBottom: "1px solid #2a2a2e"
        }}>
          <BalanceCard
            wallet={{
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
            }}
            showBalance={showBalance}
            onToggleBalance={() => setShowBalance(!showBalance)}
            isLoading={false}
            onRefresh={handleRefresh}
            width="100%"
          />
        </div>

        {/* Quick Actions Section */}
        <div style={{ 
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.lg,
          borderBottom: "1px solid #2a2a2e"
        }}>
          <QuickActions
            isAuthenticated={isAuthenticated}
            onOpenDeposit={() => setShowDeposit(true)}
            onOpenWithdraw={onOpenWithdraw}
            onOpenTransfer={onOpenTransfer}
            onOpenSettings={onOpenSettings}
            onRequireAuth={onRequireAuth}
            showToast={showToast}
          />
        </div>

        {/* Transactions Section */}
        <div style={{ 
          paddingTop: SPACING.xl,
          paddingBottom: SPACING.xxl
        }}>
          <TransactionHistory
            transactions={dedupedTransactions}
            onSelectTransaction={setSelectedTx}
            showToast={showToast}
          />
        </div>
      </div>

      <TransactionDetailSheet
        tx={selectedTx}
        allTransactions={dedupedTransactions}
        onClose={() => setSelectedTx(null)}
      />

      {showDeposit && (
        <DepositPanel onClose={() => setShowDeposit(false)} showToast={showToast} />
      )}
    </div>
  );
}