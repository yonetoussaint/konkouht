import { CheckCircle } from "lucide-react";
import type { MethodOption } from "./types";
import { SPACING, COLORS, TYPOGRAPHY } from "./utils";

interface MethodStepProps {
  selectedMethod: string | null;
  onSelectMethod: (method: string) => void;
  methods: MethodOption[];
}

export function MethodStep({ selectedMethod, onSelectMethod, methods }: MethodStepProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.size.md,
          fontWeight: TYPOGRAPHY.weight.semibold,
          color: COLORS.textDim,
          marginBottom: SPACING.sm,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Choisissez votre méthode
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.sm }}>
        {methods.map(({ key, label, color, icon, description }) => (
          <button
            key={key}
            onClick={() => onSelectMethod(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING.md,
              padding: `${SPACING.md}px ${SPACING.lg}px`,
              background: selectedMethod === key ? COLORS.surfaceHover : "transparent",
              border: `1px solid ${selectedMethod === key ? color : COLORS.border}`,
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TYPOGRAPHY.fontFamily,
                fontSize: TYPOGRAPHY.size.md,
                fontWeight: TYPOGRAPHY.weight.bold,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.xl,
                  fontWeight: TYPOGRAPHY.weight.semibold,
                  color: COLORS.text,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily,
                  fontSize: TYPOGRAPHY.size.md,
                  color: COLORS.textDim,
                }}
              >
                {description}
              </div>
            </div>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${selectedMethod === key ? color : COLORS.border}`,
                background: selectedMethod === key ? color : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              {selectedMethod === key && (
                <CheckCircle size={12} color="#fff" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}