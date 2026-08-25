// ─── Home-screen horizontal rail (per niche) ──────────────────────────────
// Extracted from App.tsx. Renders one section row per niche with a
// horizontally scrollable rail of CompCards.

import { useRef, useState, useEffect } from "react";
import { LayoutGrid, Heart, Music, PersonStanding, Trophy, Palette, Laugh, Sparkles, Gamepad2 } from "lucide-react";
import CompCard from "../../CompCard";
import { isCompOwner } from "../../lib/competitionData";

export const NICHE_ICONS = {
  "Tous": LayoutGrid,
  "Favoris": Heart,
  "Musique": Music,
  "Danse": PersonStanding,
  "Sports": Trophy,
  "Art & Design": Palette,
  "Comédie": Laugh,
  "Beauté": Sparkles,
  "Gaming": Gamepad2,
};

export default function NicheRow({ niche, onOpen, onRegister, registeredCompIds, currentUser }) {
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
    <section style={{ marginBottom: 0, borderBottom: "2px solid #2a2a2e", paddingBottom: 8, paddingTop: 8 }}>
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
            color: "#f2f2f2",
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
            color: "#f2f2f2",
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
          <CompCard key={comp.id} comp={comp} accent={niche.accent} onOpen={onOpen} onRegister={onRegister} isRegistered={registeredCompIds?.has(comp.id)} isOwnCompetition={isCompOwner(comp, currentUser)} />
        ))}

      </div>
    </section>
  );
}