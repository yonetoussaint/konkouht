import { createClient } from "@supabase/supabase-js";

// ── Supabase client ──────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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
// Multi-edition model: a single seed competition (e.g. "m1" — "Battle
// Hip-Hop") can now have many editions ("Saison 4", "Saison 5", a fresh
// draft being prepared, ...). `id` (uuid) is the real primary key here —
// NOT competition_id — because competition_id is no longer unique; it's
// just which seed series this edition belongs to.
//
// create table competition_editions (
//   id uuid primary key default gen_random_uuid(),
//   competition_id text not null,      -- the static seed id, e.g. "m1"
//   title text,
//   edition text,
//   ends text,
//   ends_at timestamptz,
//   phase text,                        -- 'draft' | 'registration' | 'live' | 'completed'
//   contestants integer,
//   banner_url text,
//   description text,
//   prize_amount numeric,
//   fee numeric,
//   reward_extra text,
//   rules jsonb,
//   active boolean not null default true,
//   winner_user_id uuid,
//   winner_name text,
//   winner_prize numeric,
//   closed_at timestamptz,
//   updated_by uuid,
//   updated_at timestamptz not null default now(),
//   created_at timestamptz not null default now()
// );
// create index competition_editions_competition_id_idx on competition_editions (competition_id);
// alter table competition_editions enable row level security;
// create policy "competition editions are readable by everyone"
//   on competition_editions for select
//   to anon, authenticated
//   using (true);
// create policy "only the platform organizer can insert editions"
//   on competition_editions for insert
//   to authenticated
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
// create policy "only the platform organizer can update editions"
//   on competition_editions for update
//   to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' )
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
// create policy "only the platform organizer can delete editions"
//   on competition_editions for delete
//   to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
//
// -- If migrating from the old single-edition `competition_edits` table,
// -- create the new table above, then backfill (each old row becomes one
// -- edition of its competition_id) and drop the old table once verified:
//
// insert into competition_editions
//   (competition_id, title, edition, ends, ends_at, phase, contestants,
//    banner_url, description, prize_amount, reward_extra, rules, active,
//    updated_by, updated_at)
// select
//    competition_id, title, edition, ends, ends_at, phase, contestants,
//    banner_url, description, prize_amount, reward_extra, rules, active,
//    updated_by, updated_at
// from competition_edits;
// -- (then, once the app is confirmed working against competition_editions:)
// -- drop table competition_edits;
//
// -- Multi-row gallery images per competition (unchanged — still shared
// -- across every edition of a series, keyed by the seed competition_id) --
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
// -- registrations: now scoped per EDITION, not per seed competition. --
// create table if not exists registrations (
//   id uuid primary key default gen_random_uuid(),
//   edition_id uuid not null,
//   competition_id text not null,      -- kept alongside edition_id for easy seed-level lookups
//   user_id uuid not null,
//   full_name text not null,
//   avatar_url text,
//   fee_paid numeric not null default 0,
//   created_at timestamptz not null default now(),
//   unique (edition_id, user_id)
// );
// -- If upgrading an existing registrations table:
// alter table registrations
//   add column if not exists edition_id uuid,
//   add column if not exists avatar_url text;
// -- backfill edition_id from competition_edits/competition_editions before
// -- adding the constraint, then:
// alter table registrations alter column edition_id set not null;
// alter table registrations drop constraint if exists registrations_competition_id_user_id_key;
// alter table registrations add constraint registrations_edition_id_user_id_key unique (edition_id, user_id);
//
// alter table registrations enable row level security;
// create policy "registrations are readable by everyone" on registrations
//   for select to anon, authenticated using (true);
// create policy "authenticated users can insert their own registration" on registrations
//   for insert to authenticated with check (auth.uid() = user_id);
// create policy "users can update their own registration" on registrations
//   for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
// -- Let the platform organizer delete a registration (admin removal during
// -- the registration phase). Without this policy the delete below silently
// -- matches zero rows under RLS instead of erroring. --
// create policy "only the platform organizer can delete registrations"
//   on registrations for delete
//   to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
//
// -- comments: now scoped per EDITION, not per seed competition. --
// create table if not exists comments (
//   id uuid primary key default gen_random_uuid(),
//   edition_id uuid not null,
//   competition_id text not null,      -- kept alongside edition_id for easy seed-level lookups
//   parent_id uuid references comments(id) on delete cascade,
//   user_id uuid not null,
//   full_name text not null,
//   avatar_url text,
//   text text not null,
//   created_at timestamptz not null default now()
// );
// -- If upgrading an existing comments table:
// alter table comments
//   add column if not exists edition_id uuid,
//   add column if not exists avatar_url text;
// -- backfill edition_id, then:
// alter table comments alter column edition_id set not null;
// create index if not exists comments_edition_id_idx on comments (edition_id);
// create index if not exists comments_parent_id_idx on comments (parent_id);
// alter table comments enable row level security;
// create policy "comments are readable by everyone" on comments for select using (true);
// create policy "authenticated users can insert their own comments" on comments
//   for insert with check (auth.uid() = user_id);
//
// -- gifts and participant_media are read/written directly via `supabase`
// -- from App.jsx (not through this lib file), but they're edition-scoped
// -- too now, so they need the same edition_id column added: --
// alter table gifts add column if not exists edition_id uuid;
// alter table participant_media add column if not exists edition_id uuid;
// create index if not exists gifts_edition_id_idx on gifts (edition_id);
// create index if not exists participant_media_edition_id_idx on participant_media (edition_id);
//
// -- wallet_balances / wallet_transactions are assumed to already exist
// -- (they back the MonCash SMS deposit-crediting pipeline). If they don't
// -- yet, create them and let the platform organizer credit either table: --
// create table if not exists wallet_balances (
//   user_id uuid primary key,
//   balance numeric not null default 0
// );
// create table if not exists wallet_transactions (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid not null,
//   type text not null,
//   label text,
//   amount numeric not null,
//   created_at timestamptz not null default now()
// );
// alter table wallet_balances enable row level security;
// alter table wallet_transactions enable row level security;
// create policy "users read their own balance" on wallet_balances
//   for select to authenticated using (auth.uid() = user_id);
// create policy "users read their own transactions" on wallet_transactions
//   for select to authenticated using (auth.uid() = user_id);
// create policy "only the platform organizer can credit a refund" on wallet_transactions
//   for insert to authenticated
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );
// create policy "only the platform organizer can adjust balances" on wallet_balances
//   for all to authenticated
//   using ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' )
//   with check ( (select auth.jwt() ->> 'email') = 'yonetoussaint25@gmail.com' );

