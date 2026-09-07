import { ChevronRight } from "lucide-react";
import PageHeader from "./PageHeader";

// Types
export interface Notification {
  id: string;
  type: "result" | "activity" | "registration" | "system" | "action";
  read: boolean;
  ts: number;
  icon: string;
  title: string;
  body: string;
  compId?: string;
}

// Constants
export const NOTIF_TYPE_COLOR = {
  result:       { bg: "#3d311a", border: "#6a5a30", dot: "#f39c12" },
  activity:     { bg: "#3f2423", border: "#6a3530", dot: "#ff6b5e" },
  registration: { bg: "#262048", border: "#3f3f5a", dot: "#B9A2FF" },
  system:       { bg: "#0f3b2e", border: "#1e5c44", dot: "#00B894" },
  action:       { bg: "#26262a", border: "#2a2a2e", dot: "#8a8a90" },
};

export const INITIAL_NOTIFS: Notification[] = [
  { id: "n1", type: "result",       read: false, ts: Date.now() - 1000 * 60 * 8,    icon: "🏆", title: "Résultats disponibles",     body: "Miss Élégance — la demi-finale est terminée. Découvrez le classement final.", compId: "b2" },
  { id: "n2", type: "activity",     read: false, ts: Date.now() - 1000 * 60 * 23,   icon: "🔥", title: "Concours de Beauté s'emballe", body: "6 240 votes en moins de 2 jours — la compétition est très active.", compId: "b1" },
  { id: "n3", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 61,   icon: "⚡", title: "Plus que 13 places",          body: "Top Model Open — il ne reste que 13 inscriptions disponibles.", compId: "b3" },
  { id: "n4", type: "system",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 5, icon: "💎", title: "550 crédits ajoutés",       body: "Votre achat a été confirmé. Solde actuel : 425 crédits." },
  { id: "n5", type: "activity",     read: true,  ts: Date.now() - 1000 * 60 * 60 * 9, icon: "👑", title: "Couronne envoyée",          body: "Votre cadeau a été remis à un participant de Concours de Beauté." },
  { id: "n6", type: "result",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 22, icon: "🥇", title: "Miss Élégance — Top 3",     body: "Le classement de mi-parcours est disponible. 4 810 votes comptabilisés.", compId: "b2" },
  { id: "n7", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 60 * 26, icon: "📋", title: "Top Model Open ouvert", body: "Les inscriptions pour Top Model Open viennent d'ouvrir. 20 places.", compId: "b3" },
];

export function fmtNotifTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

// Sub-components
export function NotificationEmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 8px" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", marginBottom: 6 }}>
        Aucune notification
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", lineHeight: 1.5 }}>
        Les activités de vos compétitions apparaîtront ici.
      </div>
    </div>
  );
}

export function NotificationItem({ notif, onClick }: { notif: Notification; onClick: () => void }) {
  const colors = NOTIF_TYPE_COLOR[notif.type] ?? NOTIF_TYPE_COLOR.action;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "12px 16px",
        borderTop: "1px solid #2a2a2e",
        background: notif.read ? "transparent" : colors.bg,
        cursor: notif.compId ? "pointer" : "default",
        transition: "background 0.2s",
      }}
    >
      {/* Icon + unread dot */}
      <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
        <div style={{
          width: 34, height: 34,
          background: notif.read ? "#26262a" : colors.bg,
          border: `1px solid ${notif.read ? "#2a2a2e" : colors.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, lineHeight: 1,
        }}>
          {notif.icon}
        </div>
        {!notif.read && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 7, height: 7, borderRadius: "50%",
            background: colors.dot,
            border: "2px solid #111",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#eaeaea", lineHeight: 1.2 }}>
            {notif.title}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90", fontWeight: 500, flexShrink: 0 }}>
            {fmtNotifTime(notif.ts)}
          </span>
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9", lineHeight: 1.45, display: "block" }}>
          {notif.body}
        </span>
        {notif.compId && (
          <span style={{ display: "inline-block", marginTop: 4, fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.dot }}>
            Voir la compétition <ChevronRight size={11} style={{ display: "inline" }} />
          </span>
        )}
      </div>
    </div>
  );
}

export function NotificationList({ notifications, onItemClick }: { notifications: Notification[]; onItemClick: (id: string) => void }) {
  if (notifications.length === 0) {
    return <NotificationEmptyState />;
  }
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {notifications.map((notif) => (
        <NotificationItem key={notif.id} notif={notif} onClick={() => onItemClick(notif.id)} />
      ))}
    </div>
  );
}

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onOpen: (compId: string) => void;
}

export default function NotificationsPage({ notifications, onMarkAllRead, onMarkRead, onOpen }: NotificationsPageProps) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <PageHeader
        title="Notifications"
        badge={unread}
        actions={
          unread > 0 ? (
            <button
              onClick={onMarkAllRead}
              style={{
                border: "none", background: "none",
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#9a9aa0", letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: "pointer", padding: "8px",
              }}
            >Tout lire</button>
          ) : undefined
        }
      />
      <NotificationList
        notifications={notifications}
        onItemClick={(id) => {
          onMarkRead(id);
          const notif = notifications.find(n => n.id === id);
          if (notif?.compId) onOpen(notif.compId);
        }}
      />
    </div>
  );
}
