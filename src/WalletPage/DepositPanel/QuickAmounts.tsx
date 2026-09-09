import { Star } from "lucide-react";
import type { AmountWithMetadata } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface QuickAmountsProps {
  amounts: AmountWithMetadata[];
  selectedAmount: string;
  onSelect: (value: number) => void;
}

export function QuickAmounts({ amounts, selectedAmount, onSelect }: QuickAmountsProps) {
  const isSelected = (amt: number) => parseFloat(selectedAmount) === amt;

  return (
    <div
      style={{
        display: "flex",
        gap: SPACING.sm,
        flexWrap: "wrap",
        marginTop: SPACING.md,
      }}
    >
      {amounts.map(({ amount: amt, isFrequent, isMostRecent, count }) => {
        const selected = isSelected(amt);
        const showBadge = isFrequent || isMostRecent;

        return (
          <button
            key={amt}
            onClick={() => onSelect(amt)}
            style={{
              flex: 1,
              minWidth: 70,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              background: selected ? COLORS.accentDim : COLORS.surface,
              border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
              borderRadius: 8,
              color: selected ? COLORS.accent : COLORS.textDim,
              fontFamily: TYPOGRAPHY.fontFamily,
              fontSize: TYPOGRAPHY.size.lg,
              fontWeight: selected ? TYPOGRAPHY.weight.semibold : TYPOGRAPHY.weight.medium,
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              transform: "scale(1)",
              WebkitTapHighlightColor: "transparent",
              boxShadow: selected ? `0 0 0 2px ${COLORS.accent}33` : "none",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.color = COLORS.text;
                e.currentTarget.style.background = COLORS.surfaceHover;
                e.currentTarget.style.borderColor = COLORS.textDim;
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.color = COLORS.textDim;
                e.currentTarget.style.background = COLORS.surface;
                e.currentTarget.style.borderColor = COLORS.border;
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = "scale(0.96)";
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {amt.toLocaleString("fr-FR")}
            {showBadge && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  fontSize: TYPOGRAPHY.size.xs,
                  background: isFrequent ? COLORS.accentDim : COLORS.warningDim,
                  color: isFrequent ? COLORS.accent : COLORS.warning,
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontWeight: TYPOGRAPHY.weight.bold,
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {isFrequent ? (
                  <>
                    <Star size={10} /> {count}x
                  </>
                ) : isMostRecent ? (
                  "🔄"
                ) : null}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}