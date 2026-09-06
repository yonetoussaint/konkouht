import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Lock, 
  Unlock 
} from "lucide-react";
import {
  LineChart,
  Line,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BalanceCardProps {
  balance: number;
  dayChange: number;
  dayChangePct: number;
  showBalance: boolean;
  onToggleBalance: () => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  chartData?: { time: string; value: number }[];
}

export default function BalanceCard({
  balance,
  dayChange,
  dayChangePct,
  showBalance,
  onToggleBalance,
  isLoading = false,
  onRefresh,
  chartData = [],
}: BalanceCardProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(balance);

  // Simulate balance animation when data changes
  useEffect(() => {
    if (!isLoading && !isLocked) {
      setDisplayBalance(balance);
    }
  }, [balance, isLoading, isLocked]);

  // Handle refresh with animation
  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Toggle lock feature
  const toggleLock = () => {
    setIsLocked(!isLocked);
    if (!isLocked) {
      setDisplayBalance(0);
    } else {
      setDisplayBalance(balance);
    }
  };

  // Skeleton Loader Component
  const Skeleton = () => (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ 
          width: 100, 
          height: 16, 
          background: "#2b3139", 
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <div style={{ 
          width: 24, 
          height: 24, 
          background: "#2b3139", 
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      </div>
      <div style={{ 
        width: "60%", 
        height: 36, 
        background: "#2b3139", 
        borderRadius: 4,
        marginBottom: 8,
        animation: "pulse 1.5s ease-in-out infinite",
      }} />
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ 
          width: 80, 
          height: 16, 
          background: "#2b3139", 
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <div style={{ 
          width: 100, 
          height: 16, 
          background: "#2b3139", 
          borderRadius: 4,
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
      </div>
    </div>
  );

  // Chart Component
  const Chart = ({ data }: { data: { time: string; value: number }[] }) => {
    const isPositive = dayChange >= 0;
    const color = isPositive ? "#0ecb81" : "#f6465d";

    if (data.length === 0) {
      return (
        <div style={{ 
          height: 60, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "#848e9c",
          fontSize: 12,
        }}>
          No chart data available
        </div>
      );
    }

    return (
      <div style={{ height: 60, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                background: "#1e2329",
                border: "1px solid #2b3139",
                borderRadius: 8,
                color: "#eaecef",
                fontSize: 12,
              }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, "Balance"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorGradient)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Add keyframe animation for skeleton
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e2329 0%, #181a1e 100%)",
        border: "1px solid #2b3139",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(240, 185, 11, 0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Header with controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#848e9c",
          }}
        >
          Total Balance
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Lock/Unlock Button */}
          <button
            onClick={toggleLock}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: isLocked ? "#f6465d" : "#848e9c",
              padding: 4,
              display: "flex",
              transition: "color 0.2s",
            }}
            aria-label={isLocked ? "Unlock balance" : "Lock balance"}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#848e9c",
                padding: 4,
                display: "flex",
                transition: "transform 0.2s",
              }}
              disabled={isRefreshing}
              aria-label="Refresh balance"
            >
              <RefreshCw 
                size={18} 
                style={{ 
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          )}

          {/* Visibility Toggle */}
          <button
            onClick={onToggleBalance}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#848e9c",
              padding: 4,
              display: "flex",
            }}
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          {/* Balance Display */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#eaecef",
                letterSpacing: "-0.02em",
                transition: "opacity 0.3s",
              }}
            >
              {isLocked ? "🔒••••••" : (showBalance ? displayBalance.toLocaleString("fr-FR") : "••••••")}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 16,
                fontWeight: 500,
                color: "#848e9c",
              }}
            >
              HTG
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {dayChange >= 0 ? (
                <TrendingUp size={14} color="#0ecb81" />
              ) : (
                <TrendingDown size={14} color="#f6465d" />
              )}
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: dayChange >= 0 ? "#0ecb81" : "#f6465d",
                }}
              >
                {dayChange >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
                Today
              </span>
            </div>
            <div style={{ width: 1, height: 20, background: "#2b3139" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#848e9c" }}>
                24h Change
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: dayChange >= 0 ? "#0ecb81" : "#f6465d",
                }}
              >
                {dayChange >= 0 ? "+" : ""}{dayChange.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>

          {/* Chart */}
          <Chart data={chartData} />
        </>
      )}

      {/* Add spin animation for refresh */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}