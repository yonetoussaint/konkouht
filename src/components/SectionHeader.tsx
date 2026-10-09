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
        gap: SPACING.sm,
        minHeight: 40,
        marginBottom: SPACING.sm,
      }}
    >
      <h2 className="m3-section-title" style={{ margin: 0 }}>{title}</h2>

      {actionLabel && onAction && (
        <button type="button" className="m3-text-btn" onClick={onAction}>
          {actionLabel}
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
