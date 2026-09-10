import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, ArrowLeft, ChevronRight, Info, Star, TrendingUp, Clock } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import type { Transaction } from "./types";

// Design tokens - Consistent throughout
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const COLORS = {
  bg: "#0d0f12",
  surface: "#14171c",
  surfaceHover: "#1a1e24",
  surfaceRaised: "#1e2329",
  border: "#2a2a2e",
  borderLight: "rgba(255,255,255,0.06)",
  text: "#eef0f2",
  textDim: "#7d8590",
  textMuted: "#5a5e66",
  accent: "#0ecb81",
  accentDim: "rgba(14, 203, 129, 0.12)",
  accentSubtle: "rgba(14, 203, 129, 0.06)",
  error: "#f6465d",
  warning: "#f0b90b",
  warningDim: "rgba(240, 185, 11, 0.1)",
};

const TYPOGRAPHY = {
  fontFamily: "'Inter', -apple-system, sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', monospace",
  size: {
    xs: 10,
    sm: 11,
    md: 12,
    lg: 13,
    xl: 14,
    xxl: 16,
    xxxl: 18,
    display: 24,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

type Step = "amount" | "method" | "confirm" | "processing";

interface DepositPanelProps {
  onClose: () => void;
  showToast?: (message: string) => void;
  userTransactions?: Transaction[];
  userBalance?: number;
}

export default function DepositPanel({ 
  onClose, 
  showToast, 
  userTransactions = [], 
  userBalance = 0 
}: DepositPanelProps) {
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [showFeesInfo, setShowFeesInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step === "amount" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  // Debug: Log quick amounts when transactions change
  useEffect(() => {
    if (userTransactions.length > 0) {
      const amounts = getQuickAmountsWithMetadata();
      console.log("🔍 Quick amounts with metadata:", amounts);
      console.log("📊 Total deposits:", userTransactions.filter(t => t.type === "deposit").length);
    }
  }, [userTransactions]);

  function handleClose() {
    setEntered(false);
    setTimeout(() => onClose?.(), 200);
  }

  const methods = [
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

  const getFeesAndLimits = () => ({
    fee: "Gratuit",
    feePercentage: "0%",
    min: "100 HTG",
    max: "500,000 HTG",
    processingTime: "Instantané",
    note: "Aucun frais pour les dépôts",
  });

  // Hybrid dynamic quick amounts - NOW RETURNS 4 AMOUNTS
  const getSmartQuickAmounts = (): number[] => {
    // 1. Get user's deposit history
    const deposits = userTransactions
      .filter(t => t.type === "deposit" && t.amount > 0)
      .map(t => t.amount);
    
    console.log("💰 Deposit history:", deposits);
    
    // 2. If no history, return sensible defaults based on balance
    if (deposits.length === 0) {
      console.log("📭 No deposit history, using defaults");
      // Suggest amounts relative to balance
      const baseAmount = Math.min(userBalance || 10000, 10000);
      const amounts: number[] = [];
      
      // Generate 4 evenly spaced amounts up to ~30% of balance
      for (let i = 1; i <= 4; i++) {
        const percentage = 0.05 + (i - 1) * 0.05; // 5%, 10%, 15%, 20%
        const amount = Math.round(baseAmount * percentage / 100) * 100;
        if (amount > 0) amounts.push(Math.min(amount, 10000));
      }
      
      // Ensure we have at least some defaults
      if (amounts.length === 0 || amounts.every(a => a === 0)) {
        return [500, 1000, 2500, 5000];
      }
      
      // Dedupe and sort
      return [...new Set(amounts)].sort((a, b) => a - b).slice(0, 4);
    }
    
    // 3. Analyze frequency of deposit amounts (rounded to nearest 100)
    const frequencyMap: Record<number, { count: number; lastUsed: number }> = {};
    deposits.forEach((amount, index) => {
      const rounded = Math.round(amount / 100) * 100;
      if (!frequencyMap[rounded]) {
        frequencyMap[rounded] = { count: 0, lastUsed: index };
      }
      frequencyMap[rounded].count += 1;
      frequencyMap[rounded].lastUsed = Math.max(frequencyMap[rounded].lastUsed, index);
    });
    
    console.log("📊 Frequency map:", frequencyMap);
    
    // 4. Score each amount: frequency (70%) + recency (30%)
    const maxCount = Math.max(...Object.values(frequencyMap).map(v => v.count));
    const maxLastUsed = Math.max(...Object.values(frequencyMap).map(v => v.lastUsed));
    
    const scored = Object.entries(frequencyMap).map(([amount, data]) => {
      const frequencyScore = maxCount > 0 ? data.count / maxCount : 0;
      const recencyScore = maxLastUsed > 0 ? data.lastUsed / maxLastUsed : 0;
      // Weight: 70% frequency, 30% recency
      const totalScore = (frequencyScore * 0.7) + (recencyScore * 0.3);
      return { amount: Number(amount), score: totalScore };
    });
    
    console.log("🎯 Scored amounts:", scored);
    
    // 5. Sort by score and get top amounts - NOW ONLY 4
    const sorted = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ amount }) => amount);
    
    console.log("🏆 Top amounts:", sorted);
    
    // 6. If we got less than 4, add some defaults
    const defaults = [500, 1000, 2500, 5000];
    const result = [...sorted];
    let defaultIndex = 0;
    while (result.length < 4 && defaultIndex < defaults.length) {
      if (!result.includes(defaults[defaultIndex])) {
        result.push(defaults[defaultIndex]);
      }
      defaultIndex++;
    }
    
    // 7. Sort for better visual presentation
    return result.sort((a, b) => a - b).slice(0, 4);
  };

  // Get quick amounts with metadata for display
  const getQuickAmountsWithMetadata = () => {
    const amounts = getSmartQuickAmounts();
    const deposits = userTransactions
      .filter(t => t.type === "deposit" && t.amount > 0)
      .map(t => t.amount);
    
    return amounts.map(amount => {
      // Count how many times this amount was used (rounded)
      const count = deposits.filter(d => Math.round(d / 100) * 100 === amount).length;
      
      // Check if it's the most recent deposit
      const isMostRecent = deposits.length > 0 && 
        Math.round(deposits[deposits.length - 1] / 100) * 100 === amount;
      
      // Check if it's a frequent amount (used 2+ times)
      const isFrequent = count >= 2;
      
      // Calculate percentage of total deposits
      const percentage = deposits.length > 0 
        ? Math.round((count / deposits.length) * 100) 
        : 0;
      
      return {
        amount,
        isFrequent,
        isMostRecent,
        count,
        percentage,
      };
    });
  };

  // Format number with thousand separators
  const formatNumber = (value: string): string => {
    if (!value) return "";
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) return "";
    return num.toLocaleString("fr-FR");
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    if (raw === "") {
      setAmount("");
      setDisplayAmount("");
      return;
    }
    setAmount(raw);
    setDisplayAmount(formatNumber(raw));
  };

  // Handle quick amount selection
  const handleQuickAmount = (value: number) => {
    const strValue = value.toString();
    setAmount(strValue);
    setDisplayAmount(formatNumber(strValue));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getAmountStatus = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return null;
    const limits = getFeesAndLimits();
    const min = Number(limits.min.replace(/[^0-9.]/g, ""));
    const max = Number(limits.max.replace(/[^0-9.]/g, ""));
    if (numAmount < min) return { status: "min", message: `Minimum: ${limits.min}` };
    if (numAmount > max) return { status: "max", message: `Maximum: ${limits.max}` };
    return { status: "ok", message: "Montant valide" };
  };

  const handleAmountNext = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    const status = getAmountStatus();
    if (status && status.status !== "ok") {
      showToast?.(status.message);
      return;
    }
    setStep("method");
  };

  const handleMethodNext = () => {
    if (!selectedMethod) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (selectedMethod !== "moncash") {
      showToast?.("Cette méthode n'est pas encore disponible");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) return;

    // Set submitting state and switch to processing screen
    setIsSubmitting(true);
    setStep("processing");

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

      // Redirect to MonCash after a short delay to show the processing screen
      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 1500);
    } catch (err) {
      console.error("MonCash deposit failed:", err);
      showToast?.("Erreur lors du dépôt MonCash. Veuillez réessayer.");
      // Go back to confirm on error
      setStep("confirm");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "method") setStep("amount");
    else if (step === "confirm") setStep("method");
  };

  const resetAndClose = () => {
    setStep("amount");
    setAmount("");
    setDisplayAmount("");
    setSelectedMethod(null);
    setIsSubmitting(false);
    setReferenceId(null);
    handleClose();
  };

  const steps = ["amount", "method", "confirm"];
  const currentStepIndex = steps.indexOf(step);
  const fees = getFeesAndLimits();
  const amountStatus = getAmountStatus();
  const quickAmounts = getQuickAmountsWithMetadata();

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${SPACING.lg}px ${SPACING.lg}px ${SPACING.md}px`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: SPACING.sm }}>
            {(step === "method" || step === "confirm") && (
              <button
                onClick={handleBack}
                style={{
                  background: "transparent",
                  border: "none",
                  color: COLORS.textDim,
                  cursor: "pointer",
                  padding: SPACING.xs,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.xxl,
                fontWeight: TYPOGRAPHY.weight.semibold,
                color: COLORS.text,
              }}
            >
              {step === "amount" && "Dépôt"}
              {step === "method" && "Méthode de paiement"}
              {step === "confirm" && "Confirmation"}
              {step === "processing" && "Traitement en cours"}
            </span>
          </div>
          <button
            onClick={resetAndClose}
            style={{
              border: "none",
              background: COLORS.surface,
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.surface; }}
          >
            <X size={18} color={COLORS.textDim} />
          </button>
        </div>

        {/* Step Progress - Hide during processing */}
        {step !== "processing" && (
          <div
            style={{
              padding: `${SPACING.md}px ${SPACING.lg}px 0`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: SPACING.xs, alignItems: "center" }}>
              {steps.map((s, i) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: i <= currentStepIndex ? COLORS.accent : COLORS.border,
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: SPACING.xs,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.xs,
                color: COLORS.textDim,
                fontWeight: TYPOGRAPHY.weight.medium,
              }}
            >
              <span style={{ color: currentStepIndex >= 0 ? COLORS.accent : COLORS.textDim }}>
                Montant
              </span>
              <span style={{ color: currentStepIndex >= 1 ? COLORS.accent : COLORS.textDim }}>
                Méthode
              </span>
              <span style={{ color: currentStepIndex >= 2 ? COLORS.accent : COLORS.textDim }}>
                Confirmer
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: `${SPACING.lg}px ${SPACING.lg}px 0`,
          }}
        >
          {/* Step 1: Amount */}
          {step === "amount" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
                <label
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.md,
                    fontWeight: TYPOGRAPHY.weight.semibold,
                    color: COLORS.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Montant à déposer
                </label>
                <button
                  onClick={() => setShowFeesInfo(!showFeesInfo)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: COLORS.textDim,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING.xs,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.sm,
                  }}
                >
                  <Info size={14} />
                  Frais
                </button>
              </div>

              {/* Clean Input Field */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: COLORS.surface,
                  border: `1px solid ${
                    amountStatus && amountStatus.status === "min" ? COLORS.error :
                    amountStatus && amountStatus.status === "max" ? COLORS.error :
                    amount && amountStatus?.status === "ok" ? COLORS.accent :
                    COLORS.border
                  }`,
                  borderRadius: 8,
                  padding: `0 ${SPACING.md}px`,
                  transition: "border-color 0.2s",
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: `14px 0`,
                    fontFamily: TYPOGRAPHY.fontMono,
                    fontSize: TYPOGRAPHY.size.display,
                    fontWeight: TYPOGRAPHY.weight.semibold,
                    color: COLORS.text,
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.lg,
                    fontWeight: TYPOGRAPHY.weight.medium,
                    color: COLORS.textDim,
                    paddingLeft: SPACING.sm,
                    flexShrink: 0,
                    userSelect: "none",
                  }}
                >
                  HTG
                </span>
              </div>

              {amount && amountStatus && amountStatus.status !== "ok" && (
                <div
                  style={{
                    marginTop: SPACING.xs,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.md,
                    color: COLORS.error,
                  }}
                >
                  {amountStatus.message}
                </div>
              )}

              {/* Dynamic Quick Amount Presets with Enhanced Visuals - NOW 4 BUTTONS */}
              <div
                style={{
                  display: "flex",
                  gap: SPACING.sm,
                  flexWrap: "wrap",
                  marginTop: SPACING.md,
                }}
              >
                {quickAmounts.map(({ amount: amt, isFrequent, isMostRecent, count, percentage }) => {
                  const isSelected = parseFloat(amount) === amt;
                  
                  return (
                    <button
                      key={amt}
                      onClick={() => handleQuickAmount(amt)}
                      style={{
                        flex: 1,
                        minWidth: 60,
                        padding: `${SPACING.sm}px ${SPACING.md}px`,
                        paddingTop: isFrequent ? `${SPACING.md}px` : `${SPACING.sm}px`,
                        paddingBottom: isFrequent ? `${SPACING.sm}px` : `${SPACING.sm}px`,
                        background: isSelected 
                          ? COLORS.accentDim 
                          : isFrequent 
                            ? COLORS.accentSubtle
                            : COLORS.surface,
                        border: `1px solid ${
                          isSelected 
                            ? COLORS.accent 
                            : isFrequent 
                              ? COLORS.accentDim 
                              : COLORS.border
                        }`,
                        borderRadius: 8,
                        color: isSelected 
                          ? COLORS.accent 
                          : isFrequent 
                            ? COLORS.accent 
                            : COLORS.textDim,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: isSelected ? TYPOGRAPHY.size.xl : TYPOGRAPHY.size.lg,
                        fontWeight: isSelected ? TYPOGRAPHY.weight.semibold : TYPOGRAPHY.weight.medium,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textAlign: "center",
                        transform: "scale(1)",
                        WebkitTapHighlightColor: "transparent",
                        boxShadow: isSelected 
                          ? `0 0 0 2px ${COLORS.accent}33` 
                          : isFrequent 
                            ? `0 0 0 1px ${COLORS.accent}22` 
                            : "none",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = COLORS.text;
                          e.currentTarget.style.background = COLORS.surfaceHover;
                          e.currentTarget.style.borderColor = COLORS.textDim;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = isFrequent ? COLORS.accent : COLORS.textDim;
                          e.currentTarget.style.background = isFrequent ? COLORS.accentSubtle : COLORS.surface;
                          e.currentTarget.style.borderColor = isFrequent ? COLORS.accentDim : COLORS.border;
                        }
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = "scale(0.96)";
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {/* Amount */}
                      <div style={{ position: "relative", zIndex: 1 }}>
                        {amt.toLocaleString("fr-FR")}
                      </div>
                      
                      {/* Percentage bar for frequent amounts */}
                      {isFrequent && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: COLORS.accentDim,
                            borderRadius: "0 0 8px 8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              height: "100%",
                              background: COLORS.accent,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Frequent badge with star */}
                      {isFrequent && (
                        <div
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            background: COLORS.accent,
                            color: "#111",
                            fontSize: TYPOGRAPHY.size.xs,
                            fontWeight: TYPOGRAPHY.weight.bold,
                            padding: "2px 8px",
                            borderRadius: 12,
                            lineHeight: 1.6,
                            boxShadow: "0 2px 8px rgba(14,203,129,0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            zIndex: 2,
                          }}
                        >
                          <Star size={10} fill={COLORS.accent} /> {count}x
                        </div>
                      )}
                      
                      {/* Most recent badge */}
                      {isMostRecent && !isFrequent && (
                        <div
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: COLORS.warningDim,
                            color: COLORS.warning,
                            fontSize: TYPOGRAPHY.size.xs,
                            fontWeight: TYPOGRAPHY.weight.semibold,
                            padding: "1px 8px",
                            borderRadius: 10,
                            lineHeight: 1.4,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Clock size={10} /> Récent
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend - Explain the badges */}
              {userTransactions.filter(t => t.type === "deposit").length > 0 && (
                <div
                  style={{
                    marginTop: SPACING.sm,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: SPACING.lg,
                    flexWrap: "wrap",
                    padding: `${SPACING.xs}px 0`,
                    borderTop: `1px solid ${COLORS.borderLight}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING.xs }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        background: COLORS.accentSubtle,
                        border: `1px solid ${COLORS.accentDim}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.sm,
                        color: COLORS.textDim,
                      }}
                    >
                      Utilisé fréquemment
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING.xs }}>
                    <Clock size={12} color={COLORS.warning} />
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.sm,
                        color: COLORS.textDim,
                      }}
                    >
                      Dernier dépôt
                    </span>
                  </div>
                </div>
              )}

              {/* Show hint when there's deposit history */}
              {userTransactions.filter(t => t.type === "deposit").length > 0 && (
                <div
                  style={{
                    marginTop: SPACING.xs,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.sm,
                    color: COLORS.textDim,
                    textAlign: "center",
                    opacity: 0.6,
                  }}
                >
                  <TrendingUp size={12} style={{ display: "inline", marginRight: 4 }} />
                  Basé sur vos {userTransactions.filter(t => t.type === "deposit").length} dépôts récents
                </div>
              )}

              {/* Fees & Limits */}
              <div
                style={{
                  marginTop: SPACING.md,
                  background: COLORS.surface,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderBottom: showFeesInfo ? `1px solid ${COLORS.border}` : "none",
                  }}
                >
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.lg, color: COLORS.textDim }}>
                    Frais
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamily,
                      fontSize: TYPOGRAPHY.size.lg,
                      fontWeight: TYPOGRAPHY.weight.semibold,
                      color: fees.fee === "Gratuit" ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {fees.fee}
                  </span>
                </div>

                {showFeesInfo && (
                  <div style={{ padding: `${SPACING.sm}px ${SPACING.md}px ${SPACING.md}px` }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: `${SPACING.xs}px 0`,
                      }}
                    >
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.textDim }}>
                        Taux
                      </span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.text }}>
                        {fees.feePercentage}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: `${SPACING.xs}px 0`,
                      }}
                    >
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.textDim }}>
                        Minimum
                      </span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.text }}>
                        {fees.min}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: `${SPACING.xs}px 0`,
                      }}
                    >
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.textDim }}>
                        Maximum
                      </span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.text }}>
                        {fees.max}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: `${SPACING.xs}px 0`,
                      }}
                    >
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.textDim }}>
                        Traitement
                      </span>
                      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, color: COLORS.text }}>
                        {fees.processingTime}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: SPACING.xs,
                        padding: SPACING.xs,
                        background: COLORS.warningDim,
                        borderRadius: 4,
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.sm,
                        color: COLORS.warning,
                      }}
                    >
                      ℹ️ {fees.note}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Method */}
          {step === "method" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.md,
                  fontWeight: TYPOGRAPHY.weight.semibold,
                  color: COLORS.textDim,
                  marginBottom: SPACING.sm,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Choisissez votre méthode
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
                {methods.map(({ key, label, color, icon, description }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMethod(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: SPACING.md,
                      padding: `${SPACING.md}px ${SPACING.lg}px`,
                      background: selectedMethod === key ? COLORS.surfaceHover : "transparent",
                      border: `1px solid ${selectedMethod === key ? color : COLORS.border}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.md,
                        fontWeight: TYPOGRAPHY.weight.bold,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.fontFamily,
                          fontSize: TYPOGRAPHY.size.xl,
                          fontWeight: TYPOGRAPHY.weight.semibold,
                          color: COLORS.text,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: TYPOGRAPHY.fontFamily,
                          fontSize: TYPOGRAPHY.size.md,
                          color: COLORS.textDim,
                        }}
                      >
                        {description}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid ${selectedMethod === key ? color : COLORS.border}`,
                        background: selectedMethod === key ? color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      {selectedMethod === key && (
                        <CheckCircle size={12} color="#fff" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div>
              <div
                style={{
                  background: COLORS.surface,
                  borderRadius: 8,
                  padding: SPACING.lg,
                  marginBottom: SPACING.lg,
                }}
              >
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.md,
                    fontWeight: TYPOGRAPHY.weight.semibold,
                    color: COLORS.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: SPACING.sm,
                  }}
                >
                  Résumé
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${SPACING.sm}px 0`,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, color: COLORS.textDim }}>
                    Montant
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.fontMono,
                      fontSize: TYPOGRAPHY.size.xxxl,
                      fontWeight: TYPOGRAPHY.weight.semibold,
                      color: COLORS.text,
                    }}
                  >
                    {parseFloat(amount).toLocaleString("fr-FR")} HTG
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${SPACING.sm}px 0`,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, color: COLORS.textDim }}>
                    Frais
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamily,
                      fontSize: TYPOGRAPHY.size.xl,
                      fontWeight: TYPOGRAPHY.weight.medium,
                      color: fees.fee === "Gratuit" ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {fees.fee}
                  </span>
                </div>
                {selectedMethod && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: SPACING.sm,
                    }}
                  >
                    <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.xl, color: COLORS.textDim }}>
                      Méthode
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.fontFamily,
                        fontSize: TYPOGRAPHY.size.xl,
                        fontWeight: TYPOGRAPHY.weight.medium,
                        color: COLORS.text,
                      }}
                    >
                      {methods.find(m => m.key === selectedMethod)?.label}
                    </span>
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.md,
                  color: COLORS.textDim,
                  textAlign: "center",
                }}
              >
                Vous serez redirigé vers le paiement
              </div>
            </div>
          )}

          {/* Step 4: Processing - Final Screen */}
          {step === "processing" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: `${SPACING.xxxl}px 0`,
                minHeight: 300,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: `3px solid ${COLORS.border}`,
                  borderTopColor: COLORS.accent,
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div
                style={{
                  marginTop: SPACING.lg,
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.xxl,
                  fontWeight: TYPOGRAPHY.weight.semibold,
                  color: COLORS.text,
                }}
              >
                Traitement en cours
              </div>
              <div
                style={{
                  marginTop: SPACING.sm,
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.lg,
                  color: COLORS.textDim,
                  textAlign: "center",
                }}
              >
                Redirection vers MonCash...
              </div>
              {referenceId && (
                <div
                  style={{
                    marginTop: SPACING.md,
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    background: COLORS.surface,
                    borderRadius: 6,
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.size.md,
                    color: COLORS.textDim,
                  }}
                >
                  Réf: {referenceId.slice(0, 8)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Hide during processing */}
        {step !== "processing" && (
          <div
            style={{
              padding: `${SPACING.lg}px ${SPACING.lg}px`,
              flexShrink: 0,
            }}
          >
            <button
              onClick={
                step === "amount" ? handleAmountNext :
                step === "method" ? handleMethodNext :
                step === "confirm" ? handleConfirm :
                undefined
              }
              disabled={
                (step === "amount" && (!amount || parseFloat(amount) <= 0)) ||
                (step === "method" && !selectedMethod) ||
                (step === "confirm" && isSubmitting)
              }
              style={{
                width: "100%",
                padding: `14px`,
                background: (
                  (step === "amount" && amount && parseFloat(amount) > 0 && amountStatus?.status === "ok") ||
                  (step === "method" && selectedMethod) ||
                  (step === "confirm")
                ) ? COLORS.accent : COLORS.border,
                border: "none",
                borderRadius: 8,
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.xl,
                fontWeight: TYPOGRAPHY.weight.semibold,
                color: (
                  (step === "amount" && amount && parseFloat(amount) > 0 && amountStatus?.status === "ok") ||
                  (step === "method" && selectedMethod) ||
                  (step === "confirm")
                ) ? "#111" : COLORS.textMuted,
                cursor: (
                  (step === "amount" && amount && parseFloat(amount) > 0 && amountStatus?.status === "ok") ||
                  (step === "method" && selectedMethod) ||
                  (step === "confirm")
                ) ? "pointer" : "default",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING.sm,
              }}
            >
              {step === "amount" && "Continuer"}
              {step === "method" && "Continuer"}
              {step === "confirm" && (isSubmitting ? "Traitement..." : "Confirmer le dépôt")}
              {(step === "amount" || step === "method") && (
                <ChevronRight size={18} />
              )}
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