import { ChevronRight } from "lucide-react";

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Global section heading, shared by WalletPage and HomePage.
 *
 * Supports two shapes so the same component works for the wallet's
 * "title + action link" sections and the homepage's "icon + title" rails:
 *
 *   <SectionHeader title="Transactions" actionLabel="View all" onAction={...} />
 *   <SectionHeader icon={Flame} title="Top compétitions" accent="#E8A33D" />
 *
 * `actionLabel`/`onAction` and `icon`/`accent` are all optional — omit
 * whichever pair doesn't apply for a given section.
 */
export default function SectionHeader({
  title,
  actionLabel,
  onAction,
  icon: Icon,
  accent,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACING.md,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {Icon && (
          <Icon
            size={16}
            strokeWidth={2.5}
            color={accent}
            style={{ flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#f2f2f2",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            color: "#848e9c",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 6,
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f2f2f2";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#848e9c";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {actionLabel}
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}