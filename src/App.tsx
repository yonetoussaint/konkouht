import { useState, useRef, useEffect } from "react";
import { Music, PersonStanding, Trophy, Palette, Laugh, Gamepad2, LayoutGrid, Home, Wallet, User, Bell, BadgeCheck, Play, File, Plus, Gift, ArrowDownLeft, ArrowUpRight, ShoppingCart, X, Check } from "lucide-react";

/* ─── DATA ─────────────────────────────────────────────────────────────── */

const NICHES = [
  {
    id: "music",
    label: "Musique",
    accent: "#6C63FF",
    icon: "♪",
    competitions: [
      { id: "m1", title: "Battle Hip-Hop", edition: "Saison 4", contestants: 12, votes: 4820, ends: "2j 14h", organisateur: "Urban Sound Collective", hot: true , followers: 8096 , mediaType: "photo" },
      { id: "m2", title: "Voix d'Or", edition: "Finale", contestants: 8, votes: 9310, ends: "6h 22m", organisateur: "Studio Voix", hot: true , followers: 2439 , mediaType: "video" },
      { id: "m3", title: "Guitar Shred", edition: "Quart de finale", contestants: 16, votes: 2140, ends: "4j 02h", organisateur: "Guitar League", hot: false , followers: 18824 , mediaType: "text" },
      { id: "m4", title: "DJ Set Open", edition: "Éliminatoires", contestants: 24, votes: 1870, ends: "5j 18h", organisateur: "DJ Network Haiti", hot: false , followers: 16849 , mediaType: "pdf" },
      { id: "m5", title: "Slam Poétique", edition: "Demi-finale", contestants: 6, votes: 3450, ends: "1j 08h", organisateur: "Poésie Vive", hot: true , followers: 15428 , mediaType: "photo" },
    ],
  },
  {
    id: "dance",
    label: "Danse",
    accent: "#FF4D6D",
    icon: "◈",
    competitions: [
      { id: "d1", title: "Krump Masters", edition: "Finale", contestants: 10, votes: 7640, ends: "3j 05h", organisateur: "Krump Federation", hot: true , followers: 9944 , mediaType: "video" },
      { id: "d2", title: "Afrobeats Cup", edition: "Saison 2", contestants: 20, votes: 5230, ends: "6j 11h", organisateur: "Afrobeats Crew", hot: false , followers: 7517 , mediaType: "text" },
      { id: "d3", title: "Ballet Urbain", edition: "Demi-finale", contestants: 8, votes: 3810, ends: "2j 19h", organisateur: "Ballet Urbain Co.", hot: false , followers: 36541 , mediaType: "pdf" },
      { id: "d4", title: "Breakdance WC", edition: "Quart de finale", contestants: 32, votes: 11200, ends: "1j 02h", organisateur: "World Cypher", hot: true , followers: 6497 , mediaType: "photo" },
      { id: "d5", title: "Zumba Battle", edition: "Éliminatoires", contestants: 18, votes: 980, ends: "8j 00h", organisateur: "Zumba Connect", hot: false , followers: 39498 , mediaType: "video" },
    ],
  },
  {
    id: "sports",
    label: "Sports",
    accent: "#00B894",
    icon: "▲",
    competitions: [
      { id: "s1", title: "Freestyle Football", edition: "Finale Nationale", contestants: 14, votes: 6540, ends: "12h 00m", organisateur: "Street Football Assoc.", hot: true , followers: 28451 , mediaType: "text" },
      { id: "s2", title: "Arm Wrestling Pro", edition: "Open", contestants: 28, votes: 3120, ends: "5j 07h", organisateur: "Arm Wrestling League", hot: false , followers: 2882 , mediaType: "pdf" },
      { id: "s3", title: "Parkour Challenge", edition: "Saison 3", contestants: 10, votes: 8900, ends: "2j 16h", organisateur: "Parkour Nation", hot: true , followers: 2752 , mediaType: "photo" },
      { id: "s4", title: "Chess Blitz", edition: "Quart de finale", contestants: 64, votes: 4410, ends: "3j 22h", organisateur: "Chess Club PAP", hot: false , followers: 6940 , mediaType: "video" },
      { id: "s5", title: "Natation Style", edition: "Demi-finale", contestants: 16, votes: 2670, ends: "7j 03h", organisateur: "Fédé Natation", hot: false , followers: 15128 , mediaType: "text" },
    ],
  },
  {
    id: "art",
    label: "Art & Design",
    accent: "#FDCB6E",
    icon: "□",
    competitions: [
      { id: "a1", title: "Live Graffiti", edition: "Finale", contestants: 8, votes: 5580, ends: "18h 30m", organisateur: "Graffiti Collective", hot: true , followers: 16047 , mediaType: "pdf" },
      { id: "a2", title: "Tatouage Expo", edition: "Saison 1", contestants: 20, votes: 7230, ends: "4j 00h", organisateur: "Ink Studio Expo", hot: true , followers: 33918 , mediaType: "photo" },
      { id: "a3", title: "Illustration Duel", edition: "Open Digital", contestants: 40, votes: 2310, ends: "6j 14h", organisateur: "Digital Art Hub", hot: false , followers: 40253 , mediaType: "video" },
      { id: "a4", title: "Photo Street", edition: "Éliminatoires", contestants: 50, votes: 1870, ends: "9j 02h", organisateur: "Street Photo Guild", hot: false , followers: 2539 , mediaType: "text" },
      { id: "a5", title: "Poterie Battle", edition: "Demi-finale", contestants: 6, votes: 3100, ends: "3j 09h", organisateur: "Poterie Atelier", hot: false , followers: 37581 , mediaType: "pdf" },
    ],
  },
  {
    id: "comedy",
    label: "Comédie",
    accent: "#E17055",
    icon: "◉",
    competitions: [
      { id: "c1", title: "Stand-up Open Mic", edition: "Saison 5", contestants: 18, votes: 9870, ends: "1j 20h", organisateur: "Comedy Night Productions", hot: true , followers: 13831 , mediaType: "photo" },
      { id: "c2", title: "Impro Théâtre", edition: "Finale", contestants: 6, votes: 4120, ends: "2j 06h", organisateur: "Théâtre Impro", hot: false , followers: 36513 , mediaType: "video" },
      { id: "c3", title: "Sketch Battle", edition: "Quart de finale", contestants: 12, votes: 3450, ends: "5j 11h", organisateur: "Sketch Crew", hot: false , followers: 28293 , mediaType: "text" },
      { id: "c4", title: "Mime & Clown", edition: "Éliminatoires", contestants: 22, votes: 1230, ends: "7j 18h", organisateur: "Mime Collective", hot: false , followers: 15246 , mediaType: "pdf" },
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    accent: "#00CEC9",
    icon: "▶",
    competitions: [
      { id: "g1", title: "FIFA Masters", edition: "Saison 6", contestants: 32, votes: 14500, ends: "6h 00m", organisateur: "FIFA League Haiti", hot: true , followers: 30239 , mediaType: "photo" },
      { id: "g2", title: "Speedrun Open", edition: "Finale", contestants: 16, votes: 8730, ends: "1j 14h", organisateur: "Speedrun Community", hot: true , followers: 39418 , mediaType: "video" },
      { id: "g3", title: "Card Game Pro", edition: "Quart de finale", contestants: 64, votes: 3210, ends: "4j 02h", organisateur: "Card Masters Guild", hot: false , followers: 19031 , mediaType: "text" },
      { id: "g4", title: "Retro Gaming Cup", edition: "Éliminatoires", contestants: 20, votes: 2890, ends: "6j 08h", organisateur: "Retro Gamers Club", hot: false , followers: 1225 , mediaType: "pdf" },
      { id: "g5", title: "VR Arena", edition: "Demi-finale", contestants: 10, votes: 5670, ends: "2j 22h", organisateur: "VR Arena Pro", hot: false , followers: 11263 , mediaType: "photo" },
    ],
  },
];

const ALL_NICHES = ["Tous", ...NICHES.map((n) => n.label)];

/* ─── WALLET DATA ───────────────────────────────────────────────────────── */

const CREDIT_PACKS = [
  { id: "p1", credits: 100, priceLabel: "2,99 €" },
  { id: "p2", credits: 550, priceLabel: "9,99 €", bonus: "+10%" },
  { id: "p3", credits: 1200, priceLabel: "19,99 €", bonus: "+20%" },
  { id: "p4", credits: 3000, priceLabel: "44,99 €", bonus: "+30%", popular: true },
];

const GIFT_CATALOG = [
  { id: "g1", name: "Applaudissement", icon: "👏", cost: 10 },
  { id: "g2", name: "Étoile", icon: "⭐", cost: 25 },
  { id: "g3", name: "Flamme", icon: "🔥", cost: 50 },
  { id: "g4", name: "Couronne", icon: "👑", cost: 150 },
  { id: "g5", name: "Trophée", icon: "🏆", cost: 300 },
  { id: "g6", name: "Diamant", icon: "💎", cost: 750 },
];

const INITIAL_TRANSACTIONS = [
  { id: "t1", type: "purchase", label: "Achat — Pack 550 crédits", amount: 550, date: "Aujourd'hui, 09:14" },
  { id: "t2", type: "gift_sent", label: "Couronne envoyée — Voix d'Or", amount: -150, date: "Hier, 21:02" },
  { id: "t3", type: "gift_sent", label: "Flamme envoyée — Krump Masters", amount: -50, date: "Hier, 18:47" },
  { id: "t4", type: "purchase", label: "Achat — Pack 100 crédits", amount: 100, date: "12 juin, 14:30" },
  { id: "t5", type: "gift_sent", label: "Étoile envoyée — FIFA Masters", amount: -25, date: "10 juin, 20:15" },
];

const NICHE_ICONS = {
  "Tous": LayoutGrid,
  "Musique": Music,
  "Danse": PersonStanding,
  "Sports": Trophy,
  "Art & Design": Palette,
  "Comédie": Laugh,
  "Gaming": Gamepad2,
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */

function fmtVotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

/* ─── NEWS BAND ─────────────────────────────────────────────────────────── */

const NEWS_ITEMS = [
  "🔥 Battle Hip-Hop Saison 4 entre en demi-finale",
  "🏆 Krump Masters : la finale approche",
  "🎤 Voix d'Or — finale ce soir, votez maintenant",
  "🕹️ FIFA Masters dépasse les 14k votes",
  "🎨 Live Graffiti — derniers votes avant la finale",
];

function NewsBand() {
  return (
    <div
      style={{
        background: "#111",
        borderBottom: "2px solid #111",
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

/* ─── BOTTOM TAB BAR ────────────────────────────────────────────────────── */

const TABS = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "notifications", label: "Notifs", icon: Bell },
  { id: "wallet", label: "Portefeuille", icon: Wallet },
  { id: "account", label: "Compte", icon: User },
];

function BottomTabBar({ active, onChange }) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              padding: "10px 0 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              color: isActive ? "#111" : "#aaa",
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.04em",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── PHASE ROW ─────────────────────────────────────────────────────────── */

function PhaseRow({ edition, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #e8e8e8",
        marginLeft: -14,
        marginRight: -14,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 10,
        marginTop: 10,
      }}
    >
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          color: "#888",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Phase
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: accent,
        }}
      >
        {edition}
      </span>
    </div>
  );
}

