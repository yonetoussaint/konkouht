import { useState, useRef, useEffect, useMemo } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { Audio as AudioBarsLoader } from "react-loader-spinner";
import { supabase, fetchRegistrations, insertRegistration, fetchUserRegistrations, fetchAllRegistrationCounts, fetchComments, insertComment, fetchCompetitionEdits, saveCompetitionEdit, fetchAllCompetitionImages, addCompetitionImage, deleteCompetitionImage } from "./lib/competitionData";
import { Music, PersonStanding, Trophy, Palette, Laugh, Gamepad2, LayoutGrid, Home, Wallet, User, Users, Bell, BadgeCheck, Play, File, Plus, Gift, ArrowDownLeft, ArrowUpRight, ShoppingCart, X, Check, Sparkles, ChevronsUp, ArrowLeft, Send, ChevronRight, ChevronLeft, Copy, CreditCard, HelpCircle, Search, Menu, MessageCircle, Image as ImageIcon, Mail, Lock, Eye, EyeOff, Heart, Share2, Sticker, Info, Volume2, VolumeX, Radio, Mic, MicOff, Hand, Clock, Flame } from "lucide-react";

/* ─── DATA ─────────────────────────────────────────────────────────────── */

// FNCH ("Fédération Nationale des Concours d'Haïti") is the platform's own
// organizing body — every competition on the app is run under this sigle,
// and this account is auto-recognized as its verified organizer.
const PLATFORM_ORGANIZER_EMAIL = "yonetoussaint25@gmail.com";
const PLATFORM_ORGANIZER_SIGLE = "FNCH";

