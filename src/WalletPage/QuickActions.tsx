import { ArrowDownLeft, ArrowUpRight, Send, Settings } from "lucide-react";

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
  onOpenSettings: () => void;
  onRequireAuth: () => void;
}

export default function QuickActions({
  isAuthenticated,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
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
        justifyContent: "space-between",
        gap: 0,
        padding: 0,
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const isActive = action.requiresAuth && !isAuthenticated;

        return (
          <div
            key={action.id}
            onClick={() => handleAction(action.onClick, action.requiresAuth)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              cursor: isActive ? "default" : "pointer",
              opacity: isActive ? 0.5 : 1,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isActive ? "#2b3139" : "rgba(255, 255, 255, 0.06)",
              }}
            >
              <Icon
                size={20}
                strokeWidth={2}
                color={isActive ? "#848e9c" : "#ffffff"}
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
          </div>
        );
      })}
    </div>
  );
}