/* ─── COMPETITION CARD ──────────────────────────────────────────────────── */

function CompCard({ comp, accent, onOpen }) {
  const [voteCount] = useState(comp.votes);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen?.(comp)}
      style={{
        flexShrink: 0,
        width: 220,
        border: `1px solid #ddd`,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        transform: hovered ? "translate(3px, 3px)" : "translate(0,0)",
        /* Inverted brutalist shadow: top-left */
        boxShadow: hovered
          ? "-4px -4px 0 0 #111"
          : "none",
        userSelect: "none",
      }}
    >
      {/* Banner */}
      <div style={{ height: 90, background: accent, position: "relative", flexShrink: 0 }}>
        {comp.hot && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fff",
              background: "rgba(0,0,0,0.45)",
              padding: "2px 7px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            EN VUE
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 14px 10px", flexGrow: 1 }}>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#333",
            lineHeight: 1.2,
            marginBottom: 10,
            marginLeft: -14,
            marginRight: -14,
            paddingLeft: 14,
            paddingRight: 14,
            paddingBottom: 10,
            borderBottom: "1px solid #e8e8e8",
          }}
        >
          {comp.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: accent,
              color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {comp.organisateur.charAt(0)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              {comp.organisateur}
              <BadgeCheck size={12} strokeWidth={2.5} color={accent} style={{ flexShrink: 0 }} />
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", fontWeight: 500 }}>
              {fmtVotes(comp.followers)} abonnés
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderTop: "1px solid #e8e8e8",
            marginLeft: -14,
            marginRight: -14,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", lineHeight: 1 }}>
              {comp.contestants}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              candidats
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 10 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 500 }}>
              Fin dans
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: comp.hot ? "#c0392b" : "#111", marginTop: 1 }}>
              {comp.ends}
            </div>
          </div>
        </div>

        <PhaseRow edition={comp.edition} accent={accent} />
      </div>

      {/* Footer — opens gift tray */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
        style={{
          border: "none",
          borderTop: `2px solid #111`,
          background: "#111",
          color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Gift size={14} strokeWidth={2.5} />
          Cadeau
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            opacity: 0.75,
          }}
        >
          {fmtVotes(voteCount)}
        </span>
      </button>
    </div>
  );
}

