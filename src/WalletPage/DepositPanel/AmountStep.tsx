import { useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { QuickAmounts } from "./QuickAmounts";
import { FeesInfo } from "./FeesInfo";
import type { AmountWithMetadata, FeesInfo as FeesInfoType, AmountStatus } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface AmountStepProps {
  amount: string;
  displayAmount: string;
  onAmountChange: (value: string, display: string) => void;
  quickAmounts: AmountWithMetadata[];
  amountStatus: AmountStatus | null;
  fees: FeesInfoType;
  showFeesInfo: boolean;
  onToggleFeesInfo: () => void;
  showHint: boolean;
}

export function AmountStep({
  amount,
  displayAmount,
  onAmountChange,
  quickAmounts,
  amountStatus,
  fees,
  showFeesInfo,
  onToggleFeesInfo,
  showHint,
}: AmountStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "").replace(/[^0-9.]/g, "");
    if (raw === "") {
      onAmountChange("", "");
      return;
    }
    // Format with thousand separators
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onAmountChange(raw, num.toLocaleString("fr-FR"));
    }
  };

  const handleQuickAmount = (value: number) => {
    const strValue = value.toString();
    onAmountChange(strValue, value.toLocaleString("fr-FR"));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
        <label
          style={{
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.md,
            fontWeight: TYPOGRAPHY.weight.semibold,
            color: COLORS.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Montant à déposer
        </label>
        <button
          onClick={onToggleFeesInfo}
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.textDim,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: SPACING.xs,
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.sm,
          }}
        >
          <Info size={14} />
          Frais
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: COLORS.surface,
          border: `1px solid ${
            amountStatus && amountStatus.status === "min" ? COLORS.error :
            amountStatus && amountStatus.status === "max" ? COLORS.error :
            amount && amountStatus?.status === "ok" ? COLORS.accent :
            COLORS.border
          }`,
          borderRadius: 8,
          padding: `0 ${SPACING.md}px`,
          transition: "border-color 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayAmount}
          onChange={handleChange}
          placeholder="0.00"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            padding: `14px 0`,
            fontFamily: TYPOGRAPHY.fontMono,
            fontSize: TYPOGRAPHY.size.display,
            fontWeight: TYPOGRAPHY.weight.semibold,
            color: COLORS.text,
            outline: "none",
            minWidth: 0,
          }}
        />
        <span
          style={{
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.lg,
            fontWeight: TYPOGRAPHY.weight.medium,
            color: COLORS.textDim,
            paddingLeft: SPACING.sm,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          HTG
        </span>
      </div>

      {amount && amountStatus && amountStatus.status !== "ok" && (
        <div
          style={{
            marginTop: SPACING.xs,
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.md,
            color: COLORS.error,
          }}
        >
          {amountStatus.message}
        </div>
      )}

      <QuickAmounts
        amounts={quickAmounts}
        selectedAmount={amount}
        onSelect={handleQuickAmount}
      />

      {showHint && (
        <div
          style={{
            marginTop: SPACING.xs,
            fontFamily: TYPOGRAPHY.fontFamily,
            fontSize: TYPOGRAPHY.size.sm,
            color: COLORS.textDim,
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          ⚡ Basé sur vos dépôts récents
        </div>
      )}

      <FeesInfo
        fees={fees}
        showFeesInfo={showFeesInfo}
        onToggle={onToggleFeesInfo}
      />
    </div>
  );
}