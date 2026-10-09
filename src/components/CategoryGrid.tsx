import type React from "react";
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

      <div className="m3-cats" role="group" aria-label="Catégories">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeNiche === cat.label;

          return (
            <button
              key={cat.label}
              type="button"
              className="m3-cat"
              aria-pressed={isActive}
              style={{ "--accent": cat.accent || "#F5C542" } as React.CSSProperties}
              onClick={() => onSelect?.(cat.label)}
            >
              <span className="m3-cat-icon">
                {Icon ? <Icon size={24} strokeWidth={2} /> : null}
              </span>
              <span className="m3-cat-label">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}