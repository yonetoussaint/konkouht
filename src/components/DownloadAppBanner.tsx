import { useState } from "react";
import { X, Smartphone } from "lucide-react";
import { isNative } from "../native";

const DISMISS_KEY = "konkouht_hide_app_banner";

/**
 * Télécharger l'app — a dismissible nudge toward the native app, shown
 * only on web (isNative from native.ts already no-ops your Capacitor
 * plugins outside the compiled shell, so it's the right check here too).
 * Dismissal is remembered in localStorage so it doesn't nag every visit.
 *
 * Fill in appStoreUrl / playStoreUrl once the app is actually published —
 * they default to "#" and the corresponding button just won't render
 * without a real URL, so nothing broken ships in the meantime.
 *
 * Usage in HomePage.tsx:
 *
 *   import DownloadAppBanner from "./components/DownloadAppBanner";
 *
 *   <DownloadAppBanner
 *     appStoreUrl="https://apps.apple.com/app/idXXXXXXXXX"
 *     playStoreUrl="https://play.google.com/store/apps/details?id=com.konkouht.app"
 *   />
 *
 * No new App.tsx wiring needed — it's self-contained. Drop it right after
 * the header, before the banner slider, or right above the footer;
 * top-of-page gets more clicks, bottom is less intrusive.
 */
export default function DownloadAppBanner({ appStoreUrl, playStoreUrl }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (isNative || dismissed) return null;
  if (!appStoreUrl && !playStoreUrl) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage unavailable — dismissal just won't persist, no big deal
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: 8,
        padding: "10px 12px",
        background: "#1c1c1f",
        border: "1px solid #2a2a2e",
        borderRadius: 14,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#3a2f10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Smartphone size={18} strokeWidth={2} color="#F5C542" />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#f2f2f2" }}>
          Profitez de KonkouHT sur votre téléphone
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
          Notifications live, vote plus rapide.
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {playStoreUrl && (
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#111",
              background: "#F5C542",
              borderRadius: 8,
              padding: "7px 10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Android
          </a>
        )}
        {appStoreUrl && (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#f2f2f2",
              background: "#26262a",
              border: "1px solid #2a2a2e",
              borderRadius: 8,
              padding: "7px 10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            iOS
          </a>
        )}
      </div>

      <button
        onClick={dismiss}
        aria-label="Fermer"
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          color: "#8a8a90",
          cursor: "pointer",
          padding: 4,
          display: "flex",
        }}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
