export interface Transaction {
  id: string;
  type: string;
  label: string;
  amount: number;
  date: string;
  rawDate?: string;
  status?: string;
}

export interface User {
  moncashNumber?: string;
  natcashNumber?: string;
  moncashVerified?: boolean;
  natcashVerified?: boolean;
}

export interface WalletPageProps {
  balance: number;
  transactions: Transaction[];
  currentUser: User | null;
  isAuthenticated: boolean;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenSwap: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onUpdateNumber: (method: string, number: string) => Promise<void>;
  onRequireAuth: () => void;
  showToast?: (message: string) => void;
  onBack: () => void;
}