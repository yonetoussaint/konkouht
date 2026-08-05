// Small shared presentational pieces used by both the overlay/sheet panels
// and the main CompetitionBoard screen: avatar renderer, section headers,
// status/organiser chips, and a few small data/format helpers tied to them.
import { BadgeCheck } from "lucide-react";
import { hashStr } from "../App";

export function EntityAvatar({ url, name, bg = "#ddd", color = "#666" }) {
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

// Shared header row for the home-preview sections (Participants, Médias,
// Donateurs, Live) — one component so the icon/label/action treatment can't
// drift between hand-rolled copies of the same row. Sections that link
// somewhere pass onAction (renders the "Voir plus" button); sections with
// no destination pass `right` instead — a small contextual element (status
// chip, avatar stack, etc.) so every heading still resolves to *something*
// on the right rather than sometimes being empty.
export function PreviewSectionHeader({ icon, label, accent, actionLabel = "Voir plus", onAction, right, marginBottom = 4, paddingX = 10 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom, paddingLeft: paddingX, paddingRight: paddingX,
    }}>
      <span style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
        color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {icon}{label}
      </span>
      {onAction ? (
        <button
          onClick={onAction}
          style={{
            border: "none", background: "none", color: accent,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {actionLabel}
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
          </svg>
        </button>
      ) : right || null}
    </div>
  );
}

// Small status chip used in place of a "Voir plus" button on headings that
// have nothing to navigate to (Cagnotte, Statistiques) — reflects the
// competition's actual phase rather than a fabricated stat.
export function PhaseStatusBadge({ isRegistration, isCompleted }) {
  if (isCompleted) {
    return (
      <span style={{
        display: "flex", alignItems: "center", gap: 4,
        fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
        color: "#999", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        <BadgeCheck size={11} strokeWidth={2.5} />
        Terminé
      </span>
    );
  }
  if (isRegistration) {
    return (
      <span style={{
        fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
        color: "#999", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        Bientôt
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Live
      </span>
    </span>
  );
}

// Small right-aligned "Par {organisateur}" chip for the À propos heading —
// reuses the same initials-circle treatment as the organiser profile chip
// in the hero header, just scaled down.
export function OrganiserChip({ name, accent }) {
  if (!name) return null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
        background: accent, color: "#fff",
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {name.charAt(0).toUpperCase()}
      </span>
      <span style={{
        fontFamily: "Inter, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#999",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100,
      }}>
        {name}
      </span>
    </span>
  );
}


// Renders the *current* signed-in user's own avatar — a real photo once
// they've set one, otherwise the initials circle used throughout the app.
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

