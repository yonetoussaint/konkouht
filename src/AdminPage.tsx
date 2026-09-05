import { useState, useMemo } from "react";
import { ArrowLeft, Search, Plus, Image as ImageIcon, ChevronRight, X } from "lucide-react";
import { isCompOwner, fmtAbsoluteDateOnly, WithdrawalsPanel } from "./App";
import ComitePanel from "./ComitePanel";

/* ─── ADMIN PAGE (competitions management / withdrawals / comité) ───────── */

export default function AdminPage({ currentUser, niches, seedCompetitions, onOpenComp, onToggleActive, onCreateEdition, onPublishEdition, onDeleteEdition, onBack, showToast }) {
  // The platform organizer sees every competition (plus withdrawals);
  // everyone else only ever sees — and can only manage — competitions
  // they created themselves.
  const isFullAdmin = !!currentUser?.isOrganizer;
  const [adminSection, setAdminSection] = useState("competitions"); // "competitions" | "withdrawals" | "comite"
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Total");
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  async function handlePublishClick(comp) {
    setPublishingId(comp.id);
    await onPublishEdition(comp);
    setPublishingId(null);
  }

  async function handleDeleteClick(comp) {
    if (!window.confirm(`Supprimer définitivement « ${comp.title} » (${comp.edition}) ? Cette action est irréversible.`)) return;
    setDeletingId(comp.id);
    await onDeleteEdition(comp);
    setDeletingId(null);
  }

  const allEntries = niches
    .flatMap((niche) => niche.competitions.map((comp) => ({ comp, niche })))
    .filter(({ comp }) => isFullAdmin || isCompOwner(comp, currentUser));

  const searchedEntries = query.trim() === ""
    ? allEntries
    : allEntries.filter(({ comp }) =>
        comp.title.toLowerCase().includes(query.toLowerCase()) ||
        comp.edition.toLowerCase().includes(query.toLowerCase()) ||
        comp.niche === undefined ? false : true
      ).filter(({ comp, niche }) =>
        comp.title.toLowerCase().includes(query.toLowerCase()) ||
        comp.edition.toLowerCase().includes(query.toLowerCase()) ||
        niche.label.toLowerCase().includes(query.toLowerCase())
      );

  const filteredEntries =
    statusFilter === "Total" ? searchedEntries
    : statusFilter === "En direct" ? searchedEntries.filter((e) => e.comp.phase === "live")
    : statusFilter === "Inscriptions" ? searchedEntries.filter((e) => e.comp.phase === "registration")
    : statusFilter === "Brouillons" ? searchedEntries.filter((e) => e.comp.phase === "draft")
    : statusFilter === "Désactivées" ? searchedEntries.filter((e) => !e.comp.active)
    : searchedEntries;

  const totalComps = allEntries.length;
  const liveCount = allEntries.filter((e) => e.comp.phase === "live").length;
  const registrationCount = allEntries.filter((e) => e.comp.phase === "registration").length;
  const draftCount = allEntries.filter((e) => e.comp.phase === "draft").length;
  const offCount = allEntries.filter((e) => !e.comp.active).length;
  const totalRegistered = allEntries.reduce((sum, e) => sum + (e.comp.registeredCount || 0), 0);

  // Templates (seed competitions) are never edited or deleted from here —
  // they're just the source list an admin picks from when starting a new
  // edition. Picking one is handled entirely inside the overlay below.
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [creatingTemplateKey, setCreatingTemplateKey] = useState(null);

  async function handlePickTemplate(found) {
    if (!found || creatingTemplateKey) return;
    setCreatingTemplateKey(found.key);
    await onCreateEdition(found.comp, found.niche);
    setCreatingTemplateKey(null);
    setShowTemplatePicker(false);
    setTemplateQuery("");
  }

  const templatesByNiche = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    const groups = new Map();
    for (const s of seedCompetitions) {
      if (q && !s.comp.title.toLowerCase().includes(q) && !s.niche.label.toLowerCase().includes(q)) continue;
      if (!groups.has(s.niche.label)) groups.set(s.niche.label, { niche: s.niche, items: [] });
      groups.get(s.niche.label).items.push(s);
    }
    return Array.from(groups.values());
  }, [seedCompetitions, templateQuery]);

  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #2a2a2e",
          background: "#1c1c1f",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <ArrowLeft size={20} color="#333" />
        </button>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {isFullAdmin ? "Administration" : "Mes compétitions"}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
            {isFullAdmin ? "Gérer toutes les compétitions" : "Créer et gérer vos compétitions"}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Section switcher — competitions management vs. pending withdrawals.
            Withdrawals are platform-organizer-only, so regular users creating
            their own competitions never see that tab at all. */}
        {isFullAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { id: "competitions", label: "Compétitions" },
              { id: "withdrawals", label: "Retraits" },
              { id: "comite", label: "Comité" },
            ].map((s) => {
              const isActive = adminSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setAdminSection(s.id)}
                  style={{
                    flex: 1,
                    border: isActive ? "1px solid #111" : "1px solid #2a2a2e",
                    background: isActive ? "#111" : "#fff",
                    color: isActive ? "#fff" : "#555",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {isFullAdmin && adminSection === "withdrawals" && (
          <WithdrawalsPanel showToast={showToast} />
        )}

        {isFullAdmin && adminSection === "comite" && (
          <ComitePanel showToast={showToast} />
        )}

        {adminSection === "competitions" && (
        <>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a8a90" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une compétition…"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #2a2a2e", borderRadius: 999,
              padding: "10px 14px 10px 36px",
              fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
              background: "#1c1c1f", outline: "none",
            }}
          />
        </div>

        {/* Stats as filter pills */}
        <div
          className="admin-stats-row"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 18,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          <style>{`.admin-stats-row::-webkit-scrollbar { display: none; }`}</style>
          {[
            { label: "Total", value: totalComps },
            { label: "En direct", value: liveCount },
            { label: "Inscriptions", value: registrationCount },
            { label: "Brouillons", value: draftCount },
            { label: "Inscrits", value: totalRegistered },
            { label: "Désactivées", value: offCount },
          ].map((stat) => {
            const isActive = statusFilter === stat.label;
            return (
              <button
                key={stat.label}
                onClick={() => setStatusFilter(stat.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: "0 0 auto",
                  border: isActive ? "1px solid #fff" : "1px solid #2a2a2e",
                  background: isActive ? "#fff" : "#1c1c1f",
                  borderRadius: 999,
                  padding: "8px 14px",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: isActive ? "#111" : "#c9c9c9", whiteSpace: "nowrap" }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? "#fff" : "#8a8a90",
                    background: isActive ? "#222" : "#2a2a2e",
                    borderRadius: 999,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {stat.value.toLocaleString("fr-FR")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Start a new edition/season for any competition series. Templates
            (seed competitions) never appear as rows in the list below —
            this overlay is the only place they're surfaced, purely as
            picks for spinning up a new edition. */}
        <button
          onClick={() => setShowTemplatePicker(true)}
          style={{
            width: "100%", marginBottom: 8,
            border: "1px dashed #2a2a2e", borderRadius: 10, padding: "12px 16px",
            background: "#1c1c1f", color: "#f2f2f2",
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={14} /> Nouvelle édition à partir d'un modèle
        </button>

        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90" }}>
              Aucune compétition ne correspond à « {query} »
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredEntries.map(({ comp, niche }) => {
              const thumb = comp.bannerUrl || comp.thumbnailUrl;
              const isDraft = comp.phase === "draft";
              const isDeleting = deletingId === comp.id;
              const isPublishing = publishingId === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => onOpenComp(comp, niche)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 14,
                    padding: 10, cursor: "pointer",
                    opacity: comp.active ? 1 : 0.55,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "#26262a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <ImageIcon size={18} color="#ccc" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {comp.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        color: "#fff", background: niche.accent,
                        borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {niche.label}
                      </span>
                      {!comp.active && (
                        <span style={{
                          fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                          color: "#fff", background: "#c0392b",
                          borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.03em",
                        }}>
                          Désactivée
                        </span>
                      )}
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        color: comp.phase === "live" ? "#00B894" : comp.phase === "completed" ? "#999" : comp.phase === "draft" ? "#c07a00" : "#888",
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {comp.phase === "live" ? "● En direct" : comp.phase === "completed" ? "Terminé" : comp.phase === "draft" ? "Brouillon" : "Inscriptions"}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90" }}>
                        {comp.edition}
                      </span>
                    </div>
                    {comp.phase === "registration" && comp.endsAt && (
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90" }}>
                        Fin insc. : {fmtAbsoluteDateOnly(comp.endsAt)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#f2f2f2" }}>
                      {(comp.registeredCount || 0).toLocaleString("fr-FR")}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#8a8a90", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      inscrits
                    </span>
                  </div>

                  {/* Publish — only surfaced for drafts, turns them live/open */}
                  {isDraft && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handlePublishClick(comp); }}
                      disabled={isPublishing}
                      style={{
                        flexShrink: 0,
                        border: "none", borderRadius: 8, padding: "6px 10px",
                        background: "#00B894", color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                        cursor: isPublishing ? "default" : "pointer",
                        opacity: isPublishing ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isPublishing ? "…" : "Publier"}
                    </button>
                  )}

                  {/* Delete edition — stopPropagation so it doesn't also open the edit panel */}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); handleDeleteClick(comp); }}
                    disabled={isDeleting}
                    aria-label="Supprimer cette édition"
                    title="Supprimer cette édition"
                    style={{
                      flexShrink: 0,
                      border: "none", borderRadius: 8, padding: 6,
                      background: "transparent", color: "#ff6b5e",
                      cursor: isDeleting ? "default" : "pointer",
                      opacity: isDeleting ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isDeleting ? <span style={{ fontSize: 10 }}>…</span> : <X size={14} strokeWidth={2.5} />}
                  </button>

                  <ChevronRight size={16} color="#ccc" />
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </div>

      {/* Template picker overlay — the only place seed competitions
          (templates) are ever shown in the admin experience. Picking a
          card creates a fresh draft edition of that template and drops
          straight into its edit form (via onCreateEdition). */}
      {showTemplatePicker && (
        <div
          onClick={() => setShowTemplatePicker(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560, maxHeight: "82vh",
              background: "#1c1c1f", borderRadius: "20px 20px 0 0",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{
              padding: "16px 16px 12px", background: "#1c1c1f",
              borderBottom: "1px solid #2a2a2e",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#eaeaea" }}>
                  Choisir un modèle
                </span>
                <button
                  onClick={() => setShowTemplatePicker(false)}
                  style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}
                  aria-label="Fermer"
                >
                  <X size={20} color="#666" />
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#8a8a90" }} />
                <input
                  type="text"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Rechercher un modèle…"
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1px solid #2a2a2e", borderRadius: 999,
                    padding: "9px 12px 9px 32px",
                    fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
                    background: "#1c1c1f", outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {templatesByNiche.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 8px" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90" }}>
                    Aucun modèle ne correspond à « {templateQuery} »
                  </span>
                </div>
              ) : (
                templatesByNiche.map(({ niche, items }) => (
                  <div key={niche.label}>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                      color: "#8a8a90", textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {niche.label}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {items.map((s) => {
                        const isCreating = creatingTemplateKey === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => handlePickTemplate(s)}
                            disabled={!!creatingTemplateKey}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 14,
                              padding: 10, cursor: creatingTemplateKey ? "default" : "pointer",
                              opacity: creatingTemplateKey && !isCreating ? 0.5 : 1,
                              textAlign: "left", width: "100%", boxSizing: "border-box",
                            }}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                              overflow: "hidden", background: "#26262a",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {s.comp.bannerUrl || s.comp.thumbnailUrl ? (
                                <img src={s.comp.bannerUrl || s.comp.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              ) : (
                                <ImageIcon size={16} color="#ccc" />
                              )}
                            </div>
                            <span style={{
                              flex: 1, minWidth: 0,
                              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {s.comp.title}
                            </span>
                            {isCreating ? (
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", flexShrink: 0 }}>…</span>
                            ) : (
                              <ChevronRight size={16} color="#ccc" style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
