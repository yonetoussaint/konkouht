import { supabase } from "./supabaseClient";

// ─── Comments ────────────────────────────────────────────────────────────────

export async function fetchComments(editionId) {
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

export async function insertComment({
  editionId,
  competitionId,
  userId,
  fullName,
  avatarUrl,
  text,
  parentId = null,
}) {
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

// ─── Registrations ───────────────────────────────────────────────────────────

export async function deleteRegistration(registrationId) {
  const { error } = await supabase.from("registrations").delete().eq("id", registrationId);
  return { error };
}

export async function deleteParticipantAlbum(uploaderId, editionId) {
  const { data: mediaRows, error: fetchError } = await supabase
    .from("participant_media")
    .select("media_url")
    .eq("edition_id", editionId)
    .eq("uploader_id", uploaderId);
  if (fetchError) {
    console.error("participant_media fetch error (removeParticipant):", fetchError);
  } else if (mediaRows?.length) {
    const paths = mediaRows
      .map((r) => r.media_url?.replace(/^.*\/participant-media\//, ""))
      .filter(Boolean);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("participant-media").remove(paths);
      if (storageError) console.error("participant_media storage cleanup error (removeParticipant):", storageError);
    }
  }
  const { error } = await supabase
    .from("participant_media")
    .delete()
    .eq("edition_id", editionId)
    .eq("uploader_id", uploaderId);
  return { error };
}

// ─── Gift emoji ──────────────────────────────────────────────────────────────

export function notoAnimatedEmojiUrl(emoji) {
  const codepoints = Array.from(emoji)
    .map((ch) => ch.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints.join("_")}/lottie.json`;
}
