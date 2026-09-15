import { Flame, Clock, BadgeCheck } from "lucide-react";
import { hapticTap } from "../native";
import { fmtVotes } from "../App";
import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";

/**
 * Duel du jour — home-page rail that pits two competitions from the same
 * category against each other, side by side, instead of listing them
 * separately. Reads as a single unit: shared header, a VS badge sitting
 * on the seam between the two banners, and a vote-share bar underneath
 * so the "duel" framing pays off visually and not just in the title.
 *
 * Expects `duel` = { a, b, state } — two competition-shaped objects
 * (title, bannerUrl/thumbnailUrl, votes, accent, niche) plus a lifecycle
 * state of "live" | "upcoming" | "ended". Built in App.tsx's `duels` memo
 * and picked by HomePage (live > upcoming > ended). Renders nothing if
 * either side is missing.
 *
 *   <DuelOfTheDay duel={duel} onOpen={onOpenTypeComp} />
 */

const STATE_META = {
  live: { title: "Duel du jour", badge: "EN DIRECT", color: "#e74c3c" },
  upcoming: { title: "Prochain duel", badge: "BIENTÔT", color: "#7a7a7a" },
  ended: { title: "Dernier duel", badge: "TERMINÉ", color: "#7a7a7a" },
};

function StateBadge({ state, color }) {
  if (state === "live") {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block", animation: "pulse-dot 1s infinite" }} />
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {STATE_META[state].badge}
        </span>
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {state === "ended" ? <BadgeCheck size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2.5} />}
      {STATE_META[state].badge}
    </span>
  );
}

function DuelSide({ comp, align, onOpen }) {
  const accent = comp.accent || "#F5C542";
  return (
    <button
      onClick={() => {
        hapticTap?.();
        onOpen?.(comp);
      }}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: align,
      }}
    >
      <div style={{ height: 92, position: "relative", overflow: "hidden", background: "#26262a", borderRadius: align === "left" ? "16px 0 0 0" : "0 16px 0 0" }}>
        {(comp.bannerUrl || comp.thumbnailUrl) ? (
          <img
            src={comp.bannerUrl || comp.thumbnailUrl}
            alt={comp.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.8) 100%)" }} />
      </div>
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3, alignItems: align === "left" ? "flex-start" : "flex-end" }}>
        <span style={{
          fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#f2f2f2",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
        }}>
          {comp.title}
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: accent }}>
          {fmtVotes(comp.votes || 0)} votes
        </span>
      </div>
    </button>
  );
}

export default function DuelOfTheDay({ duel, onOpen }) {
  if (!duel?.a || !duel?.b) return null;

  const meta = STATE_META[duel.state] || STATE_META.live;
  const votesA = duel.a.votes || 0;
  const votesB = duel.b.votes || 0;
  const total = votesA + votesB;
  // Even 50/50 split when neither side has votes yet, so the bar never
  // collapses to nothing for an "upcoming" pair.
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={10}>
      <div style={{ paddingLeft: 8, paddingRight: 8, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
          <Flame size={16} color="#F5C542" />
          {meta.title}
        </span>
        <StateBadge state={duel.state} color={meta.color} />
      </div>

      <div style={{ margin: "0 8px", position: "relative", borderRadius: 16, border: "1px solid #2a2a2e", background: "#1c1c1f", overflow: "hidden" }}>
        <div style={{ display: "flex" }}>
          <DuelSide comp={duel.a} align="left" onOpen={onOpen} />
          <DuelSide comp={duel.b} align="right" onOpen={onOpen} />
        </div>

        {/* VS badge, centered on the seam between the two banners */}
        <div style={{
          position: "absolute", top: 92, left: "50%", transform: "translate(-50%, -50%)",
          width: 30, height: 30, borderRadius: "50%", background: "#111",
          border: "2px solid #1c1c1f", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 800, color: "#f2f2f2",
          zIndex: 1,
        }}>
          VS
        </div>

        {/* Vote-share bar */}
        <div style={{ height: 4, display: "flex", margin: "0 10px 10px" }}>
          <div style={{ width: `${pctA}%`, background: duel.a.accent || "#F5C542", borderRadius: "2px 0 0 2px", transition: "width 0.4s ease" }} />
          <div style={{ width: `${100 - pctA}%`, background: duel.b.accent || "#F5C542", borderRadius: "0 2px 2px 0", transition: "width 0.4s ease" }} />
        </div>
      </div>
    </SectionShell>
  );
}
