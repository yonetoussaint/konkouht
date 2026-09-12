import {
  useState,
  useRef,
  useEffect,
  useMemo,
  Fragment,
} from "react";
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
  Loader2,
} from "lucide-react";
import CompCard from "./CompCard";
import SectionHeader from "./components/SectionHeader";
import SectionShell from "./components/SectionShell";
import CategoryGrid from "./components/CategoryGrid";
import RecentWinnersRow from "./components/RecentWinnersRow";
import FinaleCalendarRow from "./components/FinaleCalendarRow";
import DuelOfTheDay from "./components/DuelOfTheDay";
import DownloadAppBanner from "./components/DownloadAppBanner";
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

/* ─── ENDLESS FEED CONFIG ────────────────────────────────────────────── */

const DISCOVERY_TITLES = [
  "Recommandé pour toi",
  "Tendance en ce moment",
  "À découvrir",
  "Ne manquez pas ça",
  "Sélection du jour",
  "Ça bouge en ce moment",
  "À surveiller",
  "Choisi pour vous",
  "Populaire cette semaine",
  "Fraîchement ajouté",
];

const SHELF_SIZE = 6;
const SPECIAL_EVERY = 2;

/* ─── TYPE ROW ────────────────────────────────────────────────────────── */

function TypeRow({
  label,
  items,
  onOpen,
  onOpenComments,
  onOpenShare,
  onRegister,
  registeredCompIds,
  currentUser,
}) {
  if (!items || items.length === 0) return null;
  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={8}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader title={label} />
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
          <CompCard
            key={comp.id}
            comp={comp}
            accent={comp.accent}
            onOpen={onOpen}
            onOpenComments={onOpenComments}
            onOpenShare={onOpenShare}
            onRegister={onRegister}
            isRegistered={registeredCompIds?.has(comp.id)}
            isOwnCompetition={isCompOwner(comp, currentUser)}
          />
        ))}
      </div>
    </SectionShell>
  );
}

/* ─── TOP DONATEURS ROW ──────────────────────────────────────────────── */

function TopDonorsRow({ donors, onOpenDonor }) {
  if (!donors || donors.length === 0) return null;

  return (
    <SectionShell as="section" paddingTop={8} paddingBottom={10}>
      <div style={{ paddingLeft: 8, paddingRight: 8 }}>
        <SectionHeader title="Top donateurs" />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {donors.map((d, i) => {
          const rank = i + 1;
          const isLeader = rank === 1;
          const initials = (d.name || "?")
            .split(" ")
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <button
              key={d.id}
              onClick={() => onOpenDonor?.(d)}
              style={{
                flexShrink: 0,
                width: 84,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: onOpenDonor ? "pointer" : "default",
              }}
            >
              <div style={{ position: "relative", width: 60, height: 60 }}>
                {d.avatarUrl ? (
                  <img
                    src={d.avatarUrl}
                    alt={d.name}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      objectFit: "cover",
                      display: "block",
                      border: isLeader ? "2px solid #F5C542" : "2px solid #2a2a2e",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: isLeader ? "#3a2f10" : "#26262a",
                      color: isLeader ? "#F5C542" : "#c9c9c9",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: isLeader ? "2px solid #F5C542" : "2px solid #2a2a2e",
                    }}
                  >
                    {initials}
                  </div>
                )}
                {isLeader && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#F5C542",
                      color: "#111",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      lineHeight: 1,
                      padding: "2px 5px",
                      borderRadius: 999,
                      border: "2px solid #111",
                    }}
                  >
                    👑
                  </span>
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    borderRadius: 10,
                    background: isLeader ? "#F5C542" : "#2a2a2e",
                    color: isLeader ? "#111" : "#f2f2f2",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #1c1c1f",
                  }}
                >
                  {rank}
                </span>
              </div>

              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#f2f2f2",
                  width: "100%",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.name}
              </span>

              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: isLeader ? "#F5C542" : "#c9c9c9",
                  whiteSpace: "nowrap",
                }}
              >
                {d.total.toLocaleString("fr-FR")} HTG
              </span>
            </button>
          );
        })}
      </div>
    </SectionShell>
  );
}

