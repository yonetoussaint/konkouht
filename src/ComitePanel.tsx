import { useEffect, useState } from "react";
import { Users, Plus, X, Search, Pencil, Trash2, Coins, History } from "lucide-react";
import {
  listComiteMembers,
  searchUsersForComite,
  upsertComiteMember,
  removeComiteMember,
  repatriateComiteProfit,
  listComiteDistributions,
} from "./lib/comiteData";

/* ─── Comité ────────────────────────────────────────────────────────────
   Platform-organizer-only panel (mounted from AdminPage same as
   WithdrawalsPanel). Comité members are existing app users the organizer
   picks and assigns a percentage share to. Being listed here grants no
   extra app access — it only determines their cut the next time a profit
   repatriation is run, which credits each member's wallet balance
   directly. ─────────────────────────────────────────────────────────── */

function SheetShell({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1500,
        background: "rgba(17,17,17,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#1c1c1f",
          borderTop: "2px solid #2a2a2e", padding: 16,
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #2a2a2e" }}>
          <span style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {title}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#f2f2f2", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || name[0].toUpperCase();
}

function Avatar({ url, name }) {
  return url ? (
    <img src={url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
      background: "#26262a", color: "#c9c9c9",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
    }}>
      {initials(name)}
    </div>
  );
}

