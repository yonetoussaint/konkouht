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

  // Derived vote-share values, hoisted so the JSX below stays flat.
  const aVotes = a.votes || 0;
  const bVotes = b.votes || 0;
  const total = aVotes + bVotes;
  const aPct = total > 0 ? (aVotes / total) * 100 : 50;
  const bPct = 100 - aPct;
  const gap = Math.abs(aVotes - bVotes);
  const aLeading = aVotes > bVotes;
  const bLeading = bVotes > aVotes;

  // If both comps share the same accent (common within one niche), the
  // two halves of the bar would be visually identical — fall back to a
  // neutral tone for the right side so the split is readable.
  const aColor = a.accent || "#F5C542";
  const bColor = b.accent && b.accent !== a.accent ? b.accent : "#8a8a90";

  const Side = ({ comp, align }) => (
    <button
      onClick={() => onOpen?.(comp)}
      aria-label={`Open ${comp.title}, ${fmtVotes(comp.votes)} votes`}
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

      {/* Cards + VS badge live in a relative wrapper so the badge can be
          absolutely centered on the seam between the two cards. The vote
          bar is a sibling below this wrapper so it doesn't shift the
          visual center the badge is anchored to. */}
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
            pointerEvents: "none",
          }}
        >
          VS
        </div>
      </div>

      {/* Live vote-share bar */}
      <div
        style={{ paddingLeft: 8, paddingRight: 8, marginTop: 10 }}
        role="img"
        aria-label={`${a.title} ${aPct.toFixed(0)} percent, ${b.title} ${bPct.toFixed(0)} percent`}
      >
        <div
          style={{
            display: "flex",
            height: 6,
            borderRadius: 999,
            overflow: "hidden",
            background: "#1a1a1d",
            border: "1px solid #2a2a2e",
          }}
        >
          <div
            style={{
              width: `${aPct}%`,
              background: aColor,
              transition: "width 400ms ease",
            }}
          />
          <div
            style={{
              flex: 1,
              background: bColor,
              transition: "width 400ms ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span style={{ color: aLeading ? aColor : "#8a8a90" }}>
            {aPct.toFixed(0)}%{aLeading && gap > 0 ? " ▲" : ""}
          </span>
          <span style={{ color: "#5a5a60", fontWeight: 600 }}>
            {gap > 0 ? `${fmtVotes(gap)} ahead` : "tied"}
          </span>
          <span style={{ color: bLeading ? bColor : "#8a8a90" }}>
            {bLeading && gap > 0 ? "▲ " : ""}{bPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </SectionShell>
  );
}