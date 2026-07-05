import { supabase } from "./supabaseClient";

// Adjust these two if your project uses different names.
const BUCKET = "competition-images";
const TABLE = "competition_images";

/**
 * Returns { [competitionId]: [{ id, url, position }, ...] } for every
 * competition that has at least one uploaded image.
 */
export async function fetchAllCompetitionImages() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    console.error("fetchAllCompetitionImages error:", error);
    return {};
  }

  const grouped = {};
  for (const row of data) {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(row.file_path);
    if (!grouped[row.competition_id]) grouped[row.competition_id] = [];
    grouped[row.competition_id].push({
      id: row.id,
      url: pub.publicUrl,
      position: row.position,
    });
  }
  return grouped;
}

/**
 * Uploads `file` to the storage bucket and records it against the
 * competition. Returns { data, error } where data is { id, url, position }.
 */
export async function addCompetitionImage({ competitionId, file, position }) {
  const ext = file.name.split(".").pop();
  const filePath = `${competitionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
  if (uploadError) {
    console.error("addCompetitionImage upload error:", uploadError);
    return { data: null, error: uploadError };
  }

  const { data: row, error: insertError } = await supabase
    .from(TABLE)
    .insert({ competition_id: competitionId, file_path: filePath, position })
    .select()
    .single();

  if (insertError) {
    console.error("addCompetitionImage insert error:", insertError);
    // Best-effort cleanup so we don't leave an orphaned file in storage.
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { data: null, error: insertError };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return { data: { id: row.id, url: pub.publicUrl, position: row.position }, error: null };
}

/**
 * Deletes an image row and its underlying storage file.
 */
export async function deleteCompetitionImage(imageId) {
  const { data: row, error: fetchError } = await supabase
    .from(TABLE)
    .select("file_path")
    .eq("id", imageId)
    .single();

  if (fetchError) {
    console.error("deleteCompetitionImage fetch error:", fetchError);
    return { error: fetchError };
  }

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.file_path]);
  if (storageError) {
    console.error("deleteCompetitionImage storage error:", storageError);
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", imageId);
  if (error) {
    console.error("deleteCompetitionImage delete error:", error);
  }
  return { error };
}
