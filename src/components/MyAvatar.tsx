// ─── MyAvatar ─────────────────────────────────────────────────────────────
// Fills the parent circle (sets width/height/overflow/border) with either
// the person's real photo, or — when none is on file — a flat initials
// circle built from their name. Never a stock/mock photo.

import { User } from "lucide-react";

export default function MyAvatar({ user, size = 34, fontSize = 13, iconSize = 14, loggedBg = "#111", guestBg = "#e0e0e0" }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName || "Profil"}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: user ? loggedBg : guestBg, color: "#fff",
      fontFamily: "'Space Grotesk', sans-serif", fontSize, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {user ? user.fullName.charAt(0).toUpperCase() : <User size={iconSize} color="#999" />}
    </div>
  );
}