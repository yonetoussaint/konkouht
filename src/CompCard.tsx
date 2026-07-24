import { useState, useMemo } from "react";
import {
  Image as ImageIcon,
  Pencil,
  MessageCircle,
  Star,
  BadgeCheck,
  Check,
  Plus,
  Trophy,
  Gift,
  Clock,
} from "lucide-react";
import { PiShareFat } from "react-icons/pi";
import {
  isoWeekNumber,
  fmtVotes,
  fmtAbsoluteDateOnly,
  fmtCountdown,
  fmtCompactPrize,
  hashStr,
  getRegistrationFee,
  formatCoins,
} from "./App";

export default function CompCard({ comp, accent, onOpen, onRegister, isRegistered, isOwnCompetition, fullWidth }) {
  const [voteCount] = useState(comp.votes);
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(comp.followers);
  // No real share/comment counters exist on comp yet, so derive stable
  // per-competition stand-ins the same way getRegistrationFee does — keeps
  // them consistent across re-renders without needing new mock fields.
  const [shareCount, setShareCount] = useState(() => 3 + (Math.abs(hashStr(comp.id)) % 240));
  const [commentCount] = useState(() => 5 + (Math.abs(hashStr(comp.id + "c")) % 380));
  const isRegistration = comp.phase === "registration";
  const isCompleted = comp.phase === "completed";
  const isLive = comp.phase === "live";

  // Real editions carry a real comp.endsAt. Competitions still on the
  // legacy mock "2j 18h"-style `ends` duration string don't have one, so we
  // derive a stand-in absolute deadline once (relative to now) and hold it
  // for the life of the card — recomputing it on every render would make
  // the displayed date creep forward as the feed re-renders.
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

  return (
    <div
      onClick={() => onOpen?.(comp)}
      style={{
        flexShrink: fullWidth ? 1 : 0,
        width: fullWidth ? "100%" : 272,
        border: "1px solid #ececec",
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Banner — title, organizer, and badges all live on the image now,
          so the card doesn't need a separate bordered title block below it. */}
      <div style={{ height: fullWidth ? 194 : 126, position: "relative", flexShrink: 0, overflow: "hidden", background: "#eee" }}>
        {(comp.bannerUrl || comp.images?.[0]?.url) ? (
          <img
            src={comp.bannerUrl || comp.images[0].url}
            alt={comp.title}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              filter: isCompleted ? "grayscale(0.85)" : "none",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={26} color="#ccc" />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: `${accent}55`,
          mixBlendMode: "multiply",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.78) 100%)",
        }} />

        {/* Top row — status badges on the left, follow toggle on the right */}
        <div style={{
          position: "absolute", top: 8, left: 8, right: 8,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6,
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            {isRegistration && (
              <div style={{
                height: 25, borderRadius: 13,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#fff",
                background: "#6C63FF",
                fontFamily: "Inter, sans-serif",
                display: "flex", alignItems: "center", gap: 4,
                padding: "0 8px 0 7px",
              }}>
                <Pencil size={11} strokeWidth={2.5} />
                INSCR.
              </div>
            )}
            {isLive && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#fff",
                background: "#00B894", padding: "2px 7px",
                fontFamily: "Inter, sans-serif",
                borderRadius: 7,
                display: "flex", alignItems: "center", gap: 3,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#fff",
                  boxShadow: "0 0 0 2px rgba(255,255,255,0.35)",
                }} />
                En direct
              </div>
            )}
            {isCompleted && (
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#fff",
                background: "rgba(0,0,0,0.55)", padding: "2px 7px",
                fontFamily: "Inter, sans-serif",
                borderRadius: 7,
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              }}>
                Terminé
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareData = { title: comp.title, text: `${comp.title} — ${comp.edition}` };
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(shareData.text).catch(() => {});
                }
                setShareCount((c) => c + 1);
              }}
              title="Partager"
              style={{
                flexShrink: 0,
                height: 25, borderRadius: 13,
                border: "1px solid rgba(255,255,255,0.55)",
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                cursor: "pointer",
                padding: "0 8px 0 7px",
              }}
            >
              <PiShareFat size={13} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {formatCoins(shareCount)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(comp, { focusComments: true });
              }}
              title="Commentaires"
              style={{
                flexShrink: 0,
                height: 25, borderRadius: 13,
                border: "1px solid rgba(255,255,255,0.55)",
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                cursor: "pointer",
                padding: "0 8px 0 7px",
              }}
            >
              <MessageCircle size={13} strokeWidth={2.25} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {formatCoins(commentCount)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFollowed((f) => !f);
                setFollowerCount((c) => followed ? c - 1 : c + 1);
              }}
              title={followed ? "Retirer des favoris" : "Ajouter aux favoris"}
              style={{
                flexShrink: 0,
                height: 25, borderRadius: 13,
                border: followed ? "none" : "1px solid rgba(255,255,255,0.55)",
                background: followed ? accent : "rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                cursor: "pointer",
                transition: "background 0.15s",
                padding: "0 8px 0 7px",
              }}
            >
              <Star size={12} strokeWidth={2.5} fill={followed ? "#fff" : "none"} />
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                {formatCoins(followerCount)}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom overlay — title + organizer, replaces the old separate title block */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          padding: "8px 12px 9px",
          display: "flex", flexDirection: "column", gap: 5,
        }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15, fontWeight: 800,
            color: "#fff",
            lineHeight: 1.2,
            textShadow: "0 1px 6px rgba(0,0,0,0.4)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {comp.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: accent, color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 8.5, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {comp.organisateur.charAt(0)}
            </div>
            <span style={{
              fontFamily: "Inter, sans-serif", fontSize: 10.5, fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              display: "flex", alignItems: "center", gap: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.organisateur}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#1877F2" d="M12 0l2.39 2.39 3.3-.6 1.02 3.18 3.18 1.02-.6 3.3L24 12l-2.71 2.71.6 3.3-3.18 1.02-1.02 3.18-3.3-.6L12 24l-2.39-2.39-3.3.6-1.02-3.18-3.18-1.02.6-3.3L0 12l2.71-2.71-.6-3.3 3.18-1.02L6.31 1.79l3.3.6z" />
                <path fill="#fff" d="M10.5 15.17l-3-3 1.41-1.41L10.5 12.34l5.09-5.09 1.41 1.42z" />
              </svg>
            </span>
            <span style={{
              marginLeft: "auto", flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3,
            }}>
              <span style={{
                display: "flex", alignItems: "center",
                padding: "3px 7px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
              }}>
                {`S${isoWeekNumber(new Date(resolvedEndDate))}-Q${comp.contestants}`}
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: 3,
                fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
                color: "rgba(255,255,255,0.85)",
              }}>
                {isCompleted ? (
                  <>
                    <Trophy size={10} strokeWidth={2.5} />
                    {comp.winnerName ? comp.winnerName : "Terminé"}
                  </>
                ) : (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "3px 7px",
                    borderRadius: 999,
                    background: comp.hot ? "rgba(192,57,43,0.55)" : "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}>
                    <Clock size={10} strokeWidth={2.5} />
                    {fmtCountdown(resolvedEndDate)}
                  </span>
                )}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Compact stats row — deadline, prize, and phase. */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "9px 12px",
        borderBottom: "1px solid #f0f0f0",
      }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
            color: comp.hot ? "#c0392b" : "#333",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {fmtAbsoluteDateOnly(resolvedEndDate)}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8.5, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            {isRegistration ? "Fin inscr." : "Fin dans"}
          </span>
        </div>
        <div style={{ width: 1, height: 24, background: "#eee", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, paddingLeft: 10, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: "#222",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {fmtCompactPrize(comp.prizeAmount) ? `${fmtCompactPrize(comp.prizeAmount)} HTG` : "—"}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8.5, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Cagnotte
          </span>
        </div>
        <div style={{ width: 1, height: 24, background: "#eee", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, paddingLeft: 10, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: accent,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {getRegistrationFee(comp)} HTG
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8.5, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Frais Inscr.
          </span>
        </div>
      </div>

      {/* Full-width, edge-to-edge registration progress bar — flush
          against the stats row's bottom border above it, and sitting
          right on top of the footer button below. No side padding, no
          border-radius, to match the flat edge-to-edge style used
          elsewhere. The registered/capacity counts already show on the
          footer button itself, so this is just the bar. Only shown
          during the registration phase. */}
      {isRegistration && (
        <div style={{ height: 6, width: "100%", background: "#eee", overflow: "hidden", flexShrink: 0 }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, Math.round((comp.registeredCount / Math.max(comp.contestants, 1)) * 100))}%`,
            background: comp.registeredCount >= comp.contestants ? "#00B894" : accent,
            transition: "width 0.4s ease",
          }} />
        </div>
      )}

      {/* Footer — voting or registration */}
      {isRegistration ? (
        isOwnCompetition ? (
          <div
            style={{
              border: "none",
              background: "#f7f7f7",
              color: "#999",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <BadgeCheck size={13} strokeWidth={2.5} />
            Votre compétition
          </div>
        ) : isRegistered ? (
          <div
            style={{
              border: "none",
              background: "#e8f8f3",
              color: "#00875A",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={13} strokeWidth={2.5} />
              Inscrit
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11.5,
                fontWeight: 600,
                opacity: 0.75,
              }}
            >
              {Math.min(comp.registeredCount + 1, comp.contestants)}/{comp.contestants}
            </span>
          </div>
        ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRegister?.(comp); }}
          style={{
            border: "none",
            background: "#6C63FF",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} strokeWidth={2.5} />
            S'inscrire
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11.5,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {comp.registeredCount}/{comp.contestants}
          </span>
        </button>
        )
      ) : isCompleted ? (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
          style={{
            border: "none",
            background: "#f7f7f7",
            color: "#666",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={13} strokeWidth={2.5} />
            Résultat
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11.5,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {fmtVotes(voteCount)}
          </span>
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
          style={{
            border: "none",
            background: "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 12.5,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Gift size={13} strokeWidth={2.5} />
            Cadeau
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11.5,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {fmtVotes(voteCount)}
          </span>
        </button>
      )}
    </div>
  );
}
