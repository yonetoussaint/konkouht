import { useState, useEffect } from "react";
import { supabase } from "@lib/supabaseClient";
import { DepositHeader } from "./DepositPanel/DepositHeader";
import { DepositProgress } from "./DepositPanel/DepositProgress";
import { AmountStep } from "./DepositPanel/AmountStep";
import { MethodStep } from "./DepositPanel/MethodStep";
import { ConfirmStep } from "./DepositPanel/ConfirmStep";
import { ProcessingStep } from "./DepositPanel/ProcessingStep";
import { SuccessStep } from "./DepositPanel/SuccessStep";
import { SPACING, COLORS, getFeesAndLimits, getAmountStatus, getSmartQuickAmounts } from "./DepositPanel/utils";
import type { Step, DepositState, MethodOption } from "./DepositPanel/types";

interface DepositPanelProps {
  onClose: () => void;
  showToast?: (message: string) => void;
  userTransactions?: any[];
  userBalance?: number;
}

const METHODS: MethodOption[] = [
  {
    key: "moncash",
    label: "MonCash",
    color: "#e63946",
    icon: "MC",
    description: "Payez avec MonCash",
  },
  {
    key: "natcash",
    label: "NatCash",
    color: "#2a9d8f",
    icon: "NC",
    description: "Payez avec NatCash",
  },
];

export default function DepositPanel({
  onClose,
  showToast,
  userTransactions = [],
  userBalance = 0,
}: DepositPanelProps) {
  const [entered, setEntered] = useState(false);
  const [state, setState] = useState<DepositState>({
    step: "amount",
    amount: "",
    displayAmount: "",
    selectedMethod: null,
    submitting: false,
    referenceId: null,
    showFeesInfo: false,
  });

  const { step, amount, displayAmount, selectedMethod, submitting, referenceId, showFeesInfo } = state;
  const fees = getFeesAndLimits();
  const amountStatus = getAmountStatus(amount, fees);
  const quickAmounts = getSmartQuickAmounts(userTransactions, userBalance);
  const progressSteps = ["Montant", "Méthode", "Confirmer"];
  const stepOrder: Step[] = ["amount", "method", "confirm"];
  const currentStepIndex = stepOrder.indexOf(step);
  const showBack = step === "method" || step === "confirm";

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setEntered(false);
    setTimeout(() => onClose?.(), 200);
  };

  const resetAndClose = () => {
    setState({
      step: "amount",
      amount: "",
      displayAmount: "",
      selectedMethod: null,
      submitting: false,
      referenceId: null,
      showFeesInfo: false,
    });
    handleClose();
  };

  const setAmount = (amount: string, displayAmount: string) => {
    setState(prev => ({ ...prev, amount, displayAmount }));
  };

  const setSelectedMethod = (method: string | null) => {
    setState(prev => ({ ...prev, selectedMethod: method }));
  };

  const setSubmitting = (submitting: boolean) => {
    setState(prev => ({ ...prev, submitting }));
  };

  const setReferenceId = (referenceId: string | null) => {
    setState(prev => ({ ...prev, referenceId }));
  };

  const toggleFeesInfo = () => {
    setState(prev => ({ ...prev, showFeesInfo: !prev.showFeesInfo }));
  };

  const goToNextStep = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setState(prev => ({ ...prev, step: stepOrder[currentIndex + 1] }));
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, step: stepOrder[currentIndex - 1] }));
    }
  };

  const handleAmountNext = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (amountStatus && amountStatus.status !== "ok") {
      showToast?.(amountStatus.message);
      return;
    }
    goToNextStep();
  };

  const handleMethodNext = () => {
    if (!selectedMethod) return;
    goToNextStep();
  };

  const handleConfirm = async () => {
    if (selectedMethod !== "moncash") {
      showToast?.("Cette méthode n'est pas encore disponible");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("moncash-create-deposit", {
        body: { amount: numericAmount },
      });

      if (error || !data?.paymentUrl) {
        throw error || new Error("No payment URL returned");
      }

      if (data.referenceId) {
        try { localStorage.setItem("pendingMoncashDeposit", data.referenceId); } catch {}
        setReferenceId(data.referenceId);
      }

      setState(prev => ({ ...prev, step: "success" }));

      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 1500);
    } catch (err) {
      console.error("MonCash deposit failed:", err);
      showToast?.("Erreur lors du dépôt MonCash. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  const getMethodLabel = () => {
    const method = METHODS.find(m => m.key === selectedMethod);
    return method?.label || undefined;
  };

  const hasDepositHistory = userTransactions.filter((t: any) => t.type === "deposit").length > 0;

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: `rgba(0,0,0,${entered ? 0.6 : 0})`,
        transition: "background 0.25s ease",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: COLORS.bg,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          display: "flex",
          flexDirection: "column",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <DepositHeader
          step={step}
          onBack={goToPreviousStep}
          onClose={resetAndClose}
          showBack={showBack}
        />

        {step !== "processing" && step !== "success" && (
          <DepositProgress steps={progressSteps} currentIndex={currentStepIndex} />
        )}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: `${SPACING.lg}px ${SPACING.lg}px 0`,
          }}
        >
          {step === "amount" && (
            <AmountStep
              amount={amount}
              displayAmount={displayAmount}
              onAmountChange={setAmount}
              quickAmounts={quickAmounts}
              amountStatus={amountStatus}
              fees={fees}
              showFeesInfo={showFeesInfo}
              onToggleFeesInfo={toggleFeesInfo}
              showHint={hasDepositHistory}
            />
          )}

          {step === "method" && (
            <MethodStep
              selectedMethod={selectedMethod}
              onSelectMethod={setSelectedMethod}
              methods={METHODS}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              amount={amount}
              selectedMethod={selectedMethod}
              fees={fees}
              onConfirm={handleConfirm}
              submitting={submitting}
              methodLabel={getMethodLabel()}
            />
          )}

          {step === "processing" && <ProcessingStep />}

          {step === "success" && (
            <SuccessStep
              referenceId={referenceId}
              onClose={resetAndClose}
            />
          )}
        </div>

        {/* Footer with action buttons for amount and method steps */}
        {step === "amount" && (
          <div
            style={{
              padding: `${SPACING.lg}px ${SPACING.lg}px`,
              flexShrink: 0,
            }}
          >
            <button
              onClick={handleAmountNext}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                width: "100%",
                padding: `14px`,
                background: (amount && parseFloat(amount) > 0 && amountStatus?.status === "ok")
                  ? COLORS.accent : COLORS.border,
                border: "none",
                borderRadius: 8,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.xl,
                fontWeight: TYPOGRAPHY.weight.semibold,
                color: (amount && parseFloat(amount) > 0 && amountStatus?.status === "ok")
                  ? "#111" : COLORS.textMuted,
                cursor: (amount && parseFloat(amount) > 0 && amountStatus?.status === "ok")
                  ? "pointer" : "default",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING.sm,
              }}
            >
              Continuer
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === "method" && (
          <div
            style={{
              padding: `${SPACING.lg}px ${SPACING.lg}px`,
              flexShrink: 0,
            }}
          >
            <button
              onClick={handleMethodNext}
              disabled={!selectedMethod}
              style={{
                width: "100%",
                padding: `14px`,
                background: selectedMethod ? COLORS.accent : COLORS.border,
                border: "none",
                borderRadius: 8,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.xl,
                fontWeight: TYPOGRAPHY.weight.semibold,
                color: selectedMethod ? "#111" : COLORS.textMuted,
                cursor: selectedMethod ? "pointer" : "default",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING.sm,
              }}
            >
              Continuer
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}