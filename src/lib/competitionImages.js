import { supabase } from "./supabaseClient";

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// create table competition_images (
//   id uuid primary key default gen_random_uuid(),
//   competition_id text not null,
//   file_path text not null,
//   position integer not null default 0,
//   created_at timestamptz not null default now()
// );
// alter table competition_images enable row level security;
// create policy "competition images rows are readable by everyone"
//   on competition_images for select
//   to anon, authenticated
//   using (true);
// create policy "only the platform organizer can add competition images"
//   on competition_images for insert
//   to authenticated
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
// create policy "only the platform organizer can remove competition images"
//   on competition_images for delete
//   to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
//
// -- Storage bucket for the actual files (skip if you already created this
// -- alongside competition_edits) --
// insert into storage.buckets (id, name, public)
//   values ('competition-images', 'competition-images', true)
//   on conflict (id) do nothing;
// create policy "competition images are publicly readable"
//   on storage.objects for select
//   to public
//   using (bucket_id = 'competition-images');
// create policy "only the platform organizer can upload competition images"
//   on storage.objects for insert
//   to authenticated
//   with check (
//     bucket_id = 'competition-images'
//     and (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com'
//   );
// create policy "only the platform organizer can delete competition image files"
//   on storage.objects for delete
//   to authenticated
//   using (
//     bucket_id = 'competition-images'
//     and (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com'
//   );
//
// ─────────────────────────────────────────────────────────────────────────
// Unlike competition_edits (one override row per competition), a
// competition can have several images here — this is what backs the
// gallery grid in the edit modal (multiple thumbnails + an "add" tile).

const BUCKET = "competition-images";
const TABLE = "competition_images";

// Returns { [competitionId]: [{ id, url, position }, ...] } for every
// competition that has at least one uploaded image.
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

// Uploads `file` to the storage bucket and records it against the
// competition (owner-only via RLS). Returns { data, error } where data is
// { id, url, position }.
export async function addCompetitionImage({ competitionId, file, position }) {
  const ext = file.name.split(".").pop() || "jpg";
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

// Deletes an image row and its underlying storage file (owner-only via RLS).
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
