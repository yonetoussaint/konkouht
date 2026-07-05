import { createClient } from "@supabase/supabase-js";

// ── Supabase client ──────────────────────────────────────────────────────
// Vite convention (import.meta.env.VITE_*). If you're on Next.js, swap these
// for process.env.NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
// If you're on Create React App, use process.env.REACT_APP_SUPABASE_URL / _ANON_KEY.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and early instead of silently breaking auth calls later.
  throw new Error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// -- Single-row-per-competition overrides (title, edition, description, etc.) --
// create table competition_edits (
//   competition_id text primary key,
//   title text,
//   edition text,
//   ends text,
//   banner_url text,
//   description text,
//   prize_amount numeric,
//   reward_extra text,
//   rules jsonb,
//   updated_by uuid,
//   updated_at timestamptz not null default now()
// );
// alter table competition_edits enable row level security;
// create policy "competition edits are readable by everyone"
//   on competition_edits for select
//   to anon, authenticated
//   using (true);
// create policy "only the platform organizer can insert edits"
//   on competition_edits for insert
//   to authenticated
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
// create policy "only the platform organizer can update edits"
//   on competition_edits for update
//   to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' )
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
//
// If competition_edits already exists without the newer columns, run instead:
//
// alter table competition_edits
//   add column if not exists description text,
//   add column if not exists prize_amount numeric,
//   add column if not exists reward_extra text,
//   add column if not exists rules jsonb;
//
// -- Multi-row gallery images per competition (backs the edit modal's grid) --
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
// -- Shared storage bucket for both banner_url uploads and gallery images --
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
// create policy "only the platform organizer can update competition images"
//   on storage.objects for update
//   to authenticated
//   using (
//     bucket_id = 'competition-images'
//     and (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com'
//   );
// create policy "only the platform organizer can delete competition images"
//   on storage.objects for delete
//   to authenticated
//   using (
//     bucket_id = 'competition-images'
//     and (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com'
//   );
//
// ─────────────────────────────────────────────────────────────────────────
// Competitions themselves are still static seed data in App.jsx (there's no
// "competitions" table yet).
//
// - competition_edits stores one override row per competition id (title,
//   edition, ends, description, prizeAmount, rewardExtra, rules, banner).
// - competition_images stores zero or more gallery images per competition,
//   which back the thumbnail grid + "add" tile in the edit modal.
// The app merges both on top of the seed data wherever a competition is
// displayed or opened.

const BUCKET = "competition-images";
const IMAGES_TABLE = "competition_images";

export type CompetitionEdit = {
  title?: string;
  edition?: string;
  ends?: string;
  bannerUrl?: string;
  description?: string;
  prizeAmount?: number | null;
  rewardExtra?: string;
  rules?: string[];
};

export type CompetitionImage = {
  id: string;
  url: string;
  position: number;
};

/* ─── competition_edits ──────────────────────────────────────────────── */

// Returns a map of { [competitionId]: { title, edition, ends, bannerUrl,
// description, prizeAmount, rewardExtra, rules } }
export async function fetchCompetitionEdits(): Promise<Record<string, CompetitionEdit>> {
  const { data, error } = await supabase.from("competition_edits").select("*");
  if (error) {
    console.error("fetchCompetitionEdits error:", error);
    return {};
  }
  const map: Record<string, CompetitionEdit> = {};
  (data || []).forEach((row: any) => {
    map[row.competition_id] = {
      title: row.title,
      edition: row.edition,
      ends: row.ends,
      bannerUrl: row.banner_url,
      description: row.description,
      prizeAmount: row.prize_amount,
      rewardExtra: row.reward_extra,
      rules: row.rules || [],
    };
  });
  return map;
}

// Create or update the override row for a competition (owner-only via RLS).
export async function saveCompetitionEdit({
  competitionId,
  title,
  edition,
  ends,
  bannerUrl,
  description,
  prizeAmount,
  rewardExtra,
  rules,
  updatedBy,
}: {
  competitionId: string;
  title?: string;
  edition?: string;
  ends?: string;
  bannerUrl?: string;
  description?: string;
  prizeAmount?: number | null;
  rewardExtra?: string;
  rules?: string[];
  updatedBy?: string;
}) {
  return supabase
    .from("competition_edits")
    .upsert(
      {
        competition_id: competitionId,
        title,
        edition,
        ends,
        banner_url: bannerUrl,
        description,
        prize_amount: prizeAmount,
        reward_extra: rewardExtra,
        rules,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "competition_id" }
    )
    .select()
    .single();
}

// Upload a new banner/thumbnail image for a competition and return its
// public URL. Overwrites any previous file for the same competition.
export async function uploadCompetitionImage({
  competitionId,
  file,
}: {
  competitionId: string;
  file: File;
}) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${competitionId}/banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the new image shows immediately even if the browser
  // cached the old file at the same path.
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, error: null };
}

