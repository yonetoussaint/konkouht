import { CheckCircle } from "lucide-react";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface SuccessStepProps {
  referenceId: string | null;
  onClose: () => void;
}

export function SuccessStep({ referenceId, onClose }: SuccessStepProps) {
  return (
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
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.size.xxxl,
          fontWeight: TYPOGRAPHY.weight.bold,
          color: COLORS.text,
        }}
      >
        Commande créée !
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
        Vous allez être redirigé vers MonCash
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
      <button
        onClick={onClose}
        style={{
          width: "100%",
          marginTop: SPACING.lg,
          padding: `14px`,
          background: COLORS.border,
          border: "none",
          borderRadius: 8,
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: TYPOGRAPHY.weight.semibold,
          color: COLORS.text,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.surfaceHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.border; }}
      >
        Fermer
      </button>
    </div>
  );
}