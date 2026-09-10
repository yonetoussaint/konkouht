import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type ActionVariant = "text" | "chip";

export type SectionHeaderProps = {
  title: string;
  /** Leading icon — used by homepage rails (TypeRow, NicheRow). */
  icon?: LucideIcon;
  /** Tint color for the icon. Falls back to the header text color. */
  accent?: string;
  /** Trailing "see all" action. Omit for a plain title-only header. */
  action?: {
    label: string;
    onClick: () => void;
    /** "text" = WalletPage style, "chip" = legacy NicheRow style. */
    variant?: ActionVariant;
  };
  /**
   * "grotesk" for homepage rails (matches card titles),
   * "inter" for wallet/settings sections.
   * Defaults to "grotesk" when an icon is present, "inter" otherwise —
   * which matches how the three existing callers already looked.
   */
  font?: "grotesk" | "inter";
  /** Header text size. 15 for rails, 16 for wallet. */
  size?: 15 | 16;
  style?: CSSProperties;
};

export default function SectionHeader({
  title,
  icon: Icon,
  accent,
  action,
  font,
  size,
  style,
}: SectionHeaderProps) {
  // Preserve the existing look: rails use Grotesk 15px bold; wallet uses Inter 16px semibold.
  const resolvedFont = font ?? (Icon ? "grotesk" : "inter");
  const resolvedSize = size ?? (Icon ? 15 : 16);

  const titleStyle: CSSProperties = {
    fontFamily:
      resolvedFont === "grotesk"
        ? "'Space Grotesk', sans-serif"
        : "'Inter', sans-serif",
    fontSize: resolvedSize,
    fontWeight: resolvedFont === "grotesk" ? 700 : 600,
    color: "#f2f2f2",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 2,
        ...style,
      }}
    >
      {Icon && (
        <Icon
          size={16}
          strokeWidth={2.5}
          color={accent ?? "#f2f2f2"}
          style={{ flexShrink: 0 }}
        />
      )}

      <span style={titleStyle}>{title}</span>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={
            action.variant === "chip"
              ? "section-header-action section-header-action--chip"
              : "section-header-action section-header-action--text"
          }
        >
          {action.label}
          <ChevronRight
            size={action.variant === "chip" ? 12 : 16}
            strokeWidth={action.variant === "chip" ? 1.8 : 2}
          />
        </button>
      )}

      <style>{`
        .section-header-action {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          font-family: 'Inter', sans-serif;
          transition: color 0.15s, background 0.15s;
        }
        .section-header-action:focus-visible {
          outline: 2px solid #f2f2f2;
          outline-offset: 2px;
          border-radius: 6px;
        }
        /* WalletPage variant — lowercase 13px text + chevron, subtle bg on hover */
        .section-header-action--text {
          color: #848e9c;
          font-size: 13px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .section-header-action--text:hover {
          color: #f2f2f2;
          background: rgba(255, 255, 255, 0.05);
        }
        /* Legacy NicheRow variant — uppercase tracked-out label */
        .section-header-action--chip {
          color: #f2f2f2;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0;
        }
        .section-header-action--chip:hover {
          color: #888;
        }
      `}</style>
    </div>
  );
}