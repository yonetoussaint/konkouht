import SectionHeader from "./SectionHeader";
import SectionShell from "./SectionShell";
import { useEffect, useState } from "react";

/**
 * Local vote formatter — keeps this component self-contained.
 */
function fmtVotes(n) {
  const v = Number(n) || 0;
  if (v < 1000) return `${v}`;
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const m = v / 1_000_000;
  return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
}

/**
 * Short relative-time formatter for countdowns.
 * Returns e.g. "2d 4h", "3h 12m", "45s", "closing now".
 */
function fmtCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "closing now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/**
 * Derive duel state from the two comps. Trusts explicit `phase` when
 * present; falls back to timestamp comparison otherwise.
 */
function deriveState(a, b) {
  const norm = (c) => {
    if (!c) return "unknown";
    if (c.phase) return c.phase; // "live" | "upcoming" | "ended" | custom
    const now = Date.now();
    const start = c.startsAt ? new Date(c.startsAt).getTime() : null;
    const end = c.endsAt ? new Date(c.endsAt).getTime() : null;
    if (end && now > end) return "ended";
    if (start && now < start) return "upcoming";
    return "live";
  };
  const pa = norm(a);
  const pb = norm(b);
  if (pa === pb) return pa; // "live" | "upcoming" | "ended" | "unknown"
  return "mixed";
}

/**
 * Duel du jour — head-to-head spotlight that adapts to the duel's
 * lifecycle: live (vote + countdown), upcoming (starts-in countdown),
 * ended (final result + winner), or mixed (rare, status mismatch).
 *
 * Usage in HomePage.tsx:
 *   <DuelOfTheDay duel={duelOfTheDay} onOpen={onOpenTypeComp} />
 *
 * The `duel` prop shape:
 *   { a: Comp, b: Comp }
 * where Comp = {
 *   title, votes, bannerUrl, thumbnailUrl, accent,
 *   phase?: "live" | "upcoming" | "ended",
 *   startsAt?: string | Date,
 *   endsAt?: string | Date,
 * }
 */
