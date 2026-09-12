import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";

/**
 * CategoryGrid — compact circular niche shortcuts with titles.
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
          gap: "14px 6px",
          paddingLeft: 8,
          paddingRight: 8,
          justifyItems: "center",
        }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const accent = cat.accent || "#F5C542";
          const isActive = activeNiche === cat.label;

          return (
            <button
              key={cat.label}
              onClick={() => onSelect?.(cat.label)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                width: "100%",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "transform 0.1s ease",
                WebkitTapHighlightColor: "transparent",
                fontFamily: "inherit",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {/* Circular button — the only interactive surface */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: isActive ? `${accent}14` : "#1c1c1f",
                  border: `${isActive ? 2 : 1.5}px solid ${isActive ? accent : "#2a2a2e"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isActive
                    ? `0 0 0 2px ${accent}22, 0 1px 4px rgba(0,0,0,0.5)`
                    : "0 1px 4px rgba(0,0,0,0.4)",
                  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = accent;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = "#2a2a2e";
                }}
              >
                {Icon ? (
                  <Icon size={20} strokeWidth={2} color={accent} />
                ) : null}
              </div>

              {/* Title */}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: isActive ? accent : "#f2f2f2",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}