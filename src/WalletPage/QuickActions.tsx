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
        overflowX: "auto",
        padding: 0,
        borderBottom: "1px solid #2a2a2e",
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
      {actions.map((action, i) => {
        const Icon = action.icon;
        const isActive = action.requiresAuth && !isAuthenticated;

        return (
          <button
            key={action.id}
            onClick={() => handleAction(action.onClick, action.requiresAuth)}
            style={{
              flexShrink: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "14px 8px",
              border: "none",
              borderLeft: i > 0 ? "1px solid #2a2a2e" : "none",
              background: "transparent",
              cursor: isActive ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: isActive ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "#1a1a1a";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <Icon
              size={20}
              strokeWidth={2}
              color={isActive ? "#8a8a90" : action.color || "#eaecef"}
            />
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? "#8a8a90" : "#eaecef",
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