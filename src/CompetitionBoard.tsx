import { useState, useRef, useEffect, useMemo } from "react";
import { hapticTap } from "./native";
import { Player } from "@lottiefiles/react-lottie-player";
import { Audio as AudioBarsLoader } from "react-loader-spinner";
import {
  Trophy, Home, Wallet, Users, Bell, BadgeCheck, Play, Plus, Gift, X, Check,
  ArrowLeft, Send, ChevronRight, ChevronLeft, MessageCircle,
  Image as ImageIcon, Heart, Share2, Sticker, Info, Volume2, VolumeX, Hand,
  Clock, Pencil,
} from "lucide-react";
import {
  supabase,
  fmtVotes,
  hashStr,
  getRegistrationFee,
  fakeName,
  FR_MONTH_ABBR,
  MyAvatar,
  PLATFORM_ORGANIZER_SIGLE,
  WALLET_PIN,
  fetchRegistrations,
  refundRegistrationFee,
} from "./App";

async function fetchComments(editionId) {
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

async function insertComment({
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
async function deleteRegistration(registrationId) {
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
function notoAnimatedEmojiUrl(emoji) {
  const codepoints = Array.from(emoji)
    .map((ch) => ch.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints.join("_")}/lottie.json`;
}

// Renders a gift's icon as an animated sticker instead of a static emoji
// glyph. Falls back to the plain emoji if the animation fails to load
// (e.g. no matching Noto animation exists for that emoji, or offline).
function AnimatedGiftIcon({ emoji, size = 40 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span style={{ fontSize: size * 0.7, lineHeight: 1, display: "block" }}>
        {emoji}
      </span>
    );
  }

  return (
    <Player
      src={notoAnimatedEmojiUrl(emoji)}
      autoplay
      loop
      onEvent={(event) => {
        if (event === "error") setFailed(true);
      }}
      style={{ width: size, height: size }}
    />
  );
}

// Gift "points" (shown on the icon) are not the same as the actual HTG
// price charged — points are a display/prestige number, the real cost in
// gourdes is derived from this rate (e.g. 50 points -> 45 HTG at 0.9).
const POINTS_TO_HTG_RATE = 0.9;
function giftPriceHTG(gift) {
  return Math.round(gift.cost * POINTS_TO_HTG_RATE);
}

const GIFT_CATALOG = [
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

function fmtAbsoluteDate(target) {
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
const COUNTDOWN_UNITS = [
  { label: "Y", secs: 31536000 }, // 365d
  { label: "M", secs: 2592000 },  // 30d ("month")
  { label: "W", secs: 604800 },
  { label: "D", secs: 86400 },
  { label: "H", secs: 3600 },
  { label: "M", secs: 60 },       // minute
  { label: "S", secs: 1 },
];
function fmtCountdownSecs(s, unitCount = 3) {
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
const COMMENTATORS = [
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

function EntityAvatar({ url, name, bg = "#ddd", color = "#666" }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || ""}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: "100%", height: "100%",
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

// Renders the *current* signed-in user's own avatar — a real photo once
// they've set one, otherwise the initials circle used throughout the app.
function buildParticipantsFromRegistrants(registrants) {
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

function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtCommentTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo}min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

function fmtAgoFr(minutesAgo) {
  if (minutesAgo < 60) return `Il y a ${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}

/* ─── RULES / PRIZE / DESCRIPTION ───────────────────────────────────────── */

function buildRulesInfo(comp) {
  // No generated placeholder copy — only what the organizer has actually
  // entered in the edit panel. Anything left blank stays blank in the UI.
  return {
    description: comp.description?.trim() ? comp.description : "",
    rewardExtra: comp.rewardExtra?.trim() ? comp.rewardExtra : "",
    rules: Array.isArray(comp.rules) && comp.rules.length > 0 ? comp.rules : [],
  };
}

function ParticipantListOverlay({ comp, participants, onClose }) {
  const accent = comp.accent;
  // `participants` is passed down from CompetitionBoard, already synced with
  // the real `registrations` table — real registrants only, never invented.
  const ranked = participants || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Participant</span>
          <span style={{ width: 90, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Votes</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points</span>
        </div>

        {ranked.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
            Aucun participant pour le moment.
          </div>
        ) : ranked.map((p, rank) => (
          <div
            key={p.id ?? p.index}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                width: 32,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: rank < 3 ? accent : "#bbb",
              }}
            >
              {rank + 1}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0, overflow: "hidden",
                  border: "1px solid #e0e0e0",
                }}>
                <EntityAvatar url={p.avatarUrl} name={p.name} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333", fontWeight: 600 }}>{p.name}</span>
            </div>
            <span style={{ width: 90, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>
              {fmtVotes(p.votes)}
            </span>
            <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#aaa" }}>
              {p.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ALBUM GRID OVERLAY ─────────────────────────────────────────────────
   Full grid of approved participant media — this is what "Voir tout" opens
   from the Médias tab. Kept separate from ParticipantListOverlay, which is
   the votes/ranking table used by the Classement tab's own "Voir tout". */

function AlbumGridOverlay({ items, onClose, onOpenItem }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky", top: 0, background: "#fff",
          borderBottom: "1px solid #e0e0e0", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111" }}>
          Médias des participants
        </span>
      </div>

      <div style={{
        maxWidth: 800, margin: "0 auto", padding: 12,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onOpenItem(item)} style={{ position: "relative", cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
            {item.media_type === "video" ? (
              <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
            ) : (
              <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.uploader_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── REGISTRANT LIST OVERLAY ───────────────────────────────────────────── */

function RegistrantListOverlay({ comp, registrants, accent, onClose, canRemove, onRemove, removingRegistrantId }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#333" }}>
          Membres inscrits — {comp.title}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Membre</span>
          <span style={{ width: 100, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</span>
          <span style={{ width: 80, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Frais</span>
        </div>

        {registrants.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#bbb" }}>
            Aucune inscription pour le moment.
          </div>
        ) : registrants.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                width: 32,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#bbb",
              }}
            >
              {i + 1}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0,
                  background: "#f0ebff", color: "#6C63FF",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {r.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </div>
            <span style={{ width: 100, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#999", lineHeight: 1.3 }}>
              {r.date}<br />
              <span style={{ fontSize: 11, color: "#bbb" }}>{r.time}</span>
            </span>
            <span style={{ width: 80, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: accent }}>
              {r.fee} gdes
            </span>
            {canRemove && (
              <button
                onClick={() => onRemove?.(r)}
                disabled={removingRegistrantId === r.id}
                title="Retirer ce participant"
                style={{
                  width: 26, height: 26, flexShrink: 0, marginLeft: 10,
                  border: "1px solid #f3d0cd", borderRadius: "50%",
                  background: "#fdf1f0", color: "#e74c3c",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: removingRegistrantId === r.id ? "default" : "pointer",
                  opacity: removingRegistrantId === r.id ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ORGANISER BAR (organiser-follow, local state) ────────────────────── */

function OrgBar({ comp, accent }) {
  const [orgFollowed, setOrgFollowed] = useState(false);
  const [orgFollowerCount, setOrgFollowerCount] = useState(comp.followers);
  return (
    <div style={{
      background: "#fff",
      borderBottom: "1px solid #e0e0e0",
      padding: "12px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      maxWidth: 800, margin: "0 auto",
      boxSizing: "border-box", width: "100%",
      position: "relative", left: "50%", transform: "translateX(-50%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: accent, color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {comp.organisateur.charAt(0)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            {comp.organisateur}
            <BadgeCheck size={13} strokeWidth={2.5} color={accent} />
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
            {fmtVotes(orgFollowerCount)} abonnés
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          const wasFollowed = orgFollowed;
          setOrgFollowed(!wasFollowed);
          setOrgFollowerCount((c) => wasFollowed ? c - 1 : c + 1);
        }}
        style={{
          border: `1px solid ${orgFollowed ? "#111" : accent}`,
          background: orgFollowed ? "#111" : "transparent",
          color: orgFollowed ? "#fff" : accent,
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "6px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >{orgFollowed
        ? <><Check size={11} strokeWidth={3} /> Abonné</>
        : <><Bell size={11} strokeWidth={2.5} /> S'abonner</>
      }</button>
    </div>
  );
}

/* ─── ALBUM SHEET (Mon album) ────────────────────────────────────────────
   Lets the current user manage their own uploaded participant media. Only
   ever opened in "own" mode now — browsing other participants' media goes
   through the real approved-media gallery + MediaLightbox instead. */

function AlbumSheet({ accent, uploads = [], uploading = false, onUpload, onClose }) {
  const subtitle = `${uploads.length} média${uploads.length > 1 ? "s" : ""} envoyé${uploads.length > 1 ? "s" : ""}`;
  const statusLabel = { pending: "En attente", approved: "Approuvé", rejected: "Rejeté" };
  const statusColor = { pending: "#e74c3c", approved: "#27ae60", rejected: "#999" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#fff",
          borderTop: `2px solid #111`,
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #e0e0e0",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              Mon album
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          overflowY: "auto",
          padding: "16px 16px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{
            background: "#faf9f7", border: "1px solid #eee",
            padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12,
            color: "#777", lineHeight: 1.6,
          }}>
            Ajoutez vos propres photos ou vidéos — elles seront visibles publiquement une fois approuvées par l'organisateur.
          </div>

          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            border: `1.5px dashed ${accent}`, background: `${accent}0a`,
            padding: "14px 0", cursor: uploading ? "default" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload?.(f); e.target.value = ""; }}
              style={{ display: "none" }}
            />
            <Plus size={16} color={accent} strokeWidth={2.5} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: accent }}>
              {uploading ? "Envoi en cours…" : "Ajouter un média"}
            </span>
          </label>

          {uploads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
              Aucun média envoyé pour l'instant.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {uploads.map((u) => (
                <div key={u.id} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
                  {u.media_type === "video" ? (
                    <video src={u.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                  ) : (
                    <img src={u.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <span style={{
                    position: "absolute", top: 6, right: 6,
                    background: statusColor[u.status], color: "#fff",
                    fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                    padding: "2px 6px",
                  }}>
                    {statusLabel[u.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MEDIA LIGHTBOX ─────────────────────────────────────────────────────
   Full-screen viewer for a single approved participant_media row, opened
   from the real "Médias des participants" gallery. */

function MediaLightbox({ item, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1150,
        background: "rgba(0,0,0,0.9)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.15)", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={18} />
      </button>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.media_type === "video" ? (
          <video src={item.media_url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        ) : (
          <img src={item.media_url} alt="" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        )}
      </div>
      <div style={{ marginTop: 12, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
        {item.uploader_name}
      </div>
    </div>
  );
}

/* ─── LIVE COMMENTARY STREAM SHEET (X Spaces / podcast style) ─────────── */

function RoomAvatar({ name, size = 56, speaking = false, ring, badge }) {
  const initials = (name || "").trim() ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: speaking ? `2px solid ${ring || "#2ecc71"}` : "2px solid transparent",
        boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", height: "100%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: size * 0.32, fontWeight: 700, color: "#fff" }}>{initials}</span>
        </div>
      </div>
      {badge}
      {speaking && (
        <div style={{
          position: "absolute", bottom: -3, right: -3,
          width: 20, height: 20, borderRadius: "50%", background: "#111",
          border: "2px solid #111",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AudioBarsLoader height="11" width="11" color="#2ecc71" ariaLabel="parle" visible={true} />
        </div>
      )}
    </div>
  );
}

function CommentaryStreamSheet({ comp, commentator, coSpeakers, accent, muted, onToggleMute, onClose }) {
  const [requestSent, setRequestSent] = useState(false);
  const baseSeed = Math.abs(hashStr(comp.id));
  const listenerCount = 40 + (baseSeed % 900);
  const listenerFaces = Array.from({ length: 6 }, (_, i) => (baseSeed + i * 13) % 60);
  const speakers = [
    { name: commentator.name, role: "Hôte", index: baseSeed % 40, speaking: true },
    ...coSpeakers.map((s, i) => ({ name: s.name, role: "Intervenant", index: (baseSeed + (i + 1) * 9) % 40, speaking: i === 0 })),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#111",
          borderTop: "1px solid #2a2a2a",
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 18px 12px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 800, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Salle audio en direct
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Réduire"
            style={{
              width: 26, height: 26, border: "none", background: "#1c1c1c", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={14} color="#999" style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>

        <div style={{ padding: "0 18px 22px", overflowY: "auto" }}>
          {/* Speakers grid */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            À l'antenne · {speakers.length}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {speakers.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64 }}>
                <RoomAvatar name={s.name} size={56} speaking={s.speaking} ring={accent} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {s.name.split(" ")[0]}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#777" }}>{s.role}</div>
              </div>
            ))}
          </div>

          {/* Listeners */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 22, paddingTop: 16, borderTop: "1px solid #222",
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {listenerFaces.map((idx, i) => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid #111", borderRadius: "50%" }}>
                  <RoomAvatar name="" size={26} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>
              {listenerCount} auditeurs
            </div>
          </div>

          {/* Description */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#bbb", lineHeight: 1.5, marginTop: 16 }}>
            Suivez le commentaire audio en direct de cette compétition — analyses, moments forts et ambiance, commentés en temps réel.
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setRequestSent(true)}
              disabled={requestSent}
              style={{
                flex: 1, height: 44, borderRadius: 22, border: "1px solid #333",
                background: requestSent ? "#1c1c1c" : accent,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: requestSent ? "default" : "pointer",
              }}
            >
              <Hand size={16} color={requestSent ? "#888" : "#111"} strokeWidth={2.2} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: requestSent ? "#888" : "#111" }}>
                {requestSent ? "Demande envoyée" : "Demander à parler"}
              </span>
            </button>
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              style={{
                width: 44, height: 44, borderRadius: 22, border: "1px solid #333",
                background: muted ? "#1c1c1c" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {muted ? <VolumeX size={16} color="#fff" strokeWidth={2.2} /> : <Volume2 size={16} color="#111" strokeWidth={2.2} />}
            </button>
          </div>

          {/* Leave */}
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              marginTop: 14, padding: "8px 0",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#e74c3c",
            }}
          >
            Quitter la salle
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── COMPETITION BOARD (overlay) ──────────────────────────────────────── */

export default function CompetitionBoard({ comp, onClose, balance, onSendGift, onOpenBuy, onRegister, showToast, isRegistered, isFollowed, onToggleFollow, currentUser, onRequestAuth, onEditComp, onCreateComp, onAddImage, onRemoveImage, startInEditMode = false, isNewEdition = false, onParticipantRemoved }) {
  const isRegistration = comp.phase === "registration";
  const isCompleted = comp.phase === "completed";
  const registrationFee = getRegistrationFee(comp);
  const isOwnCompetition = currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE;
  const [showEditModal, setShowEditModal] = useState(startInEditMode);
  const [editTitle, setEditTitle] = useState(comp.title);
  const [editEdition, setEditEdition] = useState(comp.edition);
  const [editEnds, setEditEnds] = useState(comp.ends);
  const [editPhase, setEditPhase] = useState(comp.phase);
  const [editContestants, setEditContestants] = useState(comp.contestants != null ? String(comp.contestants) : "");
  const [editEndsAt, setEditEndsAt] = useState(toDatetimeLocal(comp.endsAt));
  const [editDescription, setEditDescription] = useState(comp.description || "");
  const [editPrizeAmount, setEditPrizeAmount] = useState(comp.prizeAmount != null ? String(comp.prizeAmount) : "");
  const [editFee, setEditFee] = useState(String(registrationFee));
  const [editRewardExtra, setEditRewardExtra] = useState(comp.rewardExtra || "");
  const [editRules, setEditRules] = useState((comp.rules || []).join("\n"));
  const [editBannerUrl, setEditBannerUrl] = useState(comp.bannerUrl || null);
  const [savingEdit, setSavingEdit] = useState(false);
  const isLive = !isRegistration && !isCompleted;
  // How long the LIVE phase itself will last, once this edition gets there.
  // This has to be locked in during registration (or at creation) because
  // `open_expired_registrations` reads it only at the registration→live
  // transition to compute the real `ends_at` for the live phase — it can't
  // be changed by hand after the fact, so the edit form stops offering it
  // the moment phase flips to "live".
  const [editLiveDurationSeconds, setEditLiveDurationSeconds] = useState(comp.liveDurationSeconds ?? null);
  // Both duration fields — the quick preset label (editEnds) AND the real
  // deadline (editEndsAt) — must be set together before the edition can be
  // saved/published. Picking a preset sets both at once; picking a custom
  // date used to blank out the label instead, leaving the edition half-set.
  // While still in registration, the live-phase duration above must also be
  // set, since there's no later opportunity to fill it in once live. Live
  // and completed editions skip this check entirely — a live edition's
  // duration was already locked in, and a completed one hides the whole
  // duration section.
  const durationIncomplete = !isCompleted && (!editEnds.trim() || !editEndsAt || (isRegistration && !editLiveDurationSeconds));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImageId, setRemovingImageId] = useState(null);
  const images = comp.images || [];

  useEffect(() => {
    setEditTitle(comp.title);
    setEditEdition(comp.edition);
    setEditEnds(comp.ends);
    setEditPhase(comp.phase);
    setEditContestants(comp.contestants != null ? String(comp.contestants) : "");
    setEditEndsAt(toDatetimeLocal(comp.endsAt));
    setEditDescription(comp.description || "");
    setEditPrizeAmount(comp.prizeAmount != null ? String(comp.prizeAmount) : "");
    setEditFee(String(getRegistrationFee(comp)));
    setEditRewardExtra(comp.rewardExtra || "");
    setEditRules((comp.rules || []).join("\n"));
    setEditBannerUrl(comp.bannerUrl || null);
    setEditLiveDurationSeconds(comp.liveDurationSeconds ?? null);
  }, [comp.id, comp.title, comp.edition, comp.ends, comp.phase, comp.contestants, comp.endsAt, comp.description, comp.prizeAmount, comp.fee, comp.rewardExtra, comp.rules, comp.bannerUrl, comp.liveDurationSeconds]);

  async function handleAddImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    // The gallery is still shared across every edition of this series, so
    // it's keyed by the seed competitionId, not this edition's own id.
    await onAddImage?.(comp.competitionId, file);
    setUploadingImage(false);
  }

  // Banner: not a separate upload — just a tag on one of the thumbnails
  // below, marking which image represents this competition on its card and
  // in the homepage carousel. Persisted to competition_edits.bannerUrl only
  // once "Enregistrer" is pressed, same as every other field in this panel.
  function handleSetBanner(url) {
    setEditBannerUrl((prev) => (prev === url ? null : url));
  }

  async function handleRemoveImage(imageId) {
    setRemovingImageId(imageId);
    await onRemoveImage?.(comp.competitionId, imageId);
    setRemovingImageId(null);
  }

  async function handleSaveEdit() {
    setSavingEdit(true);
    const trimmedPrize = editPrizeAmount.trim();
    const trimmedContestants = editContestants.trim();
    const trimmedFee = editFee.trim();
    const fields = {
      title: editTitle.trim() || comp.title,
      edition: editEdition.trim() || comp.edition,
      ends: editEnds.trim() || comp.ends,
      contestants: trimmedContestants === "" ? null : Math.max(0, parseInt(trimmedContestants, 10) || 0),
      endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      description: editDescription.trim(),
      prizeAmount: trimmedPrize === "" ? null : Number(trimmedPrize),
      fee: trimmedFee === "" ? null : Math.max(0, parseInt(trimmedFee, 10) || 0),
      rewardExtra: editRewardExtra.trim(),
      rules: editRules.split("\n").map((r) => r.trim()).filter(Boolean),
      bannerUrl: editBannerUrl,
      // Left undefined once live (or completed) so neither saveEditionEdit
      // nor onCreateComp ever touches live_duration_seconds past the point
      // it's allowed to change — it was locked in back in registration.
      liveDurationSeconds: isLive ? undefined : editLiveDurationSeconds,
    };
    // A brand-new edition has never been written to the database — this
    // is its first save, so it's an insert (always phase "registration",
    // handled inside onCreateComp), not an update to a row that doesn't
    // exist yet. Everything typed into the form up to this point has
    // only ever lived in local state.
    const result = isNewEdition
      ? await onCreateComp?.({ competitionId: comp.competitionId, ...fields })
      : await onEditComp?.({
          editionId: comp.id,
          competitionId: comp.competitionId,
          ...fields,
          phase: isCompleted ? "completed" : editPhase,
        });
    setSavingEdit(false);
    if (result?.success) setShowEditModal(false);
  }
  const [voted, setVoted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home" | "participants" | "medias" | "donateurs"

  // ── LIVE AUDIO COMMENTARY ──────────────────────────────────────────────
  // Floating, permanent audio player for a "chroniqueur sportif" narrating
  // the competition live — always visible while a competition is open (like
  // X's persistent Spaces mini-player). Tapping it opens a detailed bottom
  // sheet with stream info; muting only happens from inside that sheet.
  // Currently wired to SomaFM's free "Groove Salad" stream for testing —
  // swap the <audio> src below for your real commentary stream when ready.
  const commentator = COMMENTATORS[Math.abs(hashStr(comp.id)) % COMMENTATORS.length];
  const coSpeakers = [1, 2].map((offset) => ({
    name: fakeName(Math.abs(hashStr(comp.id + "_speaker_" + offset))),
  }));
  const [commentaryMuted, setCommentaryMuted] = useState(true);
  const [commentarySheetOpen, setCommentarySheetOpen] = useState(false);
  const [commentaryReady, setCommentaryReady] = useState(false); // true once audio starts actually playing
  const commentaryAudioRef = useRef(null);
  const showCommentaryBand = !isRegistration;

  useEffect(() => {
    if (!showCommentaryBand) return;
    const audio = commentaryAudioRef.current;
    if (!audio) return;
    // Browsers allow autoplay when muted, so this silent bootstrap play is
    // always allowed. Real (audible) playback only starts from a genuine
    // user gesture — see toggleCommentaryMute, called from the floating
    // button's onClick and from the mute control inside the room sheet.
    audio.muted = true;
    const p = audio.play();
    if (p?.then) {
      p.then(() => setCommentaryReady(true)).catch(() => setCommentaryReady(false));
    }
  }, [showCommentaryBand]);

  function toggleCommentaryMute() {
    const audio = commentaryAudioRef.current;
    setCommentaryMuted((prev) => {
      const next = !prev;
      if (audio) {
        audio.muted = next;
        if (!next) {
          // Called from a click handler, so this counts as a user gesture
          // and browsers will allow audible playback here.
          audio.play().then(() => setCommentaryReady(true)).catch(() => setCommentaryReady(false));
        }
      }
      return next;
    });
  }
  function openCommentaryRoom() {
    setCommentarySheetOpen(true);
    if (commentaryMuted) toggleCommentaryMute();
  }
  // ─────────────────────────────────────────────────────────────────────

  const [activeBanner, setActiveBanner] = useState(0);
  const bannerVideoRefs = useRef({});
  const [videoErrors, setVideoErrors] = useState({});
  useEffect(() => {
    Object.entries(bannerVideoRefs.current).forEach(([idx, videoEl]) => {
      if (!videoEl) return;
      if (Number(idx) === activeBanner) {
        try { videoEl.currentTime = 0; } catch (e) { /* not ready yet, ignore */ }
        const playPromise = videoEl.play();
        if (playPromise) playPromise.catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [activeBanner]);
  const [bannerFullscreen, setBannerFullscreen] = useState(false);
  const [tickFlash, setTickFlash] = useState(false);
  // Bonus punch-up: only the gift bonus bumps/flashes, the base prize stays static
  const [bonusBump, setBonusBump] = useState(false);
  const [cagnotteFlash, setCagnotteFlash] = useState(null); // { id, amount } | null
  const cagnotteFlashTimeoutRef = useRef(null);

  // ── Leader row live signals: momentum flash, margin trend, time-in-lead ──
  const leaderSinceRef = useRef(Date.now());
  const [leaderFlash, setLeaderFlash] = useState(null); // small "+X" burst near leader's points
  const [leaderHot, setLeaderHot] = useState(false); // recent-gain momentum dot
  const prevLeaderVotesRef = useRef(null);
  const leaderHotTimeoutRef = useRef(null);
  const leaderFlashTimeoutRef = useRef(null);
  const [marginTrend, setMarginTrend] = useState(null); // 'up' | 'down' | null
  const prevMarginRef = useRef(null);
  const marginTrendTimeoutRef = useRef(null);

  // If the organizer set a real deadline (comp.endsAt), the countdown is
  // computed from actual elapsed time each tick — so it survives reloads,
  // background tabs, etc. Competitions still on the legacy mock "2j 14h"-style
  // `ends` string no longer just decrement a local counter (which snapped back
  // to the full mock duration on every refresh) — instead we compute a real
  // deadline once and persist it, so the countdown keeps counting down against
  // an actual fixed point in time across reloads, same as a real comp.endsAt.
  function secondsUntilEndsAt(target) {
    const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  function resolveEndsAt() {
    if (comp.endsAt) return comp.endsAt;
    const storageKey = `comp-endsAt-${comp.id}`;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (stored) return stored;
    const str = comp.ends || "";
    let total = 0;
    const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
    const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
    const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
    const deadline = new Date(Date.now() + (total || 3600) * 1000).toISOString();
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, deadline);
    return deadline;
  }
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntilEndsAt(resolveEndsAt()));
  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsLeft(secondsUntilEndsAt(resolveEndsAt()));
      setTickFlash((f) => !f);
    }, 1000);
    return () => clearInterval(iv);
  }, [comp.endsAt, comp.id]);

  // ── Closing competitions is now entirely server-side ─────────────────────
  // A Postgres procedure (`close_expired_competitions`), scheduled via
  // pg_cron every minute, is what actually flips phase → "completed",
  // picks the winner (highest total gifts received, from the `gifts`
  // table), and pays out their prize into wallet_balances — atomically,
  // in one transaction per competition, regardless of whether anyone has
  // the board open. The client no longer does this itself: no ref-guarded
  // effect, no "only the organizer's browser can write this" workaround,
  // and no race between whichever tab happens to be open first.
  //
  // `secondsLeft` above is purely cosmetic countdown UI. The moment the
  // server closes a competition out, every client (including this board,
  // if open) hears about it via the `competition_edits` realtime
  // subscription in App() and re-renders with the authoritative result —
  // see the `editionsByComp` subscription near the top-level App component.

  // Dynamic countdown: always shows the 3 most significant units for the
  // remaining duration (e.g. "2D : 12H : 45M" close to the deadline,
  // "5M : 2W : 23D" months out, "1Y : 12M : 32W" a year+ out,
  // "21H : 23M : 45S" under a day). Units shrink as time passes, so the
  // display is never cluttered with zeros the way a fixed d/h/m/s format
  // would be for a far-off deadline. Shares COUNTDOWN_UNITS/fmtCountdownSecs
  // with the module-level fmtCountdown() used on the home-screen cards.
  const fmtCountdown = (s) => fmtCountdownSecs(s);
  const [albumSheet, setAlbumSheet] = useState(null); // { participantIndex, name }
  const [mediaLightbox, setMediaLightbox] = useState(null); // approved participant_media row
  const [showGiftBar, setShowGiftBar] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftStep, setGiftStep] = useState("participant"); // "participant" | "gift" | "confirm"
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftConfirmPhase, setGiftConfirmPhase] = useState("summary"); // "summary" | "pin"
  const [giftPin, setGiftPin] = useState("");
  const [giftPinError, setGiftPinError] = useState(false);
  const [giftSubmitting, setGiftSubmitting] = useState(false);

  // Real donateurs, backed by Supabase — every gift ever sent in this
  // competition, by real, authenticated users. Create this table in
  // Supabase if it doesn't exist yet:
  //   table "gifts": id uuid pk default gen_random_uuid(),
  //     competition_id text, sender_id text, sender_name text,
  //     sender_avatar_url text, recipient_name text, recipient_index int,
  //     recipient_user_id text, gift_icon text, gift_name text, gift_cost int,
  //     price_htg int, created_at timestamptz default now()
  //   recipient_user_id (added) is the real Supabase user id of the gift's
  //   recipient — recipient_index is just a display-hash and isn't safe to
  //   use for anything that pays out real money (collisions possible).
  const [giftRows, setGiftRows] = useState([]); // raw rows for this competition
  const [giftRowsLoading, setGiftRowsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGiftRowsLoading(true);
    supabase
      .from("gifts")
      .select("*")
      .eq("edition_id", comp.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("fetch gifts error:", error); setGiftRowsLoading(false); return; }
        setGiftRows(data || []);
        setGiftRowsLoading(false);
      });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect gifts sent by ANY user, live, while this board
  // is open — the donateurs list is never fake and never stale.
  useEffect(() => {
    const channel = supabase
      .channel(`gifts-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gifts", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setGiftRows((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  // Real total gift *count* for this competition, live-updated by the
  // subscription above. Replaces the old comp.votes mock stat, which was a
  // static seed number (e.g. 6240) that never reflected real donations and
  // only ever moved by a flat +1 per gift sent — it could show a number
  // wildly unrelated to what donateurs actually gave.
  const totalGiftCount = giftRows.length;
  const [pointsBump, setPointsBump] = useState(false);
  const prevTotalGiftCountRef = useRef(totalGiftCount);
  useEffect(() => {
    if (totalGiftCount !== prevTotalGiftCountRef.current) {
      prevTotalGiftCountRef.current = totalGiftCount;
      setPointsBump(true);
      const t = setTimeout(() => setPointsBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [totalGiftCount]);

  // Aggregate raw gift rows into a per-user leaderboard. Grouped by the
  // real sender_id, so "donateurs" always reflects actual people who
  // actually sent gifts — never invented names.
  const giftLeaderboard = useMemo(() => {
    const bySender = new Map();
    for (const row of giftRows) {
      const key = row.sender_id;
      if (!key) continue; // skip malformed rows defensively
      const giftEntry = {
        id: row.id,
        icon: row.gift_icon,
        name: row.gift_name,
        cost: row.gift_cost,
        recipientName: row.recipient_name,
        timestamp: new Date(row.created_at).getTime(),
      };
      const existing = bySender.get(key);
      if (existing) {
        existing.totalSpent += row.gift_cost;
        existing.giftCount += 1;
        existing.gifts.push(giftEntry);
        if (row.gift_cost > existing._topCost) {
          existing._topCost = row.gift_cost;
          existing.topGift = row.gift_icon;
        }
      } else {
        bySender.set(key, {
          id: key,
          senderId: key,
          index: Math.abs(hashStr(key)) % 40,
          name: row.sender_name || "Utilisateur",
          avatarUrl: (currentUser && key === currentUser.id) ? currentUser.avatarUrl : row.sender_avatar_url,
          totalSpent: row.gift_cost,
          giftCount: 1,
          topGift: row.gift_icon,
          _topCost: row.gift_cost,
          isMe: currentUser && key === currentUser.id,
          gifts: [giftEntry],
        });
      }
    }
    return Array.from(bySender.values())
      .map((d) => (d.isMe && currentUser?.fullName ? { ...d, name: currentUser.fullName } : d))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [giftRows, currentUser?.id, currentUser?.fullName, currentUser?.avatarUrl]);

  const [selectedDonor, setSelectedDonor] = useState(null);
  useEffect(() => {
    if (!selectedDonor) return;
    const fresh = giftLeaderboard.find((d) => d.id === selectedDonor.id);
    if (fresh && fresh !== selectedDonor) setSelectedDonor(fresh);
  }, [giftLeaderboard, selectedDonor]);
  const [donorTab, setDonorTab] = useState("all");
  const accent = isRegistration ? "#6C63FF" : comp.accent;
  const rulesInfo = buildRulesInfo(comp);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  // Prize — the organizer sets this explicitly in the edit panel; there is
  // no auto-generated fallback amount anymore.
  const WINNER_GIFT_SHARE = 0.3;
  const basePrizePool = comp.prizeAmount != null && comp.prizeAmount !== ""
    ? Number(comp.prizeAmount)
    : 0;
  // Real registrants for this competition, fetched from Supabase. Always
  // fetched (not just during "registration") since the voting-phase
  // classement/albums/gift-picker below are now built from these rows
  // instead of fake generated names.
  const [showAllRegistrants, setShowAllRegistrants] = useState(false);
  const [registrants, setRegistrants] = useState([]);
  const [registrantsLoading, setRegistrantsLoading] = useState(true);
  const [removingRegistrantId, setRemovingRegistrantId] = useState(null);
  const liveRegistered = registrantsLoading ? comp.registeredCount : registrants.length;
  // Admin-only: pull a participant out of a competition, but only while it's
  // still in the registration phase (once it's live, votes/gifts may already
  // reference them). Always refunds the registration fee they paid, if any.
  const canRemoveParticipants = isOwnCompetition && isRegistration;
  async function handleRemoveParticipant(r) {
    if (!canRemoveParticipants || removingRegistrantId) return;
    const confirmMsg = r.fee > 0
      ? `Retirer ${r.name} de la compétition ? ${r.fee} gourdes lui seront remboursées.`
      : `Retirer ${r.name} de la compétition ?`;
    if (!window.confirm(confirmMsg)) return;
    setRemovingRegistrantId(r.id);
    const { error } = await deleteRegistration(r.id);
    if (error) {
      console.error("remove participant error:", error);
      showToast?.("Échec du retrait du participant.");
      setRemovingRegistrantId(null);
      return;
    }
    if (r.fee > 0) {
      const { error: refundError } = await refundRegistrationFee({
        userId: r.userId,
        amount: r.fee,
        competitionTitle: comp.title,
      });
      if (refundError) {
        console.error("refund error:", refundError);
        showToast?.(`${r.name} retiré, mais le remboursement a échoué.`);
        setRegistrants((prev) => prev.filter((x) => x.id !== r.id));
        setRemovingRegistrantId(null);
        return;
      }
    }
    setRegistrants((prev) => prev.filter((x) => x.id !== r.id));
    onParticipantRemoved?.(comp.id);
    showToast?.(
      r.fee > 0 ? `${r.name} retiré — ${r.fee} gourdes remboursées.` : `${r.name} retiré.`
    );
    setRemovingRegistrantId(null);
  }


  // Participant-submitted media (their own photos/videos), pending organizer
  // approval before it shows up publicly. Backed by Supabase directly so it
  // actually syncs between the uploader's device and the organizer's device —
  // create these in Supabase if they don't exist yet:
  //   table "participant_media": id uuid pk default gen_random_uuid(),
  //     competition_id, uploader_id text, uploader_name text,
  //     media_url text, media_type text, status text default 'pending',
  //     created_at timestamptz default now()
  //   storage bucket "participant-media" (public read)
  const [participantUploads, setParticipantUploads] = useState([]); // flat rows for this competition
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("participant_media")
      .select("*")
      .eq("edition_id", comp.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("fetch participant_media error:", error); return; }
        setParticipantUploads(data || []);
      });
    return () => { cancelled = true; };
  }, [comp.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`participant-media-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "participant_media", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setParticipantUploads((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "participant_media", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setParticipantUploads((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  const myUploads = currentUser ? participantUploads.filter((u) => u.uploader_id === currentUser.id) : [];
  const approvedUploads = participantUploads.filter((u) => u.status === "approved");
  const pendingUploads = participantUploads.filter((u) => u.status === "pending");

  async function addOwnUpload(file) {
    if (!currentUser || !file) return;
    setUploadingMedia(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${comp.id}/${currentUser.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("participant-media").upload(path, file);
    if (uploadError) {
      console.error("participant media upload error:", uploadError);
      showToast?.("Échec de l'envoi du média.");
      setUploadingMedia(false);
      return;
    }
    const { data: pub } = supabase.storage.from("participant-media").getPublicUrl(path);
    const type = file.type.startsWith("video") ? "video" : "photo";
    const { data: inserted, error: insertError } = await supabase
      .from("participant_media")
      .insert({
        competition_id: comp.competitionId,
        edition_id: comp.id,
        uploader_id: currentUser.id,
        uploader_name: currentUser.fullName,
        media_url: pub.publicUrl,
        media_type: type,
        status: "pending",
      })
      .select()
      .single();
    setUploadingMedia(false);
    if (insertError) {
      console.error("participant media insert error:", insertError);
      showToast?.("Échec de l'envoi du média.");
      return;
    }
    setParticipantUploads((prev) => (prev.some((r) => r.id === inserted.id) ? prev : [inserted, ...prev]));
    showToast?.("Média envoyé — en attente d'approbation.");
  }

  async function reviewUpload(id, status) {
    setParticipantUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))); // optimistic
    const { error } = await supabase.from("participant_media").update({ status }).eq("id", id);
    if (error) {
      console.error("participant media review error:", error);
      showToast?.("Échec de la mise à jour.");
      return;
    }
    showToast?.(status === "approved" ? "Média approuvé." : "Média rejeté.");
  }

  useEffect(() => {
    let cancelled = false;
    setRegistrantsLoading(true);
    fetchRegistrations(comp.id).then((rows) => {
      if (cancelled) return;
      setRegistrants(
        rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          name: r.full_name,
          avatarUrl: (currentUser && r.user_id === currentUser.id) ? currentUser.avatarUrl : r.avatar_url,
          fee: r.fee_paid,
          date: new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
          time: new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        }))
      );
      setRegistrantsLoading(false);
    });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect registrations made by ANY user, live, while this
  // board is open — not just the ones fetched at mount time.
  useEffect(() => {
    const channel = supabase
      .channel(`registrations-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          const r = payload.new;
          setRegistrants((prev) => {
            if (prev.some((existing) => existing.id === r.id)) return prev;
            return [
              {
                id: r.id,
                userId: r.user_id,
                name: r.full_name,
                avatarUrl: (currentUser && r.user_id === currentUser.id) ? currentUser.avatarUrl : r.avatar_url,
                fee: r.fee_paid,
                date: new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                time: new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  // Real per-participant total, straight from the same `gifts` rows that
  // back the donateurs section — sum of actual gift_cost, keyed by the
  // recipient_index every real gift was recorded against. No mock data.
  const giftTotalsByIndex = useMemo(() => {
    const totals = {};
    for (const row of giftRows) {
      if (row.recipient_index == null) continue;
      totals[row.recipient_index] = (totals[row.recipient_index] || 0) + (row.gift_cost || 0);
    }
    return totals;
  }, [giftRows]);

  // Database-backed participant list — real registrants only, ranked by
  // real donations received. Never falls back to invented names or invented
  // vote/point totals; if there are no real registrations yet (or the fetch
  // is still in flight), the classement, albums strip, and gift picker
  // simply show nothing, same as donateurs.
  const dbParticipants = useMemo(() => {
    const base = buildParticipantsFromRegistrants(registrants);
    return base
      .map((p) => {
        const real = giftTotalsByIndex[p.index] || 0;
        return { ...p, votes: real, points: real };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [registrants, giftTotalsByIndex]);
  const participantsFull = registrantsLoading ? [] : dbParticipants;
  // Never let someone show up as their own selectable gift recipient — this
  // is what let a self-gift slip through before (the "contestants can't
  // gift in their own competition" check alone wasn't enough, since it
  // relies on the isRegistered flag which can be stale/unpopulated).
  const giftableParticipants = currentUser
    ? participantsFull.filter((p) => p.userId !== currentUser.id)
    : participantsFull;

  // Top 5 by real donations received. dbParticipants already recomputes
  // whenever registrants or real gift rows change (including the realtime
  // `gifts` subscription above and the optimistic row added right after a
  // send), so this is always live — no shadow vote state needed.
  const ranked = participantsFull.slice(0, 5);
  const topPoints = Math.max(...ranked.map((p) => p.points), 1);
  const leader = ranked[0];
  const secondPlace = ranked[1];
  const thirdPlace = ranked[2];
  const leaderMargin = leader && secondPlace ? leader.points - secondPlace.points : null;
  const marginSafe = leaderMargin != null && leader.points > 0 ? leaderMargin / leader.points >= 0.15 : true;

  // Momentum flash: leader just gained votes → brief "+X" burst + "hot" dot for a few seconds
  useEffect(() => {
    if (!leader) return;
    if (prevLeaderVotesRef.current == null) {
      prevLeaderVotesRef.current = leader.votes;
      return;
    }
    const delta = leader.votes - prevLeaderVotesRef.current;
    prevLeaderVotesRef.current = leader.votes;
    if (delta > 0) {
      setLeaderFlash(delta);
      setLeaderHot(true);
      clearTimeout(leaderFlashTimeoutRef.current);
      leaderFlashTimeoutRef.current = setTimeout(() => setLeaderFlash(null), 1200);
      clearTimeout(leaderHotTimeoutRef.current);
      leaderHotTimeoutRef.current = setTimeout(() => setLeaderHot(false), 4000);
    }
  }, [leader?.votes]);

  // Margin trend: compare margin tick-to-tick, flash an arrow for a few seconds
  useEffect(() => {
    if (leaderMargin == null) return;
    if (prevMarginRef.current == null) {
      prevMarginRef.current = leaderMargin;
      return;
    }
    if (leaderMargin !== prevMarginRef.current) {
      setMarginTrend(leaderMargin > prevMarginRef.current ? "up" : "down");
      prevMarginRef.current = leaderMargin;
      clearTimeout(marginTrendTimeoutRef.current);
      marginTrendTimeoutRef.current = setTimeout(() => setMarginTrend(null), 4000);
    }
  }, [leaderMargin]);

  // Time in lead — ticks with the existing 1s countdown heartbeat (tickFlash)
  const leaderElapsedSec = Math.max(0, Math.floor((Date.now() - leaderSinceRef.current) / 1000));
  const fmtLeadTime = (s) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h}h${String(m % 60).padStart(2, "0")}`;
  };
  const leaderGiftCredits = leader ? leader.points : 0;
  const bonusValue = isRegistration ? 0 : Math.round(leaderGiftCredits * WINNER_GIFT_SHARE);
  const winnerPrize = basePrizePool + bonusValue;
  const heroPrizeValue = isRegistration ? basePrizePool : winnerPrize;
  // Only the bonus bumps/flashes live — the base prize number stays put
  const prevBonusRef = useRef(bonusValue);
  useEffect(() => {
    if (bonusValue !== prevBonusRef.current) {
      const delta = bonusValue - prevBonusRef.current;
      prevBonusRef.current = bonusValue;
      setBonusBump(true);
      const t = setTimeout(() => setBonusBump(false), 380);
      if (delta > 0) {
        setCagnotteFlash({ id: Date.now(), amount: delta });
        clearTimeout(cagnotteFlashTimeoutRef.current);
        cagnotteFlashTimeoutRef.current = setTimeout(() => setCagnotteFlash(null), 1400);
      }
      return () => clearTimeout(t);
    }
  }, [bonusValue]);
  // Contribution breakdown — how much of the pot is base vs. gift bonus
  const giftBonusValue = Math.max(0, heroPrizeValue - basePrizePool);
  const giftBonusPct = heroPrizeValue > 0 ? Math.min(100, Math.round((giftBonusValue / heroPrizeValue) * 100)) : 0;
  // Next round milestone, to create a little anticipation
  const nextMilestone = (() => {
    const v = heroPrizeValue;
    const step = v < 5000 ? 1000 : v < 20000 ? 5000 : v < 100000 ? 10000 : 50000;
    return Math.ceil((v + 1) / step) * step;
  })();
  const milestoneProgressPct = nextMilestone > 0 ? Math.min(100, Math.round((heroPrizeValue / nextMilestone) * 100)) : 0;
  function mapCommentRow(row) {
    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000));
    const isMine = currentUser && row.user_id === currentUser.id;
    return {
      id: row.id,
      index: Math.abs(hashStr(row.user_id || row.id)) % 40,
      name: row.full_name,
      // Prefer the live avatar for the viewer's own comments (so a picture
      // change shows up immediately), otherwise whatever the row has.
      avatarUrl: isMine ? currentUser.avatarUrl : row.avatar_url,
      text: row.text,
      minutesAgo,
      likes: 0,
      isMine,
    };
  }

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [likedCommentIds, setLikedCommentIds] = useState(() => new Set());
  const [expandedReplies, setExpandedReplies] = useState(() => new Set());
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyDraft, setReplyDraft] = useState("");
  const scrollRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // If the user renames themselves mid-session, immediately reflect the new
  // name on anything of theirs already loaded into this board (their own
  // registration entry, their own media uploads, their own comments) instead
  // of leaving the old name stuck until a hard refresh re-fetches from the
  // database. Historical rows in the database keep the name as it was at
  // creation time — this just keeps what's on screen in sync for the
  // person currently renaming themselves.
  useEffect(() => {
    if (!currentUser) return;
    setRegistrants((prev) =>
      prev.map((r) => (r.userId === currentUser.id && r.name !== currentUser.fullName ? { ...r, name: currentUser.fullName } : r))
    );
    setParticipantUploads((prev) =>
      prev.map((u) => (u.uploader_id === currentUser.id && u.uploader_name !== currentUser.fullName ? { ...u, uploader_name: currentUser.fullName } : u))
    );
    setComments((prev) =>
      prev.map((c) => ({
        ...c,
        name: c.isMine ? currentUser.fullName : c.name,
        replies: (c.replies || []).map((r) => (r.isMine ? { ...r, name: currentUser.fullName } : r)),
      }))
    );
  }, [currentUser?.fullName, currentUser?.id]);

  // Load comments (and their replies) for this competition from the database.
  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    fetchComments(comp.id).then((rows) => {
      if (cancelled) return;
      setComments(
        rows.map((c) => ({
          ...mapCommentRow(c),
          replies: (c.replies || []).map(mapCommentRow),
        }))
      );
      setCommentsLoading(false);
    });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect comments/replies posted by ANY user, live, while
  // this board is open.
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          const row = payload.new;
          if (row.parent_id) {
            setComments((prev) => prev.map((cm) => {
              if (cm.id !== row.parent_id) return cm;
              if ((cm.replies || []).some((r) => r.id === row.id)) return cm;
              return { ...cm, replies: [...(cm.replies || []), mapCommentRow(row)] };
            }));
          } else {
            setComments((prev) => {
              if (prev.some((c) => c.id === row.id)) return prev;
              return [{ ...mapCommentRow(row), replies: [] }, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const SCROLL_THRESHOLD = 140;
  const t = Math.min(scrollY / SCROLL_THRESHOLD, 1);
  const headerBg = `rgba(255,255,255,${t})`;
  const borderColor = t > 0.5 ? `rgba(0,0,0,0.1)` : `rgba(255,255,255,0.3)`;


  // (Removed: fake simulated registration-count timer. liveRegistered is now
  // sourced for real from the database — see the fetch + realtime effects above.)

  async function handlePostComment() {
    const text = commentDraft.trim();
    if (!text) return;
    if (!currentUser) {
      onRequestAuth?.();
      return;
    }
    setPosting(true);
    const { data, error } = await insertComment({
      editionId: comp.id,
      competitionId: comp.competitionId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      text,
    });
    setPosting(false);
    if (error) {
      console.error("insertComment error:", error);
      return;
    }
    setComments((prev) => {
      if (prev.some((c) => c.id === data.id)) return prev;
      return [{ ...mapCommentRow(data), replies: [] }, ...prev];
    });
    setCommentDraft("");
  }

  async function handlePostReply(parentId) {
    const text = replyDraft.trim();
    if (!text || !currentUser) return;
    const { data, error } = await insertComment({
      editionId: comp.id,
      competitionId: comp.competitionId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      text,
      parentId,
    });
    if (error) {
      console.error("insertComment (reply) error:", error);
      return;
    }
    setComments((prev) => prev.map((cm) => {
      if (cm.id !== parentId) return cm;
      if ((cm.replies || []).some((r) => r.id === data.id)) return cm;
      return { ...cm, replies: [...(cm.replies || []), mapCommentRow(data)] };
    }));
    setExpandedReplies((prev) => new Set([...prev, parentId]));
    setReplyDraft("");
    setReplyingTo(null);
  }

  function handleToggleLike(commentId) {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  // Interleave live gift entries and comments into one chronological feed, TikTok-style.
  // Derived straight from giftRows (Supabase-backed + realtime-synced) so the
  // live feed survives a refresh, instead of the old local-only liveLog state
  // which reset to [] on every reload and lost every gift already sent.
  const feedItems = useMemo(() => {
    const sortedGiftRows = [...giftRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const giftItems = sortedGiftRows.map((row, i) => ({
      type: "gift",
      key: `gift-${row.id}`,
      minutesAgo: i * 2,
      entry: {
        id: row.id,
        pIndex: row.recipient_index ?? 0,
        pName: row.recipient_name,
        gift: { icon: row.gift_icon, name: row.gift_name, cost: row.gift_cost },
        senderName: row.sender_name,
        ago: i === 0 ? "À l'instant" : `il y a ${i * 2} min`,
      },
    }));
    const commentItems = comments.map((c) => ({
      type: "comment",
      key: `comment-${c.id}`,
      minutesAgo: c.minutesAgo,
      comment: c,
    }));
    return [...giftItems, ...commentItems].sort((a, b) => a.minutesAgo - b.minutesAgo);
  }, [giftRows, comments]);

  const heroBannerSlides = useMemo(() => {
    const images = comp.images || [];
    if (images.length === 0) return [{ type: "placeholder" }];
    return images.map((img) => ({ type: "image", src: img.url }));
  }, [comp.images]);

  return (
    <div ref={scrollRef} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#F2F2F0", overflowY: "auto" }}>

      {/* ── STICKY TRANSPARENT HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 12px",
        background: headerBg,
        borderBottom: t > 0.5 ? `1px solid rgba(0,0,0,${0.08 * t})` : "none",
        pointerEvents: "none",
        opacity: bannerFullscreen ? 0 : 1,
        transition: "opacity 0.3s",
      }}>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
          color: "#222", fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "all",
        }}><X size={14} /></button>

        {/* Competition follow — separate from organiser follow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "all" }}>
          <button
            onClick={() => onToggleFollow?.(comp)}
            title={isFollowed ? "Ne plus suivre cette compétition" : "Suivre cette compétition"}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: isFollowed ? `${accent}33` : "rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px) saturate(180%)",
              WebkitBackdropFilter: "blur(12px) saturate(180%)",
              border: isFollowed ? `1px solid ${accent}88` : "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              color: isFollowed ? accent : "#222",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Bell size={13} strokeWidth={isFollowed ? 2.5 : 2} fill={isFollowed ? accent : "none"} />
          </button>

          <button
            title="Partager"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px) saturate(180%)",
              WebkitBackdropFilter: "blur(12px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              color: "#222",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Share2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", width: "100%", background: accent, paddingBottom: 0, marginTop: -46 }}>

        {/* Banner slides */}
        {(() => {
          const bannerSlides = heroBannerSlides;
          return (
            <>
              {/* Main slider */}
              <div style={{ width: "100%", aspectRatio: "3 / 1", position: "relative", overflow: "hidden" }}>
                {bannerSlides.map((slide, i) => (
                  <div key={i} style={{
                    position: "absolute", inset: 0,
                    opacity: i === activeBanner ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}>
                    {slide.type === "video" ? (
                      <>
                        <video
                          ref={(el) => { if (el) bannerVideoRefs.current[i] = el; }}
                          src={slide.src}
                          poster={slide.poster}
                          muted
                          loop
                          playsInline
                          onError={() => setVideoErrors((e) => ({ ...e, [i]: true }))}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: isCompleted ? "grayscale(0.85)" : "none" }}
                        />
                        {videoErrors[i] && (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: "50%",
                              background: "rgba(0,0,0,0.45)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Play size={24} fill="#fff" color="#fff" strokeWidth={0} style={{ marginLeft: 2 }} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : slide.type === "placeholder" ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e5e5" }}>
                        <ImageIcon size={40} color="#bbb" />
                      </div>
                    ) : (
                      <img src={slide.src} alt={`${comp.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: isCompleted ? "grayscale(0.85)" : "none" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: `${accent}44`, mixBlendMode: "multiply" }} />
                    {isCompleted && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />
                    )}
                  </div>
                ))}
                {/* Gradient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
                  zIndex: 1,
                }} />
                {/* Hero content */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, padding: "0 8px 16px", opacity: bannerFullscreen ? 0 : 1, transition: "opacity 0.3s", pointerEvents: bannerFullscreen ? "none" : "all" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>{comp.niche}</div>
                    {isLive && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "#fff",
                        background: "#00B894", padding: "2px 7px", borderRadius: 7,
                        fontFamily: "Inter, sans-serif",
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                        En direct
                      </div>
                    )}
                    {isCompleted && (
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", color: "#fff",
                        background: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: 7,
                        fontFamily: "Inter, sans-serif",
                        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                      }}>
                        🏆 Terminé
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{comp.title}</div>
                </div>
                {/* Focus icon — bottom right */}
                <div
                  style={{ position: "absolute", bottom: 12, right: 12, zIndex: 6, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", padding: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setBannerFullscreen((v) => !v); }}
                >
                  {bannerFullscreen ? (
                    /* Minimize — inward arrows */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M9 14H3M9 14V20M9 14L3 20"/>
                      <path d="M15 14h6M15 14v6M15 14l6 6"/>
                      <path d="M9 10H3M9 10V4M9 10L3 4"/>
                      <path d="M15 10h6M15 10V4M15 10L21 4"/>
                    </svg>
                  ) : (
                    /* Maximize — outward corner arrows */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M3 9V3h6M3 3l6 6"/>
                      <path d="M21 9V3h-6M21 3l-6 6"/>
                      <path d="M3 15v6h6M3 21l6-6"/>
                      <path d="M21 15v6h-6M21 21l-6-6"/>
                    </svg>
                  )}
                </div>
              </div>

            </>
          );
        })()}
      </div>

      {/* ── CONTENT SHEET — rounded top corners, sits flush below the hero ── */}
      <div style={{
        position: "relative",
        borderRadius: "22px 22px 0 0",
        background: "#F2F2F0",
        overflow: "hidden",
      }}>

      {/* ── Thumbnail selector — lives inside the sheet so the curve never covers it. Only worth showing when there's something to switch between. ── */}
      {heroBannerSlides.length > 1 && (
        <div style={{ background: "#fff", padding: "12px 8px 8px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {heroBannerSlides.map((slide, i) => (
            <div
              key={i}
              onClick={() => setActiveBanner(i)}
              style={{
                width: 60, height: 60, flexShrink: 0,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden", cursor: "pointer",
                outline: i === activeBanner ? `2px solid ${accent}` : "2px solid transparent",
                outlineOffset: "-2px",
                transition: "outline-color 0.2s, opacity 0.2s",
                opacity: i === activeBanner ? 1 : 0.45,
              }}
            >
              {slide.type === "placeholder" ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#eee" }}>
                  <ImageIcon size={20} color="#ccc" />
                </div>
              ) : (
                <img src={slide.type === "video" ? slide.poster : slide.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              {slide.type === "video" && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Play size={11} fill="#111" color="#111" strokeWidth={0} style={{ marginLeft: 1 }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ORGANISER BAR ── */}
      <OrgBar comp={comp} accent={accent} />

      {/* ── TABS ── */}
      <div style={{
        display: "flex", background: "#fff", borderBottom: "1px solid #e0e0e0",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        {[
          { key: "home", label: "Home" },
          { key: "participants", label: "Participants" },
          { key: "medias", label: "Médias" },
          { key: "donateurs", label: "Donateurs" },
          { key: "live", label: "Live" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, border: "none", background: "none", cursor: "pointer",
              padding: "13px 4px 11px",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
              color: activeTab === tab.key ? "#111" : "#aaa",
              borderBottom: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {tab.key === "live" && !isRegistration ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                {tab.label}
              </span>
            ) : tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 0 132px" }}>

        {activeTab === "home" && (
        <>
        {isCompleted && (
          <div style={{
            background: "linear-gradient(135deg, #2c2c2c, #111)",
            padding: "18px 16px", textAlign: "center", color: "#fff",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <Trophy size={22} color="#F0C420" strokeWidth={2.2} />
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800, color: "#F0C420", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              Compétition terminée
            </div>
            {comp.winnerUserId ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
                  {comp.winnerName} remporte {Number(comp.winnerPrize || 0).toLocaleString("fr-FR")} HTG
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Félicitations au gagnant 🎉
                </div>
              </>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                Aucun participant n'a reçu de cadeaux — pas de gagnant à annoncer.<br />
                Les frais d'inscription ont été remboursés à tous les participants.
              </div>
            )}
          </div>
        )}
        {/* ── À PROPOS / RÈGLEMENT ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 10px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10,
          }}>
            <Info size={13} strokeWidth={2.5} />
            À propos
          </div>

          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: rulesInfo.description ? "#444" : "#aaa",
            lineHeight: 1.55, margin: "0 0 12px",
            fontStyle: rulesInfo.description ? "normal" : "italic",
          }}>
            {rulesInfo.description || "Aucune description pour le moment."}
          </p>

          {/* Prize — single winner: registration fees (base) + 30% of their personal gifts */}
          <div style={{ marginBottom: 12 }}>

            {/* Hero cagnotte — full-width section, no card wrapper */}
            <div style={{ position: "relative", padding: "2px 2px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Trophy size={14} color="#C99A2E" strokeWidth={2.3} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800, color: "#C99A2E", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                  {isRegistration ? "Prix à gagner" : "Cagnotte à gagner"}
                </span>
                {!isRegistration && !isCompleted && (
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Live
                    </span>
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                {/* Base prize — static, never bumps or increments */}
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 800, color: "#111",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {basePrizePool.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#999" }}>
                  HTG
                </span>

                {/* Gift bonus — lives in the same row, this is the only piece that bumps/increments */}
                {!isRegistration && (
                  <span style={{ position: "relative", display: "inline-flex" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: `${accent}18`, color: accent,
                      padding: "3px 9px", borderRadius: 999,
                      fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      transform: bonusBump ? "scale(1.08)" : "scale(1)",
                      transformOrigin: "left center",
                      transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <Gift size={11} color={accent} strokeWidth={2.3} />
                      +{bonusValue.toLocaleString("fr-FR")} HTG bonus
                    </span>
                    {cagnotteFlash != null && (
                      <span key={cagnotteFlash.id} style={{
                        position: "absolute", left: "100%", top: -2, marginLeft: 6,
                        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 800, color: "#27ae60",
                        whiteSpace: "nowrap", animation: "float-up-fade 1.4s ease-out forwards",
                      }}>
                        +{cagnotteFlash.amount.toLocaleString("fr-FR")}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {isRegistration ? (
                <div style={{ marginTop: 4, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888" }}>
                  + un bonus basé sur les cadeaux reçus par le gagnant
                </div>
              ) : (
                <>
                  {/* Contribution breakdown — base prize vs. gift bonus, as a thin segmented bar */}
                  {heroPrizeValue > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", width: "100%", height: 5, borderRadius: 3, overflow: "hidden", background: "#eee" }}>
                        <div style={{ width: `${100 - giftBonusPct}%`, background: "#ccc", transition: "width 0.4s ease" }} />
                        <div style={{ width: `${giftBonusPct}%`, background: accent, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontFamily: "Inter, sans-serif", fontSize: 9, color: "#aaa" }}>
                        <span>Mise de base {(100 - giftBonusPct)}%</span>
                        <span>Cadeaux {giftBonusPct}%</span>
                      </div>
                    </div>
                  )}

                  {/* Milestone marker — a little anticipation for the next round number */}
                  {!isCompleted && (
                    <div style={{ marginTop: 8, fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa" }}>
                      Prochain palier : {nextMilestone.toLocaleString("fr-FR")} HTG
                      <span style={{ marginLeft: 6, color: "#ccc" }}>({milestoneProgressPct}%)</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {rulesInfo.rewardExtra && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", marginTop: 8, padding: "0 2px" }}>
                {rulesInfo.rewardExtra}
              </div>
            )}

          </div>
        </div>

        {/* ── STATS / RÉSUMÉ FINAL ── */}
        {isCompleted ? (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>

            {/* Section label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "14px 16px 0",
            }}>
              <Trophy size={13} strokeWidth={2.5} />
              Résumé final
            </div>

            {/* Quick stats — 2x2 flat grid, hairline dividers like the
                live/registration stat row, no card backgrounds */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              marginTop: 12, borderTop: "1px solid #f0f0f0",
            }}>
              {[
                { label: "Candidats", value: liveRegistered },
                { label: "Cadeaux envoyés", value: fmtVotes(totalGiftCount) },
                { label: "Cagnotte finale", value: `${heroPrizeValue.toLocaleString("fr-FR")} G`, accent: true },
                { label: "Terminée le", value: comp.closedAt ? fmtAbsoluteDate(comp.closedAt) : fmtAbsoluteDate(resolveEndsAt()) },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "12px 4px",
                  borderRight: i % 2 === 0 ? "1px solid #f0f0f0" : "none",
                  borderBottom: i < 2 ? "1px solid #f0f0f0" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 800,
                    color: s.accent ? accent : "#111", lineHeight: 1.15,
                    fontVariantNumeric: "tabular-nums",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: "Inter, sans-serif", fontSize: 9.5, color: "#999",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4,
                    fontWeight: 600, textAlign: "center",
                  }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Winner — this platform has one winner per competition (the
                real, DB-persisted comp.winnerName), not a ranked podium.
                Flat row, matching the Classement tab's own style. */}
            {ranked.length > 0 && (
              <div style={{ padding: "14px 16px 4px" }}>
                <div style={{
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 4,
                }}>
                  Gagnant
                </div>
                {(() => {
                  const p = ranked[0];
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0" }}>
                      <span style={{
                        width: 20, flexShrink: 0, textAlign: "center",
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700,
                        color: accent,
                      }}>
                        🥇
                      </span>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${accent}` }}>
                        <EntityAvatar url={p.avatarUrl} name={p.name} />
                      </div>
                      <span style={{
                        flex: 1, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                        color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{comp.winnerName || p.name}</span>
                      <span style={{
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                        color: accent, flexShrink: 0,
                      }}>🪙 {p.points.toLocaleString("fr-FR")}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Top donors — same flat row treatment */}
            {giftLeaderboard.length > 0 && (
              <div style={{ padding: "10px 16px 14px" }}>
                <div style={{
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 4,
                }}>
                  Top donateurs
                </div>
                {giftLeaderboard.slice(0, 3).map((d, i) => (
                  <div key={d.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 0",
                    borderBottom: i < Math.min(giftLeaderboard.length, 3) - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: "#ccc", width: 16, flexShrink: 0, textAlign: "center" }}>
                      {i + 1}
                    </span>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #eee" }}>
                      <EntityAvatar url={d.avatarUrl} name={d.name} />
                    </div>
                    <span style={{
                      flex: 1, fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600,
                      color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{d.name}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#999", flexShrink: 0 }}>
                      {d.totalSpent.toLocaleString("fr-FR")} G
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
            {isRegistration && (
              <div style={{ padding: "14px 16px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  {/* Avatar stack — recent registrants, aligned with the count on the same row.
                      Tapping it (or the chevron) jumps to the full Participants list. */}
                  {registrants.length > 0 ? (
                    <button
                      onClick={() => setActiveTab("participants")}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        border: "none", background: "none", padding: 0, cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {registrants.slice(0, 4).map((r, i) => {
                          const isMe = currentUser && r.userId === currentUser.id;
                          return (
                            <div key={r.id} style={{
                              width: 22, height: 22, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                              border: isMe ? `2px solid ${accent}` : "2px solid #fff", marginLeft: i === 0 ? 0 : -8,
                              boxShadow: isMe ? `0 0 0 1px ${accent}` : "0 1px 3px rgba(0,0,0,0.18)",
                            }}>
                              <EntityAvatar url={r.avatarUrl} name={r.name} />
                            </div>
                          );
                        })}
                        {registrants.length > 4 && (
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            border: "2px solid #fff", marginLeft: -8,
                            background: "#f0ebff", color: "#6C63FF",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                          }}>
                            +{registrants.length - 4}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} color="#bbb" strokeWidth={2.5} />
                    </button>
                  ) : <span />}

                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ color: "#111" }}>{liveRegistered}</span>
                    <span style={{ color: "#ccc" }}>/</span>
                    <span style={{ color: accent }}>{comp.contestants}</span>
                  </span>
                </div>

                {/* Animated fill bar — same treatment as the Participants tab's registration bar,
                    with milestone ticks at 25/50/75% to gauge fill speed at a glance. Color ramps
                    from purple → amber → red as it nears capacity (independent of comp.hot), and
                    a pulsing glow marks the current leading edge of the fill. */}
                {(() => {
                  const fillPct = Math.min(100, Math.round((liveRegistered / comp.contestants) * 100));
                  const isFull = liveRegistered >= comp.contestants;
                  const barColor = isFull ? "#00B894" : fillPct >= 85 ? "#E74C3C" : fillPct >= 60 ? "#E67E22" : "#6C63FF";
                  const barGradient = isFull
                    ? "linear-gradient(90deg, #00B894 0%, #00d4a8 50%, #00B894 100%)"
                    : fillPct >= 85
                    ? "linear-gradient(90deg, #E74C3C 0%, #ff6b5b 50%, #E74C3C 100%)"
                    : fillPct >= 60
                    ? "linear-gradient(90deg, #E67E22 0%, #f5a623 50%, #E67E22 100%)"
                    : "linear-gradient(90deg, #6C63FF 0%, #a89dff 50%, #6C63FF 100%)";
                  return (
                    <div style={{ height: 8, borderRadius: 999, background: "#e0d5ff", width: "100%", overflow: "visible", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 999, overflow: "hidden" }}>
                        <div
                          className="bar-shimmer"
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            width: `${fillPct}%`,
                            background: barGradient,
                            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.4s ease",
                          }}
                        />
                        {[25, 50, 75].map((pct) => (
                          <div key={pct} style={{
                            position: "absolute", top: 0, bottom: 0, left: `${pct}%`,
                            width: 1, background: "rgba(0,0,0,0.14)", pointerEvents: "none",
                          }} />
                        ))}
                      </div>
                      {/* Pulsing glow at the leading edge of the fill */}
                      {fillPct > 0 && (
                        <div style={{
                          position: "absolute", top: "50%", left: `${fillPct}%`,
                          transform: "translate(-50%, -50%)",
                          width: 12, height: 12, borderRadius: "50%",
                          background: barColor,
                          boxShadow: `0 0 8px 3px ${barColor}`,
                          animation: "bar-glow-pulse 1.4s ease-in-out infinite",
                          transition: "left 0.6s cubic-bezier(0.4,0,0.2,1), background 0.4s ease",
                          pointerEvents: "none",
                        }} />
                      )}
                      <style>{`@keyframes bar-glow-pulse { 0%,100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.85); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); } }`}</style>
                    </div>
                  );
                })()}

                {/* Consolidated stat chips — pulls Places/Frais/Temps into one row right under the bar,
                    instead of scattering them across separate rows below. */}
                <div style={{ display: "flex", gap: 8, margin: "12px 0 4px" }}>
                  <div style={{ flex: 1, background: "#f7f7f5", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                      {Math.max(0, comp.contestants - liveRegistered)}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, fontWeight: 600 }}>
                      Places rest.
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "#f7f7f5", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                      {registrationFee} G
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, fontWeight: 600 }}>
                      Frais insc.
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "#f7f7f5", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 800,
                      color: comp.hot ? "#c0392b" : "#6C63FF", fontVariantNumeric: "tabular-nums",
                      transition: "opacity 0.12s", opacity: tickFlash ? 1 : 0.6,
                    }}>
                      {fmtCountdownSecs(secondsLeft, 2)}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2, fontWeight: 600 }}>
                      Temps rest.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isRegistration && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {([
                { value: liveRegistered, label: "Candidats" },
                { value: fmtVotes(totalGiftCount), label: "Cadeaux", accent: true, bump: pointsBump },
                { value: fmtAbsoluteDate(resolveEndsAt()), label: "Fin dans", hot: comp.hot, timer: true },
              ]).map((s, i) => {
                const hotTimer = s.timer && s.hot;
                return (
                  <div key={i} style={{
                    borderLeft: i > 0 ? "1px solid #f0f0f0" : "none",
                    padding: "10px 4px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    background: s.timer ? "transparent" : "transparent",
                    transition: "background 0.3s",
                  }}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: s.timer ? 13 : 24, fontWeight: 800,
                      color: hotTimer ? "#c0392b" : s.timer ? "#6C63FF" : s.accent ? accent : "#111",
                      lineHeight: 1.15,
                      transition: s.timer ? "opacity 0.12s, transform 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.3s" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                      opacity: s.timer ? (tickFlash ? 1 : 0.6) : 1,
                      transform: s.bump ? "scale(1.14)" : "scale(1)",
                      fontVariantNumeric: s.timer ? "normal" : "tabular-nums",
                      whiteSpace: s.timer ? "nowrap" : "normal",
                      ...(s.timer ? {
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: hotTimer ? "rgba(192,57,43,0.09)" : "rgba(108,99,255,0.09)",
                      } : {}),
                    }}>{s.timer ? fmtCountdown(secondsLeft) : s.value}</div>
                    {s.timer && (
                      <div style={{
                        fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb",
                        marginTop: 2, whiteSpace: "nowrap",
                      }}>{fmtAbsoluteDate(resolveEndsAt())}</div>
                    )}
                    <div style={{
                      fontFamily: "Inter, sans-serif", fontSize: 9.5, color: "#999",
                      textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4,
                      fontWeight: 600, textAlign: "center",
                    }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* ── RULES (lower-priority disclosure, separate from the vitals above) ── */}
        {rulesInfo.rules.length > 0 && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 10px" }}>
            <button
              onClick={() => setRulesExpanded((v) => !v)}
              style={{
                width: "100%", border: "none", borderRadius: 14, background: "#f5f5f5",
                padding: "6px 8px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                color: "#333", textTransform: "uppercase", letterSpacing: "0.06em",
              }}
            >
              Règlement complet
              <ChevronRight
                size={14}
                style={{ transform: rulesExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              />
            </button>

            {rulesExpanded && (
              <ol style={{
                margin: "10px 0 0", padding: "0 0 0 12px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {rulesInfo.rules.map((rule, i) => (
                  <li key={i} style={{
                    fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#555",
                    lineHeight: 1.5,
                  }}>
                    {rule}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* ── PARTICIPANTS PREVIEW ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12, paddingLeft: 10, paddingRight: 10,
          }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
            }}><Users size={13} strokeWidth={2.5} />Participants</span>
            <button
              onClick={() => setActiveTab("participants")}
              style={{
                border: "none", background: "none", color: accent,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Voir plus
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
            </button>
          </div>

          <div style={{ paddingLeft: 10, paddingRight: 10 }}>
            {isRegistration ? (
              registrants.slice(0, 3).map((r, idx, arr) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "3px 0",
                  borderBottom: idx < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "#f0ebff", color: "#6C63FF",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                      Inscrit le {r.date} à {r.time}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    color: "#6C63FF", flexShrink: 0,
                  }}>
                    {r.fee} gourdes
                  </span>
                </div>
              ))
            ) : (
              ranked.slice(0, 3).map((p, rank, arr) => {
                const pct = Math.max(8, Math.round((p.points / topPoints) * 100));
                return (
                  <div key={p.id ?? p.index} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "5px 0",
                    borderBottom: rank < arr.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    {/* Rank */}
                    <span style={{
                      width: 20, flexShrink: 0, textAlign: "center",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: rank === 0 ? 16 : 12, fontWeight: 700,
                      color: rank === 0 ? accent : "#ccc",
                    }}>
                      {rank === 0 ? "🥇" : rank + 1}
                    </span>

                    {/* Profile pic */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      overflow: "hidden", background: "#fff",
                      border: rank === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                    }}>
                      <EntityAvatar url={p.avatarUrl} name={p.name} />
                    </div>

                    {/* Name + points/coin above, full-width progress bar below */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{
                          fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                          color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{p.name}</span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                          color: rank === 0 ? accent : "#555", flexShrink: 0,
                        }}>
                          🪙 {p.points.toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                        <div
                          className="bar-shimmer"
                          style={{
                            height: "100%", borderRadius: 2,
                            width: `${pct}%`,
                            background: rank === 0
                              ? `linear-gradient(90deg, ${accent} 0%, ${accent}cc 50%, ${accent} 100%)`
                              : "linear-gradient(90deg, #ddd 0%, #eee 50%, #ddd 100%)",
                            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── MÉDIAS PREVIEW ──
             Approved media from everyone, plus the current user's own
             uploads even while still pending (tagged "En attente") so they
             can see their submission sitting in the row while it's reviewed. */}
        {!isRegistration && (() => {
          const homeMediaItems = participantUploads.filter(
            (u) => u.status === "approved" || (currentUser && u.uploader_id === currentUser.id && u.status === "pending")
          );
          return homeMediaItems.length > 0 && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><ImageIcon size={13} strokeWidth={2.5} />Médias</span>
              <button
                onClick={() => setActiveTab("medias")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
              {homeMediaItems.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={() => { if (item.status === "approved") setMediaLightbox(item); }}
                  style={{ position: "relative", flexShrink: 0, width: 110, aspectRatio: "1 / 1", overflow: "hidden", background: "#111", cursor: item.status === "approved" ? "pointer" : "default" }}
                >
                  {item.media_type === "video" ? (
                    <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.status === "pending" ? 0.55 : 1 }} muted />
                  ) : (
                    <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.status === "pending" ? 0.55 : 1 }} />
                  )}
                  {item.status === "pending" && (
                    <span style={{
                      position: "absolute", top: 6, left: 6,
                      background: "#e74c3c", color: "#fff",
                      fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                      padding: "2px 6px", letterSpacing: "0.02em",
                    }}>
                      En attente
                    </span>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.uploader_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ── DONATEURS PREVIEW ── */}
        {!isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Gift size={13} strokeWidth={2.5} />Donateurs</span>
              <button
                onClick={() => setActiveTab("donateurs")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {giftLeaderboard.length === 0 ? (
              <div style={{ padding: "2px 10px 0px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                Aucun donateur pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
                {giftLeaderboard.slice(0, 10).map((donor, i) => (
                  <div key={donor.id} style={{ flexShrink: 0, width: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                      border: i === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      position: "relative",
                    }}>
                      <EntityAvatar url={donor.avatarUrl} name={donor.name} bg={donor.isMe ? "#111" : "#ddd"} color={donor.isMe ? "#fff" : "#666"} />
                      {i === 0 && (
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>👑</span>
                      )}
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#333", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {donor.name}
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800, color: i === 0 ? accent : "#888" }}>
                      🪙 {formatCoins(donor.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE PREVIEW ── */}
        {!isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                Live
              </span>
              <button
                onClick={() => setActiveTab("live")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {feedItems.length === 0 ? (
              <div style={{ padding: "2px 10px 0px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                Aucune activité pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
                {feedItems.slice(0, 10).map((item) => {
                  if (item.type === "gift") {
                    const entry = item.entry;
                    const liked = likedCommentIds.has(entry.id);
                    // entry.id is a UUID string (from Supabase), not the old
                    // Date.now() number — hash it to a stable int before % so
                    // this doesn't produce NaN like it did right after the
                    // liveLog -> giftRows switch.
                    let idHash = 0;
                    for (let ci = 0; ci < String(entry.id).length; ci++) {
                      idHash = (idHash * 31 + String(entry.id).charCodeAt(ci)) | 0;
                    }
                    idHash = Math.abs(idHash);
                    const likeCount = (idHash % 12) + (liked ? 1 : 0);
                    const replyCount = idHash % 3;
                    return (
                      <div key={item.key} style={{
                        flexShrink: 0, width: 170,
                        border: "1px solid #f0f0f0",
                        display: "flex", flexDirection: "column",
                      }}>
                        {/* Body */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "7px 8px 6px" }}>
                          {/* Header — sender profile, same as a comment card */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                              background: "#111",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>
                                {(entry.senderName || "V").charAt(0)}
                              </span>
                            </div>
                            <span style={{ flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {entry.senderName || "Vous"}
                            </span>
                            {/* Gift tag — distinguishes this from a comment card */}
                            <span style={{
                              flexShrink: 0,
                              display: "flex", alignItems: "center", gap: 2,
                              background: `${accent}18`, color: accent,
                              fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.04em",
                              padding: "2px 5px", borderRadius: 999,
                            }}>
                              🎁 Cadeau
                            </span>
                          </div>

                          {/* Emoji — the central element */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "3px 0" }}>
                            <span style={{ fontSize: 26, lineHeight: 1 }}>{entry.gift.icon}</span>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: accent }}>
                              {entry.gift.name}
                            </span>
                          </div>

                          {/* Recipient — who the gift is for */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            paddingTop: 4, borderTop: "1px solid #f0f0f0",
                          }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1px solid #eee" }}>
                              <EntityAvatar url={entry.pAvatarUrl} name={entry.pName || fakeName(entry.pIndex)} />
                            </div>
                            <span style={{
                              fontFamily: "Inter, sans-serif", fontSize: 10, color: "#888",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              pour <span style={{ fontWeight: 700, color: "#666" }}>{entry.pName || fakeName(entry.pIndex)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Engagement bar — edge-to-edge separator, always at the bottom */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderTop: "1px solid #f0f0f0" }}>
                          <button onClick={() => handleToggleLike(entry.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                            <Heart size={12} fill={liked ? "#e74c3c" : "none"} color={liked ? "#e74c3c" : "#bbb"} strokeWidth={2} />
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: liked ? "#e74c3c" : "#999" }}>{likeCount}</span>
                          </button>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <MessageCircle size={12} color="#bbb" strokeWidth={2} />
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#999" }}>{replyCount}</span>
                          </div>
                          <span style={{ marginLeft: "auto", fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", whiteSpace: "nowrap" }}>
                            {fmtAgoFr(item.minutesAgo)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  const c = item.comment;
                  const liked = likedCommentIds.has(c.id);
                  return (
                    <div key={item.key} style={{
                      flexShrink: 0, width: 170,
                      border: "1px solid #f0f0f0",
                      display: "flex", flexDirection: "column",
                    }}>
                      {/* Body */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "7px 8px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                            background: c.isMine ? "#111" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {c.isMine ? (
                              <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>{c.name.charAt(0)}</span>
                            ) : (
                              <EntityAvatar url={c.avatarUrl} name={c.name} />
                            )}
                          </div>
                          <span style={{ flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.name}
                          </span>
                        </div>
                        <p style={{
                          flex: 1,
                          fontFamily: "Inter, sans-serif", fontSize: 11, color: "#666", lineHeight: 1.4, margin: 0,
                          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {c.text}
                        </p>
                      </div>

                      {/* Engagement bar — edge-to-edge separator, always at the bottom */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderTop: "1px solid #f0f0f0" }}>
                        <button onClick={() => handleToggleLike(c.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                          <Heart size={12} fill={liked ? "#e74c3c" : "none"} color={liked ? "#e74c3c" : "#bbb"} strokeWidth={2} />
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: liked ? "#e74c3c" : "#999" }}>{c.likes + (liked ? 1 : 0)}</span>
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MessageCircle size={12} color="#bbb" strokeWidth={2} />
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#999" }}>{c.replies.length}</span>
                        </div>
                        <span style={{ marginLeft: "auto", fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", whiteSpace: "nowrap" }}>
                          {fmtAgoFr(item.minutesAgo)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        </>
        )}

        {/* ── TOP 5 LEADERBOARD or REGISTRATION INFO ── */}
        {activeTab === "participants" && (
        isRegistration ? (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Users size={13} strokeWidth={2.5} />Inscription en cours</span>
            </div>
            <div style={{
              padding: "20px", background: "#f8f7fc", borderRadius: 16,
              textAlign: "center", marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700,
                color: "#6C63FF", marginBottom: 4,
                transition: "color 0.2s",
              }}>
                {liveRegistered}/{comp.contestants}
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666",
                marginBottom: 12,
              }}>
                personnes inscrites
              </div>
              {/* Animated fill bar */}
              <div style={{ height: 8, borderRadius: 999, background: "#e0d5ff", width: "100%", marginBottom: 12, overflow: "hidden" }}>
                <div
                  className="bar-shimmer"
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${Math.round((liveRegistered / comp.contestants) * 100)}%`,
                    background: liveRegistered >= comp.contestants
                      ? "linear-gradient(90deg, #00B894 0%, #00d4a8 50%, #00B894 100%)"
                      : "linear-gradient(90deg, #6C63FF 0%, #a89dff 50%, #6C63FF 100%)",
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999",
                lineHeight: 1.5,
              }}>
                {comp.contestants - liveRegistered > 0
                  ? `${comp.contestants - liveRegistered} place${comp.contestants - liveRegistered !== 1 ? 's' : ''} encore disponible${comp.contestants - liveRegistered !== 1 ? 's' : ''}`
                  : "Les inscriptions sont complètes"}
              </div>
            </div>

            {/* Registered members list */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Users size={13} strokeWidth={2.5} />Membres inscrits</span>
              {registrants.length > 5 && (
                <button
                  onClick={() => setShowAllRegistrants(true)}
                  style={{
                    border: "none", background: "none", color: accent,
                    fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  Voir tout ({registrants.length})
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                  </svg>
                </button>
              )}
            </div>

            {registrantsLoading ? (
              <div style={{
                padding: "20px 0 24px", textAlign: "center",
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb",
              }}>
                Chargement des inscrits...
              </div>
            ) : registrants.length === 0 ? (
              <div style={{
                padding: "20px 0 24px", textAlign: "center",
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb",
              }}>
                Aucune inscription pour le moment.
              </div>
            ) : (
              registrants.slice(0, 5).map((r, idx, arr) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0",
                  borderBottom: idx < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "#f0ebff", color: "#6C63FF",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                      Inscrit le {r.date} à {r.time}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    color: "#6C63FF", flexShrink: 0,
                  }}>
                    {r.fee} gourdes
                  </span>
                  {canRemoveParticipants && (
                    <button
                      onClick={() => handleRemoveParticipant(r)}
                      disabled={removingRegistrantId === r.id}
                      title="Retirer ce participant"
                      style={{
                        width: 24, height: 24, flexShrink: 0, marginLeft: 4,
                        border: "1px solid #f3d0cd", borderRadius: "50%",
                        background: "#fdf1f0", color: "#e74c3c",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: removingRegistrantId === r.id ? "default" : "pointer",
                        opacity: removingRegistrantId === r.id ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div style={{ height: 12 }} />
          </div>
        ) : (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Trophy size={13} strokeWidth={2.5} />Classement · Top 5</span>
              <button
                onClick={() => setShowAll(true)}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir tout ({comp.contestants})
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {ranked.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
                Aucun participant pour le moment.
              </div>
            ) : ranked.map((p, rank) => {
              const pct = Math.max(8, Math.round((p.points / topPoints) * 100));
              return (
                <div key={p.id ?? p.index} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 0",
                  borderBottom: rank < ranked.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  {/* Rank */}
                  <span style={{
                    width: 20, flexShrink: 0, textAlign: "center",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: rank === 0 ? 16 : 12, fontWeight: 700,
                    color: rank === 0 ? accent : "#ccc",
                  }}>
                    {rank === 0 ? "🥇" : rank + 1}
                  </span>

                  {/* Profile pic */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    overflow: "hidden", background: "#fff",
                    border: rank === 0 ? `2px solid ${accent}` : "2px solid #eee",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                  }}>
                    <EntityAvatar url={p.avatarUrl} name={p.name} />
                  </div>

                  {/* Name + points/coin above, full-width progress bar below */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                        color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{p.name}</span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                        color: rank === 0 ? accent : "#555", flexShrink: 0,
                        transition: "color 0.3s",
                      }}>
                        🪙 {p.points.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        className="bar-shimmer"
                        style={{
                          height: "100%", borderRadius: 2,
                          width: `${pct}%`,
                          background: rank === 0
                            ? `linear-gradient(90deg, ${accent} 0%, ${accent}cc 50%, ${accent} 100%)`
                            : "linear-gradient(90deg, #ddd 0%, #eee 50%, #ddd 100%)",
                          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 12 }} />
          </div>
        )
        )}

        {/* ── PARTICIPANTS STRIP (only for voting phase) ── */}
        {activeTab === "medias" && !isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", paddingTop: 14, paddingBottom: 14 }}>
            {/* Organizer-only: media submitted by participants, awaiting approval.
                Always visible to the organizer (not just when something's
                pending) so there's a stable, discoverable place to check. */}
            {currentUser?.isOrganizer && (
              <div style={{ marginBottom: 16, paddingLeft: 8, paddingRight: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: pendingUploads.length > 0 ? "#e74c3c" : "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 10,
                }}>
                  <Clock size={13} strokeWidth={2.5} />
                  Médias à approuver{pendingUploads.length > 0 ? ` (${pendingUploads.length})` : ""}
                </div>
                {pendingUploads.length === 0 ? (
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb", padding: "4px 0 2px" }}>
                    Rien à approuver pour l'instant.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pendingUploads.map((item) => (
                      <div key={item.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        border: "1px solid #eee", padding: 8,
                      }}>
                        <div style={{ width: 46, height: 46, flexShrink: 0, overflow: "hidden", background: "#111" }}>
                          {item.media_type === "video" ? (
                            <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                          ) : (
                            <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.uploader_name}
                          </div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa" }}>
                            {item.media_type === "video" ? "Vidéo" : "Photo"} envoyée
                          </div>
                        </div>
                        <button
                          onClick={() => reviewUpload(item.id, "rejected")}
                          style={{ border: "1px solid #eee", background: "#fff", color: "#999", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => reviewUpload(item.id, "approved")}
                          style={{ border: "none", background: accent, color: "#fff", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 12, paddingLeft: 8, paddingRight: 8,
            }}>
              <ImageIcon size={13} strokeWidth={2.5} />
              Médias des participants
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, paddingLeft: 8, paddingRight: 8 }}>
              {/* "Mon album" — lets a registered participant manage their own uploads */}
              {isRegistered && currentUser && (
                <div
                  onClick={() => setAlbumSheet(true)}
                  style={{
                    position: "relative", cursor: "pointer", aspectRatio: "1 / 1",
                    border: `1.5px dashed ${accent}`, background: `${accent}0a`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {myUploads.some((u) => u.status === "pending") && (
                    <span style={{
                      position: "absolute", top: 7, right: 7,
                      background: "#e74c3c", color: "#fff",
                      fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                      padding: "2px 6px",
                    }}>
                      En attente
                    </span>
                  )}
                  <Plus size={20} color={accent} strokeWidth={2.5} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: accent }}>
                    Mon album
                  </span>
                </div>
              )}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).slice(0, 11).map((item) => (
                <div key={item.id} onClick={() => setMediaLightbox(item)} style={{ position: "relative", cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
                  {item.media_type === "video" ? (
                    <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                  ) : (
                    <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                  }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.uploader_name}
                    </span>
                  </div>
                </div>
              ))}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length > 11 && (
                <div
                  onClick={() => setShowAllAlbums(true)}
                  style={{
                    border: "1px dashed #ddd", background: "#fafafa",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 6, cursor: "pointer",
                    aspectRatio: "1/1",
                  }}
                >
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#bbb" }}>
                    +{approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length - 11}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir tout
                  </span>
                </div>
              )}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length === 0 && !(isRegistered && currentUser) && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Aucun média approuvé pour l'instant.
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── TOP DONATEURS ── */}
        {activeTab === "donateurs" && !isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 8px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Gift size={14} color={accent} strokeWidth={2.5} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Top Donateurs
                </span>
              </div>
              {giftLeaderboard.length === 0 && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb" }}>Aucun encore</span>
              )}
            </div>

            {giftLeaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Soyez le premier à envoyer un cadeau !
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {giftLeaderboard.map((donor, i) => {
                  const isFirst = i === 0;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={donor.id}
                      onClick={() => { setSelectedDonor(donor); setDonorTab("all"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 10px",
                        background: isFirst ? `${accent}0f` : donor.isMe ? "#f8f8f8" : "#fff",
                        border: isFirst ? `1px solid ${accent}33` : donor.isMe ? "1px solid #e0e0e0" : "1px solid transparent",
                        transition: "background 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      {/* Rank */}
                      <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
                        {i < 3 ? (
                          <span style={{ fontSize: 16 }}>{medals[i]}</span>
                        ) : (
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#bbb" }}>#{i + 1}</span>
                        )}
                      </div>
                      {/* Avatar */}
                      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: isFirst ? `2px solid ${accent}` : "2px solid #eee" }}>
                        <EntityAvatar url={donor.avatarUrl} name={donor.name} bg={donor.isMe ? "#111" : "#ddd"} color={donor.isMe ? "#fff" : "#666"} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: isFirst ? accent : "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {donor.name}
                          </span>
                          {donor.isMe && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: accent, background: `${accent}18`, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vous</span>}
                          {isFirst && <span style={{ fontSize: 13 }}>👑</span>}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 1 }}>
                          {donor.giftCount} cadeau{donor.giftCount > 1 ? "x" : ""} · meilleur: {donor.topGift}
                        </div>
                      </div>
                      {/* Total */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800, color: isFirst ? accent : "#333" }}>
                          🪙 {formatCoins(donor.totalSpent)}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE TAB (gifts + comments interleaved, TikTok-style) ── */}
        {activeTab === "live" && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px 20px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {!isRegistration ? (
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#e74c3c",
                display: "inline-block", animation: "pulse-dot 1s infinite",
              }} />
            ) : (
              <MessageCircle size={13} strokeWidth={2.5} />
            )}
            Activité · Commentaires ({comments.length})
          </div>

          {/* Interleaved feed: gifts + comments, newest first */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {commentsLoading ? (
              <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                Chargement…
              </div>
            ) : feedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                Aucune activité pour le moment. Soyez le premier à commenter !
              </div>
            ) : feedItems.map((item, i) => {
              const isLast = i === feedItems.length - 1;

              if (item.type === "gift") {
                const entry = item.entry;
                return (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: isLast ? "none" : "1px solid #f5f5f5",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        flexShrink: 0, overflow: "hidden",
                        border: i === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      }}>
                        <EntityAvatar url={entry.pAvatarUrl} name={entry.pName || fakeName(entry.pIndex)} />
                      </div>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", fontWeight: 500 }}>
                        <span style={{ fontSize: 14 }}>{entry.gift.icon}</span>{" "}
                        <span style={{ fontWeight: 700, color: accent }}>{entry.gift.name}</span>
                        {" "}envoyé à{" "}
                        <span style={{ color: accent, fontWeight: 700 }}>{entry.pName || fakeName(entry.pIndex)}</span>
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb",
                      fontWeight: 500, flexShrink: 0, marginLeft: 10,
                    }}>{entry.ago}</span>
                  </div>
                );
              }

              const c = item.comment;
              const liked = likedCommentIds.has(c.id);
              const repliesOpen = expandedReplies.has(c.id);
              const isReplying = replyingTo === c.id;
              return (
                <div key={item.key} style={{
                  borderBottom: isLast ? "none" : "1px solid #f0f0f0",
                  padding: "10px 0",
                }}>
                  {/* Main comment */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                      border: "1px solid #e0e0e0",
                      background: c.isMine ? "#111" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {c.isMine ? (
                        <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700 }}>
                          {c.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <EntityAvatar url={c.avatarUrl} name={c.name} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#333" }}>{c.name}</span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb" }}>
                          {c.minutesAgo === 0 ? "À l'instant" : `il y a ${fmtCommentTime(c.minutesAgo)}`}
                        </span>
                      </div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444", lineHeight: 1.4, margin: "0 0 6px" }}>{c.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button onClick={() => handleToggleLike(c.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: liked ? "#e74c3c" : "#aaa" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "#e74c3c" : "none"} stroke={liked ? "#e74c3c" : "#aaa"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          {c.likes + (liked ? 1 : 0)}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyDraft(""); }}
                          style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: isReplying ? accent : "#aaa" }}
                        >
                          Répondre
                        </button>
                        {c.replies?.length > 0 && (
                          <button
                            onClick={() => setExpandedReplies((prev) => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: accent }}
                          >
                            {repliesOpen ? "Masquer" : `${c.replies.length} réponse${c.replies.length > 1 ? "s" : ""}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply input */}
                  {isReplying && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 38 }}>
                      <input
                        autoFocus
                        type="text"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostReply(c.id);
                        }}
                        placeholder={`Répondre à ${c.name}…`}
                        style={{ flex: 1, minWidth: 0, border: "1px solid #e0e0e0", background: "#fafafa", padding: "7px 10px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", outline: "none" }}
                      />
                      <button
                        onClick={() => handlePostReply(c.id)}
                        style={{ border: "none", background: accent, color: "#fff", padding: "7px 12px", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center" }}
                      ><Send size={13} /></button>
                    </div>
                  )}


                  {/* Sub-comments */}
                  {repliesOpen && c.replies?.length > 0 && (
                    <div style={{ marginLeft: 38, marginTop: 8, borderLeft: `2px solid #f0f0f0`, paddingLeft: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {c.replies.map((r) => {
                        const rLiked = likedCommentIds.has(r.id);
                        return (
                          <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1px solid #e0e0e0", background: r.isMine ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {r.isMine ? (
                                <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>{r.name.charAt(0)}</span>
                              ) : (
                                <EntityAvatar url={r.avatarUrl} name={r.name} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333" }}>{r.name}</span>
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb" }}>
                                  {r.minutesAgo === 0 ? "À l'instant" : `il y a ${fmtCommentTime(r.minutesAgo)}`}
                                </span>
                              </div>
                              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#555", lineHeight: 1.4, margin: "0 0 4px" }}>{r.text}</p>
                              <button onClick={() => handleToggleLike(r.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: rLiked ? "#e74c3c" : "#bbb" }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill={rLiked ? "#e74c3c" : "none"} stroke={rLiked ? "#e74c3c" : "#bbb"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                {r.likes + (rLiked ? 1 : 0)}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

      </div>

      </div>

      {/* ── GIFT TRAY BACKDROP ── */}
      {!isRegistration && showGiftBar && (
        <div
          onClick={() => setShowGiftBar(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* ── GIFT TRAY (slides up, only for voting phase) ── */}
      {!isRegistration && showGiftBar && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: `2px solid ${accent}`,
          zIndex: 1001, padding: "14px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {(giftStep === "gift" || giftStep === "confirm") && (
                  <button
                    onClick={() => {
                      if (giftStep === "confirm") {
                        if (giftConfirmPhase === "pin") {
                          setGiftConfirmPhase("summary");
                          setGiftPin("");
                          setGiftPinError(false);
                          return;
                        }
                        setGiftStep("gift");
                        setSelectedGift(null);
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setGiftPinError(false);
                        return;
                      }
                      setGiftStep("participant");
                      setSelectedParticipant(null);
                    }}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#888", padding: 0, lineHeight: 0, display: "flex", alignItems: "center" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
                  </button>
                )}
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {giftStep === "participant"
                    ? "Choisir un participant"
                    : giftStep === "gift"
                    ? `Cadeau pour ${selectedParticipant?.name}`
                    : giftConfirmPhase === "pin"
                    ? "Code PIN"
                    : "Confirmer le paiement"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>
                  <Wallet size={14} strokeWidth={2.5} color={accent} />
                  {balance.toLocaleString("fr-FR")} HTG
                </span>
                <button
                  onClick={() => {
                    setShowGiftBar(false);
                    setGiftStep("participant");
                    setSelectedParticipant(null);
                    setSelectedGift(null);
                    setGiftConfirmPhase("summary");
                    setGiftPin("");
                    setGiftPinError(false);
                  }}
                  style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", color: "#666", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Step 1 — pick participant */}
            {giftStep === "participant" && (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {giftableParticipants.length === 0 ? (
                  <div style={{ padding: "12px 4px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                    Aucun participant à qui envoyer un cadeau pour le moment.
                  </div>
                ) : giftableParticipants.slice(0, Math.min(comp.contestants, 15)).map((p) => (
                  <button
                    key={p.id ?? p.index}
                    onClick={() => { setSelectedParticipant(p); setGiftStep("gift"); }}
                    style={{
                      flexShrink: 0, width: 72,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 5,
                      border: "1px solid #ddd",
                      background: "#fff",
                      padding: "8px 4px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: `2px solid ${accent}22` }}>
                      <EntityAvatar url={p.avatarUrl} name={p.name} />
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#333", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 64 }}>
                      {p.name.split(" ")[0]}
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: "#aaa" }}>
                      {fmtVotes(p.votes)} pts
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — pick gift */}
            {giftStep === "gift" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  maxHeight: "44vh",
                  overflowY: "auto",
                  paddingBottom: 8,
                  paddingRight: 2,
                }}
              >
                {GIFT_CATALOG.map((gift) => {
                  const price = giftPriceHTG(gift);
                  const affordable = balance >= price;
                  const isSelected = activeGift === gift.id;
                  return (
                    <button
                      key={gift.id}
                      onClick={() => {
                        if (!affordable) { showToast && showToast("Solde insuffisant — rechargez votre portefeuille"); return; }
                        setActiveGift(gift.id);
                        setSelectedGift(gift);
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setGiftPinError(false);
                        setGiftStep("confirm");
                      }}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 4,
                        border: "none",
                        background: isSelected ? `${accent}12` : "transparent",
                        borderRadius: 10,
                        padding: "10px 2px",
                        cursor: affordable ? "pointer" : "default",
                        opacity: affordable ? 1 : 0.35,
                        transition: "background 0.15s, transform 0.15s",
                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      <div
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 6px ${accent}88)` : "none",
                          transition: "filter 0.15s",
                        }}
                      >
                        <AnimatedGiftIcon emoji={gift.icon} size={44} />
                      </div>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800, color: affordable ? accent : "#bbb" }}>
                        {gift.cost.toLocaleString("fr-FR")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3 — confirm cost + pay + PIN */}
            {giftStep === "confirm" && selectedGift && (
              <div style={{ padding: "4px 2px 8px" }}>
                {giftConfirmPhase === "summary" && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0 18px" }}>
                      <AnimatedGiftIcon emoji={selectedGift.icon} size={72} />
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#666" }}>
                        {selectedGift.name}
                      </span>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>Destinataire</span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>{selectedParticipant?.name}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>Points</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>{selectedGift.cost.toLocaleString("fr-FR")} pts</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>Total à payer</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 800, color: accent }}>
                          {giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG
                        </span>
                      </div>
                    </div>

                    <button
                      className="tap-scale"
                      onClick={() => { hapticTap("light"); setGiftConfirmPhase("pin"); }}
                      style={{
                        width: "100%", border: "none", borderRadius: 10,
                        background: accent, color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                        padding: "13px 0", cursor: "pointer",
                      }}
                    >
                      Payer {giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG
                    </button>
                  </>
                )}

                {giftConfirmPhase === "pin" && (
                  <>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 14, textAlign: "center" }}>
                      Entrez votre code PIN à 4 chiffres pour confirmer le paiement de{" "}
                      <strong style={{ color: "#111" }}>{giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG</strong>.
                    </p>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      autoFocus
                      value={giftPin}
                      onChange={(e) => {
                        setGiftPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                        setGiftPinError(false);
                      }}
                      style={{
                        width: "100%", textAlign: "center", letterSpacing: "0.5em",
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700,
                        border: `1px solid ${giftPinError ? "#E74C3C" : "#ddd"}`,
                        borderRadius: 10, padding: "12px 0", marginBottom: 8,
                        outline: "none",
                      }}
                    />
                    {giftPinError && (
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#E74C3C", textAlign: "center", marginBottom: 8 }}>
                        Code PIN incorrect. Réessayez.
                      </div>
                    )}
                    <button
                      className="tap-scale"
                      disabled={giftPin.length !== 4 || giftSubmitting}
                      onClick={async () => {
                        if (giftPin.length !== 4) return;
                        if (isCompleted) {
                          setShowGiftBar(false);
                          showToast?.("Cette compétition est terminée — les cadeaux ne sont plus acceptés.");
                          return;
                        }
                        if (giftPin !== WALLET_PIN) {
                          setGiftPinError(true);
                          return;
                        }
                        // Every user must be a real, authenticated account to
                        // send a gift — donateurs are never anonymous.
                        if (!currentUser?.id) {
                          setShowGiftBar(false);
                          onRequestAuth?.();
                          return;
                        }
                        // Contestants can't gift inside their own competition.
                        if (isRegistered) {
                          setShowGiftBar(false);
                          showToast?.("Les participants ne peuvent pas envoyer de cadeaux dans leur propre compétition.");
                          return;
                        }
                        // Belt-and-suspenders: isRegistered can be stale (it's
                        // client-side Set state), so also block outright if the
                        // chosen recipient turns out to be the sender themself.
                        if (selectedParticipant?.userId && selectedParticipant.userId === currentUser.id) {
                          setShowGiftBar(false);
                          showToast?.("Vous ne pouvez pas vous envoyer un cadeau à vous-même.");
                          return;
                        }
                        const gift = selectedGift;
                        setGiftSubmitting(true);

                        const giftId = (typeof crypto !== "undefined" && crypto.randomUUID)
                          ? crypto.randomUUID()
                          : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        const nowIso = new Date().toISOString();

                        const { error: giftError } = await supabase.from("gifts").insert({
                          id: giftId,
                          competition_id: comp.competitionId,
                          edition_id: comp.id,
                          sender_id: currentUser.id,
                          sender_name: currentUser.fullName,
                          sender_avatar_url: currentUser.avatarUrl || null,
                          recipient_name: selectedParticipant?.name || null,
                          recipient_index: selectedParticipant?.index ?? null,
                          recipient_user_id: selectedParticipant?.userId || null,
                          gift_icon: gift.icon,
                          gift_name: gift.name,
                          gift_cost: gift.cost,
                          price_htg: giftPriceHTG(gift),
                          created_at: nowIso,
                        });
                        if (giftError) {
                          console.error("gift insert error:", giftError);
                          showToast?.("Échec de l'envoi du cadeau. Réessayez.");
                          setGiftSubmitting(false);
                          return;
                        }

                        hapticTap("heavy");
                        onSendGift(gift, { ...comp, recipientName: selectedParticipant?.name, priceHTG: giftPriceHTG(gift) });
                        setVoted(true);
                        // Optimistically add the real row to local state — the
                        // realtime subscription will also deliver it (and skip
                        // it as a dupe by id), keeping donateurs consistent
                        // across every device watching this competition.
                        setGiftRows((prev) => (prev.some((r) => r.id === giftId) ? prev : [
                          {
                            id: giftId,
                            competition_id: comp.competitionId,
                            edition_id: comp.id,
                            sender_id: currentUser.id,
                            sender_name: currentUser.fullName,
                            sender_avatar_url: currentUser.avatarUrl || null,
                            recipient_name: selectedParticipant?.name || null,
                            recipient_index: selectedParticipant?.index ?? null,
                            recipient_user_id: selectedParticipant?.userId || null,
                            gift_icon: gift.icon,
                            gift_name: gift.name,
                            gift_cost: gift.cost,
                            price_htg: giftPriceHTG(gift),
                            created_at: nowIso,
                          },
                          ...prev,
                        ]));
                        setGiftSubmitting(false);
                        setShowGiftBar(false);
                        setActiveGift(null);
                        setSelectedGift(null);
                        setGiftStep("participant");
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setSelectedParticipant(null);
                      }}
                      style={{
                        width: "100%", border: "none", borderRadius: 10,
                        background: giftPin.length === 4 && !giftSubmitting ? "#111" : "#ccc",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                        padding: "13px 0",
                        cursor: giftPin.length === 4 && !giftSubmitting ? "pointer" : "not-allowed",
                      }}
                    >
                      {giftSubmitting ? "Traitement..." : "Confirmer le paiement"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DONOR GIFT HISTORY SCREEN ── */}
      {selectedDonor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#F2F2F0", overflowY: "auto" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
            <button
              onClick={() => setSelectedDonor(null)}
              style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid #eee" }}>
              <EntityAvatar url={selectedDonor.avatarUrl} name={selectedDonor.name} bg={selectedDonor.isMe ? "#111" : "#ddd"} color={selectedDonor.isMe ? "#fff" : "#666"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedDonor.name}
              </span>
              <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999" }}>
                {selectedDonor.giftCount} cadeau{selectedDonor.giftCount > 1 ? "x" : ""} · 🪙 {formatCoins(selectedDonor.totalSpent)} points au total
              </span>
            </div>
          </div>

          <div style={{ padding: "10px 14px 40px", maxWidth: 600, margin: "0 auto" }}>
            {(!selectedDonor.gifts || selectedDonor.gifts.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>Aucun cadeau enregistré</div>
              </div>
            ) : (() => {
              const sortedGifts = [...selectedDonor.gifts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

              // Group repeats of the same gift into tabs (e.g. "💎 Diamant x3")
              const groupsMap = new Map();
              sortedGifts.forEach((g) => {
                const existing = groupsMap.get(g.name);
                if (existing) {
                  existing.count += 1;
                } else {
                  groupsMap.set(g.name, { name: g.name, icon: g.icon, count: 1 });
                }
              });
              const groups = Array.from(groupsMap.values()).sort((a, b) => b.count - a.count);
              const showTabs = groups.length > 1;

              const filteredGifts = donorTab === "all" ? sortedGifts : sortedGifts.filter((g) => g.name === donorTab);

              return (
                <>
                  {showTabs && (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                      <button
                        onClick={() => setDonorTab("all")}
                        style={{
                          flexShrink: 0, border: "none", borderRadius: 999,
                          padding: "7px 16px",
                          background: donorTab === "all" ? "#111" : "#f0f0f0",
                          color: donorTab === "all" ? "#fff" : "#666",
                          fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        Tous ({sortedGifts.length})
                      </button>
                      {groups.map((grp) => (
                        <button
                          key={grp.name}
                          onClick={() => setDonorTab(grp.name)}
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                            border: "none", borderRadius: 999,
                            padding: "6px 14px",
                            background: donorTab === grp.name ? "#111" : "#f0f0f0",
                            color: donorTab === grp.name ? "#fff" : "#666",
                            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{grp.icon}</span>
                          × {grp.count}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {filteredGifts.map((g, i) => (
                      <div
                        key={g.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "13px 4px",
                          borderBottom: i === filteredGifts.length - 1 ? "none" : "1px solid #ececec",
                        }}
                      >
                        <div style={{ flexShrink: 0 }}>
                          <AnimatedGiftIcon emoji={g.icon} size={26} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1a1a1a" }}>{g.name}</div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, color: "#aaa", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {g.recipientName ? `À ${g.recipientName} · ` : ""}{fmtAgoFr(Math.max(0, Math.floor((Date.now() - (g.timestamp || Date.now())) / 60000)))}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {g.cost.toLocaleString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── STICKY FOOTER CTA ── */}
      {/* Comment composer on the Home and Live tabs (registration or not);
          Register/Edit CTA on Participants/Médias/Donateurs. */}
      {!showGiftBar && (() => {
        const showComposerFooter = activeTab === "home" || activeTab === "live";
        return (
      <div style={{
        position: "fixed", bottom: showComposerFooter ? 0 : 8, left: showComposerFooter ? 0 : 8, right: showComposerFooter ? 0 : 8,
        background: "#fff",
        borderTop: showComposerFooter ? "1px solid #eee" : "none",
        borderRadius: showComposerFooter ? 0 : 20,
        boxShadow: showComposerFooter ? "0 -2px 16px rgba(0,0,0,0.06)" : "0 -2px 24px rgba(0,0,0,0.15)",
        padding: showComposerFooter ? "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))" : "10px 12px",
        zIndex: 1001,
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {!showComposerFooter ? (
            isOwnCompetition ? (
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 999,
                  background: "#f2f2f2",
                  color: "#333",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "13px 16px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <BadgeCheck size={15} strokeWidth={2.5} />
                Modifier ma compétition
              </button>
            ) : isRegistered ? (
              <div
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 999,
                  background: "#e8f8f3",
                  color: "#00875A",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "13px 16px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Check size={15} strokeWidth={2.5} />
                Vous êtes inscrit
              </div>
            ) : (
            // Registration footer
            <button
              onClick={() => {
                onRegister?.(comp);
                onClose();
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                background: "#6C63FF",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "13px 16px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(108,99,255,0.35)",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              S'inscrire maintenant
            </button>
            )
          ) : (
            // Voting footer — comment input with sticker + gift embedded, swapping to a send icon while typing
            (() => {
              const isTyping = commentDraft.trim().length > 0;
              // Admins/organizers manage their own competition, they don't send themselves gifts —
              // so the gift button is swapped out for an edit entry point instead. Once the
              // competition is completed there's no one left to vote for, so the gift option
              // disappears entirely rather than opening a flow with nothing to send to. And
              // gifting itself isn't available until the competition goes live, so it's hidden
              // during registration too.
              const showGiftOption = !isOwnCompetition && !isRegistered && !isCompleted && !isRegistration;
              // The composer now also covers the Home tab, which used to be the only place
              // the Register CTA lived — so give unregistered visitors a way to register
              // right from here too, in the same slot the Edit button occupies for organizers.
              const showRegisterButton = isRegistration && !isOwnCompetition && !isRegistered;
              return (
                <>
                  <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      onFocus={() => { if (!currentUser) onRequestAuth?.(); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                      placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                      style={{
                        width: "100%", minWidth: 0, border: "1px solid #ececec", borderRadius: 999,
                        background: "#f5f5f5",
                        padding: isTyping ? "11px 52px 11px 16px" : (showGiftOption ? "11px 90px 11px 16px" : "11px 52px 11px 16px"),
                        fontFamily: "Inter, sans-serif", fontSize: 13,
                        color: "#111", outline: "none",
                        transition: "padding 0.15s",
                      }}
                    />

                    {isTyping ? (
                      /* Send button — replaces sticker + gift while typing */
                      <button
                        onClick={handlePostComment}
                        style={{
                          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                          width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                          border: "none", background: accent,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Send size={15} color="#fff" strokeWidth={2.2} />
                      </button>
                    ) : (
                      <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Sticker button */}
                        <button
                          title="Autocollants"
                          style={{
                            width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                            border: "none", background: "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Sticker size={17} color="#888" strokeWidth={2} />
                        </button>

                        {/* Gift button — hidden for the organizer/admin of this competition */}
                        {showGiftOption && (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                onRequestAuth?.();
                                return;
                              }
                              setShowGiftBar((v) => {
                                if (v) {
                                  setGiftStep("participant");
                                  setSelectedParticipant(null);
                                  setSelectedGift(null);
                                  setGiftConfirmPhase("summary");
                                  setGiftPin("");
                                  setGiftPinError(false);
                                }
                                return !v;
                              });
                            }}
                            style={{
                              width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                              border: "none", background: showGiftBar ? `${accent}18` : "transparent",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Gift size={17} color={accent} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit button — lives outside the input, replacing the gift entry point for the organizer/admin */}
                  {isOwnCompetition ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      title="Modifier la compétition"
                      style={{
                        width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                        border: "none", background: `${accent}18`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Pencil size={17} color={accent} strokeWidth={2.3} />
                    </button>
                  ) : showRegisterButton ? (
                    /* Register button — same slot as Edit, gives unregistered visitors a way
                       to register right from the composer during the registration phase. */
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onRequestAuth?.();
                          return;
                        }
                        onRegister?.(comp);
                        showToast?.("Inscription confirmée !");
                      }}
                      title="S'inscrire"
                      style={{
                        width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                        border: "none", background: "#6C63FF",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(108,99,255,0.35)",
                      }}
                    >
                      <Plus size={18} color="#fff" strokeWidth={2.5} />
                    </button>
                  ) : null}
                </>
              );
            })()
          )}
        </div>
      </div>
        );
      })()}

      {/* ── FLOATING LIVE COMMENTARY BUTTON ── */}
      {/* TEST STREAM: using SomaFM's free, freely-streamable "Groove Salad"
          Icecast/MP3 feed as a stand-in so playback can actually be tested.
          Swap the src for your real commentary stream when one exists. */}
      {showCommentaryBand && (
        <div
          style={{
            position: "fixed",
            right: 14,
            bottom: (isRegistration ? 8 : 0) + 78,
            zIndex: 1050,
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
          }}
        >
          <audio ref={commentaryAudioRef} src="https://ice1.somafm.com/groovesalad-128-mp3" loop muted preload="auto" playsInline style={{ display: "none" }} />

          {commentarySheetOpen && (
            <CommentaryStreamSheet
              comp={comp}
              commentator={commentator}
              coSpeakers={coSpeakers}
              accent={accent}
              muted={commentaryMuted}
              onToggleMute={toggleCommentaryMute}
              onClose={() => setCommentarySheetOpen(false)}
            />
          )}

          <button
            onClick={openCommentaryRoom}
            aria-label="Voir le chroniqueur en direct"
            style={{
              width: 54, height: 54, borderRadius: "50%",
              border: "none", background: accent, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <AudioBarsLoader
              height="22"
              width="22"
              color="#fff"
              ariaLabel="commentaire-audio-en-cours"
              visible={true}
            />
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 12, height: 12, borderRadius: "50%",
              background: "#e74c3c", border: "2px solid #fff",
              animation: "pulse-dot 1.2s infinite",
            }} />
          </button>

        </div>
      )}

      {showAll && (
        <ParticipantListOverlay comp={comp} onClose={() => setShowAll(false)} />
      )}

      {showAllAlbums && (
        <AlbumGridOverlay
          items={approvedUploads.filter((u) => u.uploader_id !== currentUser?.id)}
          onClose={() => setShowAllAlbums(false)}
          onOpenItem={(item) => setMediaLightbox(item)}
        />
      )}

      {showAllRegistrants && (
        <RegistrantListOverlay
          comp={comp}
          registrants={registrants}
          accent={accent}
          onClose={() => setShowAllRegistrants(false)}
          canRemove={canRemoveParticipants}
          onRemove={handleRemoveParticipant}
          removingRegistrantId={removingRegistrantId}
        />
      )}

      {albumSheet && (
        <AlbumSheet
          accent={accent}
          uploads={myUploads}
          uploading={uploadingMedia}
          onUpload={addOwnUpload}
          onClose={() => setAlbumSheet(null)}
        />
      )}

      {mediaLightbox && (
        <MediaLightbox item={mediaLightbox} onClose={() => setMediaLightbox(null)} />
      )}

      {showEditModal && (
        <div style={{
          position: "fixed", inset: 0, background: "#fff",
          zIndex: 2000, display: "flex", flexDirection: "column",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 16px", borderBottom: "1px solid #eee", flexShrink: 0,
          }}>
            <button onClick={() => setShowEditModal(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} color="#333" />
            </button>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              Modifier la compétition
            </span>
            <button onClick={() => setShowEditModal(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              <X size={18} color="#999" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20, paddingBottom: 100 }}>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Titre</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Édition</label>
            <input
              type="text"
              value={editEdition}
              onChange={(e) => setEditEdition(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>État</label>
            {/* Phase is never admin-editable — it's derived entirely from the
                registration countdown + fill rate, the same way "completed" is
                derived from the live countdown. An organizer picking "En direct"
                by hand could put a competition live with an empty roster, or
                stall a full one in "Inscriptions" past its deadline, so the
                toggle that used to sit here has been replaced with a read-only
                status. See `open_expired_registrations` (pg_cron, paired with
                `close_expired_competitions`) for the actual transition logic:
                once the registration deadline passes, it flips to "live" if
                every place is taken, otherwise it pushes endsAt out by 24h and
                leaves the competition open for registration. */}
            {isCompleted ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #eee", background: "#f7f7f7", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#999" }}>
                🏆 Terminée — archivée dans l'historique, l'état ne peut plus être modifié
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, border: "1px solid #eee",
                  background: "#f7f7f7", borderRadius: 10, padding: "10px 12px", marginBottom: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                  color: isRegistration ? "#888" : "#00B894",
                }}>
                  {isRegistration ? "🕒 Inscriptions" : "● En direct"}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14, lineHeight: 1.4 }}>
                  {isRegistration
                    ? "Passe automatiquement en direct dès que le compte à rebours se termine, si toutes les places sont prises. Sinon, les inscriptions sont prolongées de 24h."
                    : "La durée de cette phase en direct a été fixée pendant les inscriptions et ne peut plus être modifiée à la main — voir la date de fin ci-dessous."}
                </div>
              </>
            )}

            {isRegistration && (
            <>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Durée des inscriptions
            </label>
            <input
              type="datetime-local"
              value={editEndsAt}
              onChange={(e) => {
                const next = e.target.value;
                setEditEndsAt(next);
                // Keep the compact label in sync with the precise date
                // instead of blanking it out — both fields are required
                // together before the edition can be saved/published.
                setEditEnds(next ? fmtCountdown(new Date(next).toISOString()) : "");
              }}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
            />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14 }}>
              Pilote le vrai compte à rebours.
            </div>

            {/* Set once now, while the edition is still in registration —
                NOT editable once phase flips to "live". Stored as
                live_duration_seconds and read by open_expired_registrations
                only at the moment registration ends, to compute the real
                ends_at for the live phase. There's no picker for this once
                live starts; that's the whole point of locking it in here. */}
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Durée de la phase en direct
            </label>
            {(() => {
              const regEndMs = editEndsAt ? new Date(editEndsAt).getTime() : Date.now();
              const liveEndValue = editLiveDurationSeconds
                ? toDatetimeLocal(new Date(regEndMs + editLiveDurationSeconds * 1000).toISOString())
                : "";
              return (
                <input
                  type="datetime-local"
                  value={liveEndValue}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!next) {
                      setEditLiveDurationSeconds(null);
                      return;
                    }
                    const diffSecs = Math.max(0, Math.round((new Date(next).getTime() - regEndMs) / 1000));
                    setEditLiveDurationSeconds(diffSecs);
                  }}
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
                />
              );
            })()}
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              Combien de temps durera la phase en direct une fois les inscriptions closes — à définir maintenant, ce ne sera plus modifiable ensuite.
            </div>

            {durationIncomplete && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, fontWeight: 700, color: "#D35400", background: "#FDEDE3", border: "1px solid #F5C9A5", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                Choisissez une durée d'inscription (ou une date de fin précise) et une durée pour la phase en direct avant de pouvoir enregistrer.
              </div>
            )}
            </>
            )}

            {isLive && (
              <div style={{ border: "1px solid #eee", background: "#f7f7f7", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 4 }}>
                  Se termine dans {editEnds || "—"}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", lineHeight: 1.4 }}>
                  Durée verrouillée depuis les inscriptions — non modifiable à la main.
                </div>
              </div>
            )}

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Places disponibles</label>
            <input
              type="number"
              min="0"
              value={editContestants}
              onChange={(e) => setEditContestants(e.target.value)}
              placeholder="ex: 20"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Frais d'inscription (gourdes)</label>
            <input
              type="number"
              min="0"
              value={editFee}
              onChange={(e) => setEditFee(e.target.value)}
              placeholder="ex: 100"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Décrivez la compétition, son format et son déroulement…"
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14, resize: "vertical" }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Prix garanti (crédits)</label>
            <input
              type="number"
              min="0"
              value={editPrizeAmount}
              onChange={(e) => setEditPrizeAmount(e.target.value)}
              placeholder="ex: 500"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
            />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14 }}>
              Laissez vide pour ne définir aucun prix garanti.
            </div>

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Récompense additionnelle</label>
            <input
              type="text"
              value={editRewardExtra}
              onChange={(e) => setEditRewardExtra(e.target.value)}
              placeholder="ex: Trophée officiel et mise en avant"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Règlement (une règle par ligne)</label>
            <textarea
              value={editRules}
              onChange={(e) => setEditRules(e.target.value)}
              placeholder={"ex:\nInscription ouverte à tous.\nChaque participant doit soumettre…"}
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 18, resize: "vertical" }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Galerie / miniatures</label>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              Touchez <strong>Bannière</strong> sur une image pour en faire celle affichée sur la carte de la compétition et dans le carrousel de la page d'accueil.
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              marginBottom: 18,
            }}>
              {images.map((img) => {
                const isBanner = editBannerUrl === img.url;
                return (
                  <div key={img.id} style={{
                    position: "relative", width: "100%", aspectRatio: "1 / 1",
                    borderRadius: 10, overflow: "hidden", background: "#f5f5f5",
                    boxShadow: isBanner ? `0 0 0 2px ${accent}` : "none",
                  }}>
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      disabled={removingImageId === img.id}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 20, height: 20, borderRadius: "50%",
                        border: "none", background: "rgba(0,0,0,0.55)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", padding: 0,
                      }}
                    >
                      {removingImageId === img.id ? (
                        <span style={{ fontSize: 9 }}>…</span>
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => handleSetBanner(img.url)}
                      style={{
                        position: "absolute", bottom: 4, left: 4, right: 4,
                        border: "none", borderRadius: 6,
                        background: isBanner ? accent : "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        padding: "4px 0",
                        cursor: "pointer",
                      }}
                    >
                      {isBanner ? "★ Bannière" : "Bannière"}
                    </button>
                  </div>
                );
              })}

              {/* Add wrapper — always the last tile in the grid */}
              <label style={{
                width: "100%", aspectRatio: "1 / 1", borderRadius: 10,
                border: "1.5px dashed #ccc", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: uploadingImage ? "default" : "pointer",
              }}>
                <input type="file" accept="image/*" onChange={handleAddImageFile} disabled={uploadingImage} style={{ display: "none" }} />
                {uploadingImage ? (
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#999" }}>Envoi…</span>
                ) : (
                  <Plus size={22} color="#aaa" />
                )}
              </label>
            </div>
          </div>

          <div style={{
            display: "flex", gap: 10, padding: 16,
            borderTop: "1px solid #eee", flexShrink: 0,
            background: "#fff",
          }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ flex: 1, border: "1px solid #e0e0e0", background: "#fff", color: "#555", borderRadius: 999, padding: "12px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editTitle.trim() || durationIncomplete}
              style={{ flex: 1, border: "none", background: accent, color: "#fff", borderRadius: 999, padding: "12px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", cursor: savingEdit ? "default" : "pointer", opacity: savingEdit ? 0.7 : 1 }}
            >
              {savingEdit ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
