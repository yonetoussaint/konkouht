import { Bell, MoreHorizontal } from "lucide-react";

interface PageHeaderProps {
  title: string;
  badge?: number;
  showBack?: boolean;
  onBack?: () => void;
  onNotifications?: () => void;
  onMore?: () => void;
  unreadCount?: number;
  background?: string;
  borderColor?: string;
}

export default function PageHeader({
  title,
  badge,
  showBack = false,
  onBack,
  onNotifications,
  onMore,
  unreadCount,
  background = "#1c1c1f",
  borderColor = "#2a2a2e",
}: PageHeaderProps) {
  return (
    <header
      style={{
        background,
        borderBottom: `1px solid ${borderColor}`,
        padding: "0 16px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* left side */}
      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
        {showBack && onBack ? (
          <button
            onClick={onBack}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "8px 0 8px 0",
              color: "#eaecef",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              minWidth: 0,
            }}
          >
            {/* chevron pointing right — visually points back */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {title}
          </button>
        ) : (
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#f2f2f2",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
            {badge !== undefined && badge > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#e74c3c",
                  color: "#fff",
                  padding: "2px 7px",
                  borderRadius: 999,
                  verticalAlign: "middle",
                }}
              >
                {badge}
              </span>
            )}
          </span>
        )}
      </div>

      {/* right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {onNotifications && (
          <button
            onClick={onNotifications}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 8,
              color: "#eaecef",
              display: "flex",
              position: "relative",
            }}
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: "#f6465d",
                  borderRadius: "50%",
                  border: "2px solid transparent",
                }}
              />
            )}
          </button>
        )}
        {onMore && (
          <button
            onClick={onMore}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 8,
              color: "#eaecef",
              display: "flex",
            }}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
        )}
      </div>
    </header>
  );
}
