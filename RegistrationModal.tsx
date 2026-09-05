import { useState, useEffect } from "react";
import { ArrowLeft, X, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "./App";

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

/* ─── AUTH OVERLAY (login / signup / password reset bottom sheet) ───────── */

export default function AuthOverlay({ onClose, onAuthenticated, compTitle, followIntent }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function switchMode(next) {
    setMode(next);
    setError("");
    setInfo("");
  }

  async function handleSubmit() {
    setError("");
    setInfo("");

    if (mode === "reset") {
      if (!isValidEmail(email)) {
        setError("Veuillez entrer une adresse e-mail valide.");
        return;
      }
      setIsSubmitting(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      setIsSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo("Lien envoyé. Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.");
      setMode("login");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Veuillez entrer votre nom complet.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      setIsSubmitting(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        // Email confirmation disabled in the Supabase project — signed in immediately.
        onAuthenticated(data.user);
      } else {
        // Email confirmation required — no session yet.
        setInfo("Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription, puis connectez-vous.");
        setMode("login");
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setIsSubmitting(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      onAuthenticated(data.user);
    }
  }

  async function handleOAuth(provider) {
    setError("");
    setInfo("");
    setOauthProvider(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (oauthError) {
      setError(oauthError.message);
      setOauthProvider(null);
    }
    // On success, Supabase redirects the browser away — nothing else to do here.
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const inputStyle = {
    width: "100%",
    border: "1px solid #2a2a2e",
    borderRadius: 12,
    padding: "12px 12px 12px 40px",
    fontFamily: "Inter, sans-serif", fontSize: 14,
    background: "#26262a", color: "#f2f2f2",
    boxSizing: "border-box",
    outline: "none",
  };
  const labelStyle = {
    fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
    color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };
  const fieldIconStyle = { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a8a90", pointerEvents: "none" };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        background: mounted ? "rgba(17,17,17,0.6)" : "rgba(17,17,17,0)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        transition: "background 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#1c1c1f",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "10px 20px 24px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          transform: mounted ? "translateY(0)" : "translateY(40px)",
          opacity: mounted ? 1 : 0,
          transition: "transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 14px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#2a2a2e" }} />
        </div>

        {mode === "reset" && (
          <button
            onClick={() => switchMode("login")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, color: "#9a9aa0" }}
          >
            <ArrowLeft size={16} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>Retour</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {mode === "login" ? "Connexion requise" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "#202023", cursor: "pointer", color: "#f2f2f2", padding: 8, borderRadius: "50%", display: "flex", lineHeight: 0 }}>
            <X size={16} />
          </button>
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#9a9aa0", display: "block", marginBottom: 20, lineHeight: 1.5 }}>
          {mode === "reset"
            ? "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe."
            : compTitle ? `Connectez-vous pour vous inscrire à ${compTitle}.`
            : followIntent ? `Connectez-vous pour suivre ${followIntent}.`
            : "Connectez-vous pour accéder à votre compte."}
        </span>

        {mode !== "reset" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#2a2a2e", borderRadius: 999, padding: 4 }}>
            <button
              onClick={() => switchMode("login")}
              style={{
                flex: 1, border: "none", borderRadius: 999,
                background: mode === "login" ? "#fff" : "transparent",
                color: mode === "login" ? "#111" : "#8a8a90",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "10px 0", cursor: "pointer", transition: "background 0.2s, color 0.2s",
              }}
            >
              Se connecter
            </button>
            <button
              onClick={() => switchMode("signup")}
              style={{
                flex: 1, border: "none", borderRadius: 999,
                background: mode === "signup" ? "#fff" : "transparent",
                color: mode === "signup" ? "#111" : "#8a8a90",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em",
                padding: "10px 0", cursor: "pointer", transition: "background 0.2s, color 0.2s",
              }}
            >
              Créer un compte
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Nom complet</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={fieldIconStyle} />
                <input
                  type="text"
                  placeholder="ex. Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>E-mail</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={fieldIconStyle} />
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                {mode === "login" && (
                  <button
                    onClick={() => switchMode("reset")}
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#B9A2FF" }}
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={fieldIconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#8a8a90", padding: 4, display: "flex" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "signup" && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", marginTop: 5, display: "block" }}>
                  Au moins 6 caractères.
                </span>
              )}
            </div>
          )}

          {info && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#00B894", background: "#0f3b2e", border: "1px solid #b8edd9", borderRadius: 10, padding: "8px 10px" }}>
              {info}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", background: "#3f2423", border: "1px solid #6a3530", borderRadius: 10, padding: "8px 10px" }}>
              {error}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 999,
            background: "#fff",
            color: "#111",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "15px 16px",
            cursor: isSubmitting ? "default" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isSubmitting
            ? "Veuillez patienter…"
            : mode === "login" ? "Se connecter"
            : mode === "signup" ? "Créer mon compte"
            : "Envoyer le lien"}
        </button>

        {mode !== "reset" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#26262a" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", textTransform: "uppercase", letterSpacing: "0.05em" }}>ou continuer avec</span>
              <div style={{ flex: 1, height: 1, background: "#26262a" }} />
            </div>

            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthProvider}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                border: "1px solid #2a2a2e", borderRadius: 999, background: "#1c1c1f",
                padding: "13px 0", cursor: oauthProvider ? "default" : "pointer",
                opacity: oauthProvider ? 0.6 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7955 2.7164v2.2581h2.9086c1.7018-1.5668 2.6836-3.8741 2.6836-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9086-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z"/>
                <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.5564 3.5795 9 3.5795z"/>
              </svg>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#f2f2f2" }}>
                {oauthProvider === "google" ? "Redirection…" : "Continuer avec Google"}
              </span>
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", letterSpacing: "0.02em" }}>
            Propulsé par <span style={{ fontWeight: 700, color: "#8a8a90" }}>Mima</span>
          </span>
        </div>
      </div>
    </div>
  );
}
