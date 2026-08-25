// Gift catalog with cost in points
export const GIFT_CATALOG = [
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

// Gift "points" (shown on the icon) are not the same as the actual HTG
// price charged — points are a display/prestige number, the real cost in
// gourdes is derived from this rate (e.g. 50 points -> 45 HTG at 0.9).
export const POINTS_TO_HTG_RATE = 0.9;

export function giftPriceHTG(gift) {
  return Math.round(gift.cost * POINTS_TO_HTG_RATE);
}
