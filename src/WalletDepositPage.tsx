import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Copy, Info, Loader2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import type { Transaction } from "./WalletPage/types";

type Step = "amount" | "method" | "confirm" | "processing";

interface WalletDepositPageProps {
  balance?: number;
  transactions?: Transaction[];
  onBack: () => void;
  showToast?: (message: string, type?: string) => void;
}

const C = {
  bg: "#0d0f12",
  surface: "#14171c",
  raised: "#1b2026",
  border: "#2a2f36",
  text: "#eef0f2",
  dim: "#858c96",
  muted: "#626a75",
  accent: "#0ecb81",
  accentDim: "rgba(14,203,129,.12)",
  danger: "#f6465d",
};

const formatHTG = (value: number) =>
  `${Math.round(value).toLocaleString("fr-FR")} HTG`;

export default function WalletDepositPage({
  balance = 0,
  transactions = [],
  onBack,
  showToast,
}: WalletDepositPageProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (step === "amount") inputRef.current?.focus();
  }, [step]);

  const quickAmounts = useMemo(() => {
    const deposits = transactions
      .filter((t) => t.type === "deposit" && t.amount > 0)
      .map((t) => Math.round(t.amount / 100) * 100);

    const defaults = [500, 1000, 2500, 5000];
    if (!deposits.length) return defaults;

    const counts = new Map<number, number>();
    deposits.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    const frequent = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value]) => value)
      .slice(0, 4);

    return [...new Set([...frequent, ...defaults])].slice(0, 4).sort((a, b) => a - b);
  }, [transactions]);

  const numericAmount = Number(amount.replace(/,/g, ""));
  const amountValid = numericAmount >= 100 && numericAmount <= 500000;

  const setAmountValue = (value: string) => {
    const raw = value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    if (!raw) {
      setAmount("");
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    setAmount(parsed.toLocaleString("fr-FR"));
  };

  const goNext = () => {
    if (step === "amount") {
      if (!numericAmount) return;
      if (numericAmount < 100) {
        showToast?.("Minimum: 100 HTG");
        return;
      }
      if (numericAmount > 500000) {
        showToast?.("Maximum: 500,000 HTG");
        return;
      }
      setStep("method");
    } else if (step === "method") {
      if (selectedMethod) setStep("confirm");
    }
  };

  const goBack = () => {
    if (step === "method") setStep("amount");
    else if (step === "confirm") setStep("method");
    else if (step === "amount") onBack();
  };

  const handleConfirm = async () => {
    if (selectedMethod !== "moncash" || !amountValid || isSubmitting) return;

    setIsSubmitting(true);
    setStep("processing");

    try {
      const { data, error } = await supabase.functions.invoke("moncash-create-deposit", {
        body: { amount: numericAmount },
      });

      if (error || !data?.paymentUrl) throw error || new Error("No payment URL returned");

      if (data.referenceId) {
        setReferenceId(data.referenceId);
        try {
          localStorage.setItem("pendingMoncashDeposit", data.referenceId);
        } catch {}
      }

      window.location.href = data.paymentUrl;
    } catch (error) {
      console.error("MonCash deposit failed:", error);
      showToast?.("Erreur lors du dépôt MonCash. Veuillez réessayer.");
      setStep("confirm");
      setIsSubmitting(false);
    }
  };

  const copyReference = async () => {
    if (!referenceId) return;
    try {
      await navigator.clipboard.writeText(referenceId);
      showToast?.("Référence copiée", "success");
    } catch {}
  };

  const stepIndex = ["amount", "method", "confirm"].indexOf(step);

  return (
    <div
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        background: C.bg,
        color: C.text,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 64,
          padding: "8px max(16px, env(safe-area-inset-left, 0px))",
          background: "rgba(13,15,18,.96)",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label={step === "amount" ? "Retour au portefeuille" : "Étape précédente"}
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            background: C.surface,
            color: C.text,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>Déposer des fonds</div>
          <div style={{ marginTop: 2, fontSize: 11, color: C.dim }}>Portefeuille · HTG</div>
        </div>
      </header>

      <main style={{ width: "100%", maxWidth: 640, margin: "0 auto", padding: "20px 16px 40px" }}>
        {step !== "processing" && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {["Montant", "Méthode", "Confirmation"].map((label, index) => (
                <div key={label} style={{ display: "flex", alignItems: "center", flex: index < 2 ? 1 : 0, minWidth: 0 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: index <= stepIndex ? C.accent : C.raised,
                      color: index <= stepIndex ? "#07150f" : C.dim,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </div>
                  <span style={{ marginLeft: 7, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: index <= stepIndex ? C.text : C.dim }}>
                    {label}
                  </span>
                  {index < 2 && <div style={{ height: 1, flex: 1, minWidth: 10, margin: "0 8px", background: index < stepIndex ? C.accent : C.border }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "amount" && (
          <section>
            <div style={{ marginBottom: 18 }}>
              <h1 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.03em" }}>Combien voulez-vous déposer ?</h1>
              <p style={{ margin: "8px 0 0", color: C.dim, fontSize: 13, lineHeight: 1.5 }}>Choisissez un montant entre 100 HTG et 500 000 HTG.</p>
            </div>

            <div style={{ padding: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <label htmlFor="deposit-amount" style={{ display: "block", marginBottom: 9, color: C.dim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>
                Montant
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="deposit-amount"
                  ref={inputRef}
                  inputMode="decimal"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="0"
                  style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", color: C.text, fontSize: 32, fontWeight: 700, letterSpacing: "-.03em" }}
                />
                <span style={{ flexShrink: 0, color: C.dim, fontSize: 13, fontWeight: 700 }}>HTG</span>
              </div>
              {amount && !amountValid && <div style={{ marginTop: 8, color: C.danger, fontSize: 12 }}>{numericAmount < 100 ? "Minimum: 100 HTG" : "Maximum: 500,000 HTG"}</div>}
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ marginBottom: 10, color: C.dim, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Montants rapides</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {quickAmounts.map((value) => (
                  <button key={value} type="button" onClick={() => setAmountValue(String(value))} style={{ minHeight: 52, border: `1px solid ${amount === value.toLocaleString("fr-FR") ? C.accent : C.border}`, borderRadius: 12, background: amount === value.toLocaleString("fr-FR") ? C.accentDim : C.surface, color: C.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {formatHTG(value)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 18, padding: 13, borderRadius: 12, background: C.surface, color: C.dim, fontSize: 12, lineHeight: 1.45 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Aucun frais pour les dépôts. Le crédit est effectué après confirmation du paiement.</span>
            </div>

            <button type="button" disabled={!amountValid} onClick={goNext} style={{ width: "100%", minHeight: 52, marginTop: 20, border: "none", borderRadius: 13, background: amountValid ? C.accent : C.raised, color: amountValid ? "#07150f" : C.muted, fontSize: 14, fontWeight: 800, cursor: amountValid ? "pointer" : "not-allowed" }}>
              Continuer <ChevronRight size={17} style={{ verticalAlign: "-4px" }} />
            </button>
          </section>
        )}

        {step === "method" && (
          <section>
            <h1 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.03em" }}>Choisissez votre méthode</h1>
            <p style={{ margin: "8px 0 18px", color: C.dim, fontSize: 13 }}>Votre dépôt sera traité en gourdes haïtiennes.</p>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                { key: "moncash", label: "MonCash", description: "Paiement mobile rapide", mark: "MC" },
                { key: "natcash", label: "NatCash", description: "Paiement mobile", mark: "NC" },
              ].map((method) => {
                const selected = selectedMethod === method.key;
                const available = method.key === "moncash";
                return (
                  <button key={method.key} type="button" disabled={!available} onClick={() => setSelectedMethod(method.key)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: 15, textAlign: "left", border: `1px solid ${selected ? C.accent : C.border}`, borderRadius: 15, background: selected ? C.accentDim : C.surface, color: C.text, opacity: available ? 1 : .55, cursor: available ? "pointer" : "not-allowed" }}>
                    <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", background: C.raised, fontSize: 12, fontWeight: 800 }}>{method.mark}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ display: "block", fontSize: 14 }}>{method.label}</strong>
                      <span style={{ display: "block", marginTop: 3, color: C.dim, fontSize: 12 }}>{available ? method.description : "Bientôt disponible"}</span>
                    </span>
                    {selected && <CheckCircle2 size={20} color={C.accent} />}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18, padding: 15, borderRadius: 14, background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Montant</div>
              <div style={{ marginTop: 5, fontSize: 20, fontWeight: 750 }}>{formatHTG(numericAmount)}</div>
              <div style={{ marginTop: 4, color: C.accent, fontSize: 12 }}>Frais: 0 HTG</div>
            </div>

            <button type="button" disabled={!selectedMethod} onClick={goNext} style={{ width: "100%", minHeight: 52, marginTop: 20, border: "none", borderRadius: 13, background: selectedMethod ? C.accent : C.raised, color: selectedMethod ? "#07150f" : C.muted, fontSize: 14, fontWeight: 800, cursor: selectedMethod ? "pointer" : "not-allowed" }}>Continuer <ChevronRight size={17} style={{ verticalAlign: "-4px" }} /></button>
          </section>
        )}

        {step === "confirm" && (
          <section>
            <h1 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.03em" }}>Confirmez votre dépôt</h1>
            <p style={{ margin: "8px 0 18px", color: C.dim, fontSize: 13 }}>Vérifiez les informations avant de continuer vers MonCash.</p>

            <div style={{ overflow: "hidden", border: `1px solid ${C.border}`, borderRadius: 16, background: C.surface }}>
              <div style={{ padding: 18, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>Total du dépôt</div>
                <div style={{ marginTop: 6, fontSize: 30, fontWeight: 800, letterSpacing: "-.03em" }}>{formatHTG(numericAmount)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, padding: 18, fontSize: 13 }}>
                <span style={{ color: C.dim }}>Méthode</span><strong>MonCash</strong>
                <span style={{ color: C.dim }}>Frais</span><strong>0 HTG</strong>
                <span style={{ color: C.dim }}>Solde actuel</span><strong>{formatHTG(balance)}</strong>
                <span style={{ color: C.dim }}>Après dépôt</span><strong style={{ color: C.accent }}>{formatHTG(balance + numericAmount)}</strong>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: 14, borderRadius: 13, background: C.accentDim, color: C.text, fontSize: 12, lineHeight: 1.5 }}>
              Vous serez redirigé vers MonCash pour autoriser le paiement. Ne fermez pas la page avant la fin de la redirection.
            </div>

            <button type="button" onClick={handleConfirm} disabled={isSubmitting} style={{ width: "100%", minHeight: 54, marginTop: 20, border: "none", borderRadius: 13, background: C.accent, color: "#07150f", fontSize: 14, fontWeight: 800, cursor: isSubmitting ? "wait" : "pointer" }}>
              {isSubmitting ? "Préparation du paiement…" : "Continuer vers MonCash"}
            </button>
          </section>
        )}

        {step === "processing" && (
          <section style={{ minHeight: "calc(100dvh - 105px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", textAlign: "center", padding: 22 }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.accentDim, color: C.accent }}>
                <Loader2 size={28} className="wallet-deposit-spin" />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, letterSpacing: "-.03em" }}>Préparation du paiement</h1>
              <p style={{ margin: "10px auto 0", maxWidth: 390, color: C.dim, fontSize: 13, lineHeight: 1.55 }}>Nous préparons votre paiement MonCash de {formatHTG(numericAmount)}.</p>
              {referenceId && (
                <button type="button" onClick={copyReference} style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", background: C.surface, color: C.dim, fontSize: 11, cursor: "pointer" }}>
                  <Copy size={14} /> Référence: {referenceId}
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <style>{`.wallet-deposit-spin{animation:walletDepositSpin .9s linear infinite}@keyframes walletDepositSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