const BUCKET = "competition-images";
const IMAGES_TABLE = "competition_images";
const EDITIONS_TABLE = "competition_editions";

/* ─── competition_editions ───────────────────────────────────────────────
   Maps a raw DB row to the camelCase shape used throughout App.jsx (this
   exact shape is also what the "competition-editions-global" realtime
   subscription in App.jsx builds by hand from payload.new — keep both in
   sync if either changes). ──────────────────────────────────────────── */
function mapEditionRow(row) {
  return {
    id: row.id,
    competitionId: row.competition_id,
    title: row.title,
    edition: row.edition,
    ends: row.ends,
    endsAt: row.ends_at,
    phase: row.phase,
    contestants: row.contestants,
    bannerUrl: row.banner_url,
    description: row.description,
    prizeAmount: row.prize_amount,
    fee: row.fee,
    rewardExtra: row.reward_extra,
    rules: row.rules || [],
    active: row.active !== false,
    winnerUserId: row.winner_user_id,
    winnerName: row.winner_name,
    winnerPrize: row.winner_prize,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

// Returns { [competitionId]: [editionObj, ...] } — every edition (drafts
// included) of every seed competition, grouped by seed id. App.jsx does
// its own filtering/sorting (e.g. hiding drafts on the homepage) on top
// of this.
export async function fetchCompetitionEditions() {
  const { data, error } = await supabase.from(EDITIONS_TABLE).select("*");
  if (error) {
    console.error("fetchCompetitionEditions error:", error);
    return {};
  }
  const map = {};
  (data || []).forEach((row) => {
    (map[row.competition_id] ||= []).push(mapEditionRow(row));
  });
  return map;
}

// Starts a brand-new draft edition for a seed competition. Owner-only via
// RLS. Everything besides competition_id/phase starts blank — the admin
// fills the rest in via the normal edit form (saveEditionEdit) before
// publishing.
export async function createDraftEdition(competitionId) {
  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .insert({ competition_id: competitionId, phase: "draft", active: true })
    .select()
    .single();

  if (error) {
    console.error("createDraftEdition error:", error);
    return { data: null, error };
  }
  return { data: mapEditionRow(data), error: null };
}

// Updates one existing edition by its own id (owner-only via RLS). Unlike
// the old single-row-per-competition saveCompetitionEdit, this is always
// an UPDATE, never an upsert — a new edition is created first via
// createDraftEdition, so editionId always refers to a real row by the
// time this is called.
export async function saveEditionEdit({
  editionId,
  title,
  edition,
  ends,
  endsAt,
  phase,
  contestants,
  bannerUrl,
  description,
  prizeAmount,
  fee,
  rewardExtra,
  rules,
  active,
  updatedBy,
}) {
  const patch = { updated_by: updatedBy, updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  if (edition !== undefined) patch.edition = edition;
  if (ends !== undefined) patch.ends = ends;
  if (endsAt !== undefined) patch.ends_at = endsAt;
  if (phase !== undefined) patch.phase = phase;
  if (contestants !== undefined) patch.contestants = contestants;
  if (bannerUrl !== undefined) patch.banner_url = bannerUrl;
  if (description !== undefined) patch.description = description;
  if (prizeAmount !== undefined) patch.prize_amount = prizeAmount;
  if (fee !== undefined) patch.fee = fee;
  if (rewardExtra !== undefined) patch.reward_extra = rewardExtra;
  if (rules !== undefined) patch.rules = rules;
  if (active !== undefined) patch.active = active;

  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .update(patch)
    .eq("id", editionId)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data: mapEditionRow(data), error: null };
}

// Deletes a draft edition outright (owner-only via RLS). Scoped to
// phase = 'draft' as a safety net — this is for abandoning a draft that
// was never published, not for removing a live/completed edition.
export async function deleteDraftEdition(editionId) {
  const { error } = await supabase
    .from(EDITIONS_TABLE)
    .delete()
    .eq("id", editionId)
    .eq("phase", "draft");
  return { error };
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
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, error: null };
}

/* ─── competition_images (gallery) ──────────────────────────────────────── */

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
    await supabase.storage.from(BUCKET).remove([filePath]);
    return { data: null, error: insertError };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return { data: { id: row.id, url: pub.publicUrl, position: row.position }, error: null };
}

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