/* ─── HOME PAGE ─────────────────────────────────────────────────────────── */

export default function HomePage({
  query,
  onQueryChange,
  homeSearchFocused,
  onSearchFocusChange,
  activeFilter,
  onFilterChange,
  homeBannerSlides,
  bannerIndex,
  onBannerIndexChange,
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
  topDonors,
  categories,
  activeNiche,
  onSelectCategory,
  recentWinners,
  finaleCalendar,
  /**
   * Duels keyed by lifecycle state:
   *   duels.live     → { a, b } for the current live duel (or null)
   *   duels.upcoming → { a, b } for the next scheduled duel (or null)
   *   duels.ended    → { a, b } for the most recent finished duel (or null)
   *
   * The component picks the highest-priority one that exists:
   * live > upcoming > ended. If all are null, the duel section is hidden.
   * The old single `duelOfTheDay` prop still works — if `duels` isn't
   * passed, it's treated as `{ live: duelOfTheDay }`.
   */
  duels,
  duelOfTheDay, // legacy prop, kept for compatibility
  registeredCompIds,
  currentUser,
  onOpenTypeComp,
  onOpenComments,
  onOpenShare,
  onRegisterTypeComp,
  onLoadMore,
}) {
  /* ── Pick the duel to actually render ────────────────────────────────
     Priority: live beats upcoming beats ended. When a duel transitions
     from upcoming → live, this flips automatically without any extra
     wiring on the parent side, as long as `duels.live` is populated. */
  const activeDuel = useMemo(() => {
    const d = duels ?? { live: duelOfTheDay ?? null };
    if (d.live?.a && d.live?.b) return { ...d.live, state: "live" };
    if (d.upcoming?.a && d.upcoming?.b) return { ...d.upcoming, state: "upcoming" };
    if (d.ended?.a && d.ended?.b) return { ...d.ended, state: "ended" };
    return null;
  }, [duels, duelOfTheDay]);

  /* ── Endless feed ────────────────────────────────────────────────── */
  const [extraShelves, setExtraShelves] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !visibleCompsFlat || visibleCompsFlat.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          Promise.resolve(onLoadMore?.()).finally(() => {
            setExtraShelves((n) => n + 1);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadingMore, visibleCompsFlat, onLoadMore]);

  const generatedShelves = useMemo(() => {
    if (!visibleCompsFlat || visibleCompsFlat.length === 0) return [];
    const shelves = [];
    for (let i = 0; i < extraShelves; i++) {
      const start = (i * SHELF_SIZE) % visibleCompsFlat.length;
      const items = [];
      for (let j = 0; j < SHELF_SIZE; j++) {
        items.push(visibleCompsFlat[(start + j) % visibleCompsFlat.length]);
      }
      shelves.push({
        key: `discovery-${i}`,
        title: DISCOVERY_TITLES[i % DISCOVERY_TITLES.length],
        items,
      });
    }
    return shelves;
  }, [extraShelves, visibleCompsFlat]);

  /* Specials pool for the endless feed. Uses `activeDuel` so the
     interleaved duel matches whichever state is currently live. */
  const specialsPool = useMemo(
    () =>
      [
        activeDuel && (() => <DuelOfTheDay key="duel-extra" duel={activeDuel} onOpen={onOpenTypeComp} />),
        topDonors?.length > 0 && (() => <TopDonorsRow key="donors-extra" donors={topDonors} />),
        recentWinners?.length > 0 && (() => <RecentWinnersRow key="winners-extra" winners={recentWinners} onOpen={onOpenTypeComp} />),
      ].filter(Boolean),
    [activeDuel, topDonors, recentWinners, onOpenTypeComp]
  );

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
            <Search
              size={15}
              color={homeSearchFocused ? "#f5f5f5" : "#7a7a80"}
              strokeWidth={2.25}
              style={{ flexShrink: 0 }}
            />
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

        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 8px 8px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
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

      <DownloadAppBanner
        appStoreUrl={undefined}
        playStoreUrl={undefined}
      />

      {/* ── BANNER SLIDER ── */}
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

      <CategoryGrid
        categories={categories}
        activeNiche={activeNiche}
        onSelect={onSelectCategory}
      />

      <FinaleCalendarRow finales={finaleCalendar} onOpen={onOpenTypeComp} />

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
          <div
            style={{
              textAlign: "center",
              padding: "60px 8px",
              borderTop: "1px solid #2a2a2e",
              background: "transparent",
            }}
          >
            {activeFilter === "Favoris" && query.trim() === "" ? (
              <>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#f2f2f2",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Aucun favori
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#8a8a90",
                    marginTop: 8,
                  }}
                >
                  Suivez une compétition depuis sa fiche pour la retrouver ici.
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#f2f2f2",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Aucun résultat
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#8a8a90",
                    marginTop: 8,
                  }}
                >
                  Aucune compétition ne correspond à « {query} »
                </div>
                <button
                  onClick={() => onQueryChange("")}
                  style={{
                    marginTop: 20,
                    border: "1px solid #fff",
                    background: "#1c1c1f",
                    color: "#111",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  Effacer la recherche
                </button>
              </>
            )}
          </div>
        ) : activeFilter === "Terminé" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 6,
            }}
          >
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
            <TypeRow
              label="Top compétitions"
              items={topComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />

            {/* ── DUEL DU JOUR ────────────────────────────────────────
                Renders whichever duel is currently most relevant:
                live if there is one, otherwise the next upcoming one,
                otherwise the most recent ended one. `activeDuel.state`
                is passed through so DuelOfTheDay can theme itself.
                Hidden entirely when nothing is available. */}
            {activeDuel && (
              <DuelOfTheDay
                duel={activeDuel}
                state={activeDuel.state}
                onOpen={onOpenTypeComp}
              />
            )}

            <TypeRow
              label="En direct"
              items={liveComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
            <TopDonorsRow donors={topDonors} />
            <TypeRow
              label="Inscriptions ouvertes"
              items={registrationComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
            <TypeRow
              label="Se termine bientôt"
              items={endingSoonComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
            <RecentWinnersRow winners={recentWinners} onOpen={onOpenTypeComp} />
            <TypeRow
              label="En hausse"
              items={risingComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
            <TypeRow
              label="Nouveautés"
              items={newComps}
              onOpen={onOpenTypeComp}
              onOpenComments={onOpenComments}
              onOpenShare={onOpenShare}
              onRegister={onRegisterTypeComp}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
            {currentUser && (
              <TypeRow
                label="Suivies"
                items={followedTypeItems}
                onOpen={onOpenTypeComp}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onRegister={onRegisterTypeComp}
                registeredCompIds={registeredCompIds}
                currentUser={currentUser}
              />
            )}
            {currentUser && (
              <TypeRow
                label="Vos inscriptions"
                items={registeredTypeItems}
                onOpen={onOpenTypeComp}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onRegister={onRegisterTypeComp}
                registeredCompIds={registeredCompIds}
                currentUser={currentUser}
              />
            )}
            {organizerGroups.map(({ organisateur, comps }) => (
              <TypeRow
                key={organisateur}
                label={`Compétitions de ${organisateur}`}
                items={comps}
                onOpen={onOpenTypeComp}
                onOpenComments={onOpenComments}
                onOpenShare={onOpenShare}
                onRegister={onRegisterTypeComp}
                registeredCompIds={registeredCompIds}
                currentUser={currentUser}
              />
            ))}

            {generatedShelves.map((shelf, i) => (
              <Fragment key={shelf.key}>
                <TypeRow
                  label={shelf.title}
                  items={shelf.items}
                  onOpen={onOpenTypeComp}
                  onOpenComments={onOpenComments}
                  onOpenShare={onOpenShare}
                  onRegister={onRegisterTypeComp}
                  registeredCompIds={registeredCompIds}
                  currentUser={currentUser}
                />
                {specialsPool.length > 0 &&
                  (i + 1) % SPECIAL_EVERY === 0 &&
                  specialsPool[
                    (Math.floor(i / SPECIAL_EVERY)) % specialsPool.length
                  ]()}
              </Fragment>
            ))}

            <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              {loadingMore && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#8a8a90",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                  }}
                >
                  <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                  Chargement...
                </div>
              )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </main>
    </div>
  );
}