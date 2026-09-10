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
 * Global section heading — the single source of truth for every section
 * title in the app (WalletPage, HomePage, and anywhere else). Visual style
 * is fixed; callers only pass a title and, optionally, an action link.
 *
 *   <SectionHeader title="Transactions" actionLabel="View all" onAction={...} />
 *   <SectionHeader title="Top compétitions" />
 */
export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACING.md,
      }}
    >
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