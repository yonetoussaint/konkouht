import { useState, useEffect } from "react";
import { X, Share2, Link2, Check, Mail, MessageSquare } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaFacebookMessenger, FaTelegram } from "react-icons/fa";
import { buildShareUrl, buildShareText, getCachedShortUrl, prefetchShortUrl } from "./lib/share";

/* This sheet is now only ever mounted as a fallback for browsers without
   the Web Share API — call sites try navigator.share directly first (see
   src/lib/share.js) and only open this when that isn't available. */
export default function ShareSheet({ comp, onClose, accent = "#6C63FF", onShared }) {
  const [entered, setEntered] = useState(false);
  const [copied, setCopied] = useState(false);
  // Seed from the row's own short_url first (the normal case — set
  // server-side at creation time), falling back to the shared backfill
  // cache in case a call site already prefetched this comp's short link —
  // avoids a flash of the long URL while we wait on the fetch below.
  const [shortUrl, setShortUrl] = useState(() => comp?.shortUrl || getCachedShortUrl(comp));

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!comp) return;
    const known = comp.shortUrl || getCachedShortUrl(comp);
    setShortUrl(known);
    if (known) return;
    let cancelled = false;
    prefetchShortUrl(comp).then((url) => {
      if (!cancelled && url) setShortUrl(url);
    }); // long URL fallback below covers a null result
    return () => {
      cancelled = true;
    };
  }, [comp?.id, comp?.shortUrl]);

  if (!comp) return null;

  const url = shortUrl || buildShareUrl(comp);
  // Empty per buildShareText — title/description ride entirely on the
  // og:title/og:description tags the link unfurls to, so we don't want to
  // prefix the url with raw text. Kept as a variable (rather than always
  // using `url` alone) so a future call site can reintroduce text easily.
  const text = buildShareText(comp);
  const shareBody = text ? `${text} ${url}` : url;

  function handleClose() {
    setEntered(false);
    setTimeout(() => onClose?.(), 200);
  }

  function trackShare() {
    onShared?.(comp);
  }

  function openAndClose(shareUrl) {
    trackShare();
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    handleClose();
  }

  function handleCopyLink() {
    trackShare();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareBody).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => handleClose(), 700);
  }

  const options = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      bg: "#25D366",
      Icon: FaWhatsapp,
      onClick: () => openAndClose(`https://wa.me/?text=${encodeURIComponent(shareBody)}`),
    },
    {
      key: "messenger",
      label: "Messenger",
      bg: "#00B2FF",
      Icon: FaFacebookMessenger,
      onClick: () => openAndClose(`fb-messenger://share?link=${encodeURIComponent(url)}`),
    },
    {
      key: "facebook",
      label: "Facebook",
      bg: "#1877F2",
      Icon: FaFacebook,
      onClick: () => openAndClose(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      key: "telegram",
      label: "Telegram",
      bg: "#29A9EB",
      Icon: FaTelegram,
      onClick: () => openAndClose(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`),
    },
    {
      key: "sms",
      label: "SMS",
      bg: "#00B894",
      Icon: MessageSquare,
      onClick: () => openAndClose(`sms:?body=${encodeURIComponent(shareBody)}`),
    },
    {
      key: "email",
      label: "Email",
      bg: "#888",
      Icon: Mail,
      onClick: () => openAndClose(`mailto:?subject=${encodeURIComponent(comp.title)}&body=${encodeURIComponent(shareBody)}`),
    },
  ];

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: `rgba(0,0,0,${entered ? 0.45 : 0})`,
        transition: "background 0.2s ease",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#1c1c1f",
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: "flex", flexDirection: "column",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#2a2a2e" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 16px 4px", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f2f2f2",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Share2 size={14} strokeWidth={2.5} color={accent} />
              Partager
            </span>
            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "#8a8a90", marginTop: 3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {comp.title}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              border: "none", background: "#202023", borderRadius: "50%",
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <X size={15} color="#666" />
          </button>
        </div>

        {/* Share options grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
          padding: "16px 16px 6px",
        }}>
          {options.map(({ key, label, bg, Icon, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              style={{
                border: "none", background: "none", cursor: "pointer", padding: 0,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: "50%", background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              }}>
                <Icon size={22} color="#fff" />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, fontWeight: 600, color: "#c9c9c9" }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Copy link row */}
        <div style={{ padding: "10px 16px 4px" }}>
          <button
            onClick={handleCopyLink}
            style={{
              width: "100%", border: "1px solid #2a2a2e", borderRadius: 14,
              background: "#202023", padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: copied ? "#00B894" : "#eee",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}>
              {copied ? <Check size={15} color="#fff" strokeWidth={2.5} /> : <Link2 size={15} color="#666" />}
            </div>
            <span style={{
              flex: 1, minWidth: 0, textAlign: "left",
              fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#f2f2f2",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {url}
            </span>
            <span style={{
              flexShrink: 0, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
              color: copied ? "#00875A" : accent,
            }}>
              {copied ? "Copié" : "Copier"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}