import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lock,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ---- currency icons ------------------------------------------------------
function HtgIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#002876" />
      <rect x="0" y="10.67" width="32" height="10.66" fill="#D21034" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fontFamily="Georgia, serif"
        fill="white"
      >
        G
      </text>
    </svg>
  );
}

// ---- design tokens -------------------------------------------------------
const COLORS = {
  bg: "#0d0f12",
  surface: "#14171c",
  surfaceRaised: "#1a1e24",
  border: "#22262d",
  borderActive: "#3a3a3e",
  text: "#eef0f2",
  textDim: "#7d8590",
  gold: "#848e9c",
  goldDim: "rgba(132, 142, 156, 0.12)",
  up: "#0ecb81",
  down: "#f6465d",
};

const FONT_UI = "'Inter', system-ui, sans-serif";
const FONT_NUM = "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace";

let stylesInjected = false;
function ensureGlobalStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  if (document.getElementById("balance-card-styles")) {
    stylesInjected = true;
    return;
  }
  const tag = document.createElement("style");
  tag.id = "balance-card-styles";
  tag.textContent = `
    @keyframes bc-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
    @keyframes bc-spin { to { transform: rotate(360deg); } }
    .bc-scroll::-webkit-scrollbar { display: none; }
    .bc-carousel::-webkit-scrollbar { display: none; }
    .bc-carousel { cursor: grab; }
    .bc-carousel:active { cursor: grabbing; }
    .bc-dropdown { outline: none; }
  `;
  document.head.appendChild(tag);
  stylesInjected = true;
}

const TIMEFRAMES = ["24h", "1w", "1m", "1y"] as const;
type Timeframe = typeof TIMEFRAMES[number];

// Derive chart data for a given timeframe by subsampling the base 24h data
function getChartDataForTimeframe(baseData: { time: string; value: number }[], timeframe: Timeframe, balance: number) {
  if (!baseData || baseData.length === 0) return [];
  const multipliers: Record<Timeframe, number> = { "24h": 1, "1w": 7, "1m": 30, "1y": 365 };
  const mult = multipliers[timeframe];
  const count = Math.min(Math.round(mult * 1.5), 60);
  const step = Math.max(1, Math.floor(baseData.length / count));
  const sampled = baseData.filter((_, i) => i % step === 0);
  return sampled.map((d, i) => ({
    ...d,
    value: d.value + (Math.random() - 0.5) * balance * 0.02 * (i / sampled.length),
  }));
}

function getTimeframeStats(baseData: { time: string; value: number }[], timeframe: Timeframe, balance: number) {
  if (!baseData || baseData.length < 2) return { changePct: 0, changeAbs: 0 };
  const multipliers: Record<Timeframe, number> = { "24h": 1, "1w": 7, "1m": 30, "1y": 365 };
  const steps: Record<Timeframe, number> = { "24h": 1, "1w": 4, "1m": 8, "1y": 20 };
  const step = steps[timeframe];
  const start = baseData[0];
  const end = baseData[Math.min(step, baseData.length - 1)];
  const changeAbs = end.value - start.value;
  const changePct = (changeAbs / Math.abs(start.value)) * 100;
  return { changePct, changeAbs };
}

function formatAmount(value, { hidden }) {
  if (hidden) return "••••••";
  if (value === 0) return "0.00";
  const decimals = Math.abs(value) < 1 ? 6 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Skeleton() {
  const bar = (w, h, extra) => ({
    width: w,
    height: h,
    background: COLORS.surfaceRaised,
    borderRadius: 6,
    animation: "bc-pulse 1.5s ease-in-out infinite",
    ...extra,
  });
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div style={bar(64, 26, { borderRadius: 13 })} />
      </div>
      <div style={bar(180, 34, { marginBottom: 10 })} />
      <div style={bar(120, 14, { marginBottom: 0 })} />
    </div>
  );
}

