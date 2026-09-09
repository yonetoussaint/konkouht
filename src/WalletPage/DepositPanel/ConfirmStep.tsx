import type { FeesInfo } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface ConfirmStepProps {
  amount: string;
  selectedMethod: string | null;
  fees: FeesInfo;
  onConfirm: () => void;
  submitting: boolean;
  methodLabel?: string;
}

export function ConfirmStep({
  amount,
  selectedMethod,
  fees,
  onConfirm,
  submitting,
  methodLabel,
}: ConfirmStepProps) {
  const numAmount = parseFloat(amount);

  return (
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
            {numAmount.toLocaleString("fr-FR")} HTG
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
        {selectedMethod && methodLabel && (
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
              {methodLabel}
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
          marginBottom: SPACING.lg,
        }}
      >
        Vous serez redirigé vers le paiement
      </div>

      <button
        onClick={onConfirm}
        disabled={submitting}
        style={{
          width: "100%",
          padding: `14px`,
          background: submitting ? COLORS.border : COLORS.accent,
          border: "none",
          borderRadius: 8,
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: TYPOGRAPHY.weight.semibold,
          color: submitting ? COLORS.textMuted : "#111",
          cursor: submitting ? "default" : "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACING.sm,
        }}
      >
        {submitting ? "Traitement..." : "Confirmer le dépôt"}
      </button>
    </div>
  );
}