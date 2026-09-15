import { supabase, hashStr, fakeName, FR_MONTH_ABBR } from "../App";

/* ─── comments (edition-scoped) ─────────────────────────────────────────── */

export async function fetchComments(editionId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchComments error:", error);
    return [];
  }

  const rows = data || [];
  const repliesByParent = {};
  rows.forEach((r) => {
    if (r.parent_id) {
      (repliesByParent[r.parent_id] ||= []).push(r);
    }
  });

  return rows
    .filter((r) => !r.parent_id)
    .map((c) => ({ ...c, replies: repliesByParent[c.id] || [] }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function insertComment({
  editionId,
  competitionId,
  userId,
  fullName,
  avatarUrl,
  text,
  parentId = null,
}) {
  return supabase
    .from("comments")
    .insert({
      edition_id: editionId,
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      text,
      parent_id: parentId,
    })
    .select()
    .single();
}

/* ─── registrations (edition-scoped) ──────────────────────────────────────
   See the schema notes above (edition_id + avatar_url added, unique
   constraint moved to (edition_id, user_id)). ───────────────────────── */

// Keyed by edition_id now — a new season/edition starts back at 0
// registrants, it doesn't inherit a previous edition's count.
export async function deleteRegistration(registrationId) {
  const { error } = await supabase.from("registrations").delete().eq("id", registrationId);
  return { error };
}

// Refunds a registration fee back into a participant's wallet after an
// admin removal. Writes a wallet_transactions row first — same shape as a
// MonCash deposit credit, so it shows up in the participant's transaction
// history labeled as a refund — then updates wallet_balances directly.
//
// Note: the balance update here is read-then-write, not atomic. That
// matches how the rest of this file already touches wallet_balances (no
// RPC/stored procedure exists yet), so it carries the same small
// race-condition risk as a concurrent deposit landing at the same instant.
// If that ever becomes a real concern, replace this with a Postgres
// function (e.g. `increment_wallet_balance(user_id, amount)`) called via
// supabase.rpc(), which resolves it atomically server-side.
export function notoAnimatedEmojiUrl(emoji) {
  const codepoints = Array.from(emoji)
    .map((ch) => ch.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints.join("_")}/lottie.json`;
}

// Gift "points" (shown on the icon) are not the same as the actual HTG
// price charged — points are a display/prestige number, the real cost in
// gourdes is derived from this rate (e.g. 50 points -> 45 HTG at 0.9).
export const POINTS_TO_HTG_RATE = 0.9;
export function giftPriceHTG(gift) {
  return Math.round(gift.cost * POINTS_TO_HTG_RATE);
}

export const GIFT_CATALOG = [
  { id: "g1", name: "Applaudissement", icon: "👏", cost: 10 },
  { id: "g2", name: "Pouce levé", icon: "👍", cost: 10 },
  { id: "g3", name: "Cœur", icon: "❤️", cost: 15 },
  { id: "g4", name: "Étoile", icon: "⭐", cost: 25 },
  { id: "g5", name: "Ballon", icon: "🎈", cost: 25 },
  { id: "g6", name: "Fleur", icon: "💐", cost: 30 },
  { id: "g7", name: "Flamme", icon: "🔥", cost: 50 },
  { id: "g8", name: "Éclair", icon: "⚡", cost: 50 },
  { id: "g9", name: "Papillon", icon: "🦋", cost: 60 },
  { id: "g10", name: "Confettis", icon: "🎉", cost: 75 },
  { id: "g11", name: "Cadeau", icon: "🎁", cost: 100 },
  { id: "g12", name: "Micro", icon: "🎤", cost: 100 },
  { id: "g13", name: "Danse", icon: "💃", cost: 120 },
  { id: "g14", name: "Couronne", icon: "👑", cost: 150 },
  { id: "g15", name: "Feu d'artifice", icon: "🎆", cost: 180 },
  { id: "g16", name: "Guitare", icon: "🎸", cost: 200 },
  { id: "g17", name: "Arc-en-ciel", icon: "🌈", cost: 220 },
  { id: "g18", name: "Médaille d'or", icon: "🥇", cost: 250 },
  { id: "g19", name: "Trophée", icon: "🏆", cost: 300 },
  { id: "g20", name: "Champagne", icon: "🍾", cost: 350 },
  { id: "g21", name: "Fusée", icon: "🚀", cost: 400 },
  { id: "g22", name: "Sirène", icon: "🧜‍♀️", cost: 450 },
  { id: "g23", name: "Voiture de sport", icon: "🏎️", cost: 500 },
  { id: "g24", name: "Lion", icon: "🦁", cost: 600 },
  { id: "g25", name: "Diamant", icon: "💎", cost: 750 },
  { id: "g26", name: "Yacht", icon: "🛥️", cost: 900 },
  { id: "g27", name: "Château", icon: "🏰", cost: 1200 },
  { id: "g28", name: "Avion privé", icon: "✈️", cost: 1500 },
  { id: "g29", name: "Fusée spatiale", icon: "🛸", cost: 2000 },
  { id: "g30", name: "Couronne royale", icon: "👑", cost: 3000 },
];

export function fmtAbsoluteDate(target) {
  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.getDate();
  const month = FR_MONTH_ABBR[d.getMonth()];
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${date} ${month}, ${hours}:${minutes} ${ampm}`;
}

// Date-only variant for CompCard's compact stats row — the card is small
// enough that the time just adds noise once you already have the "Fin
// inscr." / "Fin dans" label sitting right next to it.
export const COUNTDOWN_UNITS = [
  { label: "Y", secs: 31536000 }, // 365d
  { label: "M", secs: 2592000 },  // 30d ("month")
  { label: "W", secs: 604800 },
  { label: "D", secs: 86400 },
  { label: "H", secs: 3600 },
  { label: "M", secs: 60 },       // minute
  { label: "S", secs: 1 },
];
export function fmtCountdownSecs(s, unitCount = 3) {
  if (!Number.isFinite(s) || s <= 0) return "Terminé";
  let startIdx = COUNTDOWN_UNITS.findIndex((u) => s >= u.secs);
  if (startIdx === -1) startIdx = COUNTDOWN_UNITS.length - 1;
  let remaining = s;
  return COUNTDOWN_UNITS.slice(startIdx, startIdx + unitCount)
    .map((u) => {
      const val = Math.floor(remaining / u.secs);
      remaining -= val * u.secs;
      return `${val}${u.label}`;
    })
    .join(" : ");
}

export function fmtCountdown(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (Number.isNaN(diff)) return "";
  return fmtCountdownSecs(Math.floor(diff / 1000));
}

// Compact prize amount for the card's tight stats-row cell ("50K HTG",
// "1.2M HTG") — the full precise figure is shown on the competition's own
// page, this is just a quick-glance number. Returns null when there's no
// prize set yet (mock seed competitions, or an edition the organizer
// hasn't filled in) so the caller can fall back to a placeholder dash.
export const COMMENTATORS = [
  { name: "Marc Fontaine" },
  { name: "Sophie Laurent" },
  { name: "Thierry Dubois" },
  { name: "Karine Joseph" },
  { name: "Yves Baptiste" },
];

// Registration fee for a competition, in credits. Organizers can set an
// explicit comp.fee from the edit screen; competitions that never had one
// set fall back to a deterministic per-competition default so old data
// keeps behaving the same as before this was editable.
export function formatCoins(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) {
    return (n / 1000000).toFixed(1).replace(".", ",").replace(",0", "") + "M";
  }
  if (abs >= 1000) {
    return (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k";
  }
  return n.toLocaleString("fr-FR");
}

export function buildParticipantsFromRegistrants(registrants) {
  if (!registrants || registrants.length === 0) return [];
  return registrants.map((r) => ({
    index: Math.abs(hashStr(r.userId || r.id)) % 40,
    id: r.id,
    userId: r.userId,
    name: r.name || r.full_name || "Participant",
    avatarUrl: r.avatarUrl,
    votes: 0,
    points: 0,
  }));
}

export function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── TOURNAMENT BRACKET (mock) ─────────────────────────────────────────
// World-cup-style stages built on top of the *same* participant pool used
// for Classement — no separate contestants list, no admin re-seeding yet.
// "Advancing" a round just means "the higher-voted side of each pairing
// moves on," and the poules step is presentation only (groups of 4, top
// scorers already sorted to the front of `qualifiers`). This is mock data:
// there's no persisted match/round table behind it yet, so a page refresh
// simply recomputes the same bracket from current vote counts.
export const KNOCKOUT_STAGE_NAMES = { 16: "8e de finale", 8: "Quart de finale", 4: "Demi-finale", 2: "Finale" };

export function pairForBracket(entrants) {
  // Standard seeding — 1st vs last, 2nd vs second-last, etc. — keeps the
  // strongest scorers apart for as long as possible, like a real bracket.
  const n = entrants.length;
  const pairs = [];
  for (let i = 0; i < n / 2; i++) pairs.push([entrants[i], entrants[n - 1 - i]]);
  return pairs;
}

// Fallback contestant pool for the bracket demo — used whenever the real
// registrant list has fewer than 2 people (new/empty competitions, or just
// testing), so the bracket always has something to show in every phase.
// Deterministic per competition (seeded off comp.id), same fakeName/hashStr
// pattern already used elsewhere in this file for mock speakers etc.
export function buildMockContestants(comp) {
  const count = Math.min(Math.max(comp?.contestants || 16, 4), 32);
  return Array.from({ length: count }, (_, i) => {
    const seed = Math.abs(hashStr(`${comp?.id || "mock"}_bracket_contestant_${i}`));
    const points = 50 + (seed % 950);
    return {
      id: `mock-contestant-${i}`,
      index: seed % 40,
      name: fakeName(seed),
      avatarUrl: null,
      votes: points,
      points,
    };
  });
}

// All-play-all pairing within a single group — every player faces every
// other player once. Winner picked the same deterministic way as knockout
// matches (higher points wins), so it stays consistent with the rest of
// the mock bracket.
export function roundRobinMatches(group) {
  const matches = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const a = group[i], b = group[j];
      matches.push({ a, b, winner: (a.points || 0) >= (b.points || 0) ? a : b });
    }
  }
  return matches;
}

