import type { FeesInfo } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface FeesInfoProps {
  fees: FeesInfo;
  showFeesInfo: boolean;
  onToggle: () => void;
}

export function FeesInfo({ fees, showFeesInfo, onToggle }: FeesInfoProps) {
  return (
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
  );
}