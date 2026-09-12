import SectionHeader from "./SectionHeader";

/**
 * Grille de catégories — tappable niche shortcuts shown on the homepage
 * so users can jump straight to a niche instead of scrolling every rail.
 *
 * See HomePage.tsx / App.tsx for the live wiring: App.tsx computes
 * `homeCategories` from NICHES + NICHE_ICONS and holds `activeNiche`
 * state; HomePage.tsx just passes them through to this component.
 *
 * Drop it right after <NewsBand /> and before the TypeRow rails, or
 * right under the filter tabs — either reads fine.
 */
export default function CategoryGrid({ categories, activeNiche, onSelect }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section
      style={{
        marginBottom: 0,
        borderBottom: "2px solid #2a2a2e",
        paddingBottom: 14,
        paddingTop: 8,
      }}
    >
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
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
        }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeNiche === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onSelect?.(cat.label)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: isActive ? `${cat.accent || "#F5C542"}14` : "#1c1c1f",
                border: `1px solid ${isActive ? (cat.accent || "#F5C542") : "#2a2a2e"}`,
                borderRadius: 16,
                padding: "16px 6px",
                cursor: "pointer",
                transition: "border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = cat.accent || "#F5C542";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = "#2a2a2e";
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: `${cat.accent || "#F5C542"}1f`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Icon ? (
                  <Icon size={20} strokeWidth={2} color={cat.accent || "#F5C542"} />
                ) : null}
              </div>

              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#f2f2f2",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {cat.label}
              </span>

              {typeof cat.count === "number" && (
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    color: "#8a8a90",
                  }}
                >
                  {cat.count} concours
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
