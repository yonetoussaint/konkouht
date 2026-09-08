import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
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
  xxxl: 32,
};

// Section heading component for consistency
function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: "#f2f2f2",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </span>
      <button
        onClick={onAction}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "transparent",
          border: "none",
          color: "#848e9c",
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 6,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#f2f2f2";
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#848e9c";
          e.currentTarget.style.background = "transparent";
        }}
      >
        {actionLabel}
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

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

  // Section action handlers
  const handleViewAllActions = () => {
    showToast?.('View all quick actions');
  };

  const handleViewAllTransactions = () => {
    showToast?.('View all transactions');
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
        padding: `0 ${SPACING.md}px`
      }}>
        {/* Balance Card Section - no heading */}
        <div style={{ 
          padding: `${SPACING.lg}px 0 ${SPACING.md}px 0`,
          borderBottom: `1px solid #2a2a2e`,
          margin: `0 -${SPACING.md}px`,
          paddingLeft: SPACING.md,
          paddingRight: SPACING.md,
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
          />
        </div>

        {/* Quick Actions Section - with heading */}
        <div style={{ 
          padding: `${SPACING.md}px 0 ${SPACING.md}px 0`,
          borderBottom: `1px solid #2a2a2e`,
          margin: `0 -${SPACING.md}px`,
          paddingLeft: SPACING.md,
          paddingRight: SPACING.md,
        }}>
          <SectionHeader
            title="Quick Actions"
            actionLabel="View all"
            onAction={handleViewAllActions}
          />
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

        {/* Transactions Section - with heading */}
        <div style={{ 
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.xxxl,
          margin: `0 -${SPACING.md}px`,
          paddingLeft: SPACING.md,
          paddingRight: SPACING.md,
        }}>
          <SectionHeader
            title="Recent Transactions"
            actionLabel="View all"
            onAction={handleViewAllTransactions}
          />
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