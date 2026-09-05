import {
  LayoutGrid,
  Heart,
  Radio,
  Pencil,
  Clock,
  ArrowUp,
  Sparkles,
  Check,
  Search,
  Flame,
  Bell,
  Users,
} from "lucide-react";
import CompCard from "./CompCard";
import { isCompOwner } from "./App";

/* ─── HOME NEWS TICKER ─────────────────────────────────────────────────── */

const NEWS_ITEMS = [
  "✦ Concours de Beauté Saison 1 entre en demi-finale",
  "🏆 Miss Élégance : la finale approche",
  "👑 Concours de Beauté — vote en direct, votez maintenant",
  "📋 Top Model Open dépasse les 20 inscriptions",
  "✦ Miss Élégance — derniers votes avant la finale",
];

function NewsBand() {
  return (
    <div
      style={{
        background: "#18181b",
        borderTop: "1px solid #2a2a2e",
        borderBottom: "2px solid #2a2a2e",
        overflow: "hidden",
        whiteSpace: "nowrap",
        padding: "4px 0",
      }}
    >
      <style>{`
        @keyframes news-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        style={{
          display: "inline-flex",
          animation: "news-scroll 30s linear infinite",
        }}
      >
        {[...NEWS_ITEMS, ...NEWS_ITEMS].map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.02em",
              padding: "0 20px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// Home screen tabs — TYPE-based (what state/kind a competition is in)
// rather than CATEGORY-based (which niche it belongs to). "Tous" and
// "Favoris" stay as general-purpose tabs; everything else now narrows by
// phase/trend instead of by niche label, and every niche can contribute
// to any tab. "Live" gets a pulsating red dot to signal it's happening
// right now.
const HOME_TABS = [
  { key: "Tous", label: "Tous", icon: LayoutGrid },
  { key: "Favoris", label: "Favoris", icon: Heart },
  { key: "Live", label: "Live", icon: Radio, live: true },
  { key: "Inscriptions", label: "Inscriptions", icon: Pencil },
  { key: "Bientôt", label: "Bientôt", icon: Clock },
  { key: "En hausse", label: "En hausse", icon: ArrowUp },
  { key: "Nouveautés", label: "Nouveautés", icon: Sparkles },
  { key: "Terminé", label: "Terminé", icon: Check },
];

/* ─── TYPE ROW (horizontally-scrollable rail of one competition "type") ── */

function TypeRow({ icon: Icon, label, accent, items, onOpen, onOpenComments, onOpenShare, onRegister, registeredCompIds, currentUser }) {
  if (!items || items.length === 0) return null;
  return (
    <section style={{ marginBottom: 0, borderBottom: "2px solid #2a2a2e", paddingBottom: 8, paddingTop: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
          marginBottom: 2,
        }}
      >
        {Icon && <Icon size={16} strokeWidth={2.5} color={accent} style={{ flexShrink: 0 }} />}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#f2f2f2",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {items.map((comp) => (
          <CompCard key={comp.id} comp={comp} accent={comp.accent} onOpen={onOpen} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegister} isRegistered={registeredCompIds?.has(comp.id)} isOwnCompetition={isCompOwner(comp, currentUser)} />
        ))}
      </div>
    </section>
  );
}

/* ─── HOME PAGE ─────────────────────────────────────────────────────────── */

export default function HomePage({
  // search + filter state
  query,
  onQueryChange,
  homeSearchFocused,
  onSearchFocusChange,
  activeFilter,
  onFilterChange,
  // banner slider state
  homeBannerSlides,
  bannerIndex,
  onBannerIndexChange,
  // competition lists
  visibleCompsFlat,
  topComps,
  liveComps,
  registrationComps,
  endingSoonComps,
  risingComps,
  newComps,
  followedTypeItems,
  registeredTypeItems,
  organizerGroups,
  // shared
  registeredCompIds,
  currentUser,
  // handlers
  onOpenTypeComp,
  onOpenComments,
  onOpenShare,
  onRegisterTypeComp,
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 64 }}>

      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: "1px solid #2a2a2e",
          background: "#111",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Search bar */}
        <div style={{ padding: "8px" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${homeSearchFocused ? "#f5f5f5" : "#2a2a2e"}`,
              background: "#1c1c1f",
              height: 38,
              borderRadius: 10,
              padding: "0 10px",
              transition: "border-color 0.15s",
            }}
          >
            <Search size={15} color={homeSearchFocused ? "#f5f5f5" : "#7a7a80"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Rechercher une compétition..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => onSearchFocusChange(true)}
              onBlur={() => onSearchFocusChange(false)}
              style={{
                flex: 1,
                minWidth: 0,
                border: "none",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#f5f5f5",
                background: "transparent",
                height: "100%",
              }}
            />
          </div>
        </div>

        {/* Chips row — edge to edge */}
        <div style={{ display: "flex", gap: 8, padding: "0 8px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
          {HOME_TABS.map(({ key, label, icon: Icon, live }) => {
            const active = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active ? "#111" : "#c9c9c9",
                  background: active ? "#fff" : "#202023",
                  border: `1px solid ${active ? "#fff" : "#333"}`,
                  borderRadius: 20,
                  padding: "6px 14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.12s, color 0.12s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                {Icon && <Icon size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                {label}
                {live && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#E74C3C",
                      display: "inline-block",
                      animation: "pulse-dot 1s infinite",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </header>

      {/* ── BANNER SLIDER (2:1, real uploaded images only) ── */}
      {homeBannerSlides.length > 0 && (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "2.2 / 1",
          overflow: "hidden",
          borderBottom: "2px solid #2a2a2e",
        }}
      >
        {homeBannerSlides.map((slide, i) => (
          <div
            key={slide.id}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: i === bannerIndex ? 1 : 0,
              transition: "opacity 0.8s ease",
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                background: slide.color,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, ${slide.color}55 0%, transparent 60%)`,
                mixBlendMode: "multiply",
              }}
            />
          </div>
        ))}

        {/* Dots */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            zIndex: 2,
          }}
        >
          {homeBannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => onBannerIndexChange(i)}
              style={{
                width: i === bannerIndex ? 28 : 8,
                height: 8,
                border: "1px solid rgba(255,255,255,0.6)",
                background: i === bannerIndex ? "#fff" : "transparent",
                cursor: "pointer",
                transition: "all 0.25s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
      )}

      <NewsBand />

      {/* ── NICHE ROWS ── */}
      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          paddingTop: 14,
          paddingBottom: 60,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {visibleCompsFlat.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px", borderTop: "1px solid #2a2a2e", background: "transparent" }}>
            {activeFilter === "Favoris" && query.trim() === "" ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.02em" }}>Aucun favori</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", marginTop: 8 }}>Suivez une compétition depuis sa fiche pour la retrouver ici.</div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.02em" }}>Aucun résultat</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", marginTop: 8 }}>Aucune compétition ne correspond à « {query} »</div>
                <button onClick={() => onQueryChange("")} style={{ marginTop: 20, border: "1px solid #fff", background: "#1c1c1f", color: "#111", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer" }}>Effacer la recherche</button>
              </>
            )}
          </div>
        ) : activeFilter === "Terminé" ? (
          // Archive view — one wide card per row instead of the usual
          // horizontally-scrollable rails, since there's nothing to
          // discover-browse here: it's a straightforward past-results list.
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 6 }}>
            {[...visibleCompsFlat]
              .sort((a, b) => new Date(b.closedAt || 0) - new Date(a.closedAt || 0))
              .map((comp) => (
              <CompCard
                key={comp.id}
                comp={comp}
                accent={comp.accent}
                onOpen={onOpenTypeComp}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onRegister={onRegisterTypeComp}
                registeredCompIds={registeredCompIds}
                isRegistered={registeredCompIds?.has(comp.id)}
                isOwnCompetition={isCompOwner(comp, currentUser)}
                fullWidth
              />
            ))}
          </div>
        ) : (
          <>
            <TypeRow icon={Flame} label="Top compétitions" accent="#E8A33D" items={topComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            <TypeRow icon={Radio} label="En direct" accent="#E74C3C" items={liveComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            <TypeRow icon={Pencil} label="Inscriptions ouvertes" accent="#6C63FF" items={registrationComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            <TypeRow icon={Clock} label="Se termine bientôt" accent="#D35400" items={endingSoonComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            <TypeRow icon={ArrowUp} label="En hausse" accent="#27AE60" items={risingComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            <TypeRow icon={Sparkles} label="Nouveautés" accent="#00B8A9" items={newComps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            {currentUser && <TypeRow icon={Bell} label="Suivies" accent="#3498DB" items={followedTypeItems} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />}
            {currentUser && <TypeRow icon={Check} label="Vos inscriptions" accent="#34495E" items={registeredTypeItems} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />}
            {organizerGroups.map(({ organisateur, comps }) => (
              <TypeRow key={organisateur} icon={Users} label={`Compétitions de ${organisateur}`} accent="#7F8C8D" items={comps} onOpen={onOpenTypeComp} onOpenComments={onOpenComments} onOpenShare={onOpenShare} onRegister={onRegisterTypeComp} registeredCompIds={registeredCompIds} currentUser={currentUser} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}
