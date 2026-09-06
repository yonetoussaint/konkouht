import { useState, useEffect, useRef } from "react";
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Lock, 
  Unlock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  LineChart,
  Line,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface WalletData {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
  dayChange: number;
  dayChangePct: number;
  chartData: { time: string; value: number }[];
}

interface BalanceCardProps {
  wallets: WalletData[];
  showBalance: boolean;
  onToggleBalance: () => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void> | void;
  onWalletChange?: (walletId: string) => void;
}

export default function BalanceCard({
  wallets,
  showBalance,
  onToggleBalance,
  isLoading = false,
  onRefresh,
  onWalletChange,
}: BalanceCardProps) {
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayBalances, setDisplayBalances] = useState<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const activeWallet = wallets[activeWalletIndex] || wallets[0];

  // Initialize display balances
  useEffect(() => {
    if (!isLoading && !isLocked) {
      const balances: Record<string, number> = {};
      wallets.forEach(w => {
        balances[w.id] = w.balance;
      });
      setDisplayBalances(balances);
    }
  }, [wallets, isLoading, isLocked]);

  // Check scroll position for arrows
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

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
      const balances: Record<string, number> = {};
      wallets.forEach(w => {
        balances[w.id] = 0;
      });
      setDisplayBalances(balances);
    } else {
      const balances: Record<string, number> = {};
      wallets.forEach(w => {
        balances[w.id] = w.balance;
      });
      setDisplayBalances(balances);
    }
  };

  // Scroll to next/previous wallet
  const scrollToWallet = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.offsetWidth;
      const currentScroll = container.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - cardWidth
        : currentScroll + cardWidth;
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll to detect active wallet
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = container.scrollLeft;
      const cardWidth = container.offsetWidth;
      const newIndex = Math.round(scrollPosition / cardWidth);
      
      if (newIndex !== activeWalletIndex && newIndex < wallets.length && newIndex >= 0) {
        setActiveWalletIndex(newIndex);
        if (onWalletChange) {
          onWalletChange(wallets[newIndex].id);
        }
      }
      checkScrollPosition();
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      checkScrollPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ 
            width: 24, 
            height: 24, 
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
          <div style={{ 
            width: 24, 
            height: 24, 
            background: "#2b3139", 
            borderRadius: 4,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        </div>
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
  const Chart = ({ data, isPositive }: { data: { time: string; value: number }[]; isPositive: boolean }) => {
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
              <linearGradient id={`colorGradient-${activeWallet.id}`} x1="0" y1="0" x2="0" y2="1">
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
              formatter={(value: any) => [`${value.toFixed(2)} ${activeWallet.symbol}`, "Balance"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#colorGradient-${activeWallet.id})`}
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

  // Add keyframe animation for skeleton and spin
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={{ position: "relative" }}>
      {/* Main Card Container */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            {/* Wallet Indicator Badge */}
            {wallets.length > 1 && !isLoading && (
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#f0b90b",
                  background: "rgba(240, 185, 11, 0.1)",
                  padding: "2px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(240, 185, 11, 0.2)",
                }}
              >
                {activeWallet?.currency || ''}
              </span>
            )}
          </div>
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
            {/* Scrollable Wallets Container - Isolated Cards */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              style={{
                display: "flex",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollBehavior: "smooth",
                gap: 16,
                paddingBottom: 8,
                marginBottom: 8,
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                position: "relative",
              }}
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.id}
                  style={{
                    minWidth: "100%",
                    scrollSnapAlign: "start",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  {/* Isolated Card Content */}
                  <div
                    style={{
                      background: "rgba(30, 35, 41, 0.5)",
                      borderRadius: 12,
                      padding: "16px 20px",
                      border: `1px solid ${index === activeWalletIndex ? 'rgba(240, 185, 11, 0.2)' : 'transparent'}`,
                      transition: "border-color 0.3s",
                    }}
                  >
                    {/* Currency Name */}
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#848e9c",
                        marginBottom: 8,
                      }}
                    >
                      {wallet.currency}
                    </div>

                    {/* Balance Display */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 28,
                          fontWeight: 700,
                          color: "#eaecef",
                          letterSpacing: "-0.02em",
                          transition: "opacity 0.3s",
                        }}
                      >
                        {isLocked ? "🔒••••••" : (showBalance ? displayBalances[wallet.id]?.toLocaleString("fr-FR") : "••••••")}
                      </span>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#848e9c",
                        }}
                      >
                        {wallet.symbol}
                      </span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {wallet.dayChange >= 0 ? (
                          <TrendingUp size={14} color="#0ecb81" />
                        ) : (
                          <TrendingDown size={14} color="#f6465d" />
                        )}
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: wallet.dayChange >= 0 ? "#0ecb81" : "#f6465d",
                          }}
                        >
                          {wallet.dayChange >= 0 ? "+" : ""}{wallet.dayChangePct.toFixed(2)}%
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
                            color: wallet.dayChange >= 0 ? "#0ecb81" : "#f6465d",
                          }}
                        >
                          {wallet.dayChange >= 0 ? "+" : ""}{wallet.dayChange.toLocaleString("fr-FR")}
                        </span>
                      </div>
                    </div>

                    {/* Chart */}
                    <Chart data={wallet.chartData} isPositive={wallet.dayChange >= 0} />
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet Indicators */}
            {wallets.length > 1 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: 8, 
                marginTop: 4 
              }}>
                {wallets.map((wallet, index) => (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        const container = scrollContainerRef.current;
                        const cardWidth = container.offsetWidth;
                        container.scrollTo({
                          left: index * cardWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      background: index === activeWalletIndex ? "#f0b90b" : "#2b3139",
                      transition: "all 0.3s",
                      padding: 0,
                      transform: index === activeWalletIndex ? "scale(1.2)" : "scale(1)",
                    }}
                    aria-label={`View ${wallet.currency} wallet`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Arrows - Positioned on the edges of the container */}
      {wallets.length > 1 && !isLoading && (
        <>
          <button
            onClick={() => scrollToWallet('left')}
            style={{
              position: "absolute",
              left: -8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(30, 35, 41, 0.9)",
              border: "1px solid #2b3139",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#eaecef",
              zIndex: 10,
              transition: "all 0.2s",
              opacity: showLeftArrow ? 0.9 : 0,
              pointerEvents: showLeftArrow ? "auto" : "none",
              backdropFilter: "blur(10px)",
            }}
            disabled={!showLeftArrow}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollToWallet('right')}
            style={{
              position: "absolute",
              right: -8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(30, 35, 41, 0.9)",
              border: "1px solid #2b3139",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#eaecef",
              zIndex: 10,
              transition: "all 0.2s",
              opacity: showRightArrow ? 0.9 : 0,
              pointerEvents: showRightArrow ? "auto" : "none",
              backdropFilter: "blur(10px)",
            }}
            disabled={!showRightArrow}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}