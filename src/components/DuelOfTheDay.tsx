import { fmtVotes } from "../App";
import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";

/**
 * Duel du jour — a head-to-head spotlight between the two hottest live
 * competitions in a niche (falls back to the two hottest live competitions
 * overall if no single niche has two live entries).
 *
 * Honest scope note: KonkouHT's data model doesn't currently pass
 * individual contestant records down to the homepage (those live behind
 * `participant_media`/`registrations`, fetched per-competition inside the
 * detail view) — so this pits competition vs. competition rather than
 * contestant vs. contestant. Tapping a side opens that competition, same
 * as every other card, since actual voting happens in the detail view.
 * A true contestant-level duel is possible later if that data gets
 * threaded into HomePage's props.
 *
 * Usage in HomePage.tsx:
 *
 *   import DuelOfTheDay from "./components/DuelOfTheDay";
 *
 *   <DuelOfTheDay duel={duelOfTheDay} onOpen={onOpenTypeComp} />
 *
 * In App.tsx:
 *
 *   const duelOfTheDay = useMemo(() => {
 *     const byNiche = allNichesWithEdits
 *       .map((niche) => ({
 *         niche,
 *         live: niche.competitions.filter((c) => c.active !== false && c.phase === "live"),
 *       }))
 *       .filter(({ live }) => live.length >= 2);
 *
 *     const pickPair = (niche, live) => {
 *       const [a, b] = [...live].sort((x, y) => y.votes - x.votes);
 *       return {
 *         a: { ...a, accent: niche.accent, niche: niche.label },
 *         b: { ...b, accent: niche.accent, niche: niche.label },
 *       };
 *     };
 *
 *     if (byNiche.length > 0) return pickPair(byNiche[0].niche, byNiche[0].live);
 *
 *     const allLive = allNichesWithEdits.flatMap((niche) =>
 *       niche.competitions
 *         .filter((c) => c.active !== false && c.phase === "live")
 *         .map((c) => ({ ...c, accent: niche.accent, niche: niche.label }))
 *     );
 *     if (allLive.length < 2) return null;
 *     const [a, b] = [...allLive].sort((x, y) => y.votes - x.votes);
 *     return { a, b };
 *   }, [allNichesWithEdits]);
 *
 * `duelOfTheDay` picks the same top-2-by-votes pair all day today — if you
 * want it to actually change once a day, seed the sort/pick with the
 * current date (e.g. hash today's date string into the pick) instead of
 * always taking the highest vote count.
 */
export default function DuelOfTheDay({ duel, onOpen }) {
  if (!duel || !duel.a || !duel.b) return null;
  const { a, b } = duel;

  const Side = ({ comp, align }) => (
    <button
      onClick={() => onOpen?.(comp)}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: align,
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 110,
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          background: "#26262a",
          border: `1.5px solid ${comp.accent || "#F5C542"}`,
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
            background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 8,
            right: 8,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {comp.title}
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: comp.accent || "#F5C542",
            }}
          >
            {fmtVotes(comp.votes)} votes
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={14}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader title="Duel du jour" />
      </div>

      <div style={{ paddingLeft: 8, paddingRight: 8, position: "relative" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <Side comp={a} align="left" />
          <Side comp={b} align="right" />
        </div>

        {/* VS badge, centered over the seam between the two cards */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#111",
            border: "2px solid #2a2a2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: "#F5C542",
          }}
        >
          VS
        </div>
      </div>
    </SectionShell>
  );
}
