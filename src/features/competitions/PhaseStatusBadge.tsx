import { BadgeCheck } from "lucide-react";

// Small status chip used in place of a "Voir plus" button on headings that
// have nothing to navigate to (Cagnotte, Statistiques) — reflects the
// competition's actual phase rather than a fabricated stat.
export default function PhaseStatusBadge({ isRegistration, isCompleted }) {
  if (isCompleted) {
    return (
      <span style={{
        display: "flex", alignItems: "center", gap: 4,
        fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
        color: "#7a7a7a", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        <BadgeCheck size={11} strokeWidth={2.5} />
        Terminé
      </span>
    );
  }
  if (isRegistration) {
    return (
      <span style={{
        fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700,
        color: "#7a7a7a", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        Bientôt
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9.5, fontWeight: 700, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Live
      </span>
    </span>
  );
}
