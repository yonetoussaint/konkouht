import { useState, useMemo } from "react";
import type React from "react";
import { hapticTap } from "./native";
import {
  Image as ImageIcon,
  Check,
  Plus,
  Trophy,
  Gift,
  Clock,
  BadgeCheck,
} from "lucide-react";
import {
  fmtVotes,
  fmtAbsoluteDateOnly,
  fmtCompactPrize,
  getRegistrationFee,
} from "./App";

function fmtCountdownClock(endDate) {
  const totalSeconds = Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60);

  if (days > 0) return `Il reste ${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `Il reste ${hours} heure${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `Il reste ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `Il reste ${totalSeconds} seconde${totalSeconds !== 1 ? "s" : ""}`;
}

export default function CompCard({ comp, accent, onOpen, onRegister, isRegistered, isOwnCompetition, fullWidth = false }) {
  const [voteCount] = useState(comp.votes);
  const isRegistration = comp.phase === "registration";
  const isCompleted = comp.phase === "completed";
  const isLive = comp.phase === "live";

  const resolvedEndDate = useMemo(() => {
    if (comp.endsAt) return comp.endsAt;
    const str = comp.ends || "";
    let total = 0;
    const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
    const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
    const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
    return new Date(Date.now() + (total || 3600) * 1000).toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp.endsAt, comp.id]);

  const registrationPct = Math.min(100, Math.round((comp.registeredCount / Math.max(comp.contestants, 1)) * 100));
  const registrationFull = comp.registeredCount >= comp.contestants;
  const prize = fmtCompactPrize(comp.prizeAmount);

  return (
    <div
      className={`m3-card${fullWidth ? " m3-card--full" : ""}`}
      style={{ "--accent": accent } as React.CSSProperties}
      onClick={() => onOpen?.(comp)}
    >
      {/* Media */}
      <div className="m3-card-media">
        {(comp.bannerUrl || comp.thumbnailUrl) ? (
          <img
            src={comp.bannerUrl || comp.thumbnailUrl}
            alt=""
            style={{ filter: isCompleted ? "grayscale(0.85)" : "none" }}
          />
        ) : (
          <div className="m3-card-ph"><ImageIcon size={28} /></div>
        )}
        <div className="m3-card-tint" />
        <div className="m3-card-scrim" />

        <div className="m3-card-flags">
          {isRegistration && <span className="m3-chip-s m3-chip-s--reg">Inscriptions ouvertes</span>}
          {isLive && (
            <span className="m3-chip-s m3-chip-s--live">
              <span className="m3-live-dot" aria-hidden="true" />
              En direct
            </span>
          )}
          {isCompleted && <span className="m3-chip-s">Terminé</span>}
        </div>

        <span className={`m3-chip-s m3-card-timer${comp.hot && !isCompleted ? " m3-chip-s--hot" : ""}`}>
          {isCompleted ? (
            <>
              <Trophy size={14} strokeWidth={2} />
              {comp.winnerName ? comp.winnerName : "Terminé"}
            </>
          ) : (
            <>
              <Clock size={14} strokeWidth={2} />
              {fmtCountdownClock(resolvedEndDate)}
            </>
          )}
        </span>
      </div>

      {/* Title + organizer */}
      <div className="m3-card-body">
        <h3 className="m3-card-title">{comp.title}</h3>
        <div className="m3-card-org">
          <span className="m3-card-avatar" aria-hidden="true">{comp.organisateur.charAt(0)}</span>
          <span>{comp.organisateur}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-label="Vérifié">
            <path fill="#1877F2" d="M12 0l2.39 2.39 3.3-.6 1.02 3.18 3.18 1.02-.6 3.3L24 12l-2.71 2.71.6 3.3-3.18 1.02-1.02 3.18-3.3-.6L12 24l-2.39-2.39-3.3.6-1.02-3.18-3.18-1.02.6-3.3L0 12l2.71-2.71-.6-3.3 3.18-1.02L6.31 1.79l3.3.6z" />
            <path fill="#fff" d="M10.5 15.17l-3-3 1.41-1.41L10.5 12.34l5.09-5.09 1.41 1.42z" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="m3-stats">
        <div className={`m3-stat${comp.hot ? " m3-stat--hot" : ""}`}>
          <b>{fmtAbsoluteDateOnly(resolvedEndDate)}</b>
          <small>{isRegistration ? "Fin inscr." : "Fin dans"}</small>
        </div>
        <div className="m3-stat">
          <b>{prize ? `${prize} HTG` : "—"}</b>
          <small>Cagnotte</small>
        </div>
        <div className="m3-stat">
          <b>{getRegistrationFee(comp)} HTG</b>
          <small>Frais d'inscr.</small>
        </div>
      </div>

      {/* Registration progress */}
      {isRegistration && (
        <div className="m3-progress">
          <div className="m3-progress-text">
            <span>Inscrits</span>
            <span>{comp.registeredCount}/{comp.contestants}</span>
          </div>
          <div className="m3-progress-track" role="progressbar" aria-valuenow={registrationPct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`m3-progress-fill${registrationFull ? " m3-progress-fill--full" : ""}`} style={{ width: `${registrationPct}%` }} />
          </div>
        </div>
      )}

      {/* Action */}
      {isRegistration ? (
        isOwnCompetition ? (
          <div className="m3-btn m3-btn--tonal m3-btn--static" style={{ justifyContent: "center" }}>
            <span><BadgeCheck size={20} strokeWidth={2} />Votre compétition</span>
          </div>
        ) : isRegistered ? (
          <div className="m3-btn m3-btn--done m3-btn--static" style={{ justifyContent: "center" }}>
            <span><Check size={20} strokeWidth={2.25} />Inscrit</span>
          </div>
        ) : (
          <button
            type="button"
            className="m3-btn m3-btn--filled"
            style={{ justifyContent: "center" }}
            onClick={(e) => { e.stopPropagation(); hapticTap("medium"); onRegister?.(comp); }}
          >
            <span><Plus size={20} strokeWidth={2.25} />S'inscrire</span>
          </button>
        )
      ) : isCompleted ? (
        <button
          type="button"
          className="m3-btn m3-btn--tonal"
          onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
        >
          <span><Trophy size={20} strokeWidth={2} />Résultat</span>
          <em>{fmtVotes(voteCount)}</em>
        </button>
      ) : (
        <button
          type="button"
          className="m3-btn m3-btn--filled"
          onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
        >
          <span><Gift size={20} strokeWidth={2} />Cadeau</span>
          <em>{fmtVotes(voteCount)}</em>
        </button>
      )}
    </div>
  );
}
