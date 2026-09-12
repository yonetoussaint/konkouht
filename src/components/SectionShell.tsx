/**
 * SectionShell — the single source of truth for the border that separates
 * one section from the next, wherever sections are stacked vertically
 * (HomePage rails, WalletPage blocks). Plays the same role SectionHeader
 * plays for headings: change the divider once here and every section
 * using it updates together, instead of each screen hand-rolling its own
 * `borderBottom` value that can silently drift out of sync.
 *
 * `SECTION_BORDER` is exported too, for the rare case where something
 * needs the raw value instead of the wrapper (e.g. a border on one side
 * of an element that already has its own wrapper).
 *
 * Two usage shapes:
 *
 *  - Full-bleed (content already sits flush against the screen edges,
 *    like HomePage's rails): just wrap children, no `bleed` needed.
 *
 *      <SectionShell as="section" paddingTop={8} paddingBottom={10}>
 *        <SectionHeader title="Gagnants récents" />
 *        ...rail content...
 *      </SectionShell>
 *
 *  - Inset content living inside a padded, max-width column (like
 *    WalletPage's `<div style={{ maxWidth: 600, padding: "0 12px" }}>`):
 *    pass `bleed` equal to that column's horizontal padding so the
 *    border still reaches the true screen edge instead of stopping at
 *    the column's inner padding.
 *
 *      <SectionShell bleed={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.md}>
 *        <SectionHeader title="Transactions" .../>
 *        ...
 *      </SectionShell>
 *
 * Pass `noBorder` for the last section in a stack (WalletPage's final
 * block has no divider since nothing follows it).
 */
export const SECTION_BORDER = "1px solid #2a2a2e";

export default function SectionShell({
  children,
  as: Tag = "div",
  bleed = 0,
  paddingTop = 8,
  paddingBottom = 8,
  noBorder = false,
}) {
  return (
    <Tag
      style={{
        borderBottom: noBorder ? "none" : SECTION_BORDER,
        margin: bleed ? `0 -${bleed}px` : 0,
        paddingLeft: bleed || 0,
        paddingRight: bleed || 0,
        paddingTop,
        paddingBottom,
      }}
    >
      {children}
    </Tag>
  );
}
