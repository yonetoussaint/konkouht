import { useState } from "react";
import { ArrowLeft, BadgeCheck, Check, ChevronRight, Plus, Wallet, X } from "lucide-react";
import { MyAvatar, getRegistrationFee, WALLET_PIN } from "./App";

/* ─── REGISTRATION MODAL (form → media upload → PIN confirm) ────────────── */

export default function RegistrationModal({ comp, onClose, onRegister, showToast, currentUser, balance, onOpenBuy }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "media" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Required media step: between 1 and 10 photos / short videos must be
  // picked before the user can proceed to the PIN step.
  // `pendingMediaFiles` holds browser File objects (not yet uploaded); the
  // actual upload to Supabase Storage + participant_media row insert
  // happens inside handleRegister right before the registrations row is
  // inserted — so we can roll back the upload if registration fails, and
  // never end up with a registrant whose album is empty.
  const MAX_MEDIA = 10;
  const [pendingMediaFiles, setPendingMediaFiles] = useState([]);
  const [pendingMediaError, setPendingMediaError] = useState("");

  const fee = getRegistrationFee(comp);
  const canAfford = balance >= fee;
  const hasMedia = pendingMediaFiles.length > 0;
  const isMediaFull = pendingMediaFiles.length >= MAX_MEDIA;

  function handleContinue() {
    if (!canAfford) {
      showToast("Gourdes insuffisantes pour l'inscription");
      onOpenBuy?.();
      return;
    }
    setRegisterError("");
    setStep("media");
  }

  function handlePickMedia(e) {
    const files = Array.from(e.target.files || []);
    // Reset the input so picking the same file twice still fires onChange.
    e.target.value = "";
    if (files.length === 0) return;

    // Soft cap on per-file size — 25 MB matches the typical Supabase
    // Storage default for free tier and keeps the modal snappy on slow
    // networks. Reject the whole batch on the first oversize file so the
    // user gets a clear message instead of a silent partial add.
    const MAX_BYTES = 25 * 1024 * 1024;
    const MAX_TOTAL_BYTES = 80 * 1024 * 1024; // keeps the upload bundle
                                                // reasonable on flaky 3G/4G.
    const allowed = ["image/", "video/"];

    const accepted = [];
    for (const file of files) {
      if (!allowed.some((p) => file.type.startsWith(p))) {
        setPendingMediaError("Format non supporté. Choisis une photo ou une vidéo.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setPendingMediaError(`« ${file.name} » dépasse 25 Mo.`);
        return;
      }
      accepted.push(file);
    }

    setPendingMediaFiles((prev) => {
      const roomLeft = MAX_MEDIA - prev.length;
      if (roomLeft <= 0) {
        setPendingMediaError(`Tu as déjà ${MAX_MEDIA} médias (maximum).`);
        return prev;
      }
      const next = accepted.slice(0, roomLeft).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      const newTotal = prev.reduce((s, it) => s + it.file.size, 0)
        + next.reduce((s, it) => s + it.file.size, 0);
      if (newTotal > MAX_TOTAL_BYTES) {
        // Free the preview URLs we just allocated for the rejected batch.
        next.forEach((it) => URL.revokeObjectURL(it.previewUrl));
        setPendingMediaError("L'ensemble des médias dépasse 80 Mo. Réduis la sélection.");
        return prev;
      }
      if (accepted.length > roomLeft) {
        setPendingMediaError(`Seulement ${roomLeft} média(x) ajouté(s) — limite de ${MAX_MEDIA} atteinte.`);
      } else {
        setPendingMediaError("");
      }
      return [...prev, ...next];
    });
  }

  function handleRemovePendingMedia(index) {
    setPendingMediaFiles((items) => {
      const target = items[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = items.filter((_, i) => i !== index);
      // Clearing an error when the user actively edits the selection —
      // feels more responsive than waiting for the next add.
      if (next.length > 0) setPendingMediaError("");
      return next;
    });
  }

  function handleMediaContinue() {
    if (!hasMedia) {
      setPendingMediaError(`Ajoute au moins une photo ou vidéo pour t'inscrire (max ${MAX_MEDIA}).`);
      return;
    }
    setStep("pin");
  }

  function handlePinChange(v) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setPinError(false);
    setRegisterError("");
  }

  async function handleConfirmPin() {
    if (pin.length !== 4) return;
    if (pin !== WALLET_PIN) {
      setPinError(true);
      return;
    }
    setRegisterError("");
    setIsSubmitting(true);
    const result = await onRegister(comp, fee, pendingMediaFiles);
    setIsSubmitting(false);

    if (!result?.success) {
      setRegisterError(result?.error || "Une erreur est survenue. Réessayez.");
      return;
    }

    // Free the object URLs we created for previews — they were only needed
    // for the in-modal preview and are now safe to release.
    pendingMediaFiles.forEach((it) => URL.revokeObjectURL(it.previewUrl));

    setIsRegistered(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  }

  if (isRegistered) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1200,
          background: "rgba(17,17,17,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 380,
            background: "#1c1c1f",
            padding: "36px 28px",
            textAlign: "center",
            borderRadius: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#6C63FF", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
            boxShadow: "0 8px 20px rgba(108,99,255,0.35)",
          }}>
            <Check size={30} strokeWidth={3} />
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700,
            color: "#f2f2f2", display: "block", marginBottom: 8, letterSpacing: "-0.01em",
          }}>
            Inscription confirmée !
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: "#9a9aa0",
            display: "block", lineHeight: 1.6,
          }}>
            Vous êtes inscrit à <strong style={{ color: "#f2f2f2" }}>{comp.title}</strong>. Tes médias de présentation ont été envoyés — ils seront visibles publiquement une fois approuvés par l'organisateur.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1c1c1f",
          padding: "10px 18px 20px",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2e" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          {step === "media" && (
            <button onClick={() => setStep("form")} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          {step === "pin" && (
            <button onClick={() => { setStep("media"); setPin(""); setPinError(false); }} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              S'inscrire à {comp.title}
            </span>
            <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", fontWeight: 500 }}>
              {comp.edition} · {comp.registeredCount}/{comp.contestants} inscrits
            </span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {step === "form" && (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#26262a" }}>
              <MyAvatar user={currentUser} size={34} fontSize={13} iconSize={16} loggedBg="#6C63FF" />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#f2f2f2" }}>{currentUser.fullName}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</span>
              </div>
            </div>
          )}

          {/* Receipt-style fee summary */}
          <div style={{
            borderRadius: 14,
            border: `1px solid ${canAfford ? "#2a2a2e" : "#5a2a2a"}`,
            background: canAfford ? "#202023" : "#3f2423",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600 }}>
                Frais d'inscription
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#f2f2f2" }}>
                {fee} <span style={{ fontSize: 13, fontWeight: 600, color: "#8a8a90" }}>gourdes</span>
              </span>
            </div>
            <div style={{ borderTop: `1px dashed ${canAfford ? "#2a2a2e" : "#6a3530"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600 }}>
                Votre solde
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: canAfford ? "#f2f2f2" : "#ff6b5e" }}>
                {balance.toLocaleString("fr-FR")} gourdes
              </span>
            </div>
          </div>

          {!canAfford && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", padding: "0 2px" }}>
              Gourdes insuffisantes — achetez-en pour continuer.
            </span>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 14,
            background: canAfford ? "#6C63FF" : "#3a3a3e",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.02em",
            padding: "15px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: canAfford ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
          }}
        >
          {canAfford ? (
            <>
              <Plus size={16} strokeWidth={2.5} />
              Payer {fee} gourdes et s'inscrire
            </>
          ) : (
            <>
              <Wallet size={16} strokeWidth={2.5} />
              Acheter des gourdes
            </>
          )}
        </button>
        </>
        )}

        {step === "media" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600,
                }}>
                  Médias de présentation
                </span>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
                  color: isMediaFull ? "#E74C3C" : "#aaa",
                }}>
                  {pendingMediaFiles.length}/{MAX_MEDIA}
                </span>
              </div>
              <span style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", lineHeight: 1.5, display: "block",
              }}>
                Ajoute entre 1 et {MAX_MEDIA} photos ou vidéos pour présenter ta participation — elles seront ajoutées à ton album et visibles publiquement après approbation de l'organisateur.
              </span>
            </div>

            {/* Tile grid: 3 columns, each tile is a square preview. The "+" tile
                replaces the grid when the user is at the cap, so picking more
                files is impossible without us having to disable a button. */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              marginBottom: 12,
            }}>
              {pendingMediaFiles.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative", aspectRatio: "1 / 1", overflow: "hidden",
                    background: "#111", borderRadius: 10,
                  }}
                >
                  {it.file.type.startsWith("video/") ? (
                    <>
                      <video
                        src={it.previewUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        muted
                        playsInline
                      />
                      {/* "Vidéo" badge so the user can tell photo from video at
                          a glance without opening the preview. */}
                      <span style={{
                        position: "absolute", left: 6, bottom: 6,
                        background: "rgba(0,0,0,0.65)", color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        padding: "2px 5px", borderRadius: 4, letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}>
                        Vidéo
                      </span>
                    </>
                  ) : (
                    <img
                      src={it.previewUrl}
                      alt={`Aperçu ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <button
                    onClick={() => handleRemovePendingMedia(idx)}
                    type="button"
                    style={{
                      position: "absolute", top: 6, right: 6,
                      width: 24, height: 24, borderRadius: "50%",
                      border: "none", background: "rgba(0,0,0,0.6)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0,
                    }}
                    title="Retirer ce média"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {!isMediaFull && (
                <label style={{
                  position: "relative", aspectRatio: "1 / 1",
                  border: "1.5px dashed #6C63FF", background: "rgba(108,99,255,0.04)",
                  borderRadius: 10, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 4, color: "#B9A2FF",
                }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handlePickMedia}
                    style={{ display: "none" }}
                  />
                  <Plus size={20} strokeWidth={2.5} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
                    Ajouter
                  </span>
                </label>
              )}
            </div>

            {pendingMediaError && (
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600,
                textAlign: "center", marginBottom: 8,
              }}>
                {pendingMediaError}
              </div>
            )}

            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", textAlign: "center", marginBottom: 6,
            }}>
              Formats : JPG, PNG, MP4 · max 25 Mo / fichier
            </div>

            <button
              onClick={handleMediaContinue}
              disabled={!hasMedia}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: hasMedia ? "#6C63FF" : "#26262a",
                color: hasMedia ? "#fff" : "#8a8a90",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.02em",
                padding: "15px 20px",
                cursor: hasMedia ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 4,
                boxShadow: hasMedia ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
              }}
            >
              {hasMedia ? `Continuer (${pendingMediaFiles.length})` : "Continuer"}
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </>
        )}

        {step === "pin" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#262048", color: "#B9A2FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <BadgeCheck size={22} strokeWidth={2.25} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", lineHeight: 1.6 }}>
                Entrez votre code PIN pour confirmer le paiement de<br />
                <strong style={{ color: "#f2f2f2" }}>{fee} gourdes</strong> pour {comp.title}.
              </div>
            </div>

            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="••••"
              style={{
                width: "100%",
                border: `1.5px solid ${pinError ? "#E74C3C" : "#2a2a2e"}`,
                borderRadius: 14,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.5em",
                textAlign: "center",
                color: "#f2f2f2",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}
            {registerError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
                {registerError}
              </div>
            )}

            <button
              onClick={handleConfirmPin}
              disabled={pin.length !== 4 || isSubmitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: isSubmitting ? "#3a3a3e" : pin.length === 4 ? "#6C63FF" : "#26262a",
                color: pin.length === 4 || isSubmitting ? "#fff" : "#8a8a90",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.02em",
                padding: "15px 20px",
                cursor: pin.length === 4 && !isSubmitting ? "pointer" : "not-allowed",
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: pin.length === 4 && !isSubmitting ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Inscription en cours...
                </>
              ) : (
                "Confirmer et payer"
              )}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
