// ─── NewsBand ─────────────────────────────────────────────────────────────
// Scrolling ticker band shown at the top of the home screen.

const NEWS_ITEMS = [
  "✦ Concours de Beauté Saison 1 entre en demi-finale",
  "🏆 Miss Élégance : la finale approche",
  "👑 Concours de Beauté — vote en direct, votez maintenant",
  "📋 Top Model Open dépasse les 20 inscriptions",
  "✦ Miss Élégance — derniers votes avant la finale",
];

export default function NewsBand() {
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