const NICHES = [
  {
    id: "music",
    label: "Musique",
    accent: "#6C63FF",
    icon: "♪",
    competitions: [
      { id: "m1", title: "Battle Hip-Hop", edition: "Saison 4", phase: "live", contestants: 12, votes: 4820, ends: "2j 14h", organisateur: "FNCH", hot: true , followers: 8096 , mediaType: "photo", registeredCount: 12 },
      { id: "m2", title: "Voix d'Or", edition: "Finale", phase: "live", contestants: 8, votes: 9310, ends: "6h 22m", organisateur: "FNCH", hot: true , followers: 2439 , mediaType: "video", registeredCount: 8 },
      { id: "m3", title: "Guitar Shred", edition: "Quart de finale", phase: "live", contestants: 16, votes: 2140, ends: "4j 02h", organisateur: "FNCH", hot: false , followers: 18824 , mediaType: "text", registeredCount: 16 },
      { id: "m4", title: "DJ Set Open", edition: "Éliminatoires", phase: "registration", contestants: 24, votes: 0, ends: "3j 18h", organisateur: "FNCH", hot: false , followers: 16849 , mediaType: "pdf", registeredCount: 7 },
      { id: "m5", title: "Slam Poétique", edition: "Demi-finale", phase: "live", contestants: 6, votes: 3450, ends: "1j 08h", organisateur: "FNCH", hot: true , followers: 15428 , mediaType: "photo", registeredCount: 6 },
    ],
  },
  {
    id: "dance",
    label: "Danse",
    accent: "#FF4D6D",
    icon: "◈",
    competitions: [
      { id: "d1", title: "Krump Masters", edition: "Finale", phase: "live", contestants: 10, votes: 7640, ends: "3j 05h", organisateur: "FNCH", hot: true , followers: 9944 , mediaType: "video", registeredCount: 10 },
      { id: "d2", title: "Afrobeats Cup", edition: "Saison 2", phase: "registration", contestants: 20, votes: 0, ends: "4j 11h", organisateur: "FNCH", hot: false , followers: 7517 , mediaType: "text", registeredCount: 5 },
      { id: "d3", title: "Ballet Urbain", edition: "Demi-finale", phase: "live", contestants: 8, votes: 3810, ends: "2j 19h", organisateur: "FNCH", hot: false , followers: 36541 , mediaType: "pdf", registeredCount: 8 },
      { id: "d4", title: "Breakdance WC", edition: "Quart de finale", phase: "live", contestants: 32, votes: 11200, ends: "1j 02h", organisateur: "FNCH", hot: true , followers: 6497 , mediaType: "photo", registeredCount: 32 },
      { id: "d5", title: "Zumba Battle", edition: "Éliminatoires", phase: "registration", contestants: 18, votes: 0, ends: "6j 00h", organisateur: "FNCH", hot: false , followers: 39498 , mediaType: "video", registeredCount: 3 },
    ],
  },
  {
    id: "sports",
    label: "Sports",
    accent: "#00B894",
    icon: "▲",
    competitions: [
      { id: "s1", title: "Freestyle Football", edition: "Finale Nationale", phase: "live", contestants: 14, votes: 6540, ends: "12h 00m", organisateur: "FNCH", hot: true , followers: 28451 , mediaType: "text", registeredCount: 14 },
      { id: "s2", title: "Arm Wrestling Pro", edition: "Open", phase: "registration", contestants: 28, votes: 0, ends: "3j 07h", organisateur: "FNCH", hot: false , followers: 2882 , mediaType: "pdf", registeredCount: 9 },
      { id: "s3", title: "Parkour Challenge", edition: "Saison 3", phase: "live", contestants: 10, votes: 8900, ends: "2j 16h", organisateur: "FNCH", hot: true , followers: 2752 , mediaType: "photo", registeredCount: 10 },
      { id: "s4", title: "Chess Blitz", edition: "Quart de finale", phase: "live", contestants: 64, votes: 4410, ends: "3j 22h", organisateur: "FNCH", hot: false , followers: 6940 , mediaType: "video", registeredCount: 64 },
      { id: "s5", title: "Natation Style", edition: "Demi-finale", phase: "registration", contestants: 16, votes: 0, ends: "5j 03h", organisateur: "FNCH", hot: false , followers: 15128 , mediaType: "text", registeredCount: 4 },
    ],
  },
  {
    id: "art",
    label: "Art & Design",
    accent: "#FDCB6E",
    icon: "□",
    competitions: [
      { id: "a1", title: "Live Graffiti", edition: "Finale", phase: "live", contestants: 8, votes: 5580, ends: "18h 30m", organisateur: "FNCH", hot: true , followers: 16047 , mediaType: "pdf", registeredCount: 8 },
      { id: "a2", title: "Tatouage Expo", edition: "Saison 1", phase: "live", contestants: 20, votes: 7230, ends: "4j 00h", organisateur: "FNCH", hot: true , followers: 33918 , mediaType: "photo", registeredCount: 20 },
      { id: "a3", title: "Illustration Duel", edition: "Open Digital", phase: "registration", contestants: 40, votes: 0, ends: "4j 14h", organisateur: "FNCH", hot: false , followers: 40253 , mediaType: "video", registeredCount: 12 },
      { id: "a4", title: "Photo Street", edition: "Éliminatoires", phase: "registration", contestants: 50, votes: 0, ends: "7j 02h", organisateur: "FNCH", hot: false , followers: 2539 , mediaType: "text", registeredCount: 15 },
      { id: "a5", title: "Poterie Battle", edition: "Demi-finale", phase: "live", contestants: 6, votes: 3100, ends: "3j 09h", organisateur: "FNCH", hot: false , followers: 37581 , mediaType: "pdf", registeredCount: 6 },
    ],
  },
  {
    id: "comedy",
    label: "Comédie",
    accent: "#E17055",
    icon: "◉",
    competitions: [
      { id: "c1", title: "Stand-up Open Mic", edition: "Saison 5", phase: "live", contestants: 18, votes: 9870, ends: "1j 20h", organisateur: "FNCH", hot: true , followers: 13831 , mediaType: "photo", registeredCount: 18 },
      { id: "c2", title: "Impro Théâtre", edition: "Finale", phase: "registration", contestants: 6, votes: 0, ends: "12h 06h", organisateur: "FNCH", hot: false , followers: 36513 , mediaType: "video", registeredCount: 2 },
      { id: "c3", title: "Sketch Battle", edition: "Quart de finale", phase: "live", contestants: 12, votes: 3450, ends: "5j 11h", organisateur: "FNCH", hot: false , followers: 28293 , mediaType: "text", registeredCount: 12 },
      { id: "c4", title: "Mime & Clown", edition: "Éliminatoires", phase: "registration", contestants: 22, votes: 0, ends: "5j 18h", organisateur: "FNCH", hot: false , followers: 15246 , mediaType: "pdf", registeredCount: 6 },
    ],
  },
  {
    id: "beaute",
    label: "Beauté",
    accent: "#E91E8C",
    icon: "✦",
    competitions: [
      { id: "b1", title: "Concours de Beauté", edition: "Saison 1", phase: "live", contestants: 12, votes: 6240, ends: "2j 08h", organisateur: "FNCH", hot: true, followers: 22450, mediaType: "photo", registeredCount: 12 },
      { id: "b2", title: "Miss Élégance", edition: "Demi-finale", phase: "live", contestants: 8, votes: 4810, ends: "1j 12h", organisateur: "FNCH", hot: true, followers: 18300, mediaType: "photo", registeredCount: 8 },
      { id: "b3", title: "Top Model Open", edition: "Éliminatoires", phase: "registration", contestants: 20, votes: 0, ends: "5j 00h", organisateur: "FNCH", hot: false, followers: 9120, mediaType: "photo", registeredCount: 7 },
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    accent: "#00CEC9",
    icon: "▶",
    competitions: [
      { id: "g1", title: "FIFA Masters", edition: "Saison 6", phase: "live", contestants: 32, votes: 14500, ends: "6h 00m", organisateur: "FNCH", hot: true , followers: 30239 , mediaType: "photo", registeredCount: 32 },
      { id: "g2", title: "Speedrun Open", edition: "Finale", phase: "live", contestants: 16, votes: 8730, ends: "1j 14h", organisateur: "FNCH", hot: true , followers: 39418 , mediaType: "video", registeredCount: 16 },
      { id: "g3", title: "Card Game Pro", edition: "Quart de finale", phase: "registration", contestants: 64, votes: 0, ends: "2j 02h", organisateur: "FNCH", hot: false , followers: 19031 , mediaType: "text", registeredCount: 20 },
      { id: "g4", title: "Retro Gaming Cup", edition: "Éliminatoires", phase: "registration", contestants: 20, votes: 0, ends: "4j 08h", organisateur: "FNCH", hot: false , followers: 1225 , mediaType: "pdf", registeredCount: 8 },
      { id: "g5", title: "VR Arena", edition: "Demi-finale", phase: "live", contestants: 10, votes: 5670, ends: "2j 22h", organisateur: "FNCH", hot: false , followers: 11263 , mediaType: "photo", registeredCount: 10 },
    ],
  },
];

const ALL_NICHES = ["Tous", ...NICHES.map((n) => n.label)];

/* ─── WALLET DATA ───────────────────────────────────────────────────────── */

const DEPOSIT_PACKS = [
  { id: "p1", amount: 500 },
  { id: "p2", amount: 2500 },
  { id: "p3", amount: 5000, popular: true },
  { id: "p4", amount: 10000 },
];

const MOBILE_MONEY_NUMBERS = {
  moncash: { number: "+509 34 XX XX XX", name: "Jean Baptiste" },
  natcash: { number: "+509 37 XX XX XX", name: "Jean Baptiste" },
};

const PAYMENT_METHODS = [
  { id: "moncash", label: "MonCash", accent: "#F26522" },
  { id: "natcash", label: "NatCash", accent: "#0072CE" },
  { id: "card", label: "Carte bancaire", accent: "#111111" },
];

// Turns an emoji character into a Google Noto "Animated Emoji" Lottie URL.
// Google hosts a Lottie JSON per emoji at this CDN path, keyed by the
// emoji's Unicode codepoint(s) joined with "_" (variation selector FE0F is
// dropped from the filename).
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

const INITIAL_TRANSACTIONS = [
  { id: "t1", type: "deposit", label: "Dépôt — MonCash", amount: 550, date: "Aujourd'hui, 09:14" },
  { id: "t2", type: "gift_sent", label: "Couronne envoyée — Voix d'Or", amount: -150, date: "Hier, 21:02" },
  { id: "t3", type: "gift_sent", label: "Flamme envoyée — Krump Masters", amount: -50, date: "Hier, 18:47" },
  { id: "t4", type: "withdrawal", label: "Retrait — NatCash", amount: -200, date: "13 juin, 17:05" },
  { id: "t5", type: "deposit", label: "Dépôt — Carte bancaire", amount: 100, date: "12 juin, 14:30" },
  { id: "t6", type: "gift_sent", label: "Étoile envoyée — FIFA Masters", amount: -25, date: "10 juin, 20:15" },
];


const NICHE_ICONS = {
  "Tous": LayoutGrid,
  "Musique": Music,
  "Danse": PersonStanding,
  "Sports": Trophy,
  "Art & Design": Palette,
  "Comédie": Laugh,
  "Beauté": Sparkles,
  "Gaming": Gamepad2,
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */

function fmtVotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

function findCompWithNiche(compId) {
  for (const niche of NICHES) {
    const comp = niche.competitions.find((c) => c.id === compId);
    if (comp) return { comp, niche };
  }
  return null;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Mock chroniqueurs sportifs for the live audio commentary band. Deterministic
// per-competition pick via hashStr so the same competition always shows the
// same commentator. Replace/extend once real hosts are onboarded.
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
function getRegistrationFee(comp) {
  return comp.fee != null ? comp.fee : 50 + (Math.abs(hashStr(comp.id)) % 5) * 25;
}

// Compact French-style formatting for coin/point totals: 1 200 -> "1,2k",
// 3 400 000 -> "3,4M". Small numbers stay exact with fr-FR thousands
// separators so the leaderboard doesn't feel abbreviated for no reason.
function formatCoins(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) {
    return (n / 1000000).toFixed(1).replace(".", ",").replace(",0", "") + "M";
  }
  if (abs >= 1000) {
    return (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k";
  }
  return n.toLocaleString("fr-FR");
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
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
  { id: "mycomps", label: "Mes compets", icon: BadgeCheck },
  { id: "wallet", label: "Portefeuille", icon: Wallet },
  { id: "notifications", label: "Notifs", icon: Bell },
  { id: "account", label: "Compte", icon: User },
];

function BottomTabBar({ active, onChange, unreadCount }) {
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
        const showBadge = tab.id === "notifications" && unreadCount > 0;
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
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {showBadge && (
                <div style={{
                  position: "absolute", top: -4, right: -6,
                  minWidth: 14, height: 14, borderRadius: "50%",
                  background: "#e74c3c", color: "#fff",
                  fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #fff",
                  padding: "0 3px",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
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

function CompCard({ comp, accent, onOpen, onRegister, isRegistered, isOwnCompetition }) {
  const [voteCount] = useState(comp.votes);
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(comp.followers);
  const isRegistration = comp.phase === "registration";

  return (
    <div
      onClick={() => onOpen?.(comp)}
      style={{
        flexShrink: 0,
        width: 220,
        border: `1px solid #eee`,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Banner */}
      <div style={{ height: 110, position: "relative", flexShrink: 0, overflow: "hidden", background: "#eee" }}>
        {(comp.bannerUrl || comp.images?.[0]?.url) ? (
          <img
            src={comp.bannerUrl || comp.images[0].url}
            alt={comp.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={26} color="#ccc" />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: `${accent}66`,
          mixBlendMode: "multiply",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
        }} />
        {comp.hot && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#fff",
            background: "rgba(0,0,0,0.45)", padding: "2px 8px",
            fontFamily: "Inter, sans-serif",
            borderRadius: 8,
          }}>
            EN VUE
          </div>
        )}
        {isRegistration && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#fff",
            background: "#6C63FF", padding: "3px 8px",
            fontFamily: "Inter, sans-serif",
            borderRadius: 8,
          }}>
            Inscriptions
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
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.organisateur}</span>
              <BadgeCheck size={12} strokeWidth={2.5} color={accent} style={{ flexShrink: 0 }} />
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", fontWeight: 500 }}>
              {fmtVotes(followerCount)} abonnés
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFollowed((f) => !f);
              setFollowerCount((c) => followed ? c - 1 : c + 1);
            }}
            style={{
              flexShrink: 0,
              border: followed ? `1px solid ${accent}` : "1px solid #ddd",
              background: followed ? accent : "transparent",
              color: followed ? "#fff" : "#666",
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 7px",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 3,
              lineHeight: 1.4,
            }}
          >
            {followed ? (
              <>
                <Check size={9} strokeWidth={3} />
                Abonné
              </>
            ) : (
              "+ Suivre"
            )}
          </button>
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
              {isRegistration ? comp.registeredCount : comp.contestants}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              {isRegistration ? "inscrits" : "candidats"}
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

      {/* Footer — voting or registration */}
      {isRegistration ? (
        isOwnCompetition ? (
          <div
            style={{
              border: "none",
              background: "#f2f2f2",
              color: "#999",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "11px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <BadgeCheck size={14} strokeWidth={2.5} />
            Votre compétition
          </div>
        ) : isRegistered ? (
          <div
            style={{
              border: "none",
              borderTop: `2px solid #00B894`,
              background: "#e8f8f3",
              color: "#00875A",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "11px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} strokeWidth={2.5} />
              Inscrit
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
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
            borderTop: `2px solid #6C63FF`,
            background: "#6C63FF",
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
            <Plus size={14} strokeWidth={2.5} />
            S'inscrire
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {comp.registeredCount}/{comp.contestants}
          </span>
        </button>
        )
      ) : (
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
      )}
    </div>
  );
}

/* ─── SKELETON CARD (feature 1) ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 220, border: "1px solid #ddd", background: "#fff" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; }
      `}</style>
      <div className="sk" style={{ height: 110 }} />
      <div style={{ padding: "14px 14px 10px" }}>
        <div className="sk" style={{ height: 16, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div className="sk" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 10, marginBottom: 4 }} />
            <div className="sk" style={{ height: 9, width: "60%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e8e8e8", paddingTop: 10 }}>
          <div style={{ flex: 1 }}><div className="sk" style={{ height: 18, marginBottom: 4 }} /><div className="sk" style={{ height: 9 }} /></div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 10 }}><div className="sk" style={{ height: 11, marginBottom: 4 }} /><div className="sk" style={{ height: 13 }} /></div>
        </div>
      </div>
      <div className="sk" style={{ height: 40 }} />
    </div>
  );
}

const picsumImg = (seed, w = 300, h = 300) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const avatarImg = (index) => picsumImg(`person${index}`, 80, 80);

function getUnsplashId(compId) {
  const ids = {
    m1: "1511671783979-2f3a7af261b3",
    m2: "1459749411615-3ae9b1d1b8ef",
    m3: "1471083922566-3b1d2c4b7e8f",
    d1: "1534432581666-6f4b3c5e7d8f",
    s1: "1574629811986-6c5e1f2c3d4e",
    a1: "1499788393439-5c5d5f6e7f8f",
    c1: "1528607284783-4c4e6f7d8e9f",
    g1: "1511512578047-09c8d2d8e9f0",
  };
  return ids[compId] || "1511671783979-2f3a7af261b3";
}

const heroBannerImg = (compId) =>
  `https://images.unsplash.com/photo-${getUnsplashId(compId)}?w=800&h=340&fit=crop`;

/* ─── PARTICIPANT CARD ──────────────────────────────────────────────────── */

const TEXT_SNIPPETS = [
  "Mon parcours a commencé dans la rue, entre passion et persévérance...",
  "Chaque jour est une nouvelle occasion de repousser mes limites...",
  "Ce que je crée vient du cœur, inspiré par mon quartier et ma famille...",
  "J'ai tout sacrifié pour arriver ici, et je ne compte pas reculer...",
];

// "Why I'm competing" mock stories — shown inside AlbumSheet so a donor
// understands the person behind the gift, not just a media gallery. Cycled
// by participant index like TEXT_SNIPPETS; swap for a real per-participant
// field (e.g. registrations.motivation) once wired to Supabase.
const WHY_STORIES = [
  "Je viens d'une famille de neuf enfants et j'ai appris très jeune à me battre pour ce que je veux. Ce concours, c'est ma chance de montrer que le talent n'attend pas les moyens.",
  "Après un accident qui m'a presque empêché de continuer, je me suis promis de remonter sur scène. Chaque vote ici, c'est un pas de plus vers cette promesse.",
  "Mon quartier ne m'a jamais vu comme quelqu'un d'ordinaire, et je veux le prouver au pays entier. Je porte leurs couleurs à chaque prestation.",
  "J'ai quitté l'école pour aider ma mère, mais jamais j'ai arrêté de m'entraîner le soir. Ce concours est la première vraie porte qu'on m'ouvre.",
  "Je fais ça pour mon fils, pour qu'il grandisse en voyant que persévérer paie toujours, même quand tout semble contre nous.",
  "Trois ans à économiser pour du matériel correct, deux ans à me faire refuser partout. Je suis enfin là où je devrais être depuis le début.",
];

function getWhyStory(index) {
  return WHY_STORIES[index % WHY_STORIES.length];
}

function ParticipantCard({ index, mediaType, accent, votes }) {
  const name = fakeName(index);
  const imgSeed = `part_${index}`;

  if (mediaType === "photo") {
    const photoCount = 3 + (index * 7 + 11) % 10; // 3–12 photos per participant
    return (
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "1 / 1", background: "#111" }}>
        {/* Square photo */}
        <img
          src={picsumImg(`beauty_${index}`, 300, 300)}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }} />
        {/* Photo count badge — top right */}
        <div style={{
          position: "absolute", top: 7, right: 7,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          fontSize: 10, fontWeight: 700,
          padding: "3px 7px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><rect x="3" y="3" width="18" height="18" rx="0"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>
          {photoCount}
        </div>
        {/* Participant avatar — bottom left above name */}
        <div style={{
          position: "absolute", bottom: 28, left: 9,
          width: 28, height: 28, borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}>
          <img src={avatarImg(index)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        {/* Name + chevron at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "5px 9px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="square"><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/></svg>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #e0e0e0", background: "#fff", display: "flex", flexDirection: "column" }}>
      {mediaType === "video" && (
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", position: "relative" }}>
          <img
            src={picsumImg(`vid_${index}`, 240, 240)}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.6)" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.4)" }}>
              <Play size={14} color="#fff" fill="#fff" />
            </div>
          </div>
        </div>
      )}
      {mediaType === "text" && (
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", position: "relative" }}>
          <img
            src={picsumImg(`txt_${index}`, 240, 240)}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.4)" }}
          />
          <div style={{
            position: "absolute", inset: 0, padding: 10,
            display: "flex", alignItems: "center",
          }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", margin: 0 }}>
              {TEXT_SNIPPETS[index % TEXT_SNIPPETS.length]}
            </p>
          </div>
        </div>
      )}
      {mediaType === "pdf" && (
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", position: "relative" }}>
          <img
            src={picsumImg(`doc_${index}`, 240, 240)}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.3) saturate(0.4)" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <File size={28} color="#fff" strokeWidth={1.5} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Dossier.pdf</span>
          </div>
        </div>
      )}
      <div style={{ padding: "8px 10px" }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#333", fontWeight: 600 }}>{name}</span>
      </div>
    </div>
  );
}

/* ─── FAKE NAME POOL ────────────────────────────────────────────────────── */

const FAKE_FIRST = [
  "Marie", "Jean", "Claudine", "Pierre", "Roseline", "Widlène", "Édouard",
  "Fabiola", "Kévin", "Nadège", "Josué", "Mirlande", "Christophe", "Yanick",
  "Lovely", "Réginald", "Sabrina", "Frantz", "Guerlande", "Olivier",
  "Stéphanie", "Duckens", "Nathalie", "Carline", "Jude", "Ketsia",
  "Wilner", "Sophonie", "Berlange", "Alix",
];
const FAKE_LAST_INIT = "ABCDEFGHJKLMNPRSTW";

function fakeName(index) {
  const first = FAKE_FIRST[index % FAKE_FIRST.length];
  const lastInit = FAKE_LAST_INIT[(index * 7 + 3) % FAKE_LAST_INIT.length];
  return `${first} ${lastInit}.`;
}

/* ─── PARTICIPANT LIST OVERLAY ──────────────────────────────────────────── */

function buildParticipants(comp) {
  const list = Array.from({ length: comp.contestants }, (_, i) => {
    const seed = (i * 53 + 17) % 97;
    const votes = Math.round((comp.votes / comp.contestants) * (0.4 + (seed % 60) / 40));
    return {
      index: i,
      name: fakeName(i),
      votes,
      points: Math.round(votes / 10),
    };
  });
  return list.sort((a, b) => b.votes - a.votes);
}

// Builds the real, database-backed participant/classement list out of the
// actual rows in `registrations` for this competition — no fake names, no
// invented head-count. Vote totals aren't tracked in the DB yet, so they're
// still distributed deterministically over `comp.votes`, but every entry
// corresponds to a real registrant (id + name straight from Supabase).
function buildParticipantsFromRegistrants(registrants, comp) {
  if (!registrants || registrants.length === 0) return [];
  const list = registrants.map((r, i) => {
    const seed = (i * 53 + 17) % 97;
    const votes = Math.round((comp.votes / registrants.length) * (0.4 + (seed % 60) / 40));
    return {
      index: i,
      id: r.id,
      name: r.name || r.full_name || fakeName(i),
      votes,
      points: Math.round(votes / 10),
    };
  });
  return list.sort((a, b) => b.votes - a.votes);
}

const COMMENT_SNIPPETS = [
  "Bonne chance à tous les participants! 🔥",
  "C'est qui le favori cette saison?",
  "J'ai voté pour mon préféré, allez!",
  "Quand est-ce que les résultats sortent?",
  "Niveau impressionnant cette année.",
  "Vivement la finale 👏",
  "Quelqu'un sait combien de tours il reste?",
  "Je suis ici depuis la saison 1, toujours au top.",
  "Ça va être serré jusqu'au bout.",
  "Respect à l'organisateur pour la qualité de l'événement.",
];

const REPLY_SNIPPETS = [
  "Totalement d'accord avec toi!",
  "Moi aussi j'ai hâte 🙌",
  "Les résultats sortent vendredi je crois",
  "Tu as voté pour qui?",
  "Même avis, c'est du bon niveau.",
  "Ouais la finale va être 🔥",
  "Normalement 3 tours encore",
  "Pareil, fidèle depuis le début!",
  "Exactement, ça va chauffer.",
  "L'orga fait vraiment du bon boulot.",
];

function buildComments(comp) {
  const count = 3 + (Math.abs(hashStr(comp.id)) % 6);
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 41 + 19) % 53;
    const minutesAgo = 4 + (seed % 240);
    const replyCount = (i * 7 + seed) % 3; // 0–2 replies per comment
    return {
      id: `seed-${comp.id}-${i}`,
      index: 12 + i,
      name: fakeName(12 + i),
      text: COMMENT_SNIPPETS[(i * 3 + seed) % COMMENT_SNIPPETS.length],
      minutesAgo,
      likes: seed % 14,
      replies: Array.from({ length: replyCount }, (_, j) => ({
        id: `reply-${comp.id}-${i}-${j}`,
        index: 20 + i + j,
        name: fakeName(20 + i + j),
        text: REPLY_SNIPPETS[(i + j * 3 + seed) % REPLY_SNIPPETS.length],
        minutesAgo: Math.max(1, minutesAgo - 10 - j * 5),
        likes: (j + seed) % 6,
      })),
    };
  }).sort((a, b) => a.minutesAgo - b.minutesAgo);
}

// Converts an ISO datetime string into the "YYYY-MM-DDTHH:mm" format a
// <input type="datetime-local"> expects, in the viewer's local timezone.
// Returns "" for null/invalid input so the field just shows empty.
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
  // the real `registrations` table; buildParticipants(comp) is only a
  // placeholder fallback for the brief window before that data has loaded.
  const ranked = participants && participants.length > 0 ? participants : buildParticipants(comp);

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
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0, overflow: "hidden",
                  border: "1px solid #e0e0e0",
                }}>
                <img src={avatarImg(p.index)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
   Full grid of every participant's album — this is what "Voir tout" opens
   from the Médias tab. Kept separate from ParticipantListOverlay, which is
   the votes/ranking table used by the Classement tab's own "Voir tout". */

function AlbumGridOverlay({ comp, onClose, onOpenAlbum }) {
  const count = comp.contestants || 0;

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
          Albums
        </span>
      </div>

      <div style={{
        maxWidth: 800, margin: "0 auto", padding: 12,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {Array.from({ length: count }, (_, i) => {
          const p = buildParticipants(comp)[i];
          return (
            <div key={i} onClick={() => onOpenAlbum(i)} style={{ cursor: "pointer" }}>
              <ParticipantCard index={i} mediaType={comp.mediaType} accent={comp.accent} votes={p?.votes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── REGISTRANT LIST OVERLAY ───────────────────────────────────────────── */

function RegistrantListOverlay({ comp, registrants, accent, onClose }) {
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

/* ─── ALBUM SHEET ───────────────────────────────────────────────────────── */

function AlbumSheet({ participantIndex, name, accent, mediaType = "photo", onClose }) {
  const photoCount = 3 + (participantIndex * 7 + 11) % 10;
  const photos = Array.from({ length: photoCount }, (_, i) => ({
    id: i,
    src: `https://picsum.photos/seed/album_${participantIndex}_${i}/600/600`,
  }));
  const story = getWhyStory(participantIndex);

  const subtitle =
    mediaType === "photo" ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` :
    mediaType === "video" ? "Message vidéo" :
    mediaType === "pdf" ? "Dossier de candidature" :
    "Pourquoi je participe";

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
              {name}
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
          {/* "Why I'm competing" — shown for every media type so a donor
              knows who they're gifting before seeing the rest of the content. */}
          <div style={{
            background: "#faf9f7", border: "1px solid #eee",
            padding: "12px 14px", marginBottom: 4,
          }}>
            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
              color: accent, textTransform: "uppercase", letterSpacing: "0.08em",
              marginBottom: 6,
            }}>
              Pourquoi je participe
            </div>
            <p style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.6,
              color: "#333", margin: 0,
            }}>
              {story}
            </p>
          </div>

          {mediaType === "photo" && photos.map((photo) => (
            <div key={photo.id} style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", background: "#f0f0f0", flexShrink: 0 }}>
              <img
                src={photo.src}
                alt={`Photo ${photo.id + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}

          {mediaType === "video" && (
            <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", position: "relative", background: "#111" }}>
              <img
                src={picsumImg(`vid_${participantIndex}`, 480, 480)}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(0.55)" }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.4)" }}>
                  <Play size={22} color="#fff" fill="#fff" />
                </div>
              </div>
            </div>
          )}

          {mediaType === "text" && (
            <p style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.7,
              color: "#444", margin: 0, padding: "0 2px",
            }}>
              {TEXT_SNIPPETS[participantIndex % TEXT_SNIPPETS.length]}
            </p>
          )}

          {mediaType === "pdf" && (
            <div style={{
              border: "1px solid #e0e0e0", background: "#fafafa",
              padding: "20px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}>
              <File size={30} color="#888" strokeWidth={1.5} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#555" }}>Dossier.pdf</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa" }}>Candidature complète — 1.2 Mo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── LIVE COMMENTARY STREAM SHEET (X Spaces / podcast style) ─────────── */

function RoomAvatar({ index, name, size = 56, speaking = false, ring, badge }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: speaking ? `2px solid ${ring || "#2ecc71"}` : "2px solid transparent",
        boxSizing: "border-box",
      }}>
        {index != null ? (
          <img src={avatarImg(index)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: size * 0.32, fontWeight: 700, color: "#fff" }}>{initials}</span>
          </div>
        )}
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
                <RoomAvatar index={s.index} name={s.name} size={56} speaking={s.speaking} ring={accent} />
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
                  <RoomAvatar index={idx} name="" size={26} />
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

function CompetitionBoard({ comp, onClose, balance, onSendGift, onOpenBuy, onRegister, showToast, isRegistered, isFollowed, onToggleFollow, currentUser, onRequestAuth, onEditComp, onAddImage, onRemoveImage, startInEditMode = false }) {
  const isRegistration = comp.phase === "registration";
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
  }, [comp.id, comp.title, comp.edition, comp.ends, comp.phase, comp.contestants, comp.endsAt, comp.description, comp.prizeAmount, comp.fee, comp.rewardExtra, comp.rules, comp.bannerUrl]);

  async function handleAddImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    await onAddImage?.(comp.id, file);
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
    await onRemoveImage?.(comp.id, imageId);
    setRemovingImageId(null);
  }

  async function handleSaveEdit() {
    setSavingEdit(true);
    const trimmedPrize = editPrizeAmount.trim();
    const trimmedContestants = editContestants.trim();
    const trimmedFee = editFee.trim();
    const result = await onEditComp?.({
      competitionId: comp.id,
      title: editTitle.trim() || comp.title,
      edition: editEdition.trim() || comp.edition,
      ends: editEnds.trim() || comp.ends,
      phase: editPhase,
      contestants: trimmedContestants === "" ? null : Math.max(0, parseInt(trimmedContestants, 10) || 0),
      endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      description: editDescription.trim(),
      prizeAmount: trimmedPrize === "" ? null : Number(trimmedPrize),
      fee: trimmedFee === "" ? null : Math.max(0, parseInt(trimmedFee, 10) || 0),
      rewardExtra: editRewardExtra.trim(),
      rules: editRules.split("\n").map((r) => r.trim()).filter(Boolean),
      bannerUrl: editBannerUrl,
    });
    setSavingEdit(false);
    if (result?.success) setShowEditModal(false);
  }
  const [voteCount, setVoteCount] = useState(comp.votes);
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
  const [prizeBump, setPrizeBump] = useState(false);
  const [pointsBump, setPointsBump] = useState(false);
  const prevVoteCountRef = useRef(voteCount);
  useEffect(() => {
    if (voteCount !== prevVoteCountRef.current) {
      prevVoteCountRef.current = voteCount;
      setPointsBump(true);
      const t = setTimeout(() => setPointsBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [voteCount]);

  // If the organizer set a real deadline (comp.endsAt), the countdown is
  // computed from actual elapsed time each tick — so it survives reloads,
  // background tabs, etc. Competitions without one fall back to the legacy
  // static "2j 14h"-style text, decremented client-side as before.
  function secondsUntilEndsAt() {
    const diff = Math.floor((new Date(comp.endsAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (comp.endsAt) return secondsUntilEndsAt();
    const str = comp.ends || "";
    let total = 0;
    const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
    const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
    const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
    return total || 3600;
  });
  useEffect(() => {
    const iv = setInterval(() => {
      if (comp.endsAt) {
        setSecondsLeft(secondsUntilEndsAt());
      } else {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }
      setTickFlash((f) => !f);
    }, 1000);
    return () => clearInterval(iv);
  }, [comp.endsAt]);
  const fmtCountdown = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (d > 0) return `${d}j ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
  };
  // Stats-row timer: "2 Days" → when days hit 0, "X Hours" → when hours hit 0, "X Minutes"
  const fmtCountdownStats = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d} Day${d > 1 ? "s" : ""}`;
    if (h > 0) return `${h} Hour${h > 1 ? "s" : ""}`;
    return `${m} Minute${m !== 1 ? "s" : ""}`;
  };
  const [albumSheet, setAlbumSheet] = useState(null); // { participantIndex, name }
  const [showGiftBar, setShowGiftBar] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftStep, setGiftStep] = useState("participant"); // "participant" | "gift" | "confirm"
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftConfirmPhase, setGiftConfirmPhase] = useState("summary"); // "summary" | "pin"
  const [giftPin, setGiftPin] = useState("");
  const [giftPinError, setGiftPinError] = useState(false);
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [liveLog, setLiveLog] = useState([]);
  const [giftLeaderboard, setGiftLeaderboard] = useState(() =>
    // Seed a few fake top donors, each with a fake list of individual gifts
    Array.from({ length: 5 }, (_, i) => {
      const giftCount = 8 - i;
      const gifts = Array.from({ length: giftCount }, (_, j) => {
        const g = GIFT_CATALOG[(i * 3 + j * 7) % GIFT_CATALOG.length];
        return {
          id: `donor-${i}-gift-${j}`,
          icon: g.icon,
          name: g.name,
          cost: g.cost,
          timestamp: Date.now() - j * 3 * 3600 * 1000,
          ago: j === 0 ? "À l'instant" : `il y a ${(j + 1) * 3}h`,
        };
      });
      return {
        id: `donor-${i}`,
        index: 30 + i,
        name: fakeName(30 + i),
        totalSpent: gifts.reduce((sum, g) => sum + g.cost, 0),
        giftCount,
        topGift: ["💎", "🔥", "🌟", "🎁", "❤️"][i],
        isMe: false,
        gifts,
      };
    })
  );
  const [selectedDonor, setSelectedDonor] = useState(null);
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
  const liveRegistered = registrantsLoading ? comp.registeredCount : registrants.length;

  useEffect(() => {
    let cancelled = false;
    setRegistrantsLoading(true);
    fetchRegistrations(comp.id).then((rows) => {
      if (cancelled) return;
      setRegistrants(
        rows.map((r) => ({
          id: r.id,
          name: r.full_name,
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
        { event: "INSERT", schema: "public", table: "registrations", filter: `competition_id=eq.${comp.id}` },
        (payload) => {
          const r = payload.new;
          setRegistrants((prev) => {
            if (prev.some((existing) => existing.id === r.id)) return prev;
            return [
              {
                id: r.id,
                name: r.full_name,
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

  // Database-backed participant list. Falls back to the old fake generator
  // only while the real fetch is in flight (or genuinely returns nothing),
  // so the classement, albums strip, and gift picker always reflect actual
  // registrations instead of invented names.
  const dbParticipants = useMemo(
    () => buildParticipantsFromRegistrants(registrants, comp),
    [registrants, comp]
  );
  const participantsFull = (registrantsLoading || dbParticipants.length === 0)
    ? buildParticipants(comp)
    : dbParticipants;

  // Seed ranked once; liveVotes tracks per-participant live vote deltas, liveGiftCredits tracks per-participant gift credits
  const seedRanked = participantsFull.slice(0, 5);
  const [liveVotes, setLiveVotes] = useState(() => {
    const m = {};
    seedRanked.forEach((p) => { m[p.index] = p.votes; });
    return m;
  });
  const [liveGiftCredits, setLiveGiftCredits] = useState(() => {
    const m = {};
    seedRanked.forEach((p) => { m[p.index] = 0; });
    return m;
  });
  function addGiftToParticipant(participantIndex, creditValue) {
    setLiveGiftCredits((prev) => ({
      ...prev,
      [participantIndex]: (prev[participantIndex] ?? 0) + creditValue,
    }));
  }
  const ranked = seedRanked.map((p) => ({ ...p, votes: liveVotes[p.index] ?? p.votes }));
  const topPoints = Math.max(...ranked.map((p) => p.points), 1);
  const leader = ranked[0];
  const secondPlace = ranked[1];
  const leaderMargin = leader && secondPlace ? leader.points - secondPlace.points : null;
  const leaderGiftCredits = leader ? (liveGiftCredits[leader.index] ?? 0) : 0;
  const winnerPrize = basePrizePool + Math.round(leaderGiftCredits * WINNER_GIFT_SHARE);
  const heroPrizeValue = isRegistration ? basePrizePool : winnerPrize;
  const prevHeroPrizeRef = useRef(heroPrizeValue);
  useEffect(() => {
    if (heroPrizeValue !== prevHeroPrizeRef.current) {
      prevHeroPrizeRef.current = heroPrizeValue;
      setPrizeBump(true);
      const t = setTimeout(() => setPrizeBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [heroPrizeValue]);
  function mapCommentRow(row) {
    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000));
    return {
      id: row.id,
      index: Math.abs(hashStr(row.user_id || row.id)) % 40,
      name: row.full_name,
      text: row.text,
      minutesAgo,
      likes: 0,
      isMine: currentUser && row.user_id === currentUser.id,
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
        { event: "INSERT", schema: "public", table: "comments", filter: `competition_id=eq.${comp.id}` },
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

  // Live vote tick — random participant gets +1–4 votes (and matching gift credit) every 1.8s (voting phase only)
  const AVG_GIFT_VALUE = Math.round(GIFT_CATALOG.reduce((s, g) => s + g.cost, 0) / GIFT_CATALOG.length);
  useEffect(() => {
    if (isRegistration) return;
    const iv = setInterval(() => {
      setLiveVotes((prev) => {
        const keys = Object.keys(prev);
        const key = keys[Math.floor(Math.random() * keys.length)];
        const delta = 1 + Math.floor(Math.random() * 4);
        addGiftToParticipant(Number(key), delta * AVG_GIFT_VALUE);
        setVoteCount((c) => c + delta);
        return { ...prev, [key]: prev[key] + delta };
      });
    }, 1800);
    return () => clearInterval(iv);
  }, [isRegistration]);

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
      competitionId: comp.id,
      userId: currentUser.id,
      fullName: currentUser.fullName,
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
      competitionId: comp.id,
      userId: currentUser.id,
      fullName: currentUser.fullName,
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
  const feedItems = useMemo(() => {
    const giftItems = liveLog.map((entry, i) => ({
      type: "gift",
      key: `gift-${entry.id}`,
      minutesAgo: i * 2,
      entry,
    }));
    const commentItems = comments.map((c) => ({
      type: "comment",
      key: `comment-${c.id}`,
      minutesAgo: c.minutesAgo,
      comment: c,
    }));
    return [...giftItems, ...commentItems].sort((a, b) => a.minutesAgo - b.minutesAgo);
  }, [liveLog, comments]);

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
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
                      <img src={slide.src} alt={`${comp.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: `${accent}44`, mixBlendMode: "multiply" }} />
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
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{comp.niche}</div>
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

            {/* Hero cagnotte card — combined total instead of two competing boxes */}
            <div style={{
              position: "relative", overflow: "hidden", borderRadius: 0,
              background: "#fff", border: "1px solid #e0e0e0",
              padding: "13px 14px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Trophy size={14} color="#C99A2E" strokeWidth={2.3} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800, color: "#C99A2E", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                  {isRegistration ? "Prix à gagner" : "Cagnotte à gagner"}
                </span>
                {!isRegistration && (
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Live
                    </span>
                  </span>
                )}
              </div>

              <div style={{
                display: "flex", alignItems: "baseline", gap: 6,
                transform: prizeBump ? "scale(1.05)" : "scale(1)",
                transformOrigin: "left center",
                transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 800, color: "#111",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {heroPrizeValue.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#999" }}>
                  HTG
                </span>
              </div>

              {isRegistration ? (
                <div style={{ marginTop: 4, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888" }}>
                  + un bonus basé sur les cadeaux reçus par le gagnant
                </div>
              ) : (
                <div style={{ marginTop: 4, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 5 }}>
                  <Gift size={11} color={accent} strokeWidth={2.3} />
                  Dont{" "}
                  <span style={{ color: accent, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    +{Math.round(leaderGiftCredits * WINNER_GIFT_SHARE).toLocaleString("fr-FR")} HTG
                  </span>{" "}
                  de bonus cadeaux
                </div>
              )}
            </div>

            {rulesInfo.rewardExtra && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", marginTop: 8, padding: "0 2px" }}>
                {rulesInfo.rewardExtra}
              </div>
            )}

          </div>
        </div>

        {/* ── LEADER + STATS — one unified vitals block, flat with separators ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
          {!isRegistration && leader ? (
            <button
              onClick={() => setActiveTab("participants")}
              style={{
                width: "100%", border: "none", background: "none", cursor: "pointer",
                padding: "10px 10px", display: "flex", alignItems: "center", gap: 10,
                textAlign: "left", borderBottom: "1px solid #e0e0e0",
              }}
            >
              <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", overflow: "hidden",
                  border: `2px solid ${accent}`, boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                }}>
                  <img src={avatarImg(leader.index)} alt={leader.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <span style={{ position: "absolute", bottom: -3, right: -3, fontSize: 13 }}>🥇</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#222",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {leader.name}
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 800, color: accent,
                    background: `${accent}1a`, padding: "1px 6px", borderRadius: 8, flexShrink: 0,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    En tête
                  </span>
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999", marginTop: 1 }}>
                  {leaderMargin != null
                    ? `+${leaderMargin.toLocaleString("fr-FR")} pts d'avance sur ${secondPlace.name}`
                    : "Seul en tête pour l'instant"}
                </div>
              </div>

              <ChevronRight size={16} color="#ccc" strokeWidth={2.3} />
            </button>
          ) : (
            <div style={{
              padding: "10px 10px", borderBottom: "1px solid #e0e0e0",
              fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999",
            }}>
              Le 1er du classement final remporte le prix à gagner + un bonus basé sur les cadeaux qu'il a reçus.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            {(isRegistration ? [
              { value: liveRegistered, label: "Inscrits", icon: Users },
              { value: comp.contestants, label: "Places", accent: true, icon: Trophy },
              { value: `${registrationFee} G`, label: "Frais insc.", icon: Wallet },
            ] : [
              { value: liveRegistered, label: "Candidats", icon: Users },
              { value: fmtVotes(voteCount), label: "Points", accent: true, icon: Flame, bump: pointsBump },
              { value: fmtCountdownStats(secondsLeft), label: "Fin dans", hot: comp.hot, timer: true, icon: Clock },
            ]).map((s, i) => {
              const Icon = s.icon;
              const hotTimer = s.timer && s.hot;
              return (
                <div key={i} style={{
                  borderLeft: i > 0 ? "1px solid #f0f0f0" : "none",
                  padding: "10px 4px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  background: hotTimer ? "rgba(192,57,43,0.06)" : "transparent",
                  transition: "background 0.3s",
                }}>
                  {Icon && (
                    <Icon
                      size={12}
                      strokeWidth={2.4}
                      color={hotTimer ? "#c0392b" : s.accent ? accent : "#bbb"}
                      style={{ marginBottom: 4 }}
                    />
                  )}
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: s.timer ? 18 : 24, fontWeight: 800,
                    color: hotTimer ? "#c0392b" : s.accent ? accent : "#111",
                    lineHeight: 1,
                    transition: s.timer ? "opacity 0.12s, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                    opacity: s.timer ? (tickFlash ? 1 : 0.6) : 1,
                    transform: s.bump ? "scale(1.14)" : "scale(1)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: s.timer ? "-0.02em" : "normal",
                  }}>{s.value}</div>
                  <div style={{
                    fontFamily: "Inter, sans-serif", fontSize: 9.5, color: "#999",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4,
                    fontWeight: 600, textAlign: "center",
                  }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

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

        {isRegistration && (
          <div style={{
            background: "#fff",
            borderBottom: "1px solid #e0e0e0",
            padding: "6px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa",
              textTransform: "uppercase", letterSpacing: "0.1em",
              fontWeight: 600,
            }}>Fin inscr.</div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18, fontWeight: 800,
              color: comp.hot ? "#c0392b" : "#111",
              lineHeight: 1,
              transition: "opacity 0.12s",
              opacity: tickFlash ? 1 : 0.6,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}>{fmtCountdown(secondsLeft)}</div>
          </div>
        )}

        {/* ── COUNTDOWN BAR ── */}
        <div style={{
          background: isRegistration ? "#f0ebff" : comp.hot ? "#fff0ed" : "#f7f7f5",
          borderBottom: "1px solid #e0e0e0",
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRegistration ? "#6C63FF" : comp.hot ? "#e74c3c" : "#bbb",
            display: "inline-block", flexShrink: 0,
            animation: (isRegistration || comp.hot) ? "pulse-dot 1.2s infinite" : "none",
          }} />
          <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
            color: isRegistration ? "#6C63FF" : comp.hot ? "#c0392b" : "#888",
          }}>
            {isRegistration 
              ? `Inscriptions ouvertes — ${comp.contestants - liveRegistered} place${comp.contestants - liveRegistered !== 1 ? 's' : ''} disponible${comp.contestants - liveRegistered !== 1 ? 's' : ''}` 
              : comp.hot ? `Compétition très active — se termine dans ${fmtCountdown(secondsLeft)}` : `Se termine dans ${fmtCountdown(secondsLeft)}`}
          </span>
        </div>

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
                  <div key={p.index} style={{
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
                      <img src={avatarImg(p.index)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>

                    {/* Name + progress bar */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                        color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{p.name}</span>
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

                    {/* Coins */}
                    <span style={{
                      display: "flex", alignItems: "center", gap: 4,
                      fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                      color: rank === 0 ? accent : "#555", flexShrink: 0, marginLeft: 4,
                    }}>
                      🪙 {p.points.toLocaleString("fr-FR")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── MÉDIAS PREVIEW ── */}
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
              {Array.from({ length: Math.min(comp.contestants, 10) }, (_, i) => {
                const p = buildParticipants(comp)[i];
                return (
                  <div
                    key={i}
                    onClick={() => setAlbumSheet({ participantIndex: i, name: fakeName(i), mediaType: comp.mediaType })}
                    style={{ flexShrink: 0, width: 110, cursor: "pointer" }}
                  >
                    <ParticipantCard index={i} mediaType={comp.mediaType} accent={comp.accent} votes={p?.votes} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                      background: donor.isMe ? "#111" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                    }}>
                      {donor.isMe ? (
                        <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>{donor.name.charAt(0)}</span>
                      ) : (
                        <img src={avatarImg(donor.index)} alt={donor.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
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
                    const likeCount = (entry.id % 12) + (liked ? 1 : 0);
                    const replyCount = entry.id % 3;
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
                              <img src={avatarImg(entry.pIndex)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </div>
                            <span style={{
                              fontFamily: "Inter, sans-serif", fontSize: 10, color: "#888",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              pour <span style={{ fontWeight: 700, color: "#666" }}>{fakeName(entry.pIndex)}</span>
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
                              <img src={avatarImg(c.index)} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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

            {ranked.map((p, rank) => {
              const pct = Math.max(8, Math.round((p.points / topPoints) * 100));
              return (
                <div key={p.index} style={{
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
                    <img src={avatarImg(p.index)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>

                  {/* Name + progress bar */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                      color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{p.name}</span>
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

                  {/* Coins */}
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    color: rank === 0 ? accent : "#555", flexShrink: 0, marginLeft: 4,
                    transition: "color 0.3s",
                  }}>
                    🪙 {p.points.toLocaleString("fr-FR")}
                  </span>
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
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 12, paddingLeft: 8, paddingRight: 8,
            }}>
              <ImageIcon size={13} strokeWidth={2.5} />
              Albums
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, paddingLeft: 8, paddingRight: 8 }}>
              {Array.from({ length: Math.min(comp.contestants, 12) }, (_, i) => {
                const p = buildParticipants(comp)[i];
                return (
                  <div key={i} onClick={() => setAlbumSheet({ participantIndex: i, name: fakeName(i), mediaType: comp.mediaType })} style={{ cursor: "pointer" }}>
                    <ParticipantCard index={i} mediaType={comp.mediaType} accent={comp.accent} votes={p?.votes} />
                  </div>
                );
              })}
              {comp.contestants > 12 && (
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
                    +{comp.contestants - 12}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir tout
                  </span>
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
                      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: isFirst ? `2px solid ${accent}` : "2px solid #eee", background: donor.isMe ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {donor.isMe ? (
                          <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700 }}>{donor.name.charAt(0)}</span>
                        ) : (
                          <img src={avatarImg(donor.index)} alt={donor.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )}
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
        {activeTab === "live" && !isRegistration && (
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

          {/* Composer — only shown during registration; voting phase types from the sticky bottom bar */}
          {isRegistration && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: currentUser ? "#111" : "#e0e0e0", color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {currentUser ? currentUser.fullName.charAt(0).toUpperCase() : <User size={14} color="#999" />}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onFocus={() => { if (!currentUser) onRequestAuth?.(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                  placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                  style={{
                    flex: 1, minWidth: 0, border: "none", borderRadius: 999, background: "#f5f5f5",
                    padding: "10px 16px", fontFamily: "Inter, sans-serif", fontSize: 13,
                    color: "#333", outline: "none",
                  }}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentDraft.trim() || posting}
                  style={{
                    border: "none", borderRadius: 999, background: commentDraft.trim() ? accent : "#eee",
                    color: commentDraft.trim() ? "#fff" : "#bbb",
                    padding: "10px 14px", flexShrink: 0, whiteSpace: "nowrap",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                    cursor: commentDraft.trim() ? "pointer" : "default",
                  }}
                >
                  Publier
                </button>
              </div>
            </div>
          )}

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
                        <img src={avatarImg(entry.pIndex)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", fontWeight: 500 }}>
                        <span style={{ fontSize: 14 }}>{entry.gift.icon}</span>{" "}
                        <span style={{ fontWeight: 700, color: accent }}>{entry.gift.name}</span>
                        {" "}envoyé à{" "}
                        <span style={{ color: accent, fontWeight: 700 }}>{fakeName(entry.pIndex)}</span>
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
                        <img src={avatarImg(c.index)} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
                                <img src={avatarImg(r.index)} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
                {participantsFull.slice(0, Math.min(comp.contestants, 15)).map((p) => (
                  <button
                    key={p.index}
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
                    <img
                      src={avatarImg(p.index)}
                      alt={p.name}
                      style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accent}22` }}
                    />
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
                      onClick={() => setGiftConfirmPhase("pin")}
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
                      disabled={giftPin.length !== 4 || giftSubmitting}
                      onClick={() => {
                        if (giftPin.length !== 4) return;
                        if (giftPin !== WALLET_PIN) {
                          setGiftPinError(true);
                          return;
                        }
                        const gift = selectedGift;
                        setGiftSubmitting(true);
                        onSendGift(gift, { ...comp, recipientName: selectedParticipant?.name, priceHTG: giftPriceHTG(gift) });
                        setVoteCount((v) => v + 1);
                        if (selectedParticipant) {
                          addGiftToParticipant(selectedParticipant.index, gift.cost);
                          setLiveVotes((prev) => ({
                            ...prev,
                            [selectedParticipant.index]: (prev[selectedParticipant.index] ?? selectedParticipant.votes) + 1,
                          }));
                        }
                        setVoted(true);
                        // Inject gift into live log
                        setLiveLog((prev) => {
                          const entry = { id: Date.now(), pIndex: selectedParticipant?.index ?? 0, ago: "À l'instant", gift, senderName: currentUser?.name || "Vous" };
                          return [entry, ...prev.slice(0, 4)].map((e, i) => ({
                            ...e,
                            ago: i === 0 ? "À l'instant" : `il y a ${i * 2} min`,
                          }));
                        });
                        // Update gift leaderboard — bump current user or add them
                        if (currentUser) {
                          const giftEntry = {
                            id: `me-gift-${Date.now()}`,
                            icon: gift.icon,
                            name: gift.name,
                            cost: gift.cost,
                            recipientName: selectedParticipant?.name,
                            timestamp: Date.now(),
                            ago: "À l'instant",
                          };
                          setGiftLeaderboard((prev) => {
                            const exists = prev.find((d) => d.isMe);
                            let updated;
                            if (exists) {
                              updated = prev.map((d) => d.isMe ? { ...d, totalSpent: d.totalSpent + gift.cost, giftCount: d.giftCount + 1, topGift: gift.icon, gifts: [giftEntry, ...(d.gifts || [])] } : d);
                            } else {
                              updated = [...prev, { id: "me", index: 0, name: currentUser.fullName, totalSpent: gift.cost, giftCount: 1, topGift: gift.icon, isMe: true, gifts: [giftEntry] }];
                            }
                            return updated.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
                          });
                          // Keep the detail screen in sync if it's currently open on "me"
                          setSelectedDonor((sd) => {
                            if (!sd?.isMe) return sd;
                            return { ...sd, totalSpent: sd.totalSpent + gift.cost, giftCount: sd.giftCount + 1, topGift: gift.icon, gifts: [giftEntry, ...(sd.gifts || [])] };
                          });
                        }
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
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid #eee", background: selectedDonor.isMe ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {selectedDonor.isMe ? (
                <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700 }}>{selectedDonor.name.charAt(0)}</span>
              ) : (
                <img src={avatarImg(selectedDonor.index)} alt={selectedDonor.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
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
                            {g.recipientName ? `À ${g.recipientName} · ` : ""}{g.ago}
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
      {!showGiftBar && (
      <div style={{
        position: "fixed", bottom: isRegistration ? 8 : 0, left: isRegistration ? 8 : 0, right: isRegistration ? 8 : 0,
        background: "#fff",
        borderTop: isRegistration ? "none" : "1px solid #eee",
        borderRadius: isRegistration ? 20 : 0,
        boxShadow: isRegistration ? "0 -2px 24px rgba(0,0,0,0.15)" : "0 -2px 16px rgba(0,0,0,0.06)",
        padding: isRegistration ? "10px 12px" : "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
        zIndex: 1001,
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {isRegistration ? (
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
              return (
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
                      padding: isTyping ? "11px 52px 11px 16px" : "11px 90px 11px 16px",
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

                      {/* Gift button */}
                      <button
                        onClick={() => {
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
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>
      )}

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
          comp={comp}
          onClose={() => setShowAllAlbums(false)}
          onOpenAlbum={(i) => setAlbumSheet({ participantIndex: i, name: fakeName(i), mediaType: comp.mediaType })}
        />
      )}

      {showAllRegistrants && (
        <RegistrantListOverlay comp={comp} registrants={registrants} accent={accent} onClose={() => setShowAllRegistrants(false)} />
      )}

      {albumSheet && (
        <AlbumSheet
          participantIndex={albumSheet.participantIndex}
          name={albumSheet.name}
          mediaType={albumSheet.mediaType}
          accent={accent}
          onClose={() => setAlbumSheet(null)}
        />
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
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[
                { value: "registration", label: "Inscriptions" },
                { value: "live", label: "En direct" },
              ].map((opt) => {
                const isActive = editPhase === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditPhase(opt.value)}
                    style={{
                      flex: 1,
                      border: isActive ? "1px solid #111" : "1px solid #e0e0e0",
                      background: isActive ? "#111" : "#fff",
                      color: isActive ? "#fff" : "#555",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {opt.value === "live" && <span style={{ marginRight: 5 }}>●</span>}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Fin des inscriptions</label>
            <input
              type="text"
              value={editEnds}
              onChange={(e) => setEditEnds(e.target.value)}
              placeholder="ex: 3j 18h"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
            />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14 }}>
              Texte affiché sur les cartes (ex: "2j 14h"). Réglez la vraie date ci-dessous pour un compte à rebours réel.
            </div>

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Date et heure de fin réelles</label>
            <input
              type="datetime-local"
              value={editEndsAt}
              onChange={(e) => setEditEndsAt(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
            />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14 }}>
              Pilote le vrai compte à rebours affiché sur la page. Laissez vide pour garder le texte ci-dessus.
            </div>

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
              disabled={savingEdit || !editTitle.trim()}
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

/* ─── NICHE ROW ─────────────────────────────────────────────────────────── */

function NicheRow({ niche, onOpen, onRegister, registeredCompIds, currentUser }) {
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
    <section style={{ marginBottom: 0, borderBottom: "2px solid #e0e0e0", paddingBottom: 8, paddingTop: 8 }}>
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 2,
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
          paddingBottom: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {niche.competitions.map((comp) => (
          <CompCard key={comp.id} comp={comp} accent={niche.accent} onOpen={onOpen} onRegister={onRegister} isRegistered={registeredCompIds?.has(comp.id)} isOwnCompetition={currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE} />
        ))}

      </div>
    </section>
  );
}

/* ─── WALLET PAGE ───────────────────────────────────────────────────────── */

const DEPOSIT_METHODS = PAYMENT_METHODS.filter((m) => m.id === "moncash" || m.id === "natcash");

function DepositModal({ onClose, onDeposit, lastMethod }) {
  const [method, setMethod] = useState(lastMethod || "moncash");
  const [copied, setCopied] = useState(false);

  const phoneNumber = MOBILE_MONEY_NUMBERS[method].number;
  const accountName = MOBILE_MONEY_NUMBERS[method].name;
  const currentMethod = PAYMENT_METHODS.find((m) => m.id === method);
  const methodLabel = currentMethod?.label;
  const accentColor = currentMethod?.accent ?? "#111";

  function handleCopy() {
    navigator.clipboard?.writeText(phoneNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onDeposit(method);
  }

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
      onClick={handleClose}
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
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Déposer des fonds
          </span>
          <button onClick={handleClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <>
          {/* Method tabs */}
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Méthode de paiement
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {DEPOSIT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      border: `1px solid ${active ? "#111" : "#ddd"}`,
                      background: active ? "#111" : "#fff",
                      color: active ? "#fff" : "#333",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "10px 6px",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: m.accent,
                        color: "#fff",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {m.label.charAt(0)}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Account details */}
            <div
              style={{
                border: "2px solid #111",
                borderLeft: `5px solid ${accentColor}`,
                background: "#f7f7f5",
                marginBottom: 12,
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #ddd" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, marginBottom: 6 }}>
                  Nom
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#111" }}>
                  {accountName}
                </div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, marginBottom: 6 }}>
                    Numéro {methodLabel}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: "#111" }}>
                    {phoneNumber}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  aria-label="Copier le numéro"
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    border: `1px solid ${accentColor}`,
                    background: copied ? accentColor : "#fff",
                    color: copied ? "#fff" : accentColor,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B", lineHeight: 1.5, marginBottom: 4 }}>
              ⚠ Envoyez uniquement à partir du numéro {methodLabel} enregistré sur votre compte.
            </div>
          </>
      </div>
    </div>
  );
}

const WALLET_PIN = "1234"; // demo PIN

function WithdrawModal({ balance, onClose, onWithdraw }) {
  const [amountStr, setAmountStr] = useState("");
  const [method, setMethod] = useState("moncash");
  const [step, setStep] = useState("form"); // "form" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const amount = parseInt(amountStr, 10) || 0;
  const canSubmit = amount > 0 && amount <= balance;
  const methodLabel = PAYMENT_METHODS.find((m) => m.id === method)?.label;

  function handlePinChange(v) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setPinError(false);
  }

  function handleConfirm() {
    if (pin.length !== 4) return;
    if (pin !== WALLET_PIN) {
      setPinError(true);
      return;
    }
    onWithdraw(amount, methodLabel);
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          {step === "pin" && (
            <button onClick={() => { setStep("form"); setPin(""); setPinError(false); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 0, lineHeight: 0 }}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <span style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            {step === "form" ? "Retirer des fonds" : "Confirmer le retrait"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Solde disponible : {balance.toLocaleString("fr-FR")} HTG
            </div>

            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", padding: "12px 14px", marginBottom: 12 }}>
              <input
                type="number"
                min="1"
                max={balance}
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#333",
                  minWidth: 0,
                }}
              />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", fontWeight: 600 }}>HTG</span>
              <button
                onClick={() => setAmountStr(String(balance))}
                style={{ marginLeft: 10, border: "1px solid #ddd", background: "#fff", color: "#333", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "6px 10px", cursor: "pointer" }}
              >
                Max
              </button>
            </div>
            {amount > balance && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#e74c3c", fontWeight: 600, marginBottom: 12 }}>
                Le montant dépasse votre solde disponible.
              </div>
            )}

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Destination
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1,
                      border: `1px solid ${active ? "#111" : "#ddd"}`,
                      background: active ? "#111" : "#fff",
                      color: active ? "#fff" : "#333",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "10px 6px",
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 16 }}>
              Les retraits sont traités vers votre compte {methodLabel} sous 24h maximum.
            </div>

            <button
              onClick={() => canSubmit && setStep("pin")}
              disabled={!canSubmit}
              style={{
                width: "100%",
                border: "none",
                background: canSubmit ? "#111" : "#ccc",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "14px 20px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
              Retirer — {amount.toLocaleString("fr-FR")} HTG
            </button>
          </>
        )}

        {step === "pin" && (
          <>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", lineHeight: 1.5, marginBottom: 20 }}>
              Entrez votre code PIN à 4 chiffres pour confirmer le retrait de <strong>{amount.toLocaleString("fr-FR")} HTG</strong> vers {methodLabel}.
            </div>

            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••"
              style={{
                width: "100%",
                border: `1px solid ${pinError ? "#E74C3C" : "#ddd"}`,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.4em",
                textAlign: "center",
                color: "#333",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={pin.length !== 4}
              style={{
                width: "100%",
                border: "none",
                background: pin.length === 4 ? "#111" : "#ccc",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "14px 20px",
                cursor: pin.length === 4 ? "pointer" : "not-allowed",
                marginTop: 12,
              }}
            >
              Confirmer le retrait
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Note: the Google button below calls supabase.auth.signInWithOAuth, which
// requires the Google provider to be enabled (with a client ID/secret) under
// Authentication → Providers in the Supabase dashboard, and the app's URL
// added to the allowed redirect list. See the setup steps in competitionData.js.
function AuthOverlay({ onClose, onAuthenticated, compTitle, followIntent }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function switchMode(next) {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function handleSubmit() {
    setError("");
    setInfo("");

    if (mode === "reset") {
      if (!isValidEmail(email)) {
        setError("Veuillez entrer une adresse e-mail valide.");
        return;
      }
      setIsSubmitting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      setIsSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo("Lien envoyé. Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.");
      setMode("login");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Veuillez entrer votre nom complet.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      setIsSubmitting(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        // Email confirmation disabled in the Supabase project — signed in immediately.
        onAuthenticated(data.user);
      } else {
        // Email confirmation required — no session yet.
        setInfo("Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription, puis connectez-vous.");
        setMode("login");
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setIsSubmitting(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      onAuthenticated(data.user);
    }
  }

  async function handleOAuth(provider) {
    setError("");
    setInfo("");
    setOauthProvider(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthProvider(null);
    }
    // On success, Supabase redirects the browser away — nothing else to do here.
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const inputStyle = {
    width: "100%",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "12px 12px 12px 40px",
    fontFamily: "Inter, sans-serif", fontSize: 14,
    background: "#fafafa", color: "#333",
    boxSizing: "border-box",
    outline: "none",
  };
  const labelStyle = {
    fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
    color: "#888", textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };
  const fieldIconStyle = { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: mounted ? "rgba(17,17,17,0.6)" : "rgba(17,17,17,0)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transition: "background 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "10px 20px 24px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          transform: mounted ? "translateY(0)" : "translateY(40px)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 14px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#e0e0e0" }} />
        </div>

        {mode === "reset" && (
          <button
            onClick={() => switchMode("login")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, color: "#888" }}
          >
            <ArrowLeft size={16} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>Retour</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
            {mode === "login" ? "Connexion requise" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", cursor: "pointer", color: "#333", padding: 8, borderRadius: "50%", display: "flex", lineHeight: 0 }}>
            <X size={16} />
          </button>
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#888", display: "block", marginBottom: 20, lineHeight: 1.5 }}>
          {mode === "reset"
            ? "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe."
            : compTitle ? `Connectez-vous pour vous inscrire à ${compTitle}.`
            : followIntent ? `Connectez-vous pour suivre ${followIntent}.`
            : "Connectez-vous pour accéder à votre compte."}
        </span>

        {mode !== "reset" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f2f2f0", borderRadius: 999, padding: 4 }}>
            <button
              onClick={() => switchMode("login")}
              style={{
                flex: 1, border: "none", borderRadius: 999,
                background: mode === "login" ? "#111" : "transparent",
                color: mode === "login" ? "#fff" : "#888",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "10px 0", cursor: "pointer", transition: "background 0.2s, color 0.2s",
              }}
            >
              Se connecter
            </button>
            <button
              onClick={() => switchMode("signup")}
              style={{
                flex: 1, border: "none", borderRadius: 999,
                background: mode === "signup" ? "#111" : "transparent",
                color: mode === "signup" ? "#fff" : "#888",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "10px 0", cursor: "pointer", transition: "background 0.2s, color 0.2s",
              }}
            >
              Créer un compte
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Nom complet</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={fieldIconStyle} />
                <input
                  type="text"
                  placeholder="ex. Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>E-mail</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={fieldIconStyle} />
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                {mode === "login" && (
                  <button
                    onClick={() => switchMode("reset")}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#6C63FF" }}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={fieldIconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#bbb", padding: 4, display: "flex" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "signup" && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 5, display: "block" }}>
                  Au moins 6 caractères.
                </span>
              )}
            </div>
          )}

          {info && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#00B894", background: "#f0fbf7", border: "1px solid #b8edd9", borderRadius: 10, padding: "8px 10px" }}>
              {info}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", background: "#fff0ed", border: "1px solid #ffcfc7", borderRadius: 10, padding: "8px 10px" }}>
              {error}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 999,
            background: "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "15px 16px",
            cursor: isSubmitting ? "default" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isSubmitting
            ? "Veuillez patienter…"
            : mode === "login" ? "Se connecter"
            : mode === "signup" ? "Créer mon compte"
            : "Envoyer le lien"}
        </button>

        {mode !== "reset" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" }}>ou continuer avec</span>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
            </div>

            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthProvider}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                border: "1px solid #e0e0e0", borderRadius: 999, background: "#fff",
                padding: "13px 0", cursor: oauthProvider ? "default" : "pointer",
                opacity: oauthProvider ? 0.6 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7955 2.7164v2.2581h2.9086c1.7018-1.5668 2.6836-3.8741 2.6836-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9086-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.5564 3.5795 9 3.5795z"/>
              </svg>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#333" }}>
                {oauthProvider === "google" ? "Redirection…" : "Continuer avec Google"}
              </span>
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ccc", letterSpacing: "0.02em" }}>
            Propulsé par <span style={{ fontWeight: 700, color: "#999" }}>Mima</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({ comp, onClose, onRegister, showToast, currentUser, balance, onOpenBuy }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const fee = getRegistrationFee(comp);
  const canAfford = balance >= fee;

  function handleContinue() {
    if (!canAfford) {
      showToast("Gourdes insuffisantes pour l'inscription");
      onOpenBuy?.();
      return;
    }
    setStep("pin");
  }

  function handlePinChange(v) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setPinError(false);
    setRegisterError("");
  }

  async function handleConfirmPin() {
    if (pin.length !== 4) return;
    if (pin !== WALLET_PIN) {
      setPinError(true);
      return;
    }
    setRegisterError("");
    setIsSubmitting(true);
    const result = await onRegister(comp, fee);
    setIsSubmitting(false);

    if (!result?.success) {
      setRegisterError(result?.error || "Une erreur est survenue. Réessayez.");
      return;
    }

    setIsRegistered(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  if (isRegistered) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          background: "rgba(17,17,17,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#fff",
            padding: "36px 28px",
            textAlign: "center",
            borderRadius: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#6C63FF", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 8px 20px rgba(108,99,255,0.35)",
          }}>
            <Check size={30} strokeWidth={3} />
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700,
            color: "#111", display: "block", marginBottom: 8, letterSpacing: "-0.01em",
          }}>
            Inscription confirmée !
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: "#888",
            display: "block", lineHeight: 1.6,
          }}>
            Vous êtes inscrit à <strong style={{ color: "#333" }}>{comp.title}</strong>. Attendez le début de la compétition pour participer.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.55)",
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
          padding: "10px 18px 20px",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e3e3e3" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          {step === "pin" && (
            <button onClick={() => { setStep("form"); setPin(""); setPinError(false); }} style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#111", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              S'inscrire à {comp.title}
            </span>
            <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
              {comp.edition} · {comp.registeredCount}/{comp.contestants} inscrits
            </span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {step === "form" && (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#fafafa" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "#6C63FF", color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>{currentUser.fullName}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</span>
              </div>
            </div>
          )}

          {/* Receipt-style fee summary */}
          <div style={{
            borderRadius: 14,
            border: `1px solid ${canAfford ? "#eee" : "#f5c6c6"}`,
            background: canAfford ? "#fafafa" : "#fdf2f2",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                Frais d'inscription
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#111" }}>
                {fee} <span style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>gourdes</span>
              </span>
            </div>
            <div style={{ borderTop: `1px dashed ${canAfford ? "#e0e0e0" : "#f0c4c4"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                Votre solde
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: canAfford ? "#333" : "#E74C3C" }}>
                {balance.toLocaleString("fr-FR")} gourdes
              </span>
            </div>
          </div>

          {!canAfford && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", padding: "0 2px" }}>
              Gourdes insuffisantes — achetez-en pour continuer.
            </span>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 14,
            background: canAfford ? "#6C63FF" : "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.02em",
            padding: "15px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: canAfford ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
          }}
        >
          {canAfford ? (
            <>
              <Plus size={16} strokeWidth={2.5} />
              Payer {fee} gourdes et s'inscrire
            </>
          ) : (
            <>
              <Wallet size={16} strokeWidth={2.5} />
              Acheter des gourdes
            </>
          )}
        </button>
        </>
        )}

        {step === "pin" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#f0ebff", color: "#6C63FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <BadgeCheck size={22} strokeWidth={2.25} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", lineHeight: 1.6 }}>
                Entrez votre code PIN pour confirmer le paiement de<br />
                <strong style={{ color: "#333" }}>{fee} gourdes</strong> pour {comp.title}.
              </div>
            </div>

            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••"
              style={{
                width: "100%",
                border: `1.5px solid ${pinError ? "#E74C3C" : "#e3e3e3"}`,
                borderRadius: 14,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.5em",
                textAlign: "center",
                color: "#111",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}
            {registerError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
                {registerError}
              </div>
            )}

            <button
              onClick={handleConfirmPin}
              disabled={pin.length !== 4 || isSubmitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: isSubmitting ? "#ddd" : pin.length === 4 ? "#6C63FF" : "#e8e8e8",
                color: pin.length === 4 || isSubmitting ? "#fff" : "#aaa",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.02em",
                padding: "15px 20px",
                cursor: pin.length === 4 && !isSubmitting ? "pointer" : "not-allowed",
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: pin.length === 4 && !isSubmitting ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Inscription en cours...
                </>
              ) : (
                "Confirmer et payer"
              )}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const TX_VISUALS = {
  deposit:    { icon: ArrowDownLeft, color: "#00B894", bg: "#f0fbf7" },
  withdrawal: { icon: ArrowUpRight, color: "#E17055", bg: "#fff4f0" },
  gift_sent:  { icon: Gift, color: "#6C63FF", bg: "#f0ebff" },
};

function txReference(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `TXN-${code}`;
}

function TransactionRow({ tx, isLast, showToast }) {
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#888", bg: "#f7f7f5" };
  const Icon = visual.icon;
  const time = tx.date.includes(",") ? tx.date.split(",").slice(1).join(",").trim() : tx.date;
  const reference = txReference(tx.id);

  function copyReference(e) {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference).catch(() => {});
    }
    showToast && showToast("Référence copiée");
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          border: `1px solid ${visual.color}33`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: visual.bg,
        }}
      >
        <Icon size={15} color={visual.color} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.label}
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
          <span>{time}</span>
          <span style={{ color: "#ddd" }}>·</span>
          <span
            onClick={copyReference}
            title="Copier la référence"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: "#bbb",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {reference}
            <Copy size={10} strokeWidth={2} />
          </span>
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: isCredit ? "#00B894" : tx.type === "withdrawal" ? "#FF5252" : "#333",
          flexShrink: 0,
        }}
      >
        {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

function MyCompetitionsPage({ registeredCompIds, followedCompIds, onOpen }) {
  const [activeSection, setActiveSection] = useState("inscrit");

  const registeredEntries = Array.from(registeredCompIds)
    .map((id) => findCompWithNiche(id))
    .filter(Boolean);

  const followedEntries = Array.from(followedCompIds)
    .map((id) => findCompWithNiche(id))
    .filter(Boolean);

  const entries = activeSection === "inscrit" ? registeredEntries : followedEntries;

  function CompRow({ comp, niche, badge }) {
    return (
      <div
        onClick={() => onOpen({ ...comp, accent: niche.accent, niche: niche.label })}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          border: "1px solid #e0e0e0", background: "#fff",
          padding: "12px 14px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 44, height: 44, flexShrink: 0, overflow: "hidden",
          border: `2px solid ${niche.accent}`,
          background: "#eee", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {(comp.bannerUrl || comp.images?.[0]?.url) ? (
            <img src={comp.bannerUrl || comp.images[0].url} alt={comp.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <ImageIcon size={16} color="#ccc" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {comp.title}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
            {niche.label} · {comp.edition}
            {comp.phase === "registration" && (
              <span style={{ color: "#6C63FF", fontWeight: 600 }}> · {comp.registeredCount}/{comp.contestants} inscrits</span>
            )}
          </span>
        </div>
        {badge}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ padding: "16px 16px 0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Mes compétitions
          </span>
        </div>
        {/* Section tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #f0f0f0", marginTop: 12 }}>
          {[
            { id: "inscrit", label: "Inscrit", count: registeredEntries.length },
            { id: "suivi", label: "Suivi", count: followedEntries.length },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  borderBottom: isActive ? "2px solid #111" : "2px solid transparent",
                  padding: "10px 0",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#111" : "#aaa",
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                    background: isActive ? "#111" : "#e0e0e0",
                    color: isActive ? "#fff" : "#888",
                    padding: "1px 6px",
                    minWidth: 18, textAlign: "center",
                    transition: "background 0.15s, color 0.15s",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 8 }}>
              {activeSection === "inscrit" ? "Aucune inscription" : "Aucun suivi"}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
              {activeSection === "inscrit"
                ? "Inscrivez-vous à une compétition pour la voir apparaître ici."
                : "Suivez une compétition depuis sa fiche pour surveiller les inscriptions sans vous engager."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map(({ comp, niche }) => (
              <CompRow
                key={comp.id}
                comp={comp}
                niche={niche}
                badge={
                  activeSection === "inscrit" ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "#00875A", background: "#e8f8f3", border: "1px solid #c8ede1",
                      padding: "4px 8px",
                    }}>
                      <Check size={11} strokeWidth={2.5} />
                      Inscrit
                    </div>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "#6C63FF", background: "#f0ebff", border: "1px solid #d5c8ff",
                      padding: "4px 8px",
                    }}>
                      Suivi
                    </div>
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountPage({ currentUser, balance, onOpenWallet, onLoginRequest, onLogout, onOpenAdmin }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
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
          Compte
        </span>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Identity block */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 4px", marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#111", color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {currentUser ? currentUser.fullName.charAt(0).toUpperCase() : <User size={24} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#333" }}>
              {currentUser ? currentUser.fullName : "Non connecté"}
            </span>
            {currentUser ? (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </span>
            ) : (
              <button
                onClick={onLoginRequest}
                style={{ border: "none", background: "none", padding: 0, marginTop: 2, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6C63FF", fontWeight: 700 }}
              >
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Admin entry point — only ever rendered for the platform organizer */}
        {currentUser?.isOrganizer && (
          <button
            onClick={onOpenAdmin}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #6C63FF", background: "#f0ebff", color: "#6C63FF",
              padding: "14px 16px", marginBottom: 12, cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BadgeCheck size={18} strokeWidth={2.5} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
                Panneau d'administration
              </span>
            </div>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Credits chip — drills into wallet */}
        <button
          onClick={onOpenWallet}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "1px solid #111", background: "#111", color: "#fff",
            padding: "14px 16px", marginBottom: 24, cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={18} strokeWidth={2.5} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
              {balance.toLocaleString("fr-FR")} crédits
            </span>
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            Gérer <ChevronRight size={11} style={{ display: "inline" }} />
          </span>
        </button>

        {/* Other account links — placeholders for future screens */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid #e0e0e0", background: "#fff" }}>
          {[
            { label: "Compétitions suivies", icon: BadgeCheck },
            { label: "Paramètres", icon: User },
            { label: "Aide & support", icon: Bell },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 14px", borderBottom: "1px solid #f0f0f0",
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333",
              }}
            >
              <item.icon size={16} strokeWidth={2} color="#888" />
              {item.label}
            </div>
          ))}
          {currentUser && (
            <button
              onClick={onLogout}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 14px", border: "none", background: "none", width: "100%", textAlign: "left",
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#FF5252", cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} strokeWidth={2} color="#FF5252" />
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN PAGE ────────────────────────────────────────────────────────
   Only ever rendered for the platform organizer (yonetoussaint25@gmail.com,
   gated both by the entry point in AccountPage and by the isOrganizer check
   where this is mounted in App()). Lists every competition across every
   niche in one place so nothing needs to be found by browsing the homepage
   first — tapping a row jumps straight into that competition's edit panel. */
function AdminPage({ niches, onOpenComp, onToggleActive, onBack }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Total");

  const allEntries = niches.flatMap((niche) =>
    niche.competitions.map((comp) => ({ comp, niche }))
  );

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
    : statusFilter === "Désactivées" ? searchedEntries.filter((e) => !e.comp.active)
    : searchedEntries;

  const totalComps = allEntries.length;
  const liveCount = allEntries.filter((e) => e.comp.phase === "live").length;
  const registrationCount = allEntries.filter((e) => e.comp.phase === "registration").length;
  const offCount = allEntries.filter((e) => !e.comp.active).length;
  const totalRegistered = allEntries.reduce((sum, e) => sum + (e.comp.registeredCount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
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
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Administration
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
            Gérer toutes les compétitions
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une compétition…"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #e0e0e0", borderRadius: 999,
              padding: "10px 14px 10px 36px",
              fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333",
              background: "#fff", outline: "none",
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
                  border: isActive ? "1px solid #111" : "1px solid #e0e0e0",
                  background: isActive ? "#111" : "#fff",
                  borderRadius: 999,
                  padding: "8px 14px",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "#555", whiteSpace: "nowrap" }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? "#111" : "#666",
                    background: isActive ? "#fff" : "#F2F2F0",
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

        {/* List */}
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
              Aucune compétition ne correspond à « {query} »
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredEntries.map(({ comp, niche }) => {
              const thumb = comp.bannerUrl || comp.images?.[0]?.url;
              return (
                <div
                  key={comp.id}
                  onClick={() => onOpenComp(comp, niche)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14,
                    padding: 10, cursor: "pointer",
                    opacity: comp.active ? 1 : 0.55,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "#f0f0f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <ImageIcon size={18} color="#ccc" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                        color: comp.phase === "live" ? "#00B894" : "#888",
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {comp.phase === "live" ? "● En direct" : "Inscriptions"}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb" }}>
                        {comp.edition}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>
                      {(comp.registeredCount || 0).toLocaleString("fr-FR")}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      inscrits
                    </span>
                  </div>

                  {/* On/off switch — stopPropagation so it doesn't also open the edit panel */}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onToggleActive(comp); }}
                    aria-label={comp.active ? "Désactiver la compétition" : "Activer la compétition"}
                    style={{
                      flexShrink: 0,
                      width: 40, height: 24, borderRadius: 999,
                      border: "none", cursor: "pointer", padding: 3,
                      background: comp.active ? "#00B894" : "#ddd",
                      display: "flex", alignItems: "center",
                      justifyContent: comp.active ? "flex-end" : "flex-start",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                    }} />
                  </button>

                  <ChevronRight size={16} color="#ccc" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const TX_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "deposit", label: "Dépôts" },
  { id: "withdrawal", label: "Retraits" },
  { id: "gift_sent", label: "Cadeaux" },
];

function groupTransactionsByDay(list) {
  const groups = [];
  const map = new Map();
  for (const tx of list) {
    const day = tx.date.includes(",") ? tx.date.split(",")[0].trim() : tx.date;
    if (!map.has(day)) {
      const group = { day, items: [] };
      map.set(day, group);
      groups.push(group);
    }
    map.get(day).items.push(tx);
  }
  return groups;
}

function DepositNumbersCard({ currentUser, onUpdateNumber, showToast }) {
  const [method, setMethod] = useState("moncash");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const current = PAYMENT_METHODS.find((m) => m.id === method);
  const userNumber = method === "moncash" ? currentUser?.moncashNumber : currentUser?.natcashNumber;
  const isVerified = method === "moncash" ? currentUser?.moncashVerified : currentUser?.natcashVerified;

  function startEditing() {
    setInputValue(userNumber || "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setInputValue("");
  }

  async function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onUpdateNumber?.(method, trimmed);
      showToast && showToast(`Numéro ${current?.label} enregistré`);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save mobile money number:", err);
      showToast && showToast(err?.message ? `Erreur : ${err.message}` : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        background: "#fff",
        borderRadius: 14,
        marginBottom: 16,
        padding: 14,
      }}
    >
      {/* Pill tabs: MonCash / NatCash */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {DEPOSIT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setEditing(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: active ? `1px solid ${m.accent}` : "1px solid #e0e0e0",
                borderRadius: 999,
                background: active ? m.accent : "#fff",
                color: active ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "rgba(255,255,255,0.25)" : m.accent,
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.label.charAt(0)}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* User's own number for the active method */}
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6 }}>
        Votre numéro {current?.label}
      </div>

      {editing ? (
        <div>
          <input
            autoFocus
            type="tel"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ex : ${MOBILE_MONEY_NUMBERS[method]?.number ?? "+509 XX XX XX XX"}`}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#111",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !inputValue.trim()}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: saving ? "default" : "pointer",
                opacity: saving || !inputValue.trim() ? 0.5 : 1,
              }}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 999,
                background: "#fff",
                color: "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {userNumber ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.04em", color: "#111" }}>
                  {userNumber}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: isVerified ? "#E8F7EE" : "#FFF6E5",
                    color: isVerified ? "#1E8449" : "#B7791F",
                  }}
                >
                  {isVerified ? "✓ Vérifié" : "⏳ En attente"}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#999", fontStyle: "italic" }}>
                Aucun numéro {current?.label} enregistré
              </div>
            )}
          </div>
          <button
            onClick={startEditing}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${current?.accent ?? "#111"}`,
              borderRadius: 999,
              background: "#fff",
              color: current?.accent ?? "#111",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            {userNumber ? <Copy size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
            {userNumber ? "Modifier" : "Ajouter"}
          </button>
        </div>
      )}

      {!editing && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: userNumber ? "#C0392B" : "#888", lineHeight: 1.5, marginTop: 10 }}>
          {userNumber
            ? isVerified
              ? `⚠ Vos dépôts ${current?.label} ne seront acceptés que s'ils proviennent de ce numéro.`
              : `Ce numéro sera vérifié automatiquement dès votre premier dépôt réel ${current?.label} depuis celui-ci.`
            : `Ajoutez votre numéro ${current?.label} pour pouvoir déposer avec cette méthode.`}
        </div>
      )}
    </div>
  );
}

function WalletPage({ balance, transactions, currentUser, isAuthenticated, onOpenDeposit, onOpenWithdraw, onOpenNotifications, onUpdateNumber, onRequireAuth, showToast, onBack }) {
  const [txFilter, setTxFilter] = useState("all");
  const [txQuery, setTxQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];

  const filteredTx = effectiveTransactions
    .filter((t) => txFilter === "all" || t.type === txFilter)
    .filter((t) => !txQuery.trim() || t.label.toLowerCase().includes(txQuery.trim().toLowerCase()));
  const groups = groupTransactionsByDay(filteredTx);

  const totalDeposited = effectiveTransactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalGifted = effectiveTransactions
    .filter((t) => t.type === "gift_sent")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const dayChange = effectiveTransactions
    .filter((t) => t.date && t.date.startsWith("Aujourd'hui"))
    .reduce((sum, t) => sum + t.amount, 0);
  const priorBalance = effectiveBalance - dayChange;
  const dayChangePct = priorBalance !== 0 ? (dayChange / Math.abs(priorBalance)) * 100 : 0;


  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "8px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => showToast && showToast("Menu bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Menu size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Messagerie bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <MessageCircle size={20} strokeWidth={2.25} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onOpenNotifications}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Bell size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Aide bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <HelpCircle size={20} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 8px" }}>
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "14px 16px",
            marginBottom: 10,
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
              }}
            >
              Solde disponible
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "3px 7px",
                borderRadius: 6,
                background: dayChange >= 0 ? "#00B89418" : "#FF525218",
                flexShrink: 0,
              }}
            >
              {dayChange >= 0 ? (
                <ArrowUpRight size={12} strokeWidth={2.75} color="#00B894" style={{ flexShrink: 0 }} />
              ) : (
                <ArrowDownLeft size={12} strokeWidth={2.75} color="#FF5252" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: dayChange >= 0 ? "#00B894" : "#FF5252",
                  whiteSpace: "nowrap",
                }}
              >
                {dayChangePct >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px, 7vw, 32px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#111", wordBreak: "break-all" }}>
              {effectiveBalance.toLocaleString("fr-FR")}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#999" }}>
              HTG
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: dayChange >= 0 ? "#00B894" : "#FF5252", marginLeft: "auto" }}>
              {dayChange >= 0 ? "+" : ""}{dayChange.toLocaleString("fr-FR")} aujourd'hui
            </span>
          </div>
        </div>

        {/* Deposit numbers — MonCash / NatCash tabs */}
        {isAuthenticated ? (
          <DepositNumbersCard currentUser={currentUser} onUpdateNumber={onUpdateNumber} showToast={showToast} />
        ) : (
          <div
            style={{
              border: "1px solid #e0e0e0",
              background: "#fafafa",
              borderRadius: 14,
              marginBottom: 16,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#666", marginBottom: 10 }}>
              Connectez-vous pour voir votre portefeuille et gérer vos numéros de dépôt.
            </div>
            <button
              onClick={onRequireAuth}
              style={{
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Total déposé
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#00B894", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              +{totalDeposited.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Cadeaux envoyés
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              -{totalGifted.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Déposer", icon: Plus, onClick: isAuthenticated ? onOpenDeposit : onRequireAuth, filled: true },
            { label: "Retirer", icon: ArrowUpRight, onClick: isAuthenticated ? onOpenWithdraw : onRequireAuth, filled: false },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              style={{
                flex: "1 1 130px",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                borderRadius: 24,
                border: action.filled ? "1px solid #111" : "1px solid #e0e0e0",
                background: action.filled ? "#111" : "#fff",
                color: action.filled ? "#fff" : "#333",
                cursor: "pointer",
                padding: "0 20px",
              }}
            >
              <action.icon size={18} strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
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
            borderRadius: 12,
          }}
        >
          Votre solde est en gourdes haïtiennes (HTG) et représente de l'argent réel. Déposez via MonCash, NatCash ou carte bancaire, et retirez à tout moment vers votre compte mobile money.
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
            marginBottom: 10,
          }}
        >
          Historique
        </div>

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${searchFocused ? "#111" : "#e0e0e0"}`,
            background: "#f9f9f9",
            height: 38,
            borderRadius: 10,
            padding: "0 10px",
            marginBottom: 12,
            transition: "border-color 0.15s",
          }}
        >
          <Search size={15} color={searchFocused ? "#333" : "#aaa"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={txQuery}
            onChange={(e) => setTxQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "#333",
              background: "transparent",
              height: "100%",
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
          {TX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTxFilter(f.id)}
              style={{
                flexShrink: 0,
                border: `1px solid ${txFilter === f.id ? "#111" : "#e0e0e0"}`,
                background: txFilter === f.id ? "#111" : "#fff",
                color: txFilter === f.id ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px", border: "1px solid #e0e0e0", background: "#fff", color: "#aaa", fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 12 }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {groups.map((g) => (
              <div
                key={g.day}
                style={{
                  border: "1px solid #e0e0e0",
                  background: "#fff",
                  overflow: "hidden",
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#999",
                    padding: "10px 14px",
                    background: "#fafafa",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {g.day}
                </div>
                <div>
                  {g.items.map((tx, i) => (
                    <TransactionRow key={tx.id} tx={tx} isLast={i === g.items.length - 1} showToast={showToast} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// The home banner slider used to fall back to static stock photos per niche.
// It now only features competitions that have a real uploaded image in the
// competition-images storage bucket — computed inside App() from `compImages`
// (see `homeBannerSlides`) so nothing fake ever shows up here.

/* ─── NOTIFICATIONS DATA ────────────────────────────────────────────────── */

const INITIAL_NOTIFS = [
  { id: "n1", type: "result",       read: false, ts: Date.now() - 1000 * 60 * 8,    icon: "🏆", title: "Résultats disponibles",     body: "Voix d'Or — la finale est terminée. Découvrez le classement final.", compId: "m2" },
  { id: "n2", type: "activity",     read: false, ts: Date.now() - 1000 * 60 * 23,   icon: "🔥", title: "Battle Hip-Hop s'emballe",   body: "4 820 votes en moins de 2 jours — la compétition est très active.", compId: "m1" },
  { id: "n3", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 61,   icon: "⚡", title: "Plus que 3 places",          body: "DJ Set Open — il ne reste que 3 inscriptions disponibles.", compId: "m4" },
  { id: "n4", type: "system",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 5, icon: "💎", title: "550 crédits ajoutés",       body: "Votre achat a été confirmé. Solde actuel : 425 crédits." },
  { id: "n5", type: "activity",     read: true,  ts: Date.now() - 1000 * 60 * 60 * 9, icon: "👑", title: "Couronne envoyée",          body: "Votre cadeau a été remis à un participant de Voix d'Or." },
  { id: "n6", type: "result",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 22, icon: "🥇", title: "FIFA Masters — Top 3",     body: "Le classement de mi-parcours est disponible. 14 500 votes comptabilisés.", compId: "g1" },
  { id: "n7", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 60 * 26, icon: "📋", title: "Illustration Duel ouvert", body: "Les inscriptions pour Illustration Duel viennent d'ouvrir. 40 places.", compId: "a3" },
];

function fmtNotifTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

const NOTIF_TYPE_COLOR = {
  result:       { bg: "#fff8e6", border: "#ffe08a", dot: "#f39c12" },
  activity:     { bg: "#fff0ed", border: "#ffcfc7", dot: "#e74c3c" },
  registration: { bg: "#f0ebff", border: "#d5c8ff", dot: "#6C63FF" },
  system:       { bg: "#f0fbf7", border: "#b8edd9", dot: "#00B894" },
  action:       { bg: "#f7f7f5", border: "#e0e0e0", dot: "#888"    },
};

function NotificationsPage({ notifications, onMarkAllRead, onMarkRead, onOpen }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header style={{
        borderBottom: "1px solid #e0e0e0", background: "#fff",
        position: "sticky", top: 0, zIndex: 50,
        padding: "16px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
          Notifications
          {unread > 0 && (
            <span style={{
              marginLeft: 8,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              background: "#e74c3c", color: "#fff",
              padding: "2px 7px",
              verticalAlign: "middle",
            }}>{unread}</span>
          )}
        </span>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{
              border: "none", background: "none",
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", letterSpacing: "0.04em", textTransform: "uppercase",
              cursor: "pointer", padding: 0,
            }}
          >Tout lire</button>
        )}
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 6 }}>
              Aucune notification
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
              Les activités de vos compétitions apparaîtront ici.
            </div>
          </div>
        ) : notifications.map((notif) => {
          const colors = NOTIF_TYPE_COLOR[notif.type] ?? NOTIF_TYPE_COLOR.action;
          return (
            <div
              key={notif.id}
              onClick={() => {
                onMarkRead(notif.id);
                if (notif.compId) onOpen?.(notif.compId);
              }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: notif.read ? "#fff" : colors.bg,
                border: `1px solid ${notif.read ? "#e0e0e0" : colors.border}`,
                padding: "12px 14px",
                cursor: notif.compId ? "pointer" : "default",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              {/* Icon + unread dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38,
                  background: notif.read ? "#f7f7f5" : colors.bg,
                  border: `1px solid ${notif.read ? "#e8e8e8" : colors.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, lineHeight: 1,
                }}>
                  {notif.icon}
                </div>
                {!notif.read && (
                  <div style={{
                    position: "absolute", top: -3, right: -3,
                    width: 8, height: 8, borderRadius: "50%",
                    background: colors.dot,
                    border: "2px solid #fff",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  gap: 8, marginBottom: 2,
                }}>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                    color: "#222", lineHeight: 1.2,
                  }}>{notif.title}</span>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb",
                    fontWeight: 500, flexShrink: 0,
                  }}>{fmtNotifTime(notif.ts)}</span>
                </div>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666",
                  lineHeight: 1.45, display: "block",
                }}>{notif.body}</span>
                {notif.compId && (
                  <span style={{
                    display: "inline-block", marginTop: 6,
                    fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: colors.dot,
                  }}>Voir la compétition <ChevronRight size={11} style={{ display: "inline" }} /></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function App() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const [homeSearchFocused, setHomeSearchFocused] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedComp, setSelectedComp] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [lastDepositMethod, setLastDepositMethod] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationComp, setRegistrationComp] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load real balance + transaction history from Supabase once authenticated.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;

    supabase
      .from("wallet_balances")
      .select("balance")
      .eq("user_id", currentUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("wallet_balances fetch error:", error);
        setBalance(data?.balance || 0);
      });

    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("wallet_transactions fetch error:", error);
          return;
        }
        setTransactions(
          (data || []).map((t) => ({
            id: t.id,
            type: t.type,
            label: t.label,
            amount: Number(t.amount),
            date: new Date(t.created_at).toLocaleString("fr-FR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            }),
          }))
        );
      });

    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Real-time: the moment the SMS server auto-credits a matching deposit,
  // push it straight into the wallet — no user action, no page refresh.
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel(`wallet-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          const t = payload.new;
          const amt = Number(t.amount);
          setBalance((b) => b + amt);
          setTransactions((tx) => {
            if (tx.some((existing) => existing.id === t.id)) return tx;
            return [
              { id: t.id, type: t.type, label: t.label, amount: amt, date: "À l'instant" },
              ...tx,
            ];
          });
          if (amt > 0) {
            showToast(`+${amt.toLocaleString("fr-FR")} HTG crédités`);
            pushNotif({ type: "action", icon: "💰", title: "Dépôt reçu", body: t.label });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);
  const [registeredCompIds, setRegisteredCompIds] = useState(() => new Set());
  const [followedCompIds, setFollowedCompIds] = useState(() => new Set());
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [pendingRegistrationComp, setPendingRegistrationComp] = useState(null);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [compEdits, setCompEdits] = useState({});
  const [compImages, setCompImages] = useState({});
  const [compRegCounts, setCompRegCounts] = useState({});
  const [compEditIntent, setCompEditIntent] = useState(false);

  useEffect(() => {
    fetchCompetitionEdits().then(setCompEdits);
    fetchAllCompetitionImages().then(setCompImages);
    fetchAllRegistrationCounts().then(setCompRegCounts);
  }, []);

  function withEdits(comp) {
    const e = compEdits[comp.id] || {};
    return {
      ...comp,
      ...e,
      // A cleared field — or a field never set at all, e.g. because the
      // only edit ever saved for this competition was the active toggle —
      // saves/loads as null. Fall back to the seed value in every case
      // rather than let a blank silently wipe out real data.
      title: e.title != null ? e.title : comp.title,
      edition: e.edition != null ? e.edition : comp.edition,
      ends: e.ends != null ? e.ends : comp.ends,
      phase: e.phase != null ? e.phase : comp.phase,
      endsAt: e.endsAt != null ? e.endsAt : comp.endsAt,
      contestants: e.contestants != null ? e.contestants : comp.contestants,
      bannerUrl: e.bannerUrl != null ? e.bannerUrl : comp.bannerUrl,
      description: e.description != null ? e.description : comp.description,
      prizeAmount: e.prizeAmount != null ? e.prizeAmount : comp.prizeAmount,
      fee: e.fee != null ? e.fee : comp.fee,
      rewardExtra: e.rewardExtra != null ? e.rewardExtra : comp.rewardExtra,
      rules: (e.rules && e.rules.length > 0) ? e.rules : comp.rules,
      // Real count from the registrations table always wins over any
      // seeded placeholder — 0 until someone actually registers.
      registeredCount: compRegCounts[comp.id] ?? 0,
      images: compImages[comp.id] || [],
      // Competitions are active unless an admin explicitly switched them off.
      active: e.active !== false,
    };
  }

  // Quick on/off toggle from the admin list — merges into whatever edits
  // already exist for this competition so title/description/etc. already
  // saved aren't clobbered.
  async function handleToggleCompActive(comp) {
    const nextActive = !comp.active;
    const edits = { ...(compEdits[comp.id] || {}), active: nextActive };
    const { error } = await saveCompetitionEdit({
      competitionId: comp.id,
      ...edits,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("saveCompetitionEdit error:", error);
      showToast("Impossible de mettre à jour le statut.");
      return;
    }
    setCompEdits((prev) => ({ ...prev, [comp.id]: edits }));
    showToast(nextActive ? "Compétition activée." : "Compétition désactivée — masquée de l'accueil.");
  }

  // Admin page → jump straight to a competition's edit panel, regardless of
  // the homepage's current filter/search state. `comp` here already has
  // edits/images applied (it comes from allNichesWithEdits).
  function handleAdminOpenComp(comp, niche) {
    setCompEditIntent(true);
    setSelectedComp({ ...comp, accent: niche.accent, niche: niche.label });
  }

  // Home banner slides: prefer each competition's dedicated banner image
  // (set from the edit screen's "Bannière" section); fall back to its first
  // gallery image if no banner was uploaded. A hot competition with neither
  // simply doesn't get a slide — nothing fake ever shows up here.
  // Home banner slides: any competition with a dedicated banner (set from the
  // edit screen's "Bannière" section) is shown on the homepage — that's the
  // whole point of that control. Competitions without a banner fall back to
  // their first gallery image, but only if they're flagged "hot"; nothing
  // fake or unintentional ever shows up here.
  const homeBannerSlides = useMemo(() => {
    return NICHES.flatMap((niche) =>
      niche.competitions
        .filter((c) => compEdits[c.id]?.active !== false)
        .filter((c) => compEdits[c.id]?.bannerUrl || (c.hot && compImages[c.id]?.length > 0))
        .map((c) => ({
          ...c,
          niche,
          color: niche.accent,
          image: compEdits[c.id]?.bannerUrl || compImages[c.id][0].url,
        }))
    ).slice(0, 6);
  }, [compImages, compEdits]);

  async function handleEditComp({ competitionId, title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl }) {
    const edits = { title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl };
    const { data, error } = await saveCompetitionEdit({
      competitionId,
      ...edits,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("saveCompetitionEdit error:", error);
      showToast("Impossible d'enregistrer les modifications.");
      return { success: false };
    }
    setCompEdits((prev) => ({ ...prev, [competitionId]: edits }));
    setSelectedComp((prev) => (prev && prev.id === competitionId ? {
      ...prev,
      ...edits,
      contestants: edits.contestants != null ? edits.contestants : prev.contestants,
      endsAt: edits.endsAt != null ? edits.endsAt : prev.endsAt,
      fee: edits.fee != null ? edits.fee : prev.fee,
    } : prev));
    showToast("Compétition mise à jour.");
    return { success: true, data };
  }

  async function handleAddCompImage(competitionId, file) {
    const position = (compImages[competitionId] || []).length;
    const { data, error } = await addCompetitionImage({ competitionId, file, position });
    if (error) {
      console.error("addCompetitionImage error:", error);
      showToast("Échec de l'envoi de l'image.");
      return null;
    }
    setCompImages((prev) => ({ ...prev, [competitionId]: [...(prev[competitionId] || []), data] }));
    setSelectedComp((prev) => (prev && prev.id === competitionId ? { ...prev, images: [...(prev.images || []), data] } : prev));
    return data;
  }

  async function handleRemoveCompImage(competitionId, imageId) {
    const { error } = await deleteCompetitionImage(imageId);
    if (error) {
      console.error("deleteCompetitionImage error:", error);
      showToast("Échec de la suppression de l'image.");
      return;
    }
    setCompImages((prev) => ({ ...prev, [competitionId]: (prev[competitionId] || []).filter((i) => i.id !== imageId) }));
    setSelectedComp((prev) => (prev && prev.id === competitionId ? { ...prev, images: (prev.images || []).filter((i) => i.id !== imageId) } : prev));
  }

  function pushNotif(notif) {
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, read: false, ts: Date.now(), ...notif },
      ...prev,
    ]);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  useEffect(() => {
    if (homeBannerSlides.length === 0) return;
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % homeBannerSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [homeBannerSlides.length]);

  // Background activity: push a notif for a random hot comp every ~45s
  useEffect(() => {
    const ACTIVITY_NOTIFS = [
      (c, n) => ({ type: "activity", icon: "🔥", title: `${c.title} s'emballe`, body: `${fmtVotes(c.votes + Math.floor(Math.random() * 500))} votes comptabilisés — la compétition est très active.`, compId: c.id }),
      (c, n) => ({ type: "result",   icon: "🏆", title: `Nouveau leader — ${c.title}`, body: `${fakeName(Math.floor(Math.random() * 10))} prend la tête du classement.`, compId: c.id }),
      (c, n) => ({ type: "activity", icon: "⚡", title: `Dernières heures — ${c.title}`, body: `La compétition se termine dans ${c.ends}. Votez maintenant !`, compId: c.id }),
    ];
    function scheduleNext() {
      const delay = 40000 + Math.random() * 20000;
      return setTimeout(() => {
        const hotComps = NICHES.flatMap((n) => n.competitions.filter((c) => c.hot && compEdits[c.id]?.active !== false));
        const comp = hotComps[Math.floor(Math.random() * hotComps.length)];
        const template = ACTIVITY_NOTIFS[Math.floor(Math.random() * ACTIVITY_NOTIFS.length)];
        pushNotif(template(comp));
        timerRef.current = scheduleNext();
      }, delay);
    }
    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, []);

  // Rebuild the registered-competitions set from the database whenever we
  // know who the current user is — this runs both after a fresh login and
  // after the session is restored on page refresh, so registration state
  // survives a reload instead of resetting to an empty Set.
  useEffect(() => {
    if (!currentUser?.id) {
      setRegisteredCompIds(new Set());
      return;
    }
    console.log("Fetching registrations for user:", currentUser.id); // debug
    let cancelled = false;
    fetchUserRegistrations(currentUser.id).then((rows) => {
      if (cancelled) return;
      console.log("Registrations returned:", rows); // debug
      setRegisteredCompIds(new Set(rows.map((r) => r.competition_id)));
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const nichesByFilter = (
    activeFilter === "Tous"
      ? NICHES
      : NICHES.filter((n) => n.label === activeFilter)
  )
    .map((niche) => ({
      ...niche,
      // Homepage only ever shows competitions the admin has left switched on.
      competitions: niche.competitions.map(withEdits).filter((c) => c.active),
    }))
    // A niche whose every competition is switched off shouldn't appear
    // as an empty section on the homepage at all.
    .filter((niche) => niche.competitions.length > 0);

  // Full, unfiltered list (every niche, every competition) — powers the
  // admin page so the platform organizer can find and edit anything
  // regardless of the homepage's current niche filter or search query.
  const allNichesWithEdits = NICHES.map((niche) => ({
    ...niche,
    competitions: niche.competitions.map(withEdits),
  }));

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

  function handleDeposit(methodId) {
    setLastDepositMethod(methodId);
    setShowBuyModal(false);
  }

  function handleWithdraw(amount, methodLabel) {
    if (amount > balance) {
      showToast("Solde insuffisant");
      return;
    }
    setBalance((b) => b - amount);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "withdrawal", label: `Retrait — ${methodLabel}`, amount: -amount, date: "À l'instant" },
      ...tx,
    ]);
    setShowWithdrawModal(false);
    showToast(`Retrait de ${amount.toLocaleString("fr-FR")} HTG en cours`);
  }


  function handleSendGift(gift, comp) {
    const price = comp?.priceHTG ?? gift.cost;
    if (balance < price) {
      showToast("Crédits insuffisants");
      return;
    }
    setBalance((b) => b - price);
    const recipient = comp?.recipientName;
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "gift_sent", label: comp ? `${gift.name} envoyé à ${recipient || "un participant"} — ${comp.title}` : `${gift.name} envoyé`, amount: -price, date: "À l'instant" },
      ...tx,
    ]);
    if (comp) pushNotif({ type: "action", icon: gift.icon, title: `${gift.name} envoyé`, body: `Votre cadeau a été remis à ${recipient || "un participant"} de ${comp.title}.`, compId: comp.id });
    showToast(comp ? `${gift.icon} ${gift.name} → ${recipient || "participant"}` : `${gift.icon} ${gift.name} envoyé`);
  }

  async function handleRegister(comp, fee) {
    if (!currentUser?.id) {
      return { success: false, error: "Vous devez être connecté pour vous inscrire." };
    }
    if (currentUser.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE) {
      return { success: false, error: "Un organisateur ne peut pas s'inscrire à sa propre compétition." };
    }

    const { error } = await insertRegistration({
      competitionId: comp.id,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      fee: fee || 0,
    });

    if (error) {
      const alreadyRegistered = error.code === "23505"; // unique(competition_id, user_id) violation
      return {
        success: false,
        error: alreadyRegistered
          ? "Vous êtes déjà inscrit à cette compétition."
          : "Une erreur est survenue. Réessayez.",
      };
    }

    if (fee) {
      setBalance((b) => b - fee);
      setTransactions((tx) => [
        { id: `t-${Date.now()}`, type: "gift_sent", label: `Inscription — ${comp.title}`, amount: -fee, date: "À l'instant" },
        ...tx,
      ]);
    }
    setRegisteredCompIds((prev) => new Set(prev).add(comp.id));
    pushNotif({ type: "action", icon: "✅", title: `Inscription confirmée`, body: `Vous êtes inscrit à ${comp.title}. Bonne chance !`, compId: comp.id });
    showToast(`Inscrit à ${comp.title}!`);
    return { success: true };
  }

  function toggleFollowComp(comp) {
    if (!isAuthenticated) {
      setPendingRegistrationComp({ ...comp, _pendingAction: "follow" });
      setShowAuthOverlay(true);
      return;
    }
    setFollowedCompIds((prev) => {
      const next = new Set(prev);
      if (next.has(comp.id)) {
        next.delete(comp.id);
        showToast(`Suivi retiré — ${comp.title}`);
      } else {
        next.add(comp.id);
        pushNotif({ type: "registration", icon: "🔔", title: `Vous suivez ${comp.title}`, body: `Vous recevrez des notifications sur l'évolution des inscriptions et des votes.`, compId: comp.id });
        showToast(`${comp.title} ajouté aux suivis`);
      }
      return next;
    });
  }

  function requestRegistration(comp) {
    if (registeredCompIds.has(comp.id)) {
      showToast(`Vous êtes déjà inscrit à ${comp.title}`);
      return;
    }
    if (currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE) {
      showToast("Un organisateur ne peut pas s'inscrire à sa propre compétition");
      return;
    }
    if (!isAuthenticated) {
      setPendingRegistrationComp(comp);
      setShowAuthOverlay(true);
    } else {
      setRegistrationComp(comp);
      setShowRegistrationModal(true);
    }
  }

  async function handleAuthenticated(user) {
    const rawName = user.user_metadata?.full_name;
    const isPlatformOrganizer = user.email?.toLowerCase() === PLATFORM_ORGANIZER_EMAIL.toLowerCase();
    const fullName = isPlatformOrganizer
      ? PLATFORM_ORGANIZER_SIGLE
      : rawName || user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("moncash_verified, natcash_verified")
      .eq("id", user.id)
      .maybeSingle();

    setIsAuthenticated(true);
    setCurrentUser({
      id: user.id,
      email: user.email,
      fullName,
      isOrganizer: isPlatformOrganizer,
      organizerStatus: isPlatformOrganizer ? "approved" : null,
      moncashNumber: user.user_metadata?.moncash_number || null,
      natcashNumber: user.user_metadata?.natcash_number || null,
      moncashVerified: !!profileRow?.moncash_verified,
      natcashVerified: !!profileRow?.natcash_verified,
    });
    setShowAuthOverlay(false);
    if (pendingRegistrationComp) {
      const pending = pendingRegistrationComp;
      setPendingRegistrationComp(null);
      if (pending._pendingAction === "follow") {
        setFollowedCompIds((prev) => {
          const next = new Set(prev);
          next.add(pending.id);
          return next;
        });
        showToast(`${pending.title} ajouté aux suivis`);
      } else {
        setRegistrationComp(pending);
        setShowRegistrationModal(true);
      }
    }
  }

  // Restore an existing Supabase session on load, and keep state in sync
  // with sign-in / sign-out / token refresh events from anywhere in the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthenticated(session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setCurrentUser(null);
      } else if (session?.user) {
        handleAuthenticated(session.user);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast && showToast("Déconnecté");
  }

  async function handleUpdateMobileMoneyNumber(method, number) {
    const metadataKey = method === "moncash" ? "moncash_number" : "natcash_number";
    const verifiedKey = method === "moncash" ? "moncash_verified" : "natcash_verified";
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Votre session a expiré. Reconnectez-vous et réessayez.");
    }
    const userId = sessionData.session.user.id;

    const { error } = await supabase.auth.updateUser({ data: { [metadataKey]: number } });
    if (error) {
      console.error("supabase.auth.updateUser error:", error);
      throw error;
    }

    // If the number is actually changing, it goes back to unverified —
    // it only becomes verified again once a real deposit arrives from it.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select(metadataKey)
      .eq("id", userId)
      .maybeSingle();
    const numberChanged = existingProfile?.[metadataKey] !== number;

    // Also mirror into `profiles` so the SMS server can match this number
    // with a simple queryable column (auth.users metadata isn't queryable
    // from the backend without the admin API).
    const patch = {
      id: userId,
      user_id: userId, // keep both in sync while it exists
      [metadataKey]: number,
      updated_at: new Date().toISOString(),
    };
    if (numberChanged) {
      patch[verifiedKey] = false;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(patch, { onConflict: "id" });
    if (profileError) {
      console.error("profiles upsert error:", profileError);
      if (profileError.code === "23505") {
        throw new Error("Ce numéro est déjà vérifié et lié à un autre compte.");
      }
      throw profileError;
    }
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            moncashNumber: method === "moncash" ? number : prev.moncashNumber,
            natcashNumber: method === "natcash" ? number : prev.natcashNumber,
            moncashVerified: method === "moncash" && numberChanged ? false : prev.moncashVerified,
            natcashVerified: method === "natcash" && numberChanged ? false : prev.natcashVerified,
          }
        : prev
    );
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
        @keyframes bar-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bar-shimmer {
          background-size: 200% 100%;
          animation: bar-shimmer 1.6s linear infinite;
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
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onOpenDeposit={() => setShowBuyModal(true)}
          onOpenWithdraw={() => setShowWithdrawModal(true)}
          onOpenNotifications={() => setActiveTab("notifications")}
          onUpdateNumber={handleUpdateMobileMoneyNumber}
          onRequireAuth={() => setShowAuthOverlay(true)}
          showToast={showToast}
          onBack={() => setActiveTab("home")}
        />
      ) : activeTab === "notifications" ? (
        <NotificationsPage
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onOpen={(compId) => {
            const result = findCompWithNiche(compId);
            if (result) { setCompEditIntent(false); setSelectedComp(withEdits({ ...result.comp, accent: result.niche.accent, niche: result.niche.label })); }
          }}
        />
      ) : activeTab === "mycomps" ? (
        <MyCompetitionsPage
          registeredCompIds={registeredCompIds}
          followedCompIds={followedCompIds}
          onOpen={(comp) => { setCompEditIntent(false); setSelectedComp(withEdits(comp)); }}
        />
      ) : activeTab === "account" ? (
        <AccountPage
          currentUser={currentUser}
          balance={balance}
          onOpenWallet={() => setActiveTab("wallet")}
          onLoginRequest={() => setShowAuthOverlay(true)}
          onLogout={handleLogout}
          onOpenAdmin={() => setActiveTab("admin")}
        />
      ) : activeTab === "admin" && currentUser?.isOrganizer ? (
        <AdminPage
          niches={allNichesWithEdits}
          onOpenComp={handleAdminOpenComp}
          onToggleActive={handleToggleCompActive}
          onBack={() => setActiveTab("account")}
        />
      ) : (
      <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 64 }}>

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
          <div style={{ padding: "8px" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${homeSearchFocused ? "#111" : "#e0e0e0"}`,
                background: "#f9f9f9",
                height: 38,
                borderRadius: 10,
                padding: "0 10px",
                transition: "border-color 0.15s",
              }}
            >
              <Search size={15} color={homeSearchFocused ? "#333" : "#aaa"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Rechercher une compétition..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setHomeSearchFocused(true)}
                onBlur={() => setHomeSearchFocused(false)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#333",
                  background: "transparent",
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Chips row — edge to edge */}
          <div style={{ display: "flex", gap: 8, padding: "0 8px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
            {ALL_NICHES.map((label) => {
              const active = activeFilter === label;
              const niche = NICHES.find((n) => n.label === label);
              return (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: active ? "#fff" : "#666",
                    background: active ? "#111" : "#f5f5f5",
                    border: `1px solid ${active ? "#111" : "#e5e5e5"}`,
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
                  {(() => { const Icon = NICHE_ICONS[label]; return Icon ? <Icon size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} /> : null; })()}
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── BANNER SLIDER (2:1, real uploaded images only) ── */}
        {homeBannerSlides.length > 0 && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "2.2 / 1",
            overflow: "hidden",
            borderBottom: "2px solid #111",
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
              onOpen={(comp) => { setCompEditIntent(false); setSelectedComp({ ...comp, accent: niche.accent, niche: niche.label }); }}
              onRegister={(comp) => requestRegistration({ ...comp, accent: niche.accent, niche: niche.label })}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
          ))}
        </main>


      </div>
      )}

      {showBuyModal && (
        <DepositModal onClose={() => setShowBuyModal(false)} onDeposit={handleDeposit} lastMethod={lastDepositMethod} />
      )}
      {showWithdrawModal && (
        <WithdrawModal balance={balance} onClose={() => setShowWithdrawModal(false)} onWithdraw={handleWithdraw} />
      )}
      {showRegistrationModal && registrationComp && (
        <RegistrationModal 
          comp={registrationComp} 
          currentUser={currentUser}
          balance={balance}
          onOpenBuy={() => setShowBuyModal(true)}
          onClose={() => {
            setShowRegistrationModal(false);
            setRegistrationComp(null);
          }}
          onRegister={handleRegister}
          showToast={showToast}
        />
      )}

      {showAuthOverlay && (
        <AuthOverlay
          compTitle={pendingRegistrationComp?._pendingAction !== "follow" ? pendingRegistrationComp?.title : undefined}
          followIntent={pendingRegistrationComp?._pendingAction === "follow" ? pendingRegistrationComp?.title : undefined}
          onClose={() => {
            setShowAuthOverlay(false);
            setPendingRegistrationComp(null);
          }}
          onAuthenticated={handleAuthenticated}
        />
      )}

      <BottomTabBar active={activeTab} onChange={setActiveTab} unreadCount={unreadCount} />

      {selectedComp && (
        <CompetitionBoard
          comp={selectedComp}
          onClose={() => { setSelectedComp(null); setCompEditIntent(false); }}
          balance={balance}
          onSendGift={handleSendGift}
          onOpenBuy={() => setShowBuyModal(true)}
          onRegister={requestRegistration}
          showToast={showToast}
          isRegistered={registeredCompIds.has(selectedComp.id)}
          isFollowed={followedCompIds.has(selectedComp.id)}
          onToggleFollow={toggleFollowComp}
          currentUser={currentUser}
          onRequestAuth={() => setShowAuthOverlay(true)}
          onEditComp={handleEditComp}
          onAddImage={handleAddCompImage}
          onRemoveImage={handleRemoveCompImage}
          startInEditMode={compEditIntent}
        />
      )}
    </>
  );
}
