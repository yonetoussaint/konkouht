import type { Transaction } from "../../types";

export type Step = "amount" | "method" | "confirm" | "processing" | "success";

export interface DepositPanelProps {
  onClose: () => void;
  showToast?: (message: string) => void;
  userTransactions?: Transaction[];
  userBalance?: number;
}

export interface DepositState {
  step: Step;
  amount: string;
  displayAmount: string;
  selectedMethod: string | null;
  submitting: boolean;
  referenceId: string | null;
  showFeesInfo: boolean;
}

export interface MethodOption {
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export interface FeesInfo {
  fee: string;
  feePercentage: string;
  min: string;
  max: string;
  processingTime: string;
  note: string;
}

export interface AmountWithMetadata {
  amount: number;
  isFrequent: boolean;
  isMostRecent: boolean;
  count: number;
}

export interface AmountStatus {
  status: "min" | "max" | "ok";
  message: string;
}