/* ─── comments (edition-scoped) ──────────────────────────────────────────
//
// See the `comments` schema block above (edition_id + avatar_url added).
*/

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

/* ─── registrations (edition-scoped) ──────────────────────────────────────
//
// See the `registrations` schema block above (edition_id + avatar_url
// added, unique constraint moved to (edition_id, user_id)).
*/

// Keyed by edition_id now — a new season/edition starts back at 0
// registrants, it doesn't inherit a previous edition's count.
export async function fetchAllRegistrationCounts() {
  const { data, error } = await supabase.from("registrations").select("edition_id");
  if (error) {
    console.error("fetchAllRegistrationCounts failed:", error.message);
    return {};
  }
  const counts = {};
  (data || []).forEach((row) => {
    if (!row.edition_id) return;
    counts[row.edition_id] = (counts[row.edition_id] || 0) + 1;
  });
  return counts;
}

export async function fetchRegistrations(editionId) {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, user_id, full_name, avatar_url, fee_paid, created_at")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchRegistrations failed:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchUserRegistrations(userId) {
  const { data, error } = await supabase
    .from("registrations")
    .select("edition_id, competition_id")
    .eq("user_id", userId);

  if (error) {
    console.error("fetchUserRegistrations failed:", error.message);
    return [];
  }
  return data || [];
}

export async function insertRegistration({ editionId, competitionId, userId, fullName, avatarUrl, fee }) {
  const { data, error } = await supabase
    .from("registrations")
    .insert({
      edition_id: editionId,
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      fee_paid: fee,
    })
    .select()
    .single();

  return { data, error };
}

// Admin-only removal (enforced both client-side by isOwnCompetition/phase
// checks in App.jsx, and server-side by the "only the platform organizer
// can delete registrations" RLS policy above). Deletes the row outright —
// there's no "removed" status, since a removed registration during the
// registration phase shouldn't linger anywhere in the participant lists.
export async function deleteRegistration(registrationId) {
  const { error } = await supabase.from("registrations").delete().eq("id", registrationId);
  return { error };
}

// Refunds a registration fee back into a participant's wallet after an
// admin removal. Writes a wallet_transactions row first — same shape as a
// MonCash deposit credit, so it shows up in the participant's transaction
// history labeled as a refund — then updates wallet_balances directly.
//
// Note: the balance update here is read-then-write, not atomic. That
// matches how the rest of this file already touches wallet_balances (no
// RPC/stored procedure exists yet), so it carries the same small
// race-condition risk as a concurrent deposit landing at the same instant.
// If that ever becomes a real concern, replace this with a Postgres
// function (e.g. `increment_wallet_balance(user_id, amount)`) called via
// supabase.rpc(), which resolves it atomically server-side.
export async function refundRegistrationFee({ userId, amount, competitionTitle }) {
  if (!amount) return { error: null };

  const { error: txError } = await supabase.from("wallet_transactions").insert({
    user_id: userId,
    type: "registration_refund",
    label: `Remboursement — ${competitionTitle}`,
    amount, // positive credit
  });
  if (txError) {
    console.error("refundRegistrationFee wallet_transactions error:", txError);
    return { error: txError };
  }

  const { data: current, error: fetchError } = await supabase
    .from("wallet_balances")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (fetchError) {
    console.error("refundRegistrationFee balance fetch error:", fetchError);
    return { error: fetchError };
  }

  const newBalance = (current?.balance || 0) + amount;
  const { error: balanceError } = await supabase
    .from("wallet_balances")
    .upsert({ user_id: userId, balance: newBalance }, { onConflict: "user_id" });
  if (balanceError) {
    console.error("refundRegistrationFee wallet_balances error:", balanceError);
    return { error: balanceError };
  }

  return { error: null };
}