// Search existing users + pick one + set their percentage, in one sheet.
function AddMemberSheet({ remainingPercentage, onClose, onSaved, showToast }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState(null);
  const [percentage, setPercentage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (picked) return;
    const t = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      const { users, error: rpcError } = await searchUsersForComite(query);
      if (rpcError) {
        setSearchError("Impossible de charger les utilisateurs. Réessaie.");
        setResults([]);
      } else {
        setResults(users);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, picked]);

  async function handleSave() {
    const pct = Number(percentage);
    if (!picked || !pct || pct <= 0 || pct > 100 || saving) return;
    setSaving(true);
    setError("");
    const { error: rpcError } = await upsertComiteMember({ userId: picked.user_id, percentage: pct });
    setSaving(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("total_exceeds_100")
          ? `Le total dépasserait 100 % (il reste ${remainingPercentage}% à répartir).`
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    showToast && showToast(`${picked.full_name || picked.email} ajouté au comité`);
    onSaved && onSaved();
  }

  return (
    <SheetShell title="Ajouter un membre" onClose={onClose}>
      {!picked ? (
        <>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a8a90" }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou email…"
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1px solid #2a2a2e", borderRadius: 999,
                padding: "10px 14px 10px 36px",
                fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
                background: "#111", outline: "none",
              }}
            />
          </div>
          {searching ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              Recherche…
            </div>
          ) : searchError ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#ff6b5e", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600 }}>
              {searchError}
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              {query.trim() ? "Aucun utilisateur trouvé." : "Tape un nom ou un email pour chercher."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map((u) => (
                <button
                  key={u.user_id}
                  onClick={() => setPicked(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: "1px solid #2a2a2e", borderRadius: 10, padding: "8px 10px",
                    background: "#111", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <Avatar url={u.avatar_url} name={u.full_name} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#eaeaea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.full_name || "Utilisateur"}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, border: "1px solid #2a2a2e", borderRadius: 10, padding: "8px 10px", background: "#111" }}>
            <Avatar url={picked.avatar_url} name={picked.full_name} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#eaeaea" }}>{picked.full_name || "Utilisateur"}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>{picked.email}</div>
            </div>
            <button onClick={() => setPicked(null)} style={{ border: "none", background: "none", color: "#8a8a90", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Part du profit (%)
          </div>
          <input
            autoFocus
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.5"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder={`ex. ${remainingPercentage}`}
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #2a2a2e", borderRadius: 10,
              padding: "12px 14px",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2",
              background: "#111", outline: "none", marginBottom: 6,
            }}
          />
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", marginBottom: 14 }}>
            Il reste {remainingPercentage}% non attribué.
          </div>

          {error && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 10 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!percentage || Number(percentage) <= 0 || Number(percentage) > 100 || saving}
            style={{
              width: "100%", border: "none",
              background: percentage && Number(percentage) > 0 && !saving ? "#fff" : "#3a3a3e",
              color: percentage && Number(percentage) > 0 && !saving ? "#111" : "#8a8a90",
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "14px 20px", cursor: percentage ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Enregistrement…" : "Ajouter au comité"}
          </button>
        </>
      )}
    </SheetShell>
  );
}

// Edit an existing member's percentage.
function EditMemberSheet({ member, remainingPercentage, onClose, onSaved, showToast }) {
  const [percentage, setPercentage] = useState(String(member.percentage));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const maxAllowed = remainingPercentage + Number(member.percentage);

  async function handleSave() {
    const pct = Number(percentage);
    if (!pct || pct <= 0 || pct > 100 || saving) return;
    setSaving(true);
    setError("");
    const { error: rpcError } = await upsertComiteMember({ userId: member.user_id, percentage: pct });
    setSaving(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("total_exceeds_100")
          ? `Le total dépasserait 100 % (maximum possible ici : ${maxAllowed}%).`
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    showToast && showToast("Part mise à jour");
    onSaved && onSaved();
  }

  return (
    <SheetShell title={`Modifier — ${member.full_name || member.email}`} onClose={onClose}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Part du profit (%)
      </div>
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        min="0"
        max="100"
        step="0.5"
        value={percentage}
        onChange={(e) => setPercentage(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          border: "1px solid #2a2a2e", borderRadius: 10,
          padding: "12px 14px",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2",
          background: "#111", outline: "none", marginBottom: 6,
        }}
      />
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", marginBottom: 14 }}>
        Maximum possible pour ce membre : {maxAllowed}%.
      </div>

      {error && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!percentage || Number(percentage) <= 0 || Number(percentage) > 100 || saving}
        style={{
          width: "100%", border: "none",
          background: percentage && Number(percentage) > 0 && !saving ? "#fff" : "#3a3a3e",
          color: percentage && Number(percentage) > 0 && !saving ? "#111" : "#8a8a90",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "14px 20px", cursor: percentage ? "pointer" : "not-allowed",
        }}
      >
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </SheetShell>
  );
}

// Enter a profit amount, preview each member's share live, confirm.
function RepatriateSheet({ members, onClose, onDone, showToast }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountNum = Number(amount) || 0;
  const totalPct = members.reduce((s, m) => s + Number(m.percentage), 0);

  async function handleSubmit() {
    if (amountNum <= 0 || submitting) return;
    if (!window.confirm(`Répartir ${amountNum.toLocaleString("fr-FR")} HTG entre les ${members.length} membre${members.length > 1 ? "s" : ""} du comité ? Cette action crédite directement leur solde et est irréversible.`)) {
      return;
    }
    setSubmitting(true);
    setError("");
    const { error: rpcError } = await repatriateComiteProfit({ amount: amountNum, note: note.trim() || null });
    setSubmitting(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("no_members")
          ? "Aucun membre dans le comité."
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    showToast && showToast("Profits répartis entre les membres du comité");
    onDone && onDone();
  }

  return (
    <SheetShell title="Répartir les profits" onClose={onClose}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Montant total (HTG)
      </div>
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        style={{
          width: "100%", boxSizing: "border-box",
          border: "1px solid #2a2a2e", borderRadius: 10,
          padding: "12px 14px",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2",
          background: "#111", outline: "none", marginBottom: 14,
        }}
      />

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Note (optionnelle)
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ex. Profits — Septembre 2026"
        style={{
          width: "100%", boxSizing: "border-box",
          border: "1px solid #2a2a2e", borderRadius: 10,
          padding: "12px 14px",
          fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
          background: "#111", outline: "none", marginBottom: 16,
        }}
      />

      {amountNum > 0 && (
        <div style={{ border: "1px solid #2a2a2e", borderRadius: 10, padding: 12, marginBottom: 16, background: "#111" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Aperçu de la répartition
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => {
              const share = Math.round(amountNum * Number(m.percentage) / 100 * 100) / 100;
              return (
                <div key={m.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "55%" }}>
                    {m.full_name || m.email} <span style={{ color: "#8a8a90" }}>({m.percentage}%)</span>
                  </span>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#00B894" }}>
                    {share.toLocaleString("fr-FR")} HTG
                  </span>
                </div>
              );
            })}
          </div>
          {totalPct < 100 && (
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#e5a83f", marginTop: 10 }}>
              {(100 - totalPct)}% non attribué ne sera pas distribué ({Math.round(amountNum * (100 - totalPct) / 100 * 100) / 100} HTG restent non répartis).
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={amountNum <= 0 || submitting || members.length === 0}
        style={{
          width: "100%", border: "none",
          background: amountNum > 0 && !submitting ? "#00B894" : "#3a3a3e",
          color: amountNum > 0 && !submitting ? "#fff" : "#8a8a90",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "14px 20px", cursor: amountNum > 0 ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <Coins size={16} strokeWidth={2.5} /> {submitting ? "Répartition…" : "Confirmer et créditer"}
      </button>
    </SheetShell>
  );
}

export default function ComitePanel({ showToast }) {
  const [members, setMembers] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [showRepatriate, setShowRepatriate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  async function refresh() {
    setLoading(true);
    const [{ members: m }, { distributions: d }] = await Promise.all([
      listComiteMembers(),
      listComiteDistributions(),
    ]);
    setMembers(m);
    setDistributions(d);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleRemove(member) {
    if (!window.confirm(`Retirer ${member.full_name || member.email} du comité ?`)) return;
    setRemovingId(member.user_id);
    const { error } = await removeComiteMember(member.user_id);
    setRemovingId(null);
    if (error) {
      showToast && showToast("Une erreur est survenue");
      return;
    }
    showToast && showToast("Membre retiré du comité");
    refresh();
  }

  const totalPct = members.reduce((s, m) => s + Number(m.percentage), 0);
  const remainingPct = Math.max(0, Math.round((100 - totalPct) * 100) / 100);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {members.length} membre{members.length > 1 ? "s" : ""} · {totalPct}% attribué
        </span>
        <button
          onClick={() => setShowHistory(true)}
          style={{ border: "none", background: "none", color: "#c9c9c9", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <History size={12} strokeWidth={2.5} /> Historique
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setShowAdd(true)}
          disabled={remainingPct <= 0}
          style={{
            flex: 1, border: "1px solid #2a2a2e", borderRadius: 10, padding: "12px 14px",
            background: "#1c1c1f", color: remainingPct > 0 ? "#eaeaea" : "#5a5a5e",
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
            cursor: remainingPct > 0 ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={15} strokeWidth={2.5} /> Ajouter un membre
        </button>
        <button
          onClick={() => setShowRepatriate(true)}
          disabled={members.length === 0}
          style={{
            flex: 1, border: "none", borderRadius: 10, padding: "12px 14px",
            background: members.length > 0 ? "#00B894" : "#3a3a3e",
            color: members.length > 0 ? "#fff" : "#8a8a90",
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
            cursor: members.length > 0 ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Coins size={15} strokeWidth={2.5} /> Répartir les profits
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 8px", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
          Chargement…
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 8px", border: "1px solid #2a2a2e", background: "#1c1c1f", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 12 }}>
          <Users size={22} style={{ marginBottom: 8, opacity: 0.6 }} />
          <div>Aucun membre dans le comité pour l'instant.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #2a2a2e", background: "#1c1c1f", borderRadius: 12, padding: 12 }}>
              <Avatar url={m.avatar_url} name={m.full_name} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.full_name || "Utilisateur"}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.email}
                </div>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#00B894", flexShrink: 0 }}>
                {m.percentage}%
              </span>
              <button
                onClick={() => setEditingMember(m)}
                style={{ border: "none", background: "none", color: "#8a8a90", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handleRemove(m)}
                disabled={removingId === m.user_id}
                style={{ border: "none", background: "none", color: "#ff6b5e", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddMemberSheet
          remainingPercentage={remainingPct}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh(); }}
          showToast={showToast}
        />
      )}

      {editingMember && (
        <EditMemberSheet
          member={editingMember}
          remainingPercentage={Math.max(0, Math.round((100 - totalPct) * 100) / 100)}
          onClose={() => setEditingMember(null)}
          onSaved={() => { setEditingMember(null); refresh(); }}
          showToast={showToast}
        />
      )}

      {showRepatriate && (
        <RepatriateSheet
          members={members}
          onClose={() => setShowRepatriate(false)}
          onDone={() => { setShowRepatriate(false); refresh(); }}
          showToast={showToast}
        />
      )}

      {showHistory && (
        <SheetShell title="Historique des répartitions" onClose={() => setShowHistory(false)}>
          {distributions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              Aucune répartition pour l'instant.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {distributions.map((d) => (
                <div key={d.id} style={{ border: "1px solid #2a2a2e", borderRadius: 10, padding: 12, background: "#111" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea" }}>
                        {Number(d.total_amount).toLocaleString("fr-FR")} HTG
                      </div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
                        {new Date(d.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  {d.note && (
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9", marginBottom: 8 }}>
                      {d.note}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(d.shares || []).map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0" }}>
                        <span>{s.full_name} ({s.percentage}%)</span>
                        <span style={{ color: "#c9c9c9" }}>{Number(s.amount).toLocaleString("fr-FR")} HTG</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetShell>
      )}
    </div>
  );
}
