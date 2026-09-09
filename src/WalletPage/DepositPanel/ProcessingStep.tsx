import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

export function ProcessingStep() {
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
        }}
      >
        Veuillez patienter...
      </div>
    </div>
  );
}