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
    detectSessionInUrl: true, // required so the app can pick up the session Supabase appends to the URL after a Google redirect
  },
});

// ── Google sign-in setup (one-time, in the Supabase & Google dashboards) ───
//
// The "Continuer avec Google" button in AuthOverlay calls
// supabase.auth.signInWithOAuth({ provider: "google" }), which redirects the
// browser to Google, then back to this app with a session in the URL —
// detectSessionInUrl above picks it up automatically and the app's
// onAuthStateChange listener (in App()) signs the user in. Nothing else in
// the app code needs to change; this is dashboard configuration only:
//
// 1. Google Cloud Console (console.cloud.google.com):
//    - Create (or reuse) a project → "APIs & Services" → "OAuth consent
//      screen" → fill in app name, support email, etc.
//    - "Credentials" → "Create Credentials" → "OAuth client ID" →
//      Application type: "Web application".
//    - Authorized redirect URIs: add
//        https://<your-project-ref>.supabase.co/auth/v1/callback
//      (find your project ref in the Supabase dashboard URL or Settings →
//      API). This is Google's callback, not your own app's URL.
//    - Save, then copy the generated Client ID and Client Secret.
//
// 2. Supabase dashboard → Authentication → Providers → Google:
//    - Toggle it on, paste the Client ID and Client Secret from step 1,
//      save.
//
// 3. Supabase dashboard → Authentication → URL Configuration:
//    - Site URL: your app's deployed URL (or http://localhost:5173 etc.
//      during local dev).
//    - Redirect URLs: add every URL the app is served from (production
//      domain, localhost, any preview/staging URLs) — Supabase only
//      redirects back to URLs on this allow-list after Google sign-in.
//
// Until steps 1–3 are done, clicking the button will surface an error from
// Supabase (e.g. "Unsupported provider") instead of opening Google's
// sign-in screen.

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// -- Single-row-per-competition overrides (title, edition, description, etc.) --
// create table competition_edits (
//   competition_id text primary key,
//   title text,
//   edition text,
//   ends text,
//   ends_at timestamptz,
//   contestants integer,
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
//   add column if not exists ends_at timestamptz,
//   add column if not exists contestants integer,
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

/* ─── competition_edits ──────────────────────────────────────────────── */

// Returns a map of { [competitionId]: { title, edition, ends, bannerUrl,
// description, prizeAmount, rewardExtra, rules } }
export async function fetchCompetitionEdits() {
  const { data, error } = await supabase.from("competition_edits").select("*");
  if (error) {
    console.error("fetchCompetitionEdits error:", error);
    return {};
  }
  const map = {};
  (data || []).forEach((row) => {
    map[row.competition_id] = {
      title: row.title,
      edition: row.edition,
      ends: row.ends,
      endsAt: row.ends_at,
      contestants: row.contestants,
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
  endsAt,
  contestants,
  bannerUrl,
  description,
  prizeAmount,
  rewardExtra,
  rules,
  updatedBy,
}) {
  return supabase
    .from("competition_edits")
    .upsert(
      {
        competition_id: competitionId,
        title,
        edition,
        ends,
        ends_at: endsAt,
        contestants,
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
export async function uploadCompetitionImage({ competitionId, file }) {
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
export async function fetchAllCompetitionImages() {
  const { data, error } = await supabase
    .from(IMAGES_TABLE)
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    console.error("fetchAllCompetitionImages error:", error);
    return {};
  }

  const grouped = {};
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
export async function addCompetitionImage({ competitionId, file, position }) {
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
export async function deleteCompetitionImage(imageId) {
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

// Fetch every comment (top-level + replies) for a competition and nest
// replies under their parent, newest top-level comment first.
export async function fetchComments(competitionId) {
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

// Insert a new top-level comment or reply (pass parentId to reply).
export async function insertComment({ competitionId, userId, fullName, text, parentId = null }) {
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

// Returns { [competitionId]: count } across every competition, in one query —
// the real "inscrits" numbers used app-wide (cards, stat tiles, etc.) instead
// of any seeded/placeholder count.
export async function fetchAllRegistrationCounts() {
  const { data, error } = await supabase.from("registrations").select("competition_id");
  if (error) {
    console.error("fetchAllRegistrationCounts failed:", error.message);
    return {};
  }
  const counts = {};
  (data || []).forEach((row) => {
    counts[row.competition_id] = (counts[row.competition_id] || 0) + 1;
  });
  return counts;
}

// Fetch every real signed-up user registered for a given competition,
// most recent first. Returns [] (not null/throw) if there are none yet.
export async function fetchRegistrations(competitionId) {
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
export async function fetchUserRegistrations(userId) {
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
export async function insertRegistration({ competitionId, userId, fullName, fee }) {
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