export function buildMockBracket(participants) {
  const pool = (participants || []).filter(Boolean).slice().sort((a, b) => (b.points || 0) - (a.points || 0));
  if (pool.length < 2) return null;

  // Bracket entry size: largest power of two ≤ 16 (8e de finale) that the
  // pool can fill, so a small competition still gets a sensible bracket
  // (e.g. 5 registrants → a 4-person knockout, no poules groups needed).
  let bracketSize = 2;
  while (bracketSize * 2 <= Math.min(pool.length, 16)) bracketSize *= 2;

  const rounds = [];
  if (pool.length > bracketSize) {
    const groupSize = 4;
    const groups = [];
    for (let i = 0; i < pool.length; i += groupSize) groups.push(pool.slice(i, i + groupSize));
    const qualifiers = pool.slice(0, bracketSize);
    // Two separate tabs sharing the same groups: "Groupes" is composition/
    // standings (who's in which group, who's qualifying), "Phase de poules"
    // is the actual round-robin matches played within each group.
    rounds.push({ name: "Groupes", type: "groups", groups, qualifiers });
    const groupMatches = groups.map((g) => roundRobinMatches(g));
    rounds.push({ name: "Phase de poules", type: "roundrobin", groups, groupMatches, qualifiers });
  }

  let entrants = pool.slice(0, bracketSize);
  while (entrants.length >= 2) {
    const size = entrants.length;
    const matches = pairForBracket(entrants).map(([a, b]) => ({
      a, b,
      winner: (a.points || 0) >= (b.points || 0) ? a : b,
    }));
    rounds.push({ name: KNOCKOUT_STAGE_NAMES[size] || `Tour de ${size}`, type: "knockout", matches });
    entrants = matches.map((m) => m.winner);
  }

  return rounds.length > 0 ? rounds : null;
}

export function fmtCommentTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo}min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

export function fmtAgoFr(minutesAgo) {
  if (minutesAgo < 60) return `Il y a ${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}

/* ─── RULES / PRIZE / DESCRIPTION ───────────────────────────────────────── */

export function buildRulesInfo(comp) {
  // No generated placeholder copy — only what the organizer has actually
  // entered in the edit panel. Anything left blank stays blank in the UI.
  return {
    description: comp.description?.trim() ? comp.description : "",
    rewardExtra: comp.rewardExtra?.trim() ? comp.rewardExtra : "",
    rules: Array.isArray(comp.rules) && comp.rules.length > 0 ? comp.rules : [],
  };
}
