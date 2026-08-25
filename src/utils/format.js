// ─── Formatting & Utility Helpers ─────────────────────────────────────────
// Extracted from App.tsx - pure functions with no React/component deps.
// Import these directly, or via App.tsx which re-exports them for
// backward compatibility with existing "./App" imports.

// French month abbreviations for date formatting.
export const FR_MONTH_ABBR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

// Compact "time remaining" label (e.g. "2j 5h", "3h 20m", "45m") used on
// CompCard's countdown badge.
export function fmtCountdown(target) {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return "Terminé";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function fmtVotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// Compact formatter for small counter badges (shares, comments, followers)
// on CompCard — same "1.2k" style as fmtVotes, kept as its own export since
// it's conceptually a different kind of count (engagement, not vote tally).
export function formatCoins(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// People read a fixed point in time ("20 Juil, 3:45 PM") far faster than a
// duration ("2j 12h"). Used for both inscription deadlines and competition
// end times, wherever we'd otherwise show a countdown-style duration.
export function fmtAbsoluteDateOnly(target) {
  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.getDate();
  const month = FR_MONTH_ABBR[d.getMonth()];
  return `${date} ${month}`;
}

// Compact duration for the card overlay chip ("2j 14h", "6h 22m") — the
// stats row below already shows the absolute deadline, so this is just a
// quick-glance urgency cue. Returns a raw timestamp for sorting purposes.
export function estimateEndTimestamp(comp) {
  // In the live phase the on-screen deadline is the competition's end (which
  // an organizer can now set explicitly); otherwise it's the registration
  // deadline. Falls back to the legacy ends text string.
  if (comp.phase === "live" && comp.liveEndsAt) return new Date(comp.liveEndsAt).getTime();
  if (comp.endsAt) return new Date(comp.endsAt).getTime();
  const str = comp.ends || "";
  let total = 0;
  const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
  const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
  const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
  return Date.now() + (total || 3600) * 1000;
}

// Compact French-style formatting for coin/point totals: 1 200 -> "1,2k",
// 3 400 000 -> "3,4M". Small numbers stay exact with fr-FR thousands
// separators so the leaderboard doesn't feel abbreviated for no reason.
export function fmtCompactPrize(amount) {
  const n = Number(amount);
  if (!n || Number.isNaN(n) || n <= 0) return null;
  if (n >= 1_000_000) return `${(n % 1_000_000 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${(n % 1_000 === 0 ? n / 1_000 : (n / 1_000).toFixed(1))}K`;
  return `${n}`;
}

export function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Deterministic per-competition registration fee (used when no explicit
// fee is set on the edition, and as a stable mock for seeded data).
export function getRegistrationFee(comp) {
  return comp.fee != null ? comp.fee : 50 + (Math.abs(hashStr(comp.id)) % 5) * 25;
}

export function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

// ─── Fake name pool ───────────────────────────────────────────────────────

const FAKE_FIRST = [
  "Marie", "Jean", "Claudine", "Pierre", "Roseline", "Widlène", "Édouard",
  "Fabiola", "Kévin", "Nadège", "Josué", "Mirlande", "Christophe", "Yanick",
  "Lovely", "Réginald", "Sabrina", "Frantz", "Guerlande", "Olivier",
  "Stéphanie", "Duckens", "Nathalie", "Carline", "Jude", "Ketsia",
  "Wilner", "Sophonie", "Berlange", "Alix",
];
const FAKE_LAST_INIT = "ABCDEFGHJKLMNPRSTW";

export function fakeName(index) {
  const first = FAKE_FIRST[index % FAKE_FIRST.length];
  const lastInit = FAKE_LAST_INIT[(index * 7 + 3) % FAKE_LAST_INIT.length];
  return `${first} ${lastInit}.`;
}