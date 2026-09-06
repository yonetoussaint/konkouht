import PageHeader from "../components/PageHeader";

interface WalletHeaderProps {
  onBack: () => void;
  onOpenNotifications: () => void;
  showToast?: (message: string) => void;
}

export default function WalletHeader({ onBack, onOpenNotifications, showToast }: WalletHeaderProps) {
  return (
    <PageHeader
      title="Wallet"
      showBack
      onBack={onBack}
      onNotifications={onOpenNotifications}
      onMore={() => showToast?.("More options coming soon")}
      background="#1e2329"
      borderColor="#2b3139"
    />
  );
}