/* ─── PARTICIPANT CARD ──────────────────────────────────────────────────── */

const TEXT_SNIPPETS = [
  "Mon parcours a commencé dans la rue, entre passion et persévérance...",
  "Chaque jour est une nouvelle occasion de repousser mes limites...",
  "Ce que je crée vient du cœur, inspiré par mon quartier et ma famille...",
  "J'ai tout sacrifié pour arriver ici, et je ne compte pas reculer...",
];

function ParticipantCard({ index, mediaType, accent }) {
  const name = `Participant ${index + 1}`;
  const hueShift = (index * 37) % 360;

  return (
    <div style={{ border: "1px solid #e0e0e0", background: "#fff", display: "flex", flexDirection: "column" }}>
      {mediaType === "photo" && (
        <div style={{ aspectRatio: "1 / 1", background: `hsl(${hueShift}, 55%, 65%)` }} />
      )}
      {mediaType === "video" && (
        <div style={{ aspectRatio: "1 / 1", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={16} color="#fff" fill="#fff" />
          </div>
        </div>
      )}
      {mediaType === "text" && (
        <div style={{ aspectRatio: "1 / 1", background: "#f7f7f5", padding: 10, display: "flex", alignItems: "center" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#888", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}>
            {TEXT_SNIPPETS[index % TEXT_SNIPPETS.length]}
          </p>
        </div>
      )}
      {mediaType === "pdf" && (
        <div style={{ aspectRatio: "1 / 1", background: "#f7f7f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <File size={32} color={accent} strokeWidth={1.5} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", fontWeight: 600 }}>Dossier.pdf</span>
        </div>
      )}
      <div style={{ padding: "8px 10px" }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#333", fontWeight: 600 }}>{name}</span>
      </div>
    </div>
  );
}

/* ─── PARTICIPANT LIST OVERLAY ──────────────────────────────────────────── */

function buildParticipants(comp) {
  const list = Array.from({ length: comp.contestants }, (_, i) => {
    const seed = (i * 53 + 17) % 97;
    const votes = Math.round((comp.votes / comp.contestants) * (0.4 + (seed % 60) / 40));
    return {
      index: i,
      name: `Participant ${i + 1}`,
      votes,
      points: Math.round(votes / 10),
    };
  });
  return list.sort((a, b) => b.votes - a.votes);
}

function ParticipantListOverlay({ comp, onClose }) {
  const accent = comp.accent;
  const ranked = buildParticipants(comp);

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
          ←
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#333" }}>
          Classement — {comp.title}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Participant</span>
          <span style={{ width: 90, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Votes</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points</span>
        </div>

        {ranked.map((p, rank) => (
          <div
            key={p.index}
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
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `hsl(${(p.index * 37) % 360}, 55%, 65%)`,
                  flexShrink: 0,
                }}
              />
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

/* ─── COMPETITION BOARD (overlay) ──────────────────────────────────────── */

function CompetitionBoard({ comp, onClose, balance, onSendGift, onOpenBuy }) {
  const [voteCount, setVoteCount] = useState(comp.votes);
  const [voted, setVoted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showGiftBar, setShowGiftBar] = useState(false);
  const accent = comp.accent;


  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#F2F2F0",
        overflowY: "auto",
      }}
    >
      {/* Banner */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "2.2 / 1", background: accent }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            width: 36,
            height: 36,
            border: "1px solid rgba(255,255,255,0.5)",
            background: "rgba(0,0,0,0.3)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          ✕
        </button>
        {comp.hot && (
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#fff",
              background: "rgba(0,0,0,0.45)",
              padding: "4px 9px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            EN VUE
          </div>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 100px" }}>
        {/* Title */}
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 700,
            color: "#333",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 14,
            paddingBottom: 16,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          {comp.title}
        </div>

        {/* Organisateur */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: accent,
              color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {comp.organisateur.charAt(0)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              {comp.organisateur}
              <BadgeCheck size={14} strokeWidth={2.5} color={accent} />
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
              {fmtVotes(comp.followers)} abonnés · {comp.niche}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#333", lineHeight: 1 }}>
              {comp.contestants}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
              candidats
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 16 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#333", lineHeight: 1 }}>
              {fmtVotes(voteCount)}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
              votes
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 16 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: comp.hot ? "#c0392b" : "#333", lineHeight: 1 }}>
              {comp.ends}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>
              fin dans
            </div>
          </div>
        </div>

        {/* Phase */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Phase
          </span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: accent }}>
            {comp.edition}
          </span>
        </div>

        {/* Participants */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: "#888",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Participants ({comp.contestants})
          </span>
          <button
            onClick={() => setShowAll(true)}
            style={{
              border: "none",
              background: "none",
              color: "#333",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: 0,
            }}
          >
            Voir tout
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
            </svg>
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 20,
            scrollbarWidth: "none",
          }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          {Array.from({ length: comp.contestants }, (_, i) => (
            <div key={i} style={{ flexShrink: 0, width: 140 }}>
              <ParticipantCard index={i} mediaType={comp.mediaType} accent={accent} />
            </div>
          ))}
        </div>

        {/* Live votes */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#888",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
            paddingTop: 16,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e74c3c", display: "inline-block" }} />
          Votes en direct
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {Array.from({ length: 6 }, (_, i) => {
            const pIndex = (i * 3 + 1) % comp.contestants;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: i < 5 ? "1px solid #eee" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: `hsl(${(pIndex * 37) % 360}, 55%, 65%)`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", fontWeight: 600 }}>
                    Quelqu'un a voté pour <span style={{ color: accent, fontWeight: 700 }}>Participant {pIndex + 1}</span>
                  </span>
                </div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500, flexShrink: 0, marginLeft: 10 }}>
                  il y a {i === 0 ? "quelques secondes" : `${i * 2} min`}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Gift bar — slides up above footer */}
      {showGiftBar && (
        <div
          style={{
            position: "fixed",
            bottom: 64,
            left: 0,
            right: 0,
            background: "#fff",
            borderTop: "1px solid #e0e0e0",
            zIndex: 1001,
            padding: "12px 12px 4px",
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Envoyer un cadeau
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>
                {balance.toLocaleString("fr-FR")} crédits
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
              <style>{`div::-webkit-scrollbar{display:none}`}</style>
              {GIFT_CATALOG.map((gift) => {
                const affordable = balance >= gift.cost;
                return (
                  <button
                    key={gift.id}
                    onClick={() => {
                      if (!affordable) {
                        onOpenBuy();
                        return;
                      }
                      onSendGift(gift, comp);
                      setVoteCount((v) => v + 1);
                      setVoted(true);
                      setShowGiftBar(false);
                    }}
                    style={{
                      flexShrink: 0,
                      width: 76,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      border: "1px solid #ddd",
                      background: affordable ? "#fff" : "#f7f7f5",
                      padding: "10px 4px",
                      cursor: "pointer",
                      opacity: affordable ? 1 : 0.5,
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{gift.icon}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#333", textAlign: "center" }}>{gift.name}</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: accent }}>{gift.cost}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gift footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #e0e0e0",
          padding: 12,
          zIndex: 1001,
        }}
      >
        <button
          onClick={() => setShowGiftBar((v) => !v)}
          style={{
            width: "100%",
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "none",
            background: showGiftBar ? accent : "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Gift size={16} strokeWidth={2.5} />
            {voted ? "Envoyer un autre cadeau" : "Voter avec un cadeau"}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, opacity: 0.75 }}>
            {fmtVotes(voteCount)}
          </span>
        </button>
      </div>

      {showAll && (
        <ParticipantListOverlay comp={comp} onClose={() => setShowAll(false)} />
      )}
    </div>
  );
}

/* ─── NICHE ROW ─────────────────────────────────────────────────────────── */

function NicheRow({ niche, onOpen }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    const el = railRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function scroll(dir) {
    railRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <section style={{ marginBottom: 0, borderBottom: "2px solid #e0e0e0", paddingBottom: 16 }}>
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
          marginBottom: 16,
        }}
      >
        {(() => { const Icon = NICHE_ICONS[niche.label]; return Icon ? <Icon size={16} strokeWidth={2.5} color={niche.accent} style={{ flexShrink: 0 }} /> : null; })()}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#333",
            letterSpacing: "-0.01em",
          }}
        >
          {niche.label}
        </span>

        <button
          style={{
            marginLeft: "auto",
            border: "none",
            background: "none",
            color: "#333",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: 0,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#333"; }}
        >
          Voir tout
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
          </svg>
        </button>
      </div>

      {/* Horizontal scroll rail */}
      <div
        ref={railRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 4,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {niche.competitions.map((comp) => (
          <CompCard key={comp.id} comp={comp} accent={niche.accent} onOpen={onOpen} />
        ))}

      </div>
    </section>
  );
}

/* ─── WALLET PAGE ───────────────────────────────────────────────────────── */

function BuyCreditsModal({ onClose, onBuy }) {
  const [selected, setSelected] = useState("p2");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "2px solid #111",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Acheter des crédits
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {CREDIT_PACKS.map((pack) => {
            const active = selected === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelected(pack.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: `1px solid ${active ? "#111" : "#ddd"}`,
                  background: active ? "#f7f7f5" : "#fff",
                  padding: "14px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.12s, background 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: `2px solid ${active ? "#111" : "#ccc"}`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {active && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#111" }} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#333" }}>
                      {pack.credits.toLocaleString("fr-FR")} crédits
                    </span>
                    {pack.bonus && (
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#00B894", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Bonus {pack.bonus}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {pack.popular && (
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: "#6C63FF", padding: "3px 7px" }}>
                      Populaire
                    </span>
                  )}
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#333" }}>
                    {pack.priceLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 16 }}>
          Les crédits n'ont aucune valeur monétaire et ne sont ni remboursables ni transférables. Paiement sécurisé via Stripe.
        </div>

        <button
          onClick={() => {
            const pack = CREDIT_PACKS.find((p) => p.id === selected);
            onBuy(pack);
          }}
          style={{
            width: "100%",
            border: "none",
            background: "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <ShoppingCart size={16} strokeWidth={2.5} />
          Acheter — {CREDIT_PACKS.find((p) => p.id === selected)?.priceLabel}
        </button>
      </div>
    </div>
  );
}

function GiftModal({ balance, onClose, onSend }) {
  const [selected, setSelected] = useState(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "2px solid #111",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Envoyer un cadeau
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {GIFT_CATALOG.map((gift) => {
            const active = selected === gift.id;
            const affordable = balance >= gift.cost;
            return (
              <button
                key={gift.id}
                disabled={!affordable}
                onClick={() => setSelected(gift.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  border: `1px solid ${active ? "#111" : "#ddd"}`,
                  background: active ? "#f7f7f5" : "#fff",
                  padding: "14px 8px",
                  cursor: affordable ? "pointer" : "not-allowed",
                  opacity: affordable ? 1 : 0.4,
                  transition: "border-color 0.12s, background 0.12s",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{gift.icon}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#333" }}>{gift.name}</span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: "#888" }}>{gift.cost}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 16 }}>
          Choisissez une compétition depuis l'accueil pour envoyer ce cadeau à un participant.
        </div>

        <button
          disabled={!selected}
          onClick={() => {
            const gift = GIFT_CATALOG.find((g) => g.id === selected);
            onSend(gift);
          }}
          style={{
            width: "100%",
            border: "none",
            background: selected ? "#111" : "#ddd",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: selected ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Gift size={16} strokeWidth={2.5} />
          Envoyer{selected ? ` — ${GIFT_CATALOG.find((g) => g.id === selected)?.cost} crédits` : ""}
        </button>
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const isCredit = tx.amount > 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          border: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isCredit ? "#f0fbf7" : "#f7f7f5",
        }}
      >
        {isCredit ? (
          <ArrowDownLeft size={15} color="#00B894" strokeWidth={2.5} />
        ) : (
          <ArrowUpRight size={15} color="#888" strokeWidth={2.5} />
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333" }}>{tx.label}</span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>{tx.date}</span>
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: isCredit ? "#00B894" : "#333",
          flexShrink: 0,
        }}
      >
        {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

function WalletPage({ balance, transactions, onOpenBuy, onOpenGift, showToast }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 16px",
        }}
      >
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
          Portefeuille
        </span>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Balance card */}
        <div
          style={{
            border: "2px solid #111",
            background: "#111",
            color: "#fff",
            padding: 20,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 10,
            }}
          >
            Solde disponible
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {balance.toLocaleString("fr-FR")}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
              crédits
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onOpenBuy}
              style={{
                flex: 1,
                border: "1px solid #fff",
                background: "#fff",
                color: "#111",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "12px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Acheter
            </button>
            <button
              onClick={onOpenGift}
              style={{
                flex: 1,
                border: "1px solid rgba(255,255,255,0.4)",
                background: "transparent",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "12px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Gift size={14} strokeWidth={2.5} />
              Envoyer un cadeau
            </button>
          </div>
        </div>

        {/* Info note */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "12px 14px",
            marginBottom: 24,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#aaa",
            lineHeight: 1.5,
          }}
        >
          Les crédits sont utilisés pour envoyer des cadeaux aux participants. Ils n'ont aucune valeur monétaire et ne peuvent pas être convertis en argent réel.
        </div>

        {/* Transaction history */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#888",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          Historique
        </div>
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px", color: "#aaa", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



const BANNER_SLIDES = NICHES.flatMap((niche) =>
  niche.competitions
    .filter((c) => c.hot)
    .map((c) => ({ ...c, niche, color: niche.accent }))
).slice(0, 6);

export default function App() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedComp, setSelectedComp] = useState(null);
  const [balance, setBalance] = useState(425);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const nichesByFilter =
    activeFilter === "Tous"
      ? NICHES
      : NICHES.filter((n) => n.label === activeFilter);

  const visibleNiches = query.trim() === ""
    ? nichesByFilter
    : nichesByFilter
        .map((niche) => ({
          ...niche,
          competitions: niche.competitions.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()) ||
            c.edition.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((niche) => niche.competitions.length > 0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleBuyCredits(pack) {
    setBalance((b) => b + pack.credits);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "purchase", label: `Achat — Pack ${pack.credits.toLocaleString("fr-FR")} crédits`, amount: pack.credits, date: "À l'instant" },
      ...tx,
    ]);
    setShowBuyModal(false);
    showToast(`${pack.credits.toLocaleString("fr-FR")} crédits ajoutés`);
  }

  function handleSendGift(gift, comp) {
    if (balance < gift.cost) {
      showToast("Crédits insuffisants");
      return;
    }
    setBalance((b) => b - gift.cost);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "gift_sent", label: comp ? `${gift.name} envoyé — ${comp.title}` : `${gift.name} envoyé`, amount: -gift.cost, date: "À l'instant" },
      ...tx,
    ]);
    setShowGiftModal(false);
    showToast(comp ? `Vote enregistré — ${gift.icon} ${gift.name}` : `${gift.icon} ${gift.name} envoyé`);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F2F2F0; }
        @keyframes toast-up {
          0%   { opacity: 0; transform: translateX(-50%) translateY(12px); }
          12%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            zIndex: 9999,
            background: "#444",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.04em",
            padding: "10px 22px",
            border: "1px solid #ddd",
            animation: "toast-up 2.5s ease forwards",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {activeTab === "wallet" ? (
        <WalletPage
          balance={balance}
          transactions={transactions}
          onOpenBuy={() => setShowBuyModal(true)}
          onOpenGift={() => setShowGiftModal(true)}
          showToast={showToast}
        />
      ) : (
      <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 64 }}>

        {/* ── HEADER ── */}
        <header
          style={{
            borderBottom: "1px solid #e0e0e0",
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Search bar */}
          <div style={{ padding: "8px 8px 0" }}>
            <div style={{ width: "100%", display: "flex", alignItems: "center", border: "1px solid #ccc", background: "#f9f9f9", height: 32 }}>
              <input
                type="text"
                placeholder="Rechercher une compétition..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#333",
                  background: "transparent",
                  padding: "0 8px 0 10px",
                  height: "100%",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{ border: "none", background: "none", cursor: "pointer", padding: "0 10px", fontSize: 14, color: "#aaa", lineHeight: 1, flexShrink: 0 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Chips row — edge to edge */}
          <div style={{ display: "flex", gap: 6, padding: "8px 8px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
            {ALL_NICHES.map((label) => {
              const active = activeFilter === label;
              const niche = NICHES.find((n) => n.label === label);
              return (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: active ? "#fff" : "#666",
                    background: active ? "#444" : "#f0f0f0",
                    border: "1px solid #ccc",
                    padding: "7px 14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.12s, color 0.12s",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {(() => { const Icon = NICHE_ICONS[label]; return Icon ? <Icon size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} /> : null; })()}
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── BANNER SLIDER (2:1, images only) ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "2.2 / 1",
            overflow: "hidden",
            borderBottom: "2px solid #111",
          }}
        >
          {BANNER_SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: slide.color,
                opacity: i === bannerIndex ? 1 : 0,
                transition: "opacity 0.8s ease",
              }}
            />
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
            {BANNER_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIndex(i)}
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

        <NewsBand />




        {/* ── NICHE ROWS ── */}
        <main
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            paddingTop: 36,
            paddingBottom: 60,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {visibleNiches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 8px", borderTop: "1px solid #ddd", background: "#fff" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#333", letterSpacing: "-0.02em" }}>Aucun résultat</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", marginTop: 8 }}>Aucune compétition ne correspond à « {query} »</div>
              <button onClick={() => setQuery("")} style={{ marginTop: 20, border: "1px solid #ddd", background: "#444", color: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer" }}>Effacer la recherche</button>
            </div>
          ) : visibleNiches.map((niche) => (
            <NicheRow
              key={niche.id}
              niche={niche}
              onOpen={(comp) => setSelectedComp({ ...comp, accent: niche.accent, niche: niche.label })}
            />
          ))}
        </main>

        {/* ── FOOTER ── */}
        <footer
          style={{
            borderTop: "1px solid #ddd",
            background: "#fff",
            padding: "20px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#333", letterSpacing: "-0.01em" }}>
            VOTEX
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", letterSpacing: "0.04em" }}>
            Résultats mis à jour en temps réel · Données de démonstration
          </span>
        </footer>
      </div>
      )}

      {showBuyModal && (
        <BuyCreditsModal onClose={() => setShowBuyModal(false)} onBuy={handleBuyCredits} />
      )}
      {showGiftModal && (
        <GiftModal balance={balance} onClose={() => setShowGiftModal(false)} onSend={handleSendGift} />
      )}

      <BottomTabBar active={activeTab} onChange={setActiveTab} />

      {selectedComp && (
        <CompetitionBoard
          comp={selectedComp}
          onClose={() => setSelectedComp(null)}
          balance={balance}
          onSendGift={handleSendGift}
          onOpenBuy={() => setShowBuyModal(true)}
        />
      )}
    </>
  );
}