function Sparkline({ data, positive }) {
  const color = positive ? COLORS.up : COLORS.down;
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          fontFamily: FONT_UI,
          fontSize: 12,
          color: COLORS.textDim,
        }}
      >
        No chart data for this range
      </div>
    );
  }
  return (
    <div style={{ height: 56, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="bc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: COLORS.border }}
            contentStyle={{
              background: COLORS.surfaceRaised,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontFamily: FONT_NUM,
              fontSize: 12,
              color: COLORS.text,
              padding: "6px 10px",
            }}
            labelStyle={{ fontFamily: FONT_UI, color: COLORS.textDim, marginBottom: 2 }}
            formatter={(value) => [value.toFixed(2), "Balance"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill="url(#bc-fill)"
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function IconButton({ onClick, label, active, children, spinning, disabled }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      style={{
        border: "none",
        background: active ? COLORS.goldDim : "transparent",
        cursor: disabled ? "default" : "pointer",
        color: active ? COLORS.gold : COLORS.textDim,
        width: 30,
        height: 30,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      <span style={{ display: "flex", animation: spinning ? "bc-spin 0.8s linear infinite" : "none" }}>
        {children}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// A single card. Every piece of state here (whether it's locked, whether it's
// mid-refresh) lives inside this component, so dropping several of these into
// a scroller never lets one card's state leak into another.
// ---------------------------------------------------------------------------
export function BalanceCardItem({
  wallet,
  showBalance,
  onToggleBalance,
  isLoading = false,
  onRefresh,
  onActivate,
  width = 340,
}) {
  const [isLocked, setIsLocked] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(ensureGlobalStyles, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".bc-dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  const hidden = !showBalance || isLocked;
  const { changePct, changeAbs } = getTimeframeStats(wallet?.chartData ?? [], timeframe, wallet?.balance ?? 0);
  const isPositive = changePct >= 0;
  const chartData = getChartDataForTimeframe(wallet?.chartData ?? [], timeframe, wallet?.balance ?? 0);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, width, flexShrink: 0 }}>
      {/* Stats section */}
      <div
        style={{
          fontFamily: FONT_UI,
          padding: "12px 0 10px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.gold,
                letterSpacing: "0.04em",
              }}
            >
              <HtgIcon size={14} />
              {wallet?.currency || "—"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <IconButton
              onClick={() => setIsLocked((v) => !v)}
              label={isLocked ? "Unlock balance" : "Lock balance"}
              active={isLocked}
            >
              <Lock size={15} />
            </IconButton>
            {onRefresh && (
              <IconButton
                onClick={handleRefresh}
                label="Refresh balance"
                spinning={isRefreshing}
                disabled={isRefreshing}
              >
                <RefreshCw size={15} />
              </IconButton>
            )}
            <IconButton
              onClick={onToggleBalance}
              label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            </IconButton>
          </div>
        </div>

        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            {/* balance */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: FONT_NUM,
                  fontSize: 32,
                  fontWeight: 600,
                  color: COLORS.text,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatAmount(wallet.balance, { hidden })}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textDim }}>
                {wallet.symbol}
              </span>
            </div>

            {/* change row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isPositive ? (
                <TrendingUp size={13} color={COLORS.up} />
              ) : (
                <TrendingDown size={13} color={COLORS.down} />
              )}
              <span
                style={{
                  fontFamily: FONT_NUM,
                  fontSize: 13,
                  fontWeight: 600,
                  color: isPositive ? COLORS.up : COLORS.down,
                }}
              >
                {isPositive ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
              <span style={{ fontSize: 13, color: COLORS.textDim }}>
                ({isPositive ? "+" : ""}
                {hidden ? "••••" : changeAbs.toLocaleString("en-US")} {wallet.symbol})
              </span>
              <div style={{ marginLeft: "auto", position: "relative" }}>
                <button
                  className="bc-dropdown"
                  onClick={() => setDropdownOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "transparent",
                    border: "1px solid #2a2a2e",
                    borderRadius: 0,
                    color: COLORS.textDim,
                    fontFamily: FONT_UI,
                    fontSize: 12,
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                >
                  {timeframe}
                  <ChevronDown size={12} style={{ transition: "transform 0.15s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: 4,
                      background: "#1c1c1f",
                      border: "1px solid #2a2a2e",
                      borderRadius: 0,
                      zIndex: 50,
                      minWidth: 60,
                    }}
                  >
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => { setTimeframe(tf); setDropdownOpen(false); }}
                        style={{
                          display: "block",
                          width: "100%",
                          background: tf === timeframe ? COLORS.goldDim : "transparent",
                          border: "none",
                          borderBottom: "1px solid #2a2a2e",
                          color: tf === timeframe ? COLORS.gold : COLORS.text,
                          fontFamily: FONT_UI,
                          fontSize: 12,
                          padding: "6px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => { if (tf !== timeframe) e.currentTarget.style.background = "#2a2a2e"; }}
                        onMouseLeave={(e) => { if (tf !== timeframe) e.currentTarget.style.background = "transparent"; }}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Chart section */}
      <div
        style={{
          borderTop: "1px solid #2a2a2e",
          borderBottom: "1px solid #2a2a2e",
          padding: "8px 0 4px",
          marginTop: 0,
        }}
      >
        {isLoading ? null : <Sparkline data={chartData} positive={isPositive} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BalanceCard: a single balance card, rendered directly. No carousel / no
// horizontal scroller — there is only one currency to display.
// ---------------------------------------------------------------------------
export default function BalanceCard(props) {
  useEffect(ensureGlobalStyles, []);
  return <BalanceCardItem {...props} />;
}