/* ─── competition_images (gallery) ──────────────────────────────────────── */

// Returns { [competitionId]: [{ id, url, position }, ...] } for every
// competition that has at least one uploaded image.
export async function fetchAllCompetitionImages(): Promise<Record<string, CompetitionImage[]>> {
  const { data, error } = await supabase
    .from(IMAGES_TABLE)
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    console.error("fetchAllCompetitionImages error:", error);
    return {};
  }

  const grouped: Record<string, CompetitionImage[]> = {};
  for (const row of data || []) {
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
export async function addCompetitionImage({
  competitionId,
  file,
  position,
}: {
  competitionId: string;
  file: File;
  position: number;
}) {
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${competitionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
  if (uploadError) {
    console.error("addCompetitionImage upload error:", uploadError);
    return { data: null, error: uploadError };
  }

  const { data: row, error: insertError } = await supabase
    .from(IMAGES_TABLE)
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
export async function deleteCompetitionImage(imageId: string) {
  const { data: row, error: fetchError } = await supabase
    .from(IMAGES_TABLE)
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

  const { error } = await supabase.from(IMAGES_TABLE).delete().eq("id", imageId);
  if (error) {
    console.error("deleteCompetitionImage delete error:", error);
  }
  return { error };
}

/* ─── comments ───────────────────────────────────────────────────────────
//
// create table comments (
//   id uuid primary key default gen_random_uuid(),
//   competition_id text not null,
//   parent_id uuid references comments(id) on delete cascade,
//   user_id uuid not null,
//   full_name text not null,
//   text text not null,
//   created_at timestamptz not null default now()
// );
// create index comments_competition_id_idx on comments (competition_id);
// create index comments_parent_id_idx on comments (parent_id);
// alter table comments enable row level security;
// create policy "comments are readable by everyone" on comments for select using (true);
// create policy "authenticated users can insert their own comments" on comments
//   for insert with check (auth.uid() = user_id);
*/

export type Comment = {
  id: string;
  competition_id: string;
  parent_id: string | null;
  user_id: string;
  full_name: string;
  text: string;
  created_at: string;
  replies: Comment[];
};

// Fetch every comment (top-level + replies) for a competition and nest
// replies under their parent, newest top-level comment first.
export async function fetchComments(competitionId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchComments error:", error);
    return [];
  }

  const rows = data || [];
  const repliesByParent: Record<string, any[]> = {};
  rows.forEach((r: any) => {
    if (r.parent_id) {
      (repliesByParent[r.parent_id] ||= []).push(r);
    }
  });

  return rows
    .filter((r: any) => !r.parent_id)
    .map((c: any) => ({ ...c, replies: repliesByParent[c.id] || [] }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Insert a new top-level comment or reply (pass parentId to reply).
export async function insertComment({
  competitionId,
  userId,
  fullName,
  text,
  parentId = null,
}: {
  competitionId: string;
  userId: string;
  fullName: string;
  text: string;
  parentId?: string | null;
}) {
  return supabase
    .from("comments")
    .insert({
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      text,
      parent_id: parentId,
    })
    .select()
    .single();
}

/* ─── registrations ──────────────────────────────────────────────────────── */

export type Registration = {
  id: string;
  user_id: string;
  full_name: string;
  fee_paid: number;
  created_at: string;
};

// Fetch every real signed-up user registered for a given competition,
// most recent first. Returns [] (not null/throw) if there are none yet.
export async function fetchRegistrations(competitionId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, user_id, full_name, fee_paid, created_at")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchRegistrations failed:", error.message);
    return [];
  }
  return data || [];
}

// Fetch every competition_id the given user has registered for.
// Returns [] (not null/throw) if there are none yet — used on load/login
// to rebuild the client-side "registeredCompIds" set from the source of
// truth in the database (so a refresh doesn't lose registration state).
export async function fetchUserRegistrations(userId: string): Promise<{ competition_id: string }[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("competition_id")
    .eq("user_id", userId);

  if (error) {
    console.error("fetchUserRegistrations failed:", error.message);
    return [];
  }
  return data || [];
}

// Insert a real registration row. Returns { data, error } so the caller can
// decide how to surface a failure (e.g. "already registered" from the
// unique constraint).
export async function insertRegistration({
  competitionId,
  userId,
  fullName,
  fee,
}: {
  competitionId: string;
  userId: string;
  fullName: string;
  fee: number;
}) {
  const { data, error } = await supabase
    .from("registrations")
    .insert({
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      fee_paid: fee,
    })
    .select()
    .single();

  return { data, error };
}

