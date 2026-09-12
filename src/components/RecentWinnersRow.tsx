import { Trophy } from "lucide-react";
import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";
import { fmtCompactPrize } from "../App";

/**
 * Gagnants récents — horizontal rail of recently-closed competitions,
 * spotlighting the winner instead of the generic "Terminé" state.
 * Doubles as social proof: real names, real prizes, right on the homepage.
 *
 * Expects comps already filtered to phase === "completed" and sorted by
 * closedAt descending (same sort HomePage already does for the "Terminé"
 * tab) — just pass the first 8-10.
 *
 * Usage in HomePage.tsx:
 *
 *   import RecentWinnersRow from "./components/RecentWinnersRow";
 *
 *   const recentWinners = [...visibleCompsFlat]
 *     .filter((c) => c.phase === "completed" && c.winnerName)
 *     .sort((a, b) => new Date(b.closedAt || 0) - new Date(a.closedAt || 0))
 *     .slice(0, 10);
 *
 *   <RecentWinnersRow winners={recentWinners} onOpen={onOpenTypeComp} />
 *
 * Slot it wherever "Terminé" would otherwise be buried — right after
 * "Se termine bientôt" reads well, since it's the natural next beat.
 */
export default function RecentWinnersRow({ winners, onOpen }) {
  if (!winners || winners.length === 0) return null;

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={10}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader title="Gagnants récents" />
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
        {winners.map((comp) => {
          const initials = (comp.winnerName || "?")
            .split(" ")
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const accent = comp.accent || "#F5C542";

          return (
            <button
              key={comp.id}
              onClick={() => onOpen?.(comp)}
              style={{
                flexShrink: 0,
                width: 148,
                display: "flex",
                flexDirection: "column",
                background: "#1c1c1f",
                border: "1px solid #2a2a2e",
                borderRadius: 16,
                overflow: "hidden",
                cursor: "pointer",
                textAlign: "left",
                padding: 0,
              }}
            >
              {/* Banner strip using the competition image, with a Trophy badge */}
              <div
                style={{
                  height: 70,
                  position: "relative",
                  overflow: "hidden",
                  background: "#26262a",
                }}
              >
                {(comp.bannerUrl || comp.thumbnailUrl) ? (
                  <img
                    src={comp.bannerUrl || comp.thumbnailUrl}
                    alt={comp.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#F5C542",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trophy size={12} strokeWidth={2.5} color="#111" />
                </div>
              </div>

              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Winner identity */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#26262a",
                      color: accent,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1.5px solid ${accent}`,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
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
                    {comp.winnerName || "Gagnant"}
                  </span>
                </div>

                {/* Competition title */}
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: "#8a8a90",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {comp.title}
                </span>

                {/* Prize */}
                {comp.winnerPrize ? (
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#F5C542",
                    }}
                  >
                    {fmtCompactPrize(comp.winnerPrize)} HTG
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}
