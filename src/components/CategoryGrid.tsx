import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";

/**
 * Grille de catégories — tappable niche shortcuts shown on the homepage
 * so users can jump straight to a niche instead of scrolling every rail.
 */
export default function CategoryGrid({ categories, activeNiche, onSelect }) {
  if (!categories || categories.length === 0) return null;

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={14}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader
          title="Catégories"
          actionLabel={activeNiche ? "Effacer" : undefined}
          onAction={activeNiche ? () => onSelect?.(activeNiche) : undefined}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          paddingLeft: 8,
          paddingRight: 8,
          justifyItems: "center",
        }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeNiche === cat.label;
          const accent = cat.accent || "#F5C542";

          return (
            <button
              key={cat.label}
              onClick={() => onSelect?.(cat.label)}
              aria-label={cat.label}
              title={cat.label}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: isActive ? `${accent}2e` : `${accent}1f`,
                border: isActive ? `2px solid ${accent}` : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.15s, border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.06)";
                if (!isActive) e.currentTarget.style.background = `${accent}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                if (!isActive) e.currentTarget.style.background = `${accent}1f`;
              }}
            >
              {Icon ? <Icon size={22} strokeWidth={2} color={accent} /> : null}
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}