export default function DuelOfTheDay({ duel, onOpen }) {
  if (!duel || !duel.a || !duel.b) return null;
  const { a, b } = duel;

  const state = deriveState(a, b);

  // Live "now" tick so countdowns update. 1s granularity — the countdown
  // formatter itself drops to seconds only under a minute, so it's
  // visually quiet most of the time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (state !== "live" && state !== "upcoming") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state]);

  // Vote-share derived values (only meaningful for live/ended).
  const aVotes = a.votes || 0;
  const bVotes = b.votes || 0;
  const total = aVotes + bVotes;
  const aPct = total > 0 ? (aVotes / total) * 100 : 50;
  const bPct = 100 - aPct;
  const gap = Math.abs(aVotes - bVotes);
  const aLeading = aVotes > bVotes;
  const bLeading = bVotes > aVotes;

  const aColor = a.accent || "#F5C542";
  const bColor = b.accent && b.accent !== a.accent ? b.accent : "#8a8a90";

  // Countdown target: for live, the earlier of the two endsAt; for
  // upcoming, the earlier of the two startsAt. If timestamps are missing,
  // countdown is skipped.
  const closeAt = (() => {
    if (state === "live") {
      const ends = [a.endsAt, b.endsAt].filter(Boolean).map((t) => new Date(t).getTime());
      return ends.length ? Math.min(...ends) : null;
    }
    if (state === "upcoming") {
      const starts = [a.startsAt, b.startsAt].filter(Boolean).map((t) => new Date(t).getTime());
      return starts.length ? Math.min(...starts) : null;
    }
    return null;
  })();

  const countdownLabel = (() => {
    if (closeAt == null) return null;
    const diff = closeAt - now;
    if (state === "live") return `Closes in ${fmtCountdown(diff)}`;
    if (state === "upcoming") return `Starts in ${fmtCountdown(diff)}`;
    return null;
  })();

  const Side = ({ comp, align }) => {
    const isWinner = state === "ended" && ((comp === a && aLeading) || (comp === b && bLeading));
    return (
      <button
        onClick={() => onOpen?.(comp)}
        aria-label={`Open ${comp.title}, ${fmtVotes(comp.votes)} votes${
          isWinner ? ", winner" : ""
        }`}
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
            border: `1.5px solid ${
              isWinner ? (comp.accent || "#F5C542") : state === "ended" ? "#2a2a2e" : (comp.accent || "#F5C542")
            }`,
            opacity: state === "ended" && !isWinner ? 0.55 : 1,
            transition: "opacity 300ms ease, border-color 300ms ease",
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
          {/* Winner crown (ended only) */}
          {isWinner && (
            <div
              style={{
                position: "absolute",
                top: 6,
                [align === "left" ? "left" : "right"]: 8,
                background: comp.accent || "#F5C542",
                color: "#111",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 999,
              }}
            >
              👑 WINNER
            </div>
          )}
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
                color: state === "upcoming" ? "#8a8a90" : (comp.accent || "#F5C542"),
              }}
            >
              {state === "upcoming"
                ? "Not started"
                : `${fmtVotes(comp.votes)} votes`}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Status chip in the header — reflects the current state.
  const StatusChip = () => {
    const map = {
      live: { label: "LIVE", color: "#ff4d4d", bg: "rgba(255,77,77,0.12)", dot: true },
      upcoming: { label: "UPCOMING", color: "#F5C542", bg: "rgba(245,197,66,0.12)", dot: false },
      ended: { label: "ENDED", color: "#8a8a90", bg: "rgba(138,138,144,0.12)", dot: false },
      mixed: { label: "MIXED", color: "#8a8a90", bg: "rgba(138,138,144,0.12)", dot: false },
      unknown: { label: "—", color: "#8a8a90", bg: "rgba(138,138,144,0.12)", dot: false },
    };
    const s = map[state] || map.unknown;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: s.bg,
          color: s.color,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          padding: "3px 8px",
          borderRadius: 999,
        }}
      >
        {s.dot && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: s.color,
              animation: "duelPulse 1.4s ease-in-out infinite",
            }}
          />
        )}
        {s.label}
      </span>
    );
  };

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={14}>
      {/* Keyframes for the live pulse — injected once, harmless if repeated. */}
      <style>{`
        @keyframes duelPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      <div
        style={{
          paddingLeft: 8,
          paddingRight: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <SectionHeader title="Duel du jour" />
        <StatusChip />
      </div>

      <div style={{ paddingLeft: 8, paddingRight: 8, position: "relative" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <Side comp={a} align="left" />
          <Side comp={b} align="right" />
        </div>

        {/* VS badge — copy changes with state */}
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
            color: state === "ended" ? "#8a8a90" : "#F5C542",
            pointerEvents: "none",
          }}
        >
          {state === "ended" ? "FIN" : "VS"}
        </div>
      </div>

      {/* Bottom band: countdown + vote bar, or state-specific message */}
      <div style={{ paddingLeft: 8, paddingRight: 8, marginTop: 10 }}>
        {/* Countdown row (live + upcoming only) */}
        {countdownLabel && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 8,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: state === "live" ? "#ff4d4d" : "#F5C542",
            }}
          >
            {countdownLabel}
          </div>
        )}

        {/* Vote bar: live and ended. Hidden for upcoming/mixed. */}
        {(state === "live" || state === "ended") && (
          <>
            <div
              role="img"
              aria-label={`${a.title} ${aPct.toFixed(0)} percent, ${b.title} ${bPct.toFixed(0)} percent`}
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
                {gap > 0
                  ? `${fmtVotes(gap)} ${state === "ended" ? "margin" : "ahead"}`
                  : "tied"}
              </span>
              <span style={{ color: bLeading ? bColor : "#8a8a90" }}>
                {bLeading && gap > 0 ? "▲ " : ""}{bPct.toFixed(0)}%
              </span>
            </div>
          </>
        )}

        {/* Upcoming: friendly prompt instead of a vote bar */}
        {state === "upcoming" && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "#8a8a90",
              padding: "4px 0",
            }}
          >
            Voting opens when the duel goes live.
          </div>
        )}

        {/* Mixed: honest note */}
        {state === "mixed" && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "#8a8a90",
              padding: "4px 0",
            }}
          >
            These two competitions aren't on the same schedule right now.
          </div>
        )}
      </div>
    </SectionShell>
  );
}