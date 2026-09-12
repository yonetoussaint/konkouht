import { Calendar } from "lucide-react";
import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";
import { fmtAbsoluteDateOnly, fmtCountdown } from "../App";

/**
 * Calendrier des finales — a planning rail of upcoming finales across all
 * niches, independent of the active tab/search so it stays useful even
 * when the homepage is filtered down to "Live" or a single category.
 *
 * Each item needs a resolved absolute end date (`endsAtResolved`, ISO
 * string) since raw seed data often only has a relative "ends" string
 * like "2j 08h" — App.tsx already resolves this the same way CompCard
 * does for its own countdown.
 *
 * Usage in HomePage.tsx:
 *
 *   import FinaleCalendarRow from "./components/FinaleCalendarRow";
 *
 *   <FinaleCalendarRow finales={finaleCalendar} onOpen={onOpenTypeComp} />
 *
 * In App.tsx, compute finaleCalendar similarly to how `endingSoon` is
 * built inside homeSections, but sourced from allNichesWithEdits (not
 * visibleCompsFlat) so it ignores the active tab/niche filter:
 *
 *   const finaleCalendar = useMemo(() => {
 *     return allNichesWithEdits
 *       .flatMap((niche) =>
 *         niche.competitions
 *           .filter((c) => c.active !== false && c.phase !== "completed")
 *           .map((c) => ({
 *             ...c,
 *             accent: niche.accent,
 *             niche: niche.label,
 *             endsAtResolved: new Date(estimateEndTimestamp(c)).toISOString(),
 *           }))
 *       )
 *       .sort((a, b) => new Date(a.endsAtResolved) - new Date(b.endsAtResolved))
 *       .slice(0, 10);
 *   }, [allNichesWithEdits]);
 *
 * (estimateEndTimestamp already exists in App.tsx — just needs `export`
 * added in front of it, same as NICHE_ICONS.)
 */
export default function FinaleCalendarRow({ finales, onOpen }) {
  if (!finales || finales.length === 0) return null;

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={10}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader title="Calendrier des finales" />
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {finales.map((comp) => {
          const accent = comp.accent || "#F5C542";
          const d = new Date(comp.endsAtResolved);
          const day = Number.isNaN(d.getTime()) ? "--" : d.getDate();

          return (
            <button
              key={comp.id}
              onClick={() => onOpen?.(comp)}
              style={{
                flexShrink: 0,
                width: 168,
                display: "flex",
                gap: 10,
                background: "#1c1c1f",
                border: "1px solid #2a2a2e",
                borderRadius: 16,
                padding: 10,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* Date block */}
              <div
                style={{
                  flexShrink: 0,
                  width: 44,
                  height: 48,
                  borderRadius: 10,
                  background: `${accent}1f`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: accent,
                    lineHeight: 1,
                  }}
                >
                  {day}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    fontWeight: 600,
                    color: accent,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {fmtAbsoluteDateOnly(comp.endsAtResolved).split(" ")[1] || ""}
                </span>
              </div>

              {/* Title + countdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, justifyContent: "center" }}>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#f2f2f2",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {comp.title}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    color: "#8a8a90",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {comp.niche}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={11} strokeWidth={2.5} color="#8a8a90" />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#8a8a90" }}>
                    {fmtCountdown(comp.endsAtResolved)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}
