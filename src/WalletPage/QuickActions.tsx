import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  RefreshCw,
  Settings,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  onClick: () => void;
  requiresAuth?: boolean;
  color?: string;
}

interface QuickActionsProps {
  isAuthenticated: boolean;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenSwap: () => void;
  onOpenSettings: () => void;
  onRequireAuth: () => void;
}

export default function QuickActions({
  isAuthenticated,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenSwap,
  onOpenSettings,
  onRequireAuth,
}: QuickActionsProps) {
  const handleAction = (action: () => void, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      onRequireAuth();
      return;
    }
    action();
  };

  const actions: QuickAction[] = [
    {
      id: "deposit",
      label: "Deposit",
      icon: ArrowDownLeft,
      onClick: onOpenDeposit,
      requiresAuth: true,
      color: "#0ecb81",
    },
    {
      id: "withdraw",
      label: "Withdraw",
      icon: ArrowUpRight,
      onClick: onOpenWithdraw,
      requiresAuth: true,
      color: "#f6465d",
    },
    {
      id: "transfer",
      label: "Transfer",
      icon: Send,
      onClick: onOpenTransfer,
      requiresAuth: true,
      color: "#f0b90b",
    },
    {
      id: "swap",
      label: "Swap",
      icon: RefreshCw,
      onClick: onOpenSwap,
      requiresAuth: true,
      color: "#1e80ff",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: onOpenSettings,
      color: "#848e9c",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "4px 0 16px 0",
        marginBottom: 4,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
      className="quick-actions-scroll"
    >
      <style>
        {`
          .quick-actions-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      {actions.map((action) => {
        const Icon = action.icon;
        const isActive = action.requiresAuth && !isAuthenticated;

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.onClick, action.requiresAuth)}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "12px 16px",
              minWidth: 72,
              border: isActive ? "1px solid #2b3139" : "none",
              borderRadius: 12,
              background: isActive ? "transparent" : "#1e2329",
              cursor: isActive ? "default" : "pointer",
              transition: "all 0.2s",
              opacity: isActive ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "#2b3139";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "#1e2329";
              }
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "#2b3139" : `rgba(255, 255, 255, 0.06)`,
                transition: "background 0.2s",
              }}
            >
              <Icon
                size={20}
                strokeWidth={2}
                color={isActive ? "#848e9c" : action.color || "#eaecef"}
              />
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? "#848e9c" : "#eaecef",
                whiteSpace: "nowrap",
              }}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}