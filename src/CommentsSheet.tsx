import { useState, useEffect, useMemo } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { hapticTap } from "./native";
import { supabase, hashStr, MyAvatar } from "./App";

/* Same comments-table shape used in CompetitionBoard.tsx's Live tab —
   duplicated here (rather than imported) so this sheet is a fully
   standalone component, the way ShareSheet.tsx is. */

async function fetchComments(editionId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchComments error:", error);
    return [];
  }

  const rows = data || [];
  const repliesByParent = {};
  rows.forEach((r) => {
    if (r.parent_id) {
      (repliesByParent[r.parent_id] ||= []).push(r);
    }
  });

  return rows
    .filter((r) => !r.parent_id)
    .map((c) => ({ ...c, replies: repliesByParent[c.id] || [] }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function insertComment({ editionId, competitionId, userId, fullName, avatarUrl, text, parentId = null }) {
  return supabase
    .from("comments")
    .insert({
      edition_id: editionId,
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      text,
      parent_id: parentId,
    })
    .select()
    .single();
}

function fmtCommentTime(minutesAgo) {
  if (minutesAgo < 1) return "à l'instant";
  if (minutesAgo < 60) return `${minutesAgo} min`;
  const h = Math.floor(minutesAgo / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
}

function EntityAvatar({ url, name, bg = "#ddd", color = "#666" }) {
  if (url) {
    return <img src={url} alt={name || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  }
  return (
    <div style={{
      width: "100%", height: "100%", background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

export default function CommentsSheet({ comp, accent = "#6C63FF", currentUser, onRequestAuth, onClose }) {
  const [entered, setEntered] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [draft, setDraft] = useState("");
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [expandedReplies, setExpandedReplies] = useState(() => new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  function mapRow(row) {
    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000));
    const isMine = currentUser && row.user_id === currentUser.id;
    return {
      id: row.id,
      index: Math.abs(hashStr(row.user_id || row.id)) % 40,
      name: row.full_name,
      avatarUrl: isMine ? currentUser.avatarUrl : row.avatar_url,
      text: row.text,
      minutesAgo,
      likes: 0,
      isMine,
    };
  }

  useEffect(() => {
    if (!comp?.id) return;
    let cancelled = false;
    setLoading(true);
    fetchComments(comp.id).then((rows) => {
      if (cancelled) return;
      setComments(rows.map((c) => ({ ...mapRow(c), replies: (c.replies || []).map(mapRow) })));
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp?.id]);

  useEffect(() => {
    if (!comp?.id) return;
    const channel = supabase
      .channel(`comments-sheet-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          const row = payload.new;
          if (row.parent_id) {
            setComments((prev) => prev.map((cm) => {
              if (cm.id !== row.parent_id) return cm;
              if ((cm.replies || []).some((r) => r.id === row.id)) return cm;
              return { ...cm, replies: [...(cm.replies || []), mapRow(row)] };
            }));
          } else {
            setComments((prev) => {
              if (prev.some((c) => c.id === row.id)) return prev;
              return [{ ...mapRow(row), replies: [] }, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp?.id]);

  if (!comp) return null;

  function handleClose() {
    setEntered(false);
    setTimeout(() => onClose?.(), 200);
  }

  async function handlePost() {
    const text = draft.trim();
    if (!text) return;
    if (!currentUser) { onRequestAuth?.(); return; }
    hapticTap("light");
    setPosting(true);
    const { data, error } = await insertComment({
      editionId: comp.id,
      competitionId: comp.competitionId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      text,
    });
    setPosting(false);
    if (error) { console.error("insertComment error:", error); return; }
    setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [{ ...mapRow(data), replies: [] }, ...prev]));
    setDraft("");
  }

  async function handlePostReply(parentId) {
    const text = replyDraft.trim();
    if (!text || !currentUser) return;
    const { data, error } = await insertComment({
      editionId: comp.id,
      competitionId: comp.competitionId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      text,
      parentId,
    });
    if (error) { console.error("insertComment (reply) error:", error); return; }
    setComments((prev) => prev.map((cm) => {
      if (cm.id !== parentId) return cm;
      if ((cm.replies || []).some((r) => r.id === data.id)) return cm;
      return { ...cm, replies: [...(cm.replies || []), mapRow(data)] };
    }));
    setExpandedReplies((prev) => new Set([...prev, parentId]));
    setReplyDraft("");
    setReplyingTo(null);
  }

  function toggleLike(id) {
    hapticTap("light");
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

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
          width: "100%", maxWidth: 480, height: "78vh", maxHeight: 640,
          background: "#fff",
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          display: "flex", flexDirection: "column",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.25s cubic-bezier(0.32,0.72,0,1)",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#ddd" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 16px 10px", flexShrink: 0, borderBottom: "1px solid #f0f0f0",
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <MessageCircle size={14} strokeWidth={2.5} color={accent} />
              Commentaires
            </span>
            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11.5, color: "#999", marginTop: 3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {comp.title}
            </div>
          </div>
          <button
            className="tap-scale-sm"
            onClick={handleClose}
            style={{
              border: "none", background: "#f5f5f5", borderRadius: "50%",
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={15} color="#666" />
          </button>
        </div>

        {/* Comment list */}
        <div className="native-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 16px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
              Chargement…
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
              Aucun commentaire pour le moment. Soyez le premier !
            </div>
          ) : comments.map((c, i) => {
            const liked = likedIds.has(c.id);
            const repliesOpen = expandedReplies.has(c.id);
            const isReplying = replyingTo === c.id;
            const isLast = i === comments.length - 1;
            return (
              <div key={c.id} style={{ borderBottom: isLast ? "none" : "1px solid #f0f0f0", padding: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                    border: "1px solid #e0e0e0",
                    background: c.isMine ? "#111" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {c.isMine ? (
                      <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <EntityAvatar url={c.avatarUrl} name={c.name} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#333" }}>{c.name}</span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb" }}>
                        {fmtCommentTime(c.minutesAgo)}
                      </span>
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444", lineHeight: 1.4, margin: "0 0 6px" }}>{c.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button className="tap-scale-sm" onClick={() => toggleLike(c.id)} style={{ border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: liked ? "#e74c3c" : "#aaa" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "#e74c3c" : "none"} stroke={liked ? "#e74c3c" : "#aaa"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        {c.likes + (liked ? 1 : 0)}
                      </button>
                      <button
                        className="tap-scale-sm"
                        onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyDraft(""); }}
                        style={{ border: "none", background: "none", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: isReplying ? accent : "#aaa" }}
                      >
                        Répondre
                      </button>
                      {c.replies?.length > 0 && (
                        <button
                          className="tap-scale-sm"
                          onClick={() => setExpandedReplies((prev) => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                          style={{ border: "none", background: "none", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: accent }}
                        >
                          {repliesOpen ? "Masquer" : `${c.replies.length} réponse${c.replies.length > 1 ? "s" : ""}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isReplying && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 38 }}>
                    <input
                      autoFocus
                      type="text"
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handlePostReply(c.id); }}
                      placeholder={`Répondre à ${c.name}…`}
                      style={{ flex: 1, minWidth: 0, border: "1px solid #e0e0e0", background: "#fafafa", padding: "7px 10px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", outline: "none" }}
                    />
                    <button
                      className="tap-scale-sm"
                      onClick={() => { hapticTap("light"); handlePostReply(c.id); }}
                      style={{ border: "none", background: accent, color: "#fff", padding: "7px 12px", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center" }}
                    ><Send size={13} /></button>
                  </div>
                )}

                {repliesOpen && c.replies?.length > 0 && (
                  <div style={{ marginLeft: 38, marginTop: 8, borderLeft: "2px solid #f0f0f0", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {c.replies.map((r) => {
                      const rLiked = likedIds.has(r.id);
                      return (
                        <div key={r.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1px solid #e0e0e0", background: r.isMine ? "#111" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {r.isMine ? (
                              <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>{r.name.charAt(0)}</span>
                            ) : (
                              <EntityAvatar url={r.avatarUrl} name={r.name} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333" }}>{r.name}</span>
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb" }}>{fmtCommentTime(r.minutesAgo)}</span>
                            </div>
                            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#555", lineHeight: 1.4, margin: "0 0 4px" }}>{r.text}</p>
                            <button className="tap-scale-sm" onClick={() => toggleLike(r.id)} style={{ border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: rLiked ? "#e74c3c" : "#bbb" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill={rLiked ? "#e74c3c" : "none"} stroke={rLiked ? "#e74c3c" : "#bbb"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                              {r.likes + (rLiked ? 1 : 0)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          padding: "10px 16px", borderTop: "1px solid #f0f0f0",
          paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
        }}>
          <MyAvatar user={currentUser} size={30} fontSize={12} iconSize={14} />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => { if (!currentUser) onRequestAuth?.(); }}
            onKeyDown={(e) => { if (e.key === "Enter") handlePost(); }}
            placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
            style={{
              flex: 1, minWidth: 0, border: "none", borderRadius: 999, background: "#f5f5f5",
              padding: "10px 16px", fontFamily: "Inter, sans-serif", fontSize: 13,
              color: "#333", outline: "none",
            }}
          />
          <button
            className="tap-scale-sm"
            onClick={handlePost}
            disabled={!draft.trim() || posting}
            style={{
              border: "none", borderRadius: 999, background: draft.trim() ? accent : "#eee",
              color: draft.trim() ? "#fff" : "#bbb",
              padding: "10px 14px", flexShrink: 0, whiteSpace: "nowrap",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}
