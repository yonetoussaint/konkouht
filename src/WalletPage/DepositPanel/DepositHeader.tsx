import { X, ArrowLeft } from "lucide-react";
import type { Step } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface DepositHeaderProps {
  step: Step;
  onBack: () => void;
  onClose: () => void;
  showBack: boolean;
}

export function DepositHeader({ step, onBack, onClose, showBack }: DepositHeaderProps) {
  const getTitle = () => {
    switch (step) {
      case "amount": return "Dépôt";
      case "method": return "Méthode de paiement";
      case "confirm": return "Confirmation";
      case "processing": return "Traitement en cours";
      case "success": return "Succès !";
      default: return "Dépôt";
    }
  };

  return (
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
        {showBack && (
          <button
            onClick={onBack}
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
          {getTitle()}
        </span>
      </div>
      <button
        onClick={onClose}
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
  );
}