import { useState, useEffect } from "react";
import { X, Copy, CheckCircle, ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// Design tokens
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
  bg: "#111",
  surface: "#1a1a1e",
  surfaceRaised: "#22262d",
  border: "#2a2a2e",
  text: "#f2f2f2",
  textDim: "#848e9c",
  accent: "#0ecb81",
  accentDim: "rgba(14, 203, 129, 0.12)",
  error: "#f6465d",
};

type Step = "amount" | "method" | "confirm" | "processing" | "success";

interface DepositPanelProps {
  onClose: () => void;
  showToast?: (message: string) => void;
}

export default function DepositPanel({ onClose, showToast }: DepositPanelProps) {
  const [entered, setEntered] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"HTG" | "USDT">("HTG");
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

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
      description: "Pay with MonCash mobile money",
    },
    {
      key: "natcash",
      label: "NatCash",
      color: "#2a9d8f",
      icon: "NC",
      description: "Pay with NatCash mobile money",
    },
  ];

  const usdtAddress = "TRX1234567890abcdef1234567890abcdef12";

  // Step handlers
  const handleAmountNext = () => {
    if (!amount || Number(amount) <= 0) return;
    if (currency === "USDT") {
      setStep("confirm");
    } else {
      setStep("method");
    }
  };

  const handleMethodNext = () => {
    if (!selectedMethod) return;
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (currency === "USDT") {
      navigator.clipboard?.writeText(usdtAddress);
      showToast?.("Address copied");
      setStep("success");
      return;
    }

    if (selectedMethod !== "moncash") {
      showToast?.("This deposit method isn't available yet");
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return;

    setSubmitting(true);
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

      setStep("success");
      
      setTimeout(() => {
        window.location.href = data.paymentUrl;
      }, 1500);
    } catch (err) {
      console.error("MonCash deposit failed:", err);
      showToast?.("Could not start the MonCash deposit. Please try again.");
      setStep("confirm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "method") setStep("amount");
    else if (step === "confirm") {
      if (currency === "USDT") setStep("amount");
      else setStep("method");
    }
  };

  const resetAndClose = () => {
    setStep("amount");
    setAmount("");
    setSelectedMethod(null);
    handleClose();
  };

  // Step indicators
  const steps = currency === "USDT" 
    ? ["amount", "confirm"] 
    : ["amount", "method", "confirm"];

  const currentStepIndex = steps.indexOf(step);

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
            borderBottom: `1px solid ${COLORS.border}`,
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
                fontFamily: "Inter, sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.text,
              }}
            >
              {step === "amount" && "Dépôt"}
              {step === "method" && "Méthode de paiement"}
              {step === "confirm" && "Confirmation"}
              {step === "processing" && "Traitement en cours"}
              {step === "success" && "Succès !"}
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
            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.border; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.surface; }}
          >
            <X size={18} color={COLORS.textDim} />
          </button>
        </div>

        {/* Step Progress */}
        {step !== "processing" && step !== "success" && (
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
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                color: COLORS.textDim,
                fontWeight: 500,
              }}
            >
              <span style={{ color: currentStepIndex >= 0 ? COLORS.accent : COLORS.textDim }}>
                Montant
              </span>
              {currency !== "USDT" && (
                <span style={{ color: currentStepIndex >= 1 ? COLORS.accent : COLORS.textDim }}>
                  Méthode
                </span>
              )}
              <span style={{ color: currentStepIndex >= steps.length - 1 ? COLORS.accent : COLORS.textDim }}>
                Confirmer
              </span>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
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
              <label
                style={{
                  display: "block",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.textDim,
                  marginBottom: SPACING.sm,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Montant à déposer
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = COLORS.accent;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    padding: `14px ${SPACING.md}px`,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 24,
                    fontWeight: 600,
                    color: COLORS.text,
                    outline: "none",
                  }}
                />
                <div style={{ position: "relative", borderLeft: `1px solid ${COLORS.border}` }}>
                  <button
                    onClick={() => setCurrency(c => c === "HTG" ? "USDT" : "HTG")}
                    style={{
                      height: "100%",
                      padding: `0 ${SPACING.md}px`,
                      background: "transparent",
                      border: "none",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.textDim,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {currency}
                    <span style={{ fontSize: 10, opacity: 0.5 }}>↻</span>
                  </button>
                </div>
              </div>
              {currency === "USDT" && (
                <div
                  style={{
                    marginTop: SPACING.sm,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color: COLORS.textDim,
                    background: COLORS.surface,
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: 6,
                  }}
                >
                  ⚡ Vous déposerez en USDT sur le réseau TRC-20
                </div>
              )}
            </div>
          )}

          {/* Step 2: Method */}
          {step === "method" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
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
                      background: selectedMethod === key ? COLORS.surfaceRaised : "transparent",
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
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.text,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 12,
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
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
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
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.textDim }}>
                    Montant
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 18,
                      fontWeight: 600,
                      color: COLORS.text,
                    }}
                  >
                    {Number(amount).toLocaleString("fr-FR")} {currency}
                  </span>
                </div>
                {currency === "HTG" && selectedMethod && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: SPACING.sm,
                    }}
                  >
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: COLORS.textDim }}>
                      Méthode
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLORS.text,
                      }}
                    >
                      {methods.find(m => m.key === selectedMethod)?.label}
                    </span>
                  </div>
                )}
                {currency === "USDT" && (
                  <div
                    style={{
                      marginTop: SPACING.sm,
                      padding: SPACING.sm,
                      background: COLORS.accentDim,
                      borderRadius: 6,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      color: COLORS.accent,
                    }}
                  >
                    ⚠️ Assurez-vous d'envoyer sur le réseau TRC-20
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  color: COLORS.textDim,
                  textAlign: "center",
                }}
              >
                {currency === "USDT" 
                  ? "L'adresse sera copiée pour le paiement"
                  : "Vous serez redirigé vers le paiement"
                }
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {step === "processing" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: `${SPACING.xxxl}px 0`,
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
                  fontFamily: "Inter, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                Traitement en cours
              </div>
              <div
                style={{
                  marginTop: SPACING.sm,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: COLORS.textDim,
                }}
              >
                Veuillez patienter...
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: `${SPACING.xxxl}px 0`,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: COLORS.accentDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={32} color={COLORS.accent} />
              </div>
              <div
                style={{
                  marginTop: SPACING.lg,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.text,
                }}
              >
                {currency === "USDT" ? "Adresse copiée !" : "Commande créée !"}
              </div>
              <div
                style={{
                  marginTop: SPACING.sm,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: COLORS.textDim,
                  textAlign: "center",
                }}
              >
                {currency === "USDT" 
                  ? "Vous pouvez maintenant effectuer le paiement"
                  : "Vous allez être redirigé vers MonCash"
                }
              </div>
              {referenceId && (
                <div
                  style={{
                    marginTop: SPACING.md,
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    background: COLORS.surface,
                    borderRadius: 6,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color: COLORS.textDim,
                  }}
                >
                  Réf: {referenceId.slice(0, 8)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Action Button (no separator) */}
        {step !== "processing" && step !== "success" && (
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
                (step === "amount" && (!amount || Number(amount) <= 0)) ||
                (step === "method" && !selectedMethod) ||
                (step === "confirm" && submitting)
              }
              style={{
                width: "100%",
                padding: `14px`,
                background: (
                  (step === "amount" && amount && Number(amount) > 0) ||
                  (step === "method" && selectedMethod) ||
                  (step === "confirm")
                ) ? COLORS.accent : COLORS.border,
                border: "none",
                borderRadius: 8,
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: (
                  (step === "amount" && amount && Number(amount) > 0) ||
                  (step === "method" && selectedMethod) ||
                  (step === "confirm")
                ) ? "#111" : COLORS.textDim,
                cursor: (
                  (step === "amount" && amount && Number(amount) > 0) ||
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
              {step === "confirm" && (submitting ? "Traitement..." : "Confirmer le dépôt")}
              {(step === "amount" || step === "method") && (
                <ChevronRight size={18} />
              )}
            </button>
          </div>
        )}

        {/* Footer - Close button for success/processing (no separator) */}
        {(step === "processing" || step === "success") && (
          <div
            style={{
              padding: `${SPACING.lg}px ${SPACING.lg}px`,
              flexShrink: 0,
            }}
          >
            {step === "success" && (
              <button
                onClick={resetAndClose}
                style={{
                  width: "100%",
                  padding: `14px`,
                  background: COLORS.border,
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.text,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.surfaceRaised; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.border; }}
              >
                Fermer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}