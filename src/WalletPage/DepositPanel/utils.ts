import type { Transaction } from "../../types";
import type { FeesInfo, AmountWithMetadata, AmountStatus } from "./types";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const COLORS = {
  bg: "#0d0f12",
  surface: "#14171c",
  surfaceHover: "#1a1e24",
  surfaceRaised: "#1e2329",
  border: "#2a2a2e",
  borderLight: "rgba(255,255,255,0.06)",
  text: "#eef0f2",
  textDim: "#7d8590",
  textMuted: "#5a5e66",
  accent: "#0ecb81",
  accentDim: "rgba(14, 203, 129, 0.12)",
  accentSubtle: "rgba(14, 203, 129, 0.06)",
  error: "#f6465d",
  warning: "#f0b90b",
  warningDim: "rgba(240, 185, 11, 0.1)",
};

export const TYPOGRAPHY = {
  fontFamily: "'Inter', -apple-system, sans-serif",
  fontMono: "'IBM Plex Mono', 'SF Mono', monospace",
  size: {
    xs: 10,
    sm: 11,
    md: 12,
    lg: 13,
    xl: 14,
    xxl: 16,
    xxxl: 18,
    display: 24,
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const getFeesAndLimits = (): FeesInfo => ({
  fee: "Gratuit",
  feePercentage: "0%",
  min: "100 HTG",
  max: "500,000 HTG",
  processingTime: "Instantané",
  note: "Aucun frais pour les dépôts",
});

export const formatNumber = (value: string): string => {
  if (!value) return "";
  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num)) return "";
  return num.toLocaleString("fr-FR");
};

export const getAmountStatus = (amount: string, limits: FeesInfo): AmountStatus | null => {
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount <= 0) return null;
  const min = Number(limits.min.replace(/[^0-9.]/g, ""));
  const max = Number(limits.max.replace(/[^0-9.]/g, ""));
  if (numAmount < min) return { status: "min", message: `Minimum: ${limits.min}` };
  if (numAmount > max) return { status: "max", message: `Maximum: ${limits.max}` };
  return { status: "ok", message: "Montant valide" };
};

export const getSmartQuickAmounts = (
  userTransactions: Transaction[],
  userBalance: number
): AmountWithMetadata[] => {
  const deposits = userTransactions
    .filter(t => t.type === "deposit" && t.amount > 0)
    .map(t => t.amount);

  let amounts: number[] = [];

  if (deposits.length === 0) {
    const baseAmount = Math.min(userBalance || 10000, 10000);
    for (let i = 1; i <= 5; i++) {
      const percentage = 0.05 + (i - 1) * 0.05;
      const amount = Math.round(baseAmount * percentage / 100) * 100;
      if (amount > 0) amounts.push(Math.min(amount, 10000));
    }
    if (amounts.length === 0 || amounts.every(a => a === 0)) {
      amounts = [500, 1000, 2500, 5000, 10000];
    }
    amounts = [...new Set(amounts)].sort((a, b) => a - b).slice(0, 5);
  } else {
    const frequencyMap: Record<number, { count: number; lastUsed: number }> = {};
    deposits.forEach((amount, index) => {
      const rounded = Math.round(amount / 100) * 100;
      if (!frequencyMap[rounded]) {
        frequencyMap[rounded] = { count: 0, lastUsed: index };
      }
      frequencyMap[rounded].count += 1;
      frequencyMap[rounded].lastUsed = Math.max(frequencyMap[rounded].lastUsed, index);
    });

    const maxCount = Math.max(...Object.values(frequencyMap).map(v => v.count));
    const maxLastUsed = Math.max(...Object.values(frequencyMap).map(v => v.lastUsed));

    const scored = Object.entries(frequencyMap).map(([amount, data]) => {
      const frequencyScore = maxCount > 0 ? data.count / maxCount : 0;
      const recencyScore = maxLastUsed > 0 ? data.lastUsed / maxLastUsed : 0;
      const totalScore = (frequencyScore * 0.7) + (recencyScore * 0.3);
      return { amount: Number(amount), score: totalScore };
    });

    amounts = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ amount }) => amount);

    const defaults = [500, 1000, 2500, 5000, 10000];
    let defaultIndex = 0;
    while (amounts.length < 5 && defaultIndex < defaults.length) {
      if (!amounts.includes(defaults[defaultIndex])) {
        amounts.push(defaults[defaultIndex]);
      }
      defaultIndex++;
    }
    amounts = amounts.sort((a, b) => a - b).slice(0, 5);
  }

  return amounts.map(amount => {
    const count = deposits.filter(d => Math.round(d / 100) * 100 === amount).length;
    const isMostRecent = deposits.length > 0 &&
      Math.round(deposits[deposits.length - 1] / 100) * 100 === amount;
    const isFrequent = count >= 3;

    return { amount, isFrequent, isMostRecent, count };
  });
};