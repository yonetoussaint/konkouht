import { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lock,
  Wallet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// ---- design tokens -------------------------------------------------------
const COLORS = {
  bg: "#0d0f12",
  surface: "#14171c",
  surfaceRaised: "#1a1e24",
  border: "#22262d",
  borderActive: "#3a3220",
  text: "#eef0f2",
  textDim: "#7d8590",
  gold: "#f0b90b",
  goldDim: "rgba(240, 185, 11, 0.12)",
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
  `;
  document.head.appendChild(tag);
  stylesInjected = true;
}

function formatAmount(value, { hidden }) {
  if (hidden) return "••••••";
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
        <div style={bar(64, 26, { borderRadius: 13 })} />
      </div>
      <div style={bar(180, 34, { marginBottom: 10 })} />
      <div style={bar(120, 14, { marginBottom: 20 })} />
      <div style={bar("100%", 56)} />
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
    <div style={{ height: 56, marginTop: 4, marginLeft: -4, marginRight: -4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
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

  useEffect(ensureGlobalStyles, []);

  const isPositive = (wallet?.dayChange ?? 0) >= 0;
  const hidden = !showBalance || isLocked;

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div
      style={{
        background: `radial-gradient(120% 140% at 100% -20%, rgba(240,185,11,0.06) 0%, transparent 55%), ${COLORS.surface}`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "18px 20px 20px",
        fontFamily: FONT_UI,
        width,
        flexShrink: 0,
        scrollSnapAlign: "start",
        overscrollBehaviorX: "contain",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wallet size={14} color={COLORS.gold} strokeWidth={2} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.gold,
              background: COLORS.goldDim,
              border: `1px solid ${COLORS.borderActive}`,
              borderRadius: 999,
              padding: "3px 10px",
              letterSpacing: "0.04em",
            }}
          >
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
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
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
              {wallet.dayChangePct.toFixed(2)}%
            </span>
            <span style={{ fontSize: 13, color: COLORS.textDim }}>
              ({isPositive ? "+" : ""}
              {hidden ? "••••" : wallet.dayChange.toLocaleString("en-US")} {wallet.symbol})
            </span>
            <span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: "auto" }}>
              24h
            </span>
          </div>

          <Sparkline data={wallet.chartData} positive={isPositive} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BalanceCard: lays several account cards side by side in one horizontally
// scrollable, snapping row. Each card below is a separate BalanceCardItem
// instance with its own hook state (see comment above), so scrolling the
// row, refreshing one card, or switching a wallet on one card never
// touches its neighbors.
// ---------------------------------------------------------------------------
export default function BalanceCard({ accounts, cardWidth = 340, gap = 14, onActiveChange }) {
  const scrollRef = useRef(null);

  useEffect(ensureGlobalStyles, []);

  // As the user scrolls/swipes, surface which card is currently "on screen"
  // so the parent can mirror the active wallet for any side effects (logging,
  // analytics, future balance-of-record plumbing).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onActiveChange) return;
    let frame = 0;
    const report = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      const cards = el.querySelectorAll("[data-card-id]");
      let closestId = null;
      let closestDist = Infinity;
      cards.forEach((node) => {
        const nodeCenter = node.offsetLeft + node.clientWidth / 2;
        const dist = Math.abs(nodeCenter - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = node.getAttribute("data-card-id");
        }
      });
      if (closestId) onActiveChange(closestId);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(report);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    report();
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [accounts, onActiveChange]);

  return (
    <div
      ref={scrollRef}
      className="bc-carousel"
      style={{
        display: "flex",
        gap,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollPadding: "0 20px",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        padding: "4px 20px 12px",
        margin: "-4px -20px -12px",
      }}
    >
      {accounts.map((account) => (
        <div
          key={account.id}
          data-card-id={account.id}
          style={{ display: "flex" }}
        >
          <BalanceCardItem width={cardWidth} {...account.props} />
        </div>
      ))}
    </div>
  );
}
