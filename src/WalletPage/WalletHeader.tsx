import { Bell, ChevronRight, MoreHorizontal } from "lucide-react";

interface WalletHeaderProps {
  onBack: () => void;
  onOpenNotifications: () => void;
  showToast?: (message: string) => void;
}

export default function WalletHeader({ onBack, onOpenNotifications, showToast }: WalletHeaderProps) {
  return (
    <header
      style={{
        background: "#1e2329",
        borderBottom: "1px solid #2b3139",
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 8,
            color: "#eaecef",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} />
          Wallet
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          onClick={onOpenNotifications}
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
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "#f6465d",
              borderRadius: "50%",
              border: "2px solid #1e2329",
            }}
          />
        </button>
        <button
          onClick={() => showToast?.("More options coming soon")}
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
      </div>
    </header>
  );
}

export default WalletHeader;