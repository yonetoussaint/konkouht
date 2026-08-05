// Full-screen overlays and bottom-sheet panels launched from the main
// CompetitionBoard screen: participant/registrant lists, the album grid +
// lightbox, and the live audio commentary room.
import { useState } from "react";
import { Audio as AudioBarsLoader } from "react-loader-spinner";
import {
  Trophy, Users, Play, Plus, ArrowLeft, ChevronLeft, Volume2, VolumeX, Hand,
} from "lucide-react";
import { fmtVotes, hashStr } from "../App";
import { fmtRelativeTime } from "./constants";
import { EntityAvatar } from "./sharedUI";

export function ParticipantListOverlay({ comp, participants, onClose }) {
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

export function AlbumGridOverlay({ items, onClose, onOpenItem }) {
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

export function RegistrantListOverlay({ comp, registrants, accent, onClose, canRemove, onRemove, removingRegistrantId }) {
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

/* ─── ALBUM SHEET (Mon album) ────────────────────────────────────────────
   Lets the current user manage their own uploaded participant media. Only
   ever opened in "own" mode now — browsing other participants' media goes
   through the real approved-media gallery + MediaLightbox instead. */

/* ─── PARTICIPANTS SHEET ─────────────────────────────────────────────────
   Bottom sheet opened from the chevron/avatar-stack above the registration
   progress bar (and from the home preview's "Voir plus"). Replaces the old
   standalone Participants tab. Shows registrants during registration, or
   the top-5 classement once voting is live. "Voir tout" still hands off to
   the existing full-page overlays (RegistrantListOverlay / ParticipantListOverlay). */
export function ParticipantsSheet({
  comp, accent, isRegistration, liveRegistered, registrants, registrantsLoading,
  ranked, topPoints, currentUser, canRemove, onRemove, removingRegistrantId,
  onClose, onShowAllRegistrants, onShowAllRanked,
}) {
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
          borderTop: "2px solid #111",
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
              Participants
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {isRegistration ? `${liveRegistered}/${comp.contestants} inscrits` : `${comp.contestants} participants`}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: "16px 16px 24px" }}>
          {isRegistration ? (
            <>
              <div style={{
                padding: "20px", background: "#f8f7fc", borderRadius: 16,
                textAlign: "center", marginBottom: 16,
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700,
                  color: "#6C63FF", marginBottom: 4,
                }}>
                  {liveRegistered}/{comp.contestants}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666", marginBottom: 12 }}>
                  personnes inscrites
                </div>
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
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999", lineHeight: 1.5 }}>
                  {comp.contestants - liveRegistered > 0
                    ? `${comp.contestants - liveRegistered} place${comp.contestants - liveRegistered !== 1 ? 's' : ''} encore disponible${comp.contestants - liveRegistered !== 1 ? 's' : ''}`
                    : "Les inscriptions sont complètes"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                }}><Users size={13} strokeWidth={2.5} />Membres inscrits</span>
                {registrants.length > 5 && (
                  <button
                    onClick={onShowAllRegistrants}
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
                <div style={{ padding: "20px 0 24px", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Chargement des inscrits...
                </div>
              ) : registrants.length === 0 ? (
                <div style={{ padding: "20px 0 24px", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Aucune inscription pour le moment.
                </div>
              ) : (
                registrants.slice(0, 5).map((r, idx, arr) => {
                  const isMe = currentUser && r.userId === currentUser.id;
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 6px", margin: "0 -6px", borderRadius: 8,
                      background: isMe ? "#f0ebff" : "transparent",
                      borderBottom: idx < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        background: "#f0ebff", color: "#6C63FF",
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: isMe ? "2px solid #6C63FF" : "none",
                      }}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: isMe ? "#6C63FF" : "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name}
                        </span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                          {fmtRelativeTime(r.createdAt)}
                        </span>
                      </div>
                      {isMe && (
                        <span style={{
                          fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
                          color: "#fff", background: "#6C63FF",
                          borderRadius: 999, padding: "3px 8px",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          flexShrink: 0,
                        }}>
                          Vous
                        </span>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => onRemove(r)}
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
                  );
                })
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                }}><Trophy size={13} strokeWidth={2.5} />Classement · Top 5</span>
                <button
                  onClick={onShowAllRanked}
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
                    <span style={{
                      width: 20, flexShrink: 0, textAlign: "center",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: rank === 0 ? 16 : 12, fontWeight: 700,
                      color: rank === 0 ? accent : "#ccc",
                    }}>
                      {rank === 0 ? "🥇" : rank + 1}
                    </span>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      overflow: "hidden", background: "#fff",
                      border: rank === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                    }}>
                      <EntityAvatar url={p.avatarUrl} name={p.name} />
                    </div>
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
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlbumSheet({ accent, uploads = [], uploading = false, onUpload, onClose }) {
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

export function MediaLightbox({ item, onClose }) {
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

export function CommentaryStreamSheet({ comp, commentator, coSpeakers, accent, muted, onToggleMute, onClose }) {
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

