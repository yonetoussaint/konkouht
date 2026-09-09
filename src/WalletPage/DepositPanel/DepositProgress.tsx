import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface DepositProgressProps {
  steps: string[];
  currentIndex: number;
}

export function DepositProgress({ steps, currentIndex }: DepositProgressProps) {
  if (currentIndex >= steps.length) return null;

  return (
    <div
      style={{
        padding: `${SPACING.md}px ${SPACING.lg}px 0`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: SPACING.xs, alignItems: "center" }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= currentIndex ? COLORS.accent : COLORS.border,
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
        {steps.map((label, i) => (
          <span
            key={i}
            style={{
              color: i <= currentIndex ? COLORS.accent : COLORS.textDim,
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}