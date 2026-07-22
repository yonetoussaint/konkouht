import { useState, useRef, useEffect, useMemo } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { Audio as AudioBarsLoader } from "react-loader-spinner";
import { createClient } from "@supabase/supabase-js";
import { Music, PersonStanding, Trophy, Palette, Laugh, Gamepad2, LayoutGrid, Home, Wallet, User, Users, Bell, BadgeCheck, Play, File, Plus, Gift, ArrowDownLeft, ArrowUpRight, ShoppingCart, X, Check, Sparkles, ChevronsUp, ArrowLeft, Send, ChevronRight, ChevronLeft, Copy, CreditCard, HelpCircle, Search, Menu, MessageCircle, Image as ImageIcon, Mail, Lock, Eye, EyeOff, Heart, Share2, Sticker, Info, Volume2, VolumeX, Radio, Mic, MicOff, Hand, Clock, Flame, ArrowUp, ArrowDown, Pencil } from "lucide-react";

/* ─── Supabase client ─────────────────────────────────────────────────────
   Previously lived in lib/competitionData.js — moved in here along with
   every competition/registration/comment/gallery data function so this
   file is the single source of truth for both UI and data access. ────── */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
async function fetchCompetitionEditions() {
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

// Creates a brand-new edition for a seed competition, in one shot, with
// every field the admin already filled in on the create form. Replaces
// the old createDraftEdition + saveEditionEdit two-step flow: that used
// to insert a bare empty "draft" row the instant the admin picked a
// template — before they'd typed anything — so backing out of the form
// left an orphan row behind that had to be deleted separately. Now
// nothing touches the database until the admin presses "Enregistrer",
// and it always lands as phase "registration" — there's no draft state
// for a freshly created edition, it opens for registration right away.
async function createEdition({
  competitionId,
  title,
  edition,
  ends,
  endsAt,
  contestants,
  bannerUrl,
  description,
  prizeAmount,
  fee,
  rewardExtra,
  rules,
  updatedBy,
}) {
  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .insert({
      competition_id: competitionId,
      title,
      edition,
      ends,
      ends_at: endsAt,
      phase: "registration",
      contestants,
      banner_url: bannerUrl,
      description,
      prize_amount: prizeAmount,
      fee,
      reward_extra: rewardExtra,
      rules,
      active: true,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("createEdition error:", error);
    return { data: null, error };
  }
  return { data: mapEditionRow(data), error: null };
}

// Updates one existing edition by its own id (owner-only via RLS). Unlike
// the old single-row-per-competition saveCompetitionEdit, this is always
// an UPDATE, never an upsert — a new edition is created first via
// createEdition, so editionId always refers to a real row by the
// time this is called.
async function saveEditionEdit({
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

// Deletes an edition outright (owner-only via RLS). Called after
// handleDeleteEdition below has already refunded registrants and cleaned
// up dependent rows (comments/gifts/registrations/media), so this works
// for a draft OR a published/completed edition — it used to also filter
// `.eq("phase", "draft")`, which silently no-op'd on any non-draft
// edition (0 rows matched, no error) and got misread as an RLS block.
async function deleteDraftEdition(editionId) {
  const { error } = await supabase
    .from(EDITIONS_TABLE)
    .delete()
    .eq("id", editionId);
  return { error };
}

// Upload a new banner/thumbnail image for a competition and return its
// public URL. Overwrites any previous file for the same competition.
async function uploadCompetitionImage({ competitionId, file }) {
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

async function fetchAllCompetitionImages() {
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

async function addCompetitionImage({ competitionId, file, position }) {
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

async function deleteCompetitionImage(imageId) {
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
   See the schema notes above (edition_id + avatar_url added). ────────── */

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

async function insertComment({
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
   See the schema notes above (edition_id + avatar_url added, unique
   constraint moved to (edition_id, user_id)). ───────────────────────── */

// Keyed by edition_id now — a new season/edition starts back at 0
// registrants, it doesn't inherit a previous edition's count.
async function fetchAllRegistrationCounts() {
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

async function fetchRegistrations(editionId) {
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

async function fetchUserRegistrations(userId) {
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

async function insertRegistration({ editionId, competitionId, userId, fullName, avatarUrl, fee }) {
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
async function deleteRegistration(registrationId) {
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
async function refundRegistrationFee({ userId, amount, competitionTitle }) {
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

/* ─── DATA ─────────────────────────────────────────────────────────────── */

// FNCH ("Fédération Nationale des Concours d'Haïti") is the platform's own
// organizing body — every competition on the app is run under this sigle,
// and this account is auto-recognized as its verified organizer.
const PLATFORM_ORGANIZER_EMAIL = "yonetoussaint25@gmail.com";
const PLATFORM_ORGANIZER_SIGLE = "FNCH";

const NICHES = [
  {
    id: "music",
    label: "Musique",
    accent: "#6C63FF",
    icon: "♪",
    competitions: [
      { id: "m1", title: "Battle Hip-Hop", edition: "Saison 4", phase: "live", contestants: 12, votes: 4820, ends: "2j 14h", organisateur: "FNCH", hot: true , followers: 8096 , mediaType: "photo", registeredCount: 12 },
      { id: "m2", title: "Voix d'Or", edition: "Finale", phase: "live", contestants: 8, votes: 9310, ends: "6h 22m", organisateur: "FNCH", hot: true , followers: 2439 , mediaType: "video", registeredCount: 8 },
      { id: "m3", title: "Guitar Shred", edition: "Quart de finale", phase: "live", contestants: 16, votes: 2140, ends: "4j 02h", organisateur: "FNCH", hot: false , followers: 18824 , mediaType: "text", registeredCount: 16 },
      { id: "m4", title: "DJ Set Open", edition: "Éliminatoires", phase: "registration", contestants: 24, votes: 0, ends: "3j 18h", organisateur: "FNCH", hot: false , followers: 16849 , mediaType: "pdf", registeredCount: 7 },
      { id: "m5", title: "Slam Poétique", edition: "Demi-finale", phase: "live", contestants: 6, votes: 3450, ends: "1j 08h", organisateur: "FNCH", hot: true , followers: 15428 , mediaType: "photo", registeredCount: 6 },
    ],
  },
  {
    id: "dance",
    label: "Danse",
    accent: "#FF4D6D",
    icon: "◈",
    competitions: [
      { id: "d1", title: "Krump Masters", edition: "Finale", phase: "live", contestants: 10, votes: 7640, ends: "3j 05h", organisateur: "FNCH", hot: true , followers: 9944 , mediaType: "video", registeredCount: 10 },
      { id: "d2", title: "Afrobeats Cup", edition: "Saison 2", phase: "registration", contestants: 20, votes: 0, ends: "4j 11h", organisateur: "FNCH", hot: false , followers: 7517 , mediaType: "text", registeredCount: 5 },
      { id: "d3", title: "Ballet Urbain", edition: "Demi-finale", phase: "live", contestants: 8, votes: 3810, ends: "2j 19h", organisateur: "FNCH", hot: false , followers: 36541 , mediaType: "pdf", registeredCount: 8 },
      { id: "d4", title: "Breakdance WC", edition: "Quart de finale", phase: "live", contestants: 32, votes: 11200, ends: "1j 02h", organisateur: "FNCH", hot: true , followers: 6497 , mediaType: "photo", registeredCount: 32 },
      { id: "d5", title: "Zumba Battle", edition: "Éliminatoires", phase: "registration", contestants: 18, votes: 0, ends: "6j 00h", organisateur: "FNCH", hot: false , followers: 39498 , mediaType: "video", registeredCount: 3 },
    ],
  },
  {
    id: "sports",
    label: "Sports",
    accent: "#00B894",
    icon: "▲",
    competitions: [
      { id: "s1", title: "Freestyle Football", edition: "Finale Nationale", phase: "live", contestants: 14, votes: 6540, ends: "12h 00m", organisateur: "FNCH", hot: true , followers: 28451 , mediaType: "text", registeredCount: 14 },
      { id: "s2", title: "Arm Wrestling Pro", edition: "Open", phase: "registration", contestants: 28, votes: 0, ends: "3j 07h", organisateur: "FNCH", hot: false , followers: 2882 , mediaType: "pdf", registeredCount: 9 },
      { id: "s3", title: "Parkour Challenge", edition: "Saison 3", phase: "live", contestants: 10, votes: 8900, ends: "2j 16h", organisateur: "FNCH", hot: true , followers: 2752 , mediaType: "photo", registeredCount: 10 },
      { id: "s4", title: "Chess Blitz", edition: "Quart de finale", phase: "live", contestants: 64, votes: 4410, ends: "3j 22h", organisateur: "FNCH", hot: false , followers: 6940 , mediaType: "video", registeredCount: 64 },
      { id: "s5", title: "Natation Style", edition: "Demi-finale", phase: "registration", contestants: 16, votes: 0, ends: "5j 03h", organisateur: "FNCH", hot: false , followers: 15128 , mediaType: "text", registeredCount: 4 },
    ],
  },
  {
    id: "art",
    label: "Art & Design",
    accent: "#FDCB6E",
    icon: "□",
    competitions: [
      { id: "a1", title: "Live Graffiti", edition: "Finale", phase: "live", contestants: 8, votes: 5580, ends: "18h 30m", organisateur: "FNCH", hot: true , followers: 16047 , mediaType: "pdf", registeredCount: 8 },
      { id: "a2", title: "Tatouage Expo", edition: "Saison 1", phase: "live", contestants: 20, votes: 7230, ends: "4j 00h", organisateur: "FNCH", hot: true , followers: 33918 , mediaType: "photo", registeredCount: 20 },
      { id: "a3", title: "Illustration Duel", edition: "Open Digital", phase: "registration", contestants: 40, votes: 0, ends: "4j 14h", organisateur: "FNCH", hot: false , followers: 40253 , mediaType: "video", registeredCount: 12 },
      { id: "a4", title: "Photo Street", edition: "Éliminatoires", phase: "registration", contestants: 50, votes: 0, ends: "7j 02h", organisateur: "FNCH", hot: false , followers: 2539 , mediaType: "text", registeredCount: 15 },
      { id: "a5", title: "Poterie Battle", edition: "Demi-finale", phase: "live", contestants: 6, votes: 3100, ends: "3j 09h", organisateur: "FNCH", hot: false , followers: 37581 , mediaType: "pdf", registeredCount: 6 },
    ],
  },
  {
    id: "comedy",
    label: "Comédie",
    accent: "#E17055",
    icon: "◉",
    competitions: [
      { id: "c1", title: "Stand-up Open Mic", edition: "Saison 5", phase: "live", contestants: 18, votes: 9870, ends: "1j 20h", organisateur: "FNCH", hot: true , followers: 13831 , mediaType: "photo", registeredCount: 18 },
      { id: "c2", title: "Impro Théâtre", edition: "Finale", phase: "registration", contestants: 6, votes: 0, ends: "12h 06h", organisateur: "FNCH", hot: false , followers: 36513 , mediaType: "video", registeredCount: 2 },
      { id: "c3", title: "Sketch Battle", edition: "Quart de finale", phase: "live", contestants: 12, votes: 3450, ends: "5j 11h", organisateur: "FNCH", hot: false , followers: 28293 , mediaType: "text", registeredCount: 12 },
      { id: "c4", title: "Mime & Clown", edition: "Éliminatoires", phase: "registration", contestants: 22, votes: 0, ends: "5j 18h", organisateur: "FNCH", hot: false , followers: 15246 , mediaType: "pdf", registeredCount: 6 },
    ],
  },
  {
    id: "beaute",
    label: "Beauté",
    accent: "#E91E8C",
    icon: "✦",
    competitions: [
      { id: "b1", title: "Concours de Beauté", edition: "Saison 1", phase: "live", contestants: 12, votes: 6240, ends: "2j 08h", organisateur: "FNCH", hot: true, followers: 22450, mediaType: "photo", registeredCount: 12 },
      { id: "b2", title: "Miss Élégance", edition: "Demi-finale", phase: "live", contestants: 8, votes: 4810, ends: "1j 12h", organisateur: "FNCH", hot: true, followers: 18300, mediaType: "photo", registeredCount: 8 },
      { id: "b3", title: "Top Model Open", edition: "Éliminatoires", phase: "registration", contestants: 20, votes: 0, ends: "5j 00h", organisateur: "FNCH", hot: false, followers: 9120, mediaType: "photo", registeredCount: 7 },
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    accent: "#00CEC9",
    icon: "▶",
    competitions: [
      { id: "g1", title: "FIFA Masters", edition: "Saison 6", phase: "live", contestants: 32, votes: 14500, ends: "6h 00m", organisateur: "FNCH", hot: true , followers: 30239 , mediaType: "photo", registeredCount: 32 },
      { id: "g2", title: "Speedrun Open", edition: "Finale", phase: "live", contestants: 16, votes: 8730, ends: "1j 14h", organisateur: "FNCH", hot: true , followers: 39418 , mediaType: "video", registeredCount: 16 },
      { id: "g3", title: "Card Game Pro", edition: "Quart de finale", phase: "registration", contestants: 64, votes: 0, ends: "2j 02h", organisateur: "FNCH", hot: false , followers: 19031 , mediaType: "text", registeredCount: 20 },
      { id: "g4", title: "Retro Gaming Cup", edition: "Éliminatoires", phase: "registration", contestants: 20, votes: 0, ends: "4j 08h", organisateur: "FNCH", hot: false , followers: 1225 , mediaType: "pdf", registeredCount: 8 },
      { id: "g5", title: "VR Arena", edition: "Demi-finale", phase: "live", contestants: 10, votes: 5670, ends: "2j 22h", organisateur: "FNCH", hot: false , followers: 11263 , mediaType: "photo", registeredCount: 10 },
    ],
  },
];

const ALL_NICHES = ["Tous", ...NICHES.map((n) => n.label)];

/* ─── WALLET DATA ───────────────────────────────────────────────────────── */

const DEPOSIT_PACKS = [
  { id: "p1", amount: 500 },
  { id: "p2", amount: 2500 },
  { id: "p3", amount: 5000, popular: true },
  { id: "p4", amount: 10000 },
];

const MOBILE_MONEY_NUMBERS = {
  moncash: { number: "+509 34 XX XX XX", name: "Jean Baptiste" },
  natcash: { number: "+509 37 XX XX XX", name: "Jean Baptiste" },
};

const PAYMENT_METHODS = [
  { id: "moncash", label: "MonCash", accent: "#F26522" },
  { id: "natcash", label: "NatCash", accent: "#0072CE" },
  { id: "card", label: "Carte bancaire", accent: "#111111" },
];

// Turns an emoji character into a Google Noto "Animated Emoji" Lottie URL.
// Google hosts a Lottie JSON per emoji at this CDN path, keyed by the
// emoji's Unicode codepoint(s) joined with "_" (variation selector FE0F is
// dropped from the filename).
function notoAnimatedEmojiUrl(emoji) {
  const codepoints = Array.from(emoji)
    .map((ch) => ch.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints.join("_")}/lottie.json`;
}

// Renders a gift's icon as an animated sticker instead of a static emoji
// glyph. Falls back to the plain emoji if the animation fails to load
// (e.g. no matching Noto animation exists for that emoji, or offline).
function AnimatedGiftIcon({ emoji, size = 40 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span style={{ fontSize: size * 0.7, lineHeight: 1, display: "block" }}>
        {emoji}
      </span>
    );
  }

  return (
    <Player
      src={notoAnimatedEmojiUrl(emoji)}
      autoplay
      loop
      onEvent={(event) => {
        if (event === "error") setFailed(true);
      }}
      style={{ width: size, height: size }}
    />
  );
}

// Gift "points" (shown on the icon) are not the same as the actual HTG
// price charged — points are a display/prestige number, the real cost in
// gourdes is derived from this rate (e.g. 50 points -> 45 HTG at 0.9).
const POINTS_TO_HTG_RATE = 0.9;
function giftPriceHTG(gift) {
  return Math.round(gift.cost * POINTS_TO_HTG_RATE);
}

const GIFT_CATALOG = [
  { id: "g1", name: "Applaudissement", icon: "👏", cost: 10 },
  { id: "g2", name: "Pouce levé", icon: "👍", cost: 10 },
  { id: "g3", name: "Cœur", icon: "❤️", cost: 15 },
  { id: "g4", name: "Étoile", icon: "⭐", cost: 25 },
  { id: "g5", name: "Ballon", icon: "🎈", cost: 25 },
  { id: "g6", name: "Fleur", icon: "💐", cost: 30 },
  { id: "g7", name: "Flamme", icon: "🔥", cost: 50 },
  { id: "g8", name: "Éclair", icon: "⚡", cost: 50 },
  { id: "g9", name: "Papillon", icon: "🦋", cost: 60 },
  { id: "g10", name: "Confettis", icon: "🎉", cost: 75 },
  { id: "g11", name: "Cadeau", icon: "🎁", cost: 100 },
  { id: "g12", name: "Micro", icon: "🎤", cost: 100 },
  { id: "g13", name: "Danse", icon: "💃", cost: 120 },
  { id: "g14", name: "Couronne", icon: "👑", cost: 150 },
  { id: "g15", name: "Feu d'artifice", icon: "🎆", cost: 180 },
  { id: "g16", name: "Guitare", icon: "🎸", cost: 200 },
  { id: "g17", name: "Arc-en-ciel", icon: "🌈", cost: 220 },
  { id: "g18", name: "Médaille d'or", icon: "🥇", cost: 250 },
  { id: "g19", name: "Trophée", icon: "🏆", cost: 300 },
  { id: "g20", name: "Champagne", icon: "🍾", cost: 350 },
  { id: "g21", name: "Fusée", icon: "🚀", cost: 400 },
  { id: "g22", name: "Sirène", icon: "🧜‍♀️", cost: 450 },
  { id: "g23", name: "Voiture de sport", icon: "🏎️", cost: 500 },
  { id: "g24", name: "Lion", icon: "🦁", cost: 600 },
  { id: "g25", name: "Diamant", icon: "💎", cost: 750 },
  { id: "g26", name: "Yacht", icon: "🛥️", cost: 900 },
  { id: "g27", name: "Château", icon: "🏰", cost: 1200 },
  { id: "g28", name: "Avion privé", icon: "✈️", cost: 1500 },
  { id: "g29", name: "Fusée spatiale", icon: "🛸", cost: 2000 },
  { id: "g30", name: "Couronne royale", icon: "👑", cost: 3000 },
];

const INITIAL_TRANSACTIONS = [
  { id: "t1", type: "deposit", label: "Dépôt — MonCash", amount: 550, date: "Aujourd'hui, 09:14" },
  { id: "t2", type: "gift_sent", label: "Couronne envoyée — Voix d'Or", amount: -150, date: "Hier, 21:02" },
  { id: "t3", type: "gift_sent", label: "Flamme envoyée — Krump Masters", amount: -50, date: "Hier, 18:47" },
  { id: "t4", type: "withdrawal", label: "Retrait — NatCash", amount: -200, date: "13 juin, 17:05" },
  { id: "t5", type: "deposit", label: "Dépôt — Carte bancaire", amount: 100, date: "12 juin, 14:30" },
  { id: "t6", type: "gift_sent", label: "Étoile envoyée — FIFA Masters", amount: -25, date: "10 juin, 20:15" },
];


const NICHE_ICONS = {
  "Tous": LayoutGrid,
  "Musique": Music,
  "Danse": PersonStanding,
  "Sports": Trophy,
  "Art & Design": Palette,
  "Comédie": Laugh,
  "Beauté": Sparkles,
  "Gaming": Gamepad2,
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */

function fmtVotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// People read a fixed point in time ("20 Juil, 3:45 PM") far faster than a
// duration ("2j 12h") — no mental math needed to figure out whether that's
// tonight or next week. Used for both inscription deadlines and competition
// end times, wherever we'd otherwise show a countdown-style duration.
const FR_MONTH_ABBR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
function fmtAbsoluteDate(target) {
  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.getDate();
  const month = FR_MONTH_ABBR[d.getMonth()];
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${date} ${month}, ${hours}:${minutes} ${ampm}`;
}

// NOTE: the old module-level findCompWithNiche(compId) — which looked up a
// competition directly in the static NICHES seed data — was removed here.
// Every id stored anywhere in the app (notifications, registeredCompIds,
// followedCompIds) is now a specific edition's id, not a seed id, so the
// lookup has to search each seed competition's editions and needs access
// to `editionsByComp` state; see findEditionWithNiche inside App().

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// Mock chroniqueurs sportifs for the live audio commentary band. Deterministic
// per-competition pick via hashStr so the same competition always shows the
// same commentator. Replace/extend once real hosts are onboarded.
const COMMENTATORS = [
  { name: "Marc Fontaine" },
  { name: "Sophie Laurent" },
  { name: "Thierry Dubois" },
  { name: "Karine Joseph" },
  { name: "Yves Baptiste" },
];

// Registration fee for a competition, in credits. Organizers can set an
// explicit comp.fee from the edit screen; competitions that never had one
// set fall back to a deterministic per-competition default so old data
// keeps behaving the same as before this was editable.
function getRegistrationFee(comp) {
  return comp.fee != null ? comp.fee : 50 + (Math.abs(hashStr(comp.id)) % 5) * 25;
}

// Compact French-style formatting for coin/point totals: 1 200 -> "1,2k",
// 3 400 000 -> "3,4M". Small numbers stay exact with fr-FR thousands
// separators so the leaderboard doesn't feel abbreviated for no reason.
function formatCoins(n) {
  const abs = Math.abs(n);
  if (abs >= 1000000) {
    return (n / 1000000).toFixed(1).replace(".", ",").replace(",0", "") + "M";
  }
  if (abs >= 1000) {
    return (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k";
  }
  return n.toLocaleString("fr-FR");
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

/* ─── NEWS BAND ─────────────────────────────────────────────────────────── */

const NEWS_ITEMS = [
  "🔥 Battle Hip-Hop Saison 4 entre en demi-finale",
  "🏆 Krump Masters : la finale approche",
  "🎤 Voix d'Or — finale ce soir, votez maintenant",
  "🕹️ FIFA Masters dépasse les 14k votes",
  "🎨 Live Graffiti — derniers votes avant la finale",
];

function NewsBand() {
  return (
    <div
      style={{
        background: "#111",
        borderBottom: "2px solid #111",
        overflow: "hidden",
        whiteSpace: "nowrap",
        padding: "4px 0",
      }}
    >
      <style>{`
        @keyframes news-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        style={{
          display: "inline-flex",
          animation: "news-scroll 30s linear infinite",
        }}
      >
        {[...NEWS_ITEMS, ...NEWS_ITEMS].map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "0.02em",
              padding: "0 20px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── BOTTOM TAB BAR ────────────────────────────────────────────────────── */

const TABS = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "mycomps", label: "Mes compets", icon: BadgeCheck },
  { id: "wallet", label: "Portefeuille", icon: Wallet },
  { id: "notifications", label: "Notifs", icon: Bell },
  { id: "account", label: "Compte", icon: User },
];

function BottomTabBar({ active, onChange, unreadCount, currentUser }) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        zIndex: 100,
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const showBadge = tab.id === "notifications" && unreadCount > 0;
        const showAvatar = tab.id === "account" && currentUser?.avatarUrl;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              padding: "10px 0 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              color: isActive ? "#111" : "#aaa",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              {showAvatar ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  style={{
                    width: 20, height: 20, borderRadius: "50%", objectFit: "cover", display: "block",
                    border: isActive ? "1.5px solid #111" : "1.5px solid transparent",
                  }}
                />
              ) : (
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              )}
              {showBadge && (
                <div style={{
                  position: "absolute", top: -4, right: -6,
                  minWidth: 14, height: 14, borderRadius: "50%",
                  background: "#e74c3c", color: "#fff",
                  fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid #fff",
                  padding: "0 3px",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.04em",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── PHASE ROW ─────────────────────────────────────────────────────────── */

function PhaseRow({ edition, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #e8e8e8",
        marginLeft: -14,
        marginRight: -14,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 10,
        marginTop: 10,
      }}
    >
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          color: "#888",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Phase
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: accent,
        }}
      >
        {edition}
      </span>
    </div>
  );
}

/* ─── COMPETITION CARD ──────────────────────────────────────────────────── */

function CompCard({ comp, accent, onOpen, onRegister, isRegistered, isOwnCompetition }) {
  const [voteCount] = useState(comp.votes);
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(comp.followers);
  const isRegistration = comp.phase === "registration";

  // Real editions carry a real comp.endsAt. Competitions still on the
  // legacy mock "2j 18h"-style `ends` duration string don't have one, so we
  // derive a stand-in absolute deadline once (relative to now) and hold it
  // for the life of the card — recomputing it on every render would make
  // the displayed date creep forward as the feed re-renders.
  const resolvedEndDate = useMemo(() => {
    if (comp.endsAt) return comp.endsAt;
    const str = comp.ends || "";
    let total = 0;
    const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
    const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
    const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
    return new Date(Date.now() + (total || 3600) * 1000).toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp.endsAt, comp.id]);

  return (
    <div
      onClick={() => onOpen?.(comp)}
      style={{
        flexShrink: 0,
        width: 220,
        border: `1px solid #eee`,
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Banner */}
      <div style={{ height: 110, position: "relative", flexShrink: 0, overflow: "hidden", background: "#eee" }}>
        {(comp.bannerUrl || comp.images?.[0]?.url) ? (
          <img
            src={comp.bannerUrl || comp.images[0].url}
            alt={comp.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={26} color="#ccc" />
          </div>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: `${accent}66`,
          mixBlendMode: "multiply",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)",
        }} />
        {comp.hot && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#fff",
            background: "rgba(0,0,0,0.45)", padding: "2px 8px",
            fontFamily: "Inter, sans-serif",
            borderRadius: 8,
          }}>
            EN VUE
          </div>
        )}
        {isRegistration && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#fff",
            background: "#6C63FF", padding: "3px 8px",
            fontFamily: "Inter, sans-serif",
            borderRadius: 8,
          }}>
            Inscriptions
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 14px 10px", flexGrow: 1 }}>

        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: "#333",
            lineHeight: 1.2,
            marginBottom: 10,
            marginLeft: -14,
            marginRight: -14,
            paddingLeft: 14,
            paddingRight: 14,
            paddingBottom: 10,
            borderBottom: "1px solid #e8e8e8",
          }}
        >
          {comp.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: accent,
              color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {comp.organisateur.charAt(0)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.organisateur}</span>
              <BadgeCheck size={12} strokeWidth={2.5} color={accent} style={{ flexShrink: 0 }} />
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", fontWeight: 500 }}>
              {fmtVotes(followerCount)} abonnés
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFollowed((f) => !f);
              setFollowerCount((c) => followed ? c - 1 : c + 1);
            }}
            style={{
              flexShrink: 0,
              border: followed ? `1px solid ${accent}` : "1px solid #ddd",
              background: followed ? accent : "transparent",
              color: followed ? "#fff" : "#666",
              fontFamily: "Inter, sans-serif",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 7px",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s, border-color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 3,
              lineHeight: 1.4,
            }}
          >
            {followed ? (
              <>
                <Check size={9} strokeWidth={3} />
                Abonné
              </>
            ) : (
              "+ Suivre"
            )}
          </button>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderTop: "1px solid #e8e8e8",
            marginLeft: -14,
            marginRight: -14,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", lineHeight: 1 }}>
              {isRegistration ? comp.registeredCount : comp.contestants}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
              {isRegistration ? "inscrits" : "candidats"}
            </div>
          </div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 10 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 500 }}>
              Fin dans
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: comp.hot ? "#c0392b" : "#111", marginTop: 1 }}>
              {fmtAbsoluteDate(resolvedEndDate)}
            </div>
          </div>
        </div>

        <PhaseRow edition={comp.edition} accent={accent} />
      </div>

      {/* Footer — voting or registration */}
      {isRegistration ? (
        isOwnCompetition ? (
          <div
            style={{
              border: "none",
              background: "#f2f2f2",
              color: "#999",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "11px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <BadgeCheck size={14} strokeWidth={2.5} />
            Votre compétition
          </div>
        ) : isRegistered ? (
          <div
            style={{
              border: "none",
              borderTop: `2px solid #00B894`,
              background: "#e8f8f3",
              color: "#00875A",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "11px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} strokeWidth={2.5} />
              Inscrit
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.75,
              }}
            >
              {Math.min(comp.registeredCount + 1, comp.contestants)}/{comp.contestants}
            </span>
          </div>
        ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onRegister?.(comp); }}
          style={{
            border: "none",
            borderTop: `2px solid #6C63FF`,
            background: "#6C63FF",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} strokeWidth={2.5} />
            S'inscrire
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {comp.registeredCount}/{comp.contestants}
          </span>
        </button>
        )
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onOpen?.(comp); }}
          style={{
            border: "none",
            borderTop: `2px solid #111`,
            background: "#111",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Gift size={14} strokeWidth={2.5} />
            Cadeau
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            {fmtVotes(voteCount)}
          </span>
        </button>
      )}
    </div>
  );
}

/* ─── SKELETON CARD (feature 1) ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 220, border: "1px solid #ddd", background: "#fff" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; }
      `}</style>
      <div className="sk" style={{ height: 110 }} />
      <div style={{ padding: "14px 14px 10px" }}>
        <div className="sk" style={{ height: 16, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div className="sk" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ height: 10, marginBottom: 4 }} />
            <div className="sk" style={{ height: 9, width: "60%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e8e8e8", paddingTop: 10 }}>
          <div style={{ flex: 1 }}><div className="sk" style={{ height: 18, marginBottom: 4 }} /><div className="sk" style={{ height: 9 }} /></div>
          <div style={{ flex: 1, borderLeft: "1px solid #e8e8e8", paddingLeft: 10 }}><div className="sk" style={{ height: 11, marginBottom: 4 }} /><div className="sk" style={{ height: 13 }} /></div>
        </div>
      </div>
      <div className="sk" style={{ height: 40 }} />
    </div>
  );
}

// Fills the parent circle (which sets width/height/overflow/border) with
// either the person's real photo, or — when none is on file — a flat
// initials circle built from their name. Never a stock/mock photo.
function EntityAvatar({ url, name, bg = "#ddd", color = "#666" }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || ""}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: "100%", height: "100%",
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}

// Renders the *current* signed-in user's own avatar — a real photo once
// they've set one, otherwise the initials circle used throughout the app.
function MyAvatar({ user, size = 34, fontSize = 13, iconSize = 14, loggedBg = "#111", guestBg = "#e0e0e0" }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName || "Profil"}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: user ? loggedBg : guestBg, color: "#fff",
      fontFamily: "'Space Grotesk', sans-serif", fontSize, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {user ? user.fullName.charAt(0).toUpperCase() : <User size={iconSize} color="#999" />}
    </div>
  );
}

function getUnsplashId(compId) {
  const ids = {
    m1: "1511671783979-2f3a7af261b3",
    m2: "1459749411615-3ae9b1d1b8ef",
    m3: "1471083922566-3b1d2c4b7e8f",
    d1: "1534432581666-6f4b3c5e7d8f",
    s1: "1574629811986-6c5e1f2c3d4e",
    a1: "1499788393439-5c5d5f6e7f8f",
    c1: "1528607284783-4c4e6f7d8e9f",
    g1: "1511512578047-09c8d2d8e9f0",
  };
  return ids[compId] || "1511671783979-2f3a7af261b3";
}

const heroBannerImg = (compId) =>
  `https://images.unsplash.com/photo-${getUnsplashId(compId)}?w=800&h=340&fit=crop`;

/* ─── PARTICIPANT CARD ──────────────────────────────────────────────────── */

const TEXT_SNIPPETS = [
  "Mon parcours a commencé dans la rue, entre passion et persévérance...",
  "Chaque jour est une nouvelle occasion de repousser mes limites...",
  "Ce que je crée vient du cœur, inspiré par mon quartier et ma famille...",
  "J'ai tout sacrifié pour arriver ici, et je ne compte pas reculer...",
];

// "Why I'm competing" mock stories — shown inside AlbumSheet so a donor
// understands the person behind the gift, not just a media gallery. Cycled
// by participant index like TEXT_SNIPPETS; swap for a real per-participant
// field (e.g. registrations.motivation) once wired to Supabase.
const WHY_STORIES = [
  "Je viens d'une famille de neuf enfants et j'ai appris très jeune à me battre pour ce que je veux. Ce concours, c'est ma chance de montrer que le talent n'attend pas les moyens.",
  "Après un accident qui m'a presque empêché de continuer, je me suis promis de remonter sur scène. Chaque vote ici, c'est un pas de plus vers cette promesse.",
  "Mon quartier ne m'a jamais vu comme quelqu'un d'ordinaire, et je veux le prouver au pays entier. Je porte leurs couleurs à chaque prestation.",
  "J'ai quitté l'école pour aider ma mère, mais jamais j'ai arrêté de m'entraîner le soir. Ce concours est la première vraie porte qu'on m'ouvre.",
  "Je fais ça pour mon fils, pour qu'il grandisse en voyant que persévérer paie toujours, même quand tout semble contre nous.",
  "Trois ans à économiser pour du matériel correct, deux ans à me faire refuser partout. Je suis enfin là où je devrais être depuis le début.",
];

function getWhyStory(index) {
  return WHY_STORIES[index % WHY_STORIES.length];
}

/* ─── FAKE NAME POOL ────────────────────────────────────────────────────── */

const FAKE_FIRST = [
  "Marie", "Jean", "Claudine", "Pierre", "Roseline", "Widlène", "Édouard",
  "Fabiola", "Kévin", "Nadège", "Josué", "Mirlande", "Christophe", "Yanick",
  "Lovely", "Réginald", "Sabrina", "Frantz", "Guerlande", "Olivier",
  "Stéphanie", "Duckens", "Nathalie", "Carline", "Jude", "Ketsia",
  "Wilner", "Sophonie", "Berlange", "Alix",
];
const FAKE_LAST_INIT = "ABCDEFGHJKLMNPRSTW";

function fakeName(index) {
  const first = FAKE_FIRST[index % FAKE_FIRST.length];
  const lastInit = FAKE_LAST_INIT[(index * 7 + 3) % FAKE_LAST_INIT.length];
  return `${first} ${lastInit}.`;
}

/* ─── PARTICIPANT LIST OVERLAY ──────────────────────────────────────────── */

// Builds the real, database-backed participant/classement list out of the
// actual rows in `registrations` for this competition — no fake names, no
// invented head-count, no invented vote/point totals. Every entry starts at
// 0 here; the caller merges in each participant's real total (sum of actual
// gift_cost from the `gifts` table, keyed by this same index) to produce
// the "votes"/"points" that get displayed.
function buildParticipantsFromRegistrants(registrants) {
  if (!registrants || registrants.length === 0) return [];
  return registrants.map((r) => ({
    index: Math.abs(hashStr(r.userId || r.id)) % 40,
    id: r.id,
    userId: r.userId,
    name: r.name || r.full_name || "Participant",
    avatarUrl: r.avatarUrl,
    votes: 0,
    points: 0,
  }));
}

const COMMENT_SNIPPETS = [
  "Bonne chance à tous les participants! 🔥",
  "C'est qui le favori cette saison?",
  "J'ai voté pour mon préféré, allez!",
  "Quand est-ce que les résultats sortent?",
  "Niveau impressionnant cette année.",
  "Vivement la finale 👏",
  "Quelqu'un sait combien de tours il reste?",
  "Je suis ici depuis la saison 1, toujours au top.",
  "Ça va être serré jusqu'au bout.",
  "Respect à l'organisateur pour la qualité de l'événement.",
];

const REPLY_SNIPPETS = [
  "Totalement d'accord avec toi!",
  "Moi aussi j'ai hâte 🙌",
  "Les résultats sortent vendredi je crois",
  "Tu as voté pour qui?",
  "Même avis, c'est du bon niveau.",
  "Ouais la finale va être 🔥",
  "Normalement 3 tours encore",
  "Pareil, fidèle depuis le début!",
  "Exactement, ça va chauffer.",
  "L'orga fait vraiment du bon boulot.",
];

function buildComments(comp) {
  const count = 3 + (Math.abs(hashStr(comp.id)) % 6);
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 41 + 19) % 53;
    const minutesAgo = 4 + (seed % 240);
    const replyCount = (i * 7 + seed) % 3; // 0–2 replies per comment
    return {
      id: `seed-${comp.id}-${i}`,
      index: 12 + i,
      name: fakeName(12 + i),
      text: COMMENT_SNIPPETS[(i * 3 + seed) % COMMENT_SNIPPETS.length],
      minutesAgo,
      likes: seed % 14,
      replies: Array.from({ length: replyCount }, (_, j) => ({
        id: `reply-${comp.id}-${i}-${j}`,
        index: 20 + i + j,
        name: fakeName(20 + i + j),
        text: REPLY_SNIPPETS[(i + j * 3 + seed) % REPLY_SNIPPETS.length],
        minutesAgo: Math.max(1, minutesAgo - 10 - j * 5),
        likes: (j + seed) % 6,
      })),
    };
  }).sort((a, b) => a.minutesAgo - b.minutesAgo);
}

// Converts an ISO datetime string into the "YYYY-MM-DDTHH:mm" format a
// <input type="datetime-local"> expects, in the viewer's local timezone.
// Returns "" for null/invalid input so the field just shows empty.
function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Quick presets for the "natural" duration picker in the competition edit
// modal. `label` is the compact text stored in comp.ends (matches the
// "Xj Yh" style already parsed elsewhere as a fallback); `display` is what
// the admin sees on the button.
const DURATION_PRESETS = [
  { label: "1h", display: "1 heure", ms: 60 * 60 * 1000 },
  { label: "6h", display: "6 heures", ms: 6 * 60 * 60 * 1000 },
  { label: "12h", display: "12 heures", ms: 12 * 60 * 60 * 1000 },
  { label: "1j", display: "1 jour", ms: 24 * 60 * 60 * 1000 },
  { label: "3j", display: "3 jours", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7j", display: "1 semaine", ms: 7 * 24 * 60 * 60 * 1000 },
];

function fmtCommentTime(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo}min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

function fmtAgoFr(minutesAgo) {
  if (minutesAgo < 60) return `Il y a ${minutesAgo} min`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  return `Il y a ${Math.floor(hours / 24)} j`;
}

/* ─── RULES / PRIZE / DESCRIPTION ───────────────────────────────────────── */

function buildRulesInfo(comp) {
  // No generated placeholder copy — only what the organizer has actually
  // entered in the edit panel. Anything left blank stays blank in the UI.
  return {
    description: comp.description?.trim() ? comp.description : "",
    rewardExtra: comp.rewardExtra?.trim() ? comp.rewardExtra : "",
    rules: Array.isArray(comp.rules) && comp.rules.length > 0 ? comp.rules : [],
  };
}

function ParticipantListOverlay({ comp, participants, onClose }) {
  const accent = comp.accent;
  // `participants` is passed down from CompetitionBoard, already synced with
  // the real `registrations` table — real registrants only, never invented.
  const ranked = participants || [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Participant</span>
          <span style={{ width: 90, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Votes</span>
          <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Points</span>
        </div>

        {ranked.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
            Aucun participant pour le moment.
          </div>
        ) : ranked.map((p, rank) => (
          <div
            key={p.id ?? p.index}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                width: 32,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: rank < 3 ? accent : "#bbb",
              }}
            >
              {rank + 1}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0, overflow: "hidden",
                  border: "1px solid #e0e0e0",
                }}>
                <EntityAvatar url={p.avatarUrl} name={p.name} />
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333", fontWeight: 600 }}>{p.name}</span>
            </div>
            <span style={{ width: 90, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>
              {fmtVotes(p.votes)}
            </span>
            <span style={{ width: 70, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#aaa" }}>
              {p.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ALBUM GRID OVERLAY ─────────────────────────────────────────────────
   Full grid of approved participant media — this is what "Voir tout" opens
   from the Médias tab. Kept separate from ParticipantListOverlay, which is
   the votes/ranking table used by the Classement tab's own "Voir tout". */

function AlbumGridOverlay({ items, onClose, onOpenItem }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky", top: 0, background: "#fff",
          borderBottom: "1px solid #e0e0e0", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 12, zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111" }}>
          Médias des participants
        </span>
      </div>

      <div style={{
        maxWidth: 800, margin: "0 auto", padding: 12,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onOpenItem(item)} style={{ position: "relative", cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
            {item.media_type === "video" ? (
              <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
            ) : (
              <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.uploader_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── REGISTRANT LIST OVERLAY ───────────────────────────────────────────── */

function RegistrantListOverlay({ comp, registrants, accent, onClose, canRemove, onRemove, removingRegistrantId }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F2F2F0", overflowY: "auto" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          zIndex: 1,
        }}
      >
        <button
          onClick={onClose}
          style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#333", padding: 0, lineHeight: 1 }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#333" }}>
          Membres inscrits — {comp.title}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", marginBottom: 4 }}>
          <span style={{ width: 32, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>#</span>
          <span style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Membre</span>
          <span style={{ width: 100, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</span>
          <span style={{ width: 80, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Frais</span>
        </div>

        {registrants.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#bbb" }}>
            Aucune inscription pour le moment.
          </div>
        ) : registrants.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                width: 32,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#bbb",
              }}
            >
              {i + 1}
            </span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  flexShrink: 0,
                  background: "#f0ebff", color: "#6C63FF",
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {r.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            </div>
            <span style={{ width: 100, textAlign: "right", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#999", lineHeight: 1.3 }}>
              {r.date}<br />
              <span style={{ fontSize: 11, color: "#bbb" }}>{r.time}</span>
            </span>
            <span style={{ width: 80, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: accent }}>
              {r.fee} gdes
            </span>
            {canRemove && (
              <button
                onClick={() => onRemove?.(r)}
                disabled={removingRegistrantId === r.id}
                title="Retirer ce participant"
                style={{
                  width: 26, height: 26, flexShrink: 0, marginLeft: 10,
                  border: "1px solid #f3d0cd", borderRadius: "50%",
                  background: "#fdf1f0", color: "#e74c3c",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: removingRegistrantId === r.id ? "default" : "pointer",
                  opacity: removingRegistrantId === r.id ? 0.5 : 1,
                  padding: 0,
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ORGANISER BAR (organiser-follow, local state) ────────────────────── */

function OrgBar({ comp, accent }) {
  const [orgFollowed, setOrgFollowed] = useState(false);
  const [orgFollowerCount, setOrgFollowerCount] = useState(comp.followers);
  return (
    <div style={{
      background: "#fff",
      borderBottom: "1px solid #e0e0e0",
      padding: "12px 8px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      maxWidth: 800, margin: "0 auto",
      boxSizing: "border-box", width: "100%",
      position: "relative", left: "50%", transform: "translateX(-50%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: accent, color: "#fff",
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {comp.organisateur.charAt(0)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#111", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            {comp.organisateur}
            <BadgeCheck size={13} strokeWidth={2.5} color={accent} />
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
            {fmtVotes(orgFollowerCount)} abonnés
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          const wasFollowed = orgFollowed;
          setOrgFollowed(!wasFollowed);
          setOrgFollowerCount((c) => wasFollowed ? c - 1 : c + 1);
        }}
        style={{
          border: `1px solid ${orgFollowed ? "#111" : accent}`,
          background: orgFollowed ? "#111" : "transparent",
          color: orgFollowed ? "#fff" : accent,
          fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "6px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >{orgFollowed
        ? <><Check size={11} strokeWidth={3} /> Abonné</>
        : <><Bell size={11} strokeWidth={2.5} /> S'abonner</>
      }</button>
    </div>
  );
}

/* ─── ALBUM SHEET (Mon album) ────────────────────────────────────────────
   Lets the current user manage their own uploaded participant media. Only
   ever opened in "own" mode now — browsing other participants' media goes
   through the real approved-media gallery + MediaLightbox instead. */

function AlbumSheet({ accent, uploads = [], uploading = false, onUpload, onClose }) {
  const subtitle = `${uploads.length} média${uploads.length > 1 ? "s" : ""} envoyé${uploads.length > 1 ? "s" : ""}`;
  const statusLabel = { pending: "En attente", approved: "Approuvé", rejected: "Rejeté" };
  const statusColor = { pending: "#e74c3c", approved: "#27ae60", rejected: "#999" };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#fff",
          borderTop: `2px solid #111`,
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #e0e0e0",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              Mon album
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          overflowY: "auto",
          padding: "16px 16px 24px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{
            background: "#faf9f7", border: "1px solid #eee",
            padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 12,
            color: "#777", lineHeight: 1.6,
          }}>
            Ajoutez vos propres photos ou vidéos — elles seront visibles publiquement une fois approuvées par l'organisateur.
          </div>

          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            border: `1.5px dashed ${accent}`, background: `${accent}0a`,
            padding: "14px 0", cursor: uploading ? "default" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}>
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload?.(f); e.target.value = ""; }}
              style={{ display: "none" }}
            />
            <Plus size={16} color={accent} strokeWidth={2.5} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: accent }}>
              {uploading ? "Envoi en cours…" : "Ajouter un média"}
            </span>
          </label>

          {uploads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
              Aucun média envoyé pour l'instant.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {uploads.map((u) => (
                <div key={u.id} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
                  {u.media_type === "video" ? (
                    <video src={u.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                  ) : (
                    <img src={u.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <span style={{
                    position: "absolute", top: 6, right: 6,
                    background: statusColor[u.status], color: "#fff",
                    fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                    padding: "2px 6px",
                  }}>
                    {statusLabel[u.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MEDIA LIGHTBOX ─────────────────────────────────────────────────────
   Full-screen viewer for a single approved participant_media row, opened
   from the real "Médias des participants" gallery. */

function MediaLightbox({ item, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1150,
        background: "rgba(0,0,0,0.9)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.15)", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={18} />
      </button>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.media_type === "video" ? (
          <video src={item.media_url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        ) : (
          <img src={item.media_url} alt="" style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }} />
        )}
      </div>
      <div style={{ marginTop: 12, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>
        {item.uploader_name}
      </div>
    </div>
  );
}

/* ─── LIVE COMMENTARY STREAM SHEET (X Spaces / podcast style) ─────────── */

function RoomAvatar({ name, size = 56, speaking = false, ring, badge }) {
  const initials = (name || "").trim() ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: speaking ? `2px solid ${ring || "#2ecc71"}` : "2px solid transparent",
        boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", height: "100%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: size * 0.32, fontWeight: 700, color: "#fff" }}>{initials}</span>
        </div>
      </div>
      {badge}
      {speaking && (
        <div style={{
          position: "absolute", bottom: -3, right: -3,
          width: 20, height: 20, borderRadius: "50%", background: "#111",
          border: "2px solid #111",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AudioBarsLoader height="11" width="11" color="#2ecc71" ariaLabel="parle" visible={true} />
        </div>
      )}
    </div>
  );
}

function CommentaryStreamSheet({ comp, commentator, coSpeakers, accent, muted, onToggleMute, onClose }) {
  const [requestSent, setRequestSent] = useState(false);
  const baseSeed = Math.abs(hashStr(comp.id));
  const listenerCount = 40 + (baseSeed % 900);
  const listenerFaces = Array.from({ length: 6 }, (_, i) => (baseSeed + i * 13) % 60);
  const speakers = [
    { name: commentator.name, role: "Hôte", index: baseSeed % 40, speaking: true },
    ...coSpeakers.map((s, i) => ({ name: s.name, role: "Intervenant", index: (baseSeed + (i + 1) * 9) % 40, speaking: i === 0 })),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#111",
          borderTop: "1px solid #2a2a2a",
          maxHeight: "85vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#333" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 18px 12px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 800, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Salle audio en direct
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Réduire"
            style={{
              width: 26, height: 26, border: "none", background: "#1c1c1c", borderRadius: "50%",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={14} color="#999" style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>

        <div style={{ padding: "0 18px 22px", overflowY: "auto" }}>
          {/* Speakers grid */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            À l'antenne · {speakers.length}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {speakers.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64 }}>
                <RoomAvatar name={s.name} size={56} speaking={s.speaking} ring={accent} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#fff", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  {s.name.split(" ")[0]}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#777" }}>{s.role}</div>
              </div>
            ))}
          </div>

          {/* Listeners */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 22, paddingTop: 16, borderTop: "1px solid #222",
          }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {listenerFaces.map((idx, i) => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid #111", borderRadius: "50%" }}>
                  <RoomAvatar name="" size={26} />
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>
              {listenerCount} auditeurs
            </div>
          </div>

          {/* Description */}
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#bbb", lineHeight: 1.5, marginTop: 16 }}>
            Suivez le commentaire audio en direct de cette compétition — analyses, moments forts et ambiance, commentés en temps réel.
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setRequestSent(true)}
              disabled={requestSent}
              style={{
                flex: 1, height: 44, borderRadius: 22, border: "1px solid #333",
                background: requestSent ? "#1c1c1c" : accent,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                cursor: requestSent ? "default" : "pointer",
              }}
            >
              <Hand size={16} color={requestSent ? "#888" : "#111"} strokeWidth={2.2} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: requestSent ? "#888" : "#111" }}>
                {requestSent ? "Demande envoyée" : "Demander à parler"}
              </span>
            </button>
            <button
              onClick={onToggleMute}
              aria-label={muted ? "Activer le son" : "Couper le son"}
              style={{
                width: 44, height: 44, borderRadius: 22, border: "1px solid #333",
                background: muted ? "#1c1c1c" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              {muted ? <VolumeX size={16} color="#fff" strokeWidth={2.2} /> : <Volume2 size={16} color="#111" strokeWidth={2.2} />}
            </button>
          </div>

          {/* Leave */}
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              marginTop: 14, padding: "8px 0",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#e74c3c",
            }}
          >
            Quitter la salle
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── COMPETITION BOARD (overlay) ──────────────────────────────────────── */

function CompetitionBoard({ comp, onClose, balance, onSendGift, onOpenBuy, onRegister, showToast, isRegistered, isFollowed, onToggleFollow, currentUser, onRequestAuth, onEditComp, onCreateComp, onAddImage, onRemoveImage, startInEditMode = false, isNewEdition = false }) {
  const isRegistration = comp.phase === "registration";
  const isCompleted = comp.phase === "completed";
  const registrationFee = getRegistrationFee(comp);
  const isOwnCompetition = currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE;
  const [showEditModal, setShowEditModal] = useState(startInEditMode);
  const [editTitle, setEditTitle] = useState(comp.title);
  const [editEdition, setEditEdition] = useState(comp.edition);
  const [editEnds, setEditEnds] = useState(comp.ends);
  const [editPhase, setEditPhase] = useState(comp.phase);
  const [editContestants, setEditContestants] = useState(comp.contestants != null ? String(comp.contestants) : "");
  const [editEndsAt, setEditEndsAt] = useState(toDatetimeLocal(comp.endsAt));
  const [editDescription, setEditDescription] = useState(comp.description || "");
  const [editPrizeAmount, setEditPrizeAmount] = useState(comp.prizeAmount != null ? String(comp.prizeAmount) : "");
  const [editFee, setEditFee] = useState(String(registrationFee));
  const [editRewardExtra, setEditRewardExtra] = useState(comp.rewardExtra || "");
  const [editRules, setEditRules] = useState((comp.rules || []).join("\n"));
  const [editBannerUrl, setEditBannerUrl] = useState(comp.bannerUrl || null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImageId, setRemovingImageId] = useState(null);
  const images = comp.images || [];

  useEffect(() => {
    setEditTitle(comp.title);
    setEditEdition(comp.edition);
    setEditEnds(comp.ends);
    setEditPhase(comp.phase);
    setEditContestants(comp.contestants != null ? String(comp.contestants) : "");
    setEditEndsAt(toDatetimeLocal(comp.endsAt));
    setEditDescription(comp.description || "");
    setEditPrizeAmount(comp.prizeAmount != null ? String(comp.prizeAmount) : "");
    setEditFee(String(getRegistrationFee(comp)));
    setEditRewardExtra(comp.rewardExtra || "");
    setEditRules((comp.rules || []).join("\n"));
    setEditBannerUrl(comp.bannerUrl || null);
  }, [comp.id, comp.title, comp.edition, comp.ends, comp.phase, comp.contestants, comp.endsAt, comp.description, comp.prizeAmount, comp.fee, comp.rewardExtra, comp.rules, comp.bannerUrl]);

  async function handleAddImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    // The gallery is still shared across every edition of this series, so
    // it's keyed by the seed competitionId, not this edition's own id.
    await onAddImage?.(comp.competitionId, file);
    setUploadingImage(false);
  }

  // Banner: not a separate upload — just a tag on one of the thumbnails
  // below, marking which image represents this competition on its card and
  // in the homepage carousel. Persisted to competition_edits.bannerUrl only
  // once "Enregistrer" is pressed, same as every other field in this panel.
  function handleSetBanner(url) {
    setEditBannerUrl((prev) => (prev === url ? null : url));
  }

  async function handleRemoveImage(imageId) {
    setRemovingImageId(imageId);
    await onRemoveImage?.(comp.competitionId, imageId);
    setRemovingImageId(null);
  }

  async function handleSaveEdit() {
    setSavingEdit(true);
    const trimmedPrize = editPrizeAmount.trim();
    const trimmedContestants = editContestants.trim();
    const trimmedFee = editFee.trim();
    const fields = {
      title: editTitle.trim() || comp.title,
      edition: editEdition.trim() || comp.edition,
      ends: editEnds.trim() || comp.ends,
      contestants: trimmedContestants === "" ? null : Math.max(0, parseInt(trimmedContestants, 10) || 0),
      endsAt: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      description: editDescription.trim(),
      prizeAmount: trimmedPrize === "" ? null : Number(trimmedPrize),
      fee: trimmedFee === "" ? null : Math.max(0, parseInt(trimmedFee, 10) || 0),
      rewardExtra: editRewardExtra.trim(),
      rules: editRules.split("\n").map((r) => r.trim()).filter(Boolean),
      bannerUrl: editBannerUrl,
    };
    // A brand-new edition has never been written to the database — this
    // is its first save, so it's an insert (always phase "registration",
    // handled inside onCreateComp), not an update to a row that doesn't
    // exist yet. Everything typed into the form up to this point has
    // only ever lived in local state.
    const result = isNewEdition
      ? await onCreateComp?.({ competitionId: comp.competitionId, ...fields })
      : await onEditComp?.({
          editionId: comp.id,
          competitionId: comp.competitionId,
          ...fields,
          phase: isCompleted ? "completed" : editPhase,
        });
    setSavingEdit(false);
    if (result?.success) setShowEditModal(false);
  }
  const [voted, setVoted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // "home" | "participants" | "medias" | "donateurs"

  // ── LIVE AUDIO COMMENTARY ──────────────────────────────────────────────
  // Floating, permanent audio player for a "chroniqueur sportif" narrating
  // the competition live — always visible while a competition is open (like
  // X's persistent Spaces mini-player). Tapping it opens a detailed bottom
  // sheet with stream info; muting only happens from inside that sheet.
  // Currently wired to SomaFM's free "Groove Salad" stream for testing —
  // swap the <audio> src below for your real commentary stream when ready.
  const commentator = COMMENTATORS[Math.abs(hashStr(comp.id)) % COMMENTATORS.length];
  const coSpeakers = [1, 2].map((offset) => ({
    name: fakeName(Math.abs(hashStr(comp.id + "_speaker_" + offset))),
  }));
  const [commentaryMuted, setCommentaryMuted] = useState(true);
  const [commentarySheetOpen, setCommentarySheetOpen] = useState(false);
  const [commentaryReady, setCommentaryReady] = useState(false); // true once audio starts actually playing
  const commentaryAudioRef = useRef(null);
  const showCommentaryBand = !isRegistration;

  useEffect(() => {
    if (!showCommentaryBand) return;
    const audio = commentaryAudioRef.current;
    if (!audio) return;
    // Browsers allow autoplay when muted, so this silent bootstrap play is
    // always allowed. Real (audible) playback only starts from a genuine
    // user gesture — see toggleCommentaryMute, called from the floating
    // button's onClick and from the mute control inside the room sheet.
    audio.muted = true;
    const p = audio.play();
    if (p?.then) {
      p.then(() => setCommentaryReady(true)).catch(() => setCommentaryReady(false));
    }
  }, [showCommentaryBand]);

  function toggleCommentaryMute() {
    const audio = commentaryAudioRef.current;
    setCommentaryMuted((prev) => {
      const next = !prev;
      if (audio) {
        audio.muted = next;
        if (!next) {
          // Called from a click handler, so this counts as a user gesture
          // and browsers will allow audible playback here.
          audio.play().then(() => setCommentaryReady(true)).catch(() => setCommentaryReady(false));
        }
      }
      return next;
    });
  }
  function openCommentaryRoom() {
    setCommentarySheetOpen(true);
    if (commentaryMuted) toggleCommentaryMute();
  }
  // ─────────────────────────────────────────────────────────────────────

  const [activeBanner, setActiveBanner] = useState(0);
  const bannerVideoRefs = useRef({});
  const [videoErrors, setVideoErrors] = useState({});
  useEffect(() => {
    Object.entries(bannerVideoRefs.current).forEach(([idx, videoEl]) => {
      if (!videoEl) return;
      if (Number(idx) === activeBanner) {
        try { videoEl.currentTime = 0; } catch (e) { /* not ready yet, ignore */ }
        const playPromise = videoEl.play();
        if (playPromise) playPromise.catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [activeBanner]);
  const [bannerFullscreen, setBannerFullscreen] = useState(false);
  const [tickFlash, setTickFlash] = useState(false);
  // Bonus punch-up: only the gift bonus bumps/flashes, the base prize stays static
  const [bonusBump, setBonusBump] = useState(false);
  const [cagnotteFlash, setCagnotteFlash] = useState(null); // { id, amount } | null
  const cagnotteFlashTimeoutRef = useRef(null);

  // ── Leader row live signals: momentum flash, margin trend, time-in-lead ──
  const leaderSinceRef = useRef(Date.now());
  const [leaderFlash, setLeaderFlash] = useState(null); // small "+X" burst near leader's points
  const [leaderHot, setLeaderHot] = useState(false); // recent-gain momentum dot
  const prevLeaderVotesRef = useRef(null);
  const leaderHotTimeoutRef = useRef(null);
  const leaderFlashTimeoutRef = useRef(null);
  const [marginTrend, setMarginTrend] = useState(null); // 'up' | 'down' | null
  const prevMarginRef = useRef(null);
  const marginTrendTimeoutRef = useRef(null);

  // If the organizer set a real deadline (comp.endsAt), the countdown is
  // computed from actual elapsed time each tick — so it survives reloads,
  // background tabs, etc. Competitions still on the legacy mock "2j 14h"-style
  // `ends` string no longer just decrement a local counter (which snapped back
  // to the full mock duration on every refresh) — instead we compute a real
  // deadline once and persist it, so the countdown keeps counting down against
  // an actual fixed point in time across reloads, same as a real comp.endsAt.
  function secondsUntilEndsAt(target) {
    const diff = Math.floor((new Date(target).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }
  function resolveEndsAt() {
    if (comp.endsAt) return comp.endsAt;
    const storageKey = `comp-endsAt-${comp.id}`;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (stored) return stored;
    const str = comp.ends || "";
    let total = 0;
    const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
    const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
    const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
    const deadline = new Date(Date.now() + (total || 3600) * 1000).toISOString();
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, deadline);
    return deadline;
  }
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntilEndsAt(resolveEndsAt()));
  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsLeft(secondsUntilEndsAt(resolveEndsAt()));
      setTickFlash((f) => !f);
    }, 1000);
    return () => clearInterval(iv);
  }, [comp.endsAt, comp.id]);

  // ── Closing competitions is now entirely server-side ─────────────────────
  // A Postgres procedure (`close_expired_competitions`), scheduled via
  // pg_cron every minute, is what actually flips phase → "completed",
  // picks the winner (highest total gifts received, from the `gifts`
  // table), and pays out their prize into wallet_balances — atomically,
  // in one transaction per competition, regardless of whether anyone has
  // the board open. The client no longer does this itself: no ref-guarded
  // effect, no "only the organizer's browser can write this" workaround,
  // and no race between whichever tab happens to be open first.
  //
  // `secondsLeft` above is purely cosmetic countdown UI. The moment the
  // server closes a competition out, every client (including this board,
  // if open) hears about it via the `competition_edits` realtime
  // subscription in App() and re-renders with the authoritative result —
  // see the `editionsByComp` subscription near the top-level App component.

  const fmtCountdown = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    if (d > 0) return `${d}j ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
  };
  const [albumSheet, setAlbumSheet] = useState(null); // { participantIndex, name }
  const [mediaLightbox, setMediaLightbox] = useState(null); // approved participant_media row
  const [showGiftBar, setShowGiftBar] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftStep, setGiftStep] = useState("participant"); // "participant" | "gift" | "confirm"
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftConfirmPhase, setGiftConfirmPhase] = useState("summary"); // "summary" | "pin"
  const [giftPin, setGiftPin] = useState("");
  const [giftPinError, setGiftPinError] = useState(false);
  const [giftSubmitting, setGiftSubmitting] = useState(false);

  // Real donateurs, backed by Supabase — every gift ever sent in this
  // competition, by real, authenticated users. Create this table in
  // Supabase if it doesn't exist yet:
  //   table "gifts": id uuid pk default gen_random_uuid(),
  //     competition_id text, sender_id text, sender_name text,
  //     sender_avatar_url text, recipient_name text, recipient_index int,
  //     recipient_user_id text, gift_icon text, gift_name text, gift_cost int,
  //     price_htg int, created_at timestamptz default now()
  //   recipient_user_id (added) is the real Supabase user id of the gift's
  //   recipient — recipient_index is just a display-hash and isn't safe to
  //   use for anything that pays out real money (collisions possible).
  const [giftRows, setGiftRows] = useState([]); // raw rows for this competition
  const [giftRowsLoading, setGiftRowsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setGiftRowsLoading(true);
    supabase
      .from("gifts")
      .select("*")
      .eq("edition_id", comp.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("fetch gifts error:", error); setGiftRowsLoading(false); return; }
        setGiftRows(data || []);
        setGiftRowsLoading(false);
      });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect gifts sent by ANY user, live, while this board
  // is open — the donateurs list is never fake and never stale.
  useEffect(() => {
    const channel = supabase
      .channel(`gifts-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gifts", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setGiftRows((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  // Real total gift *count* for this competition, live-updated by the
  // subscription above. Replaces the old comp.votes mock stat, which was a
  // static seed number (e.g. 6240) that never reflected real donations and
  // only ever moved by a flat +1 per gift sent — it could show a number
  // wildly unrelated to what donateurs actually gave.
  const totalGiftCount = giftRows.length;
  const [pointsBump, setPointsBump] = useState(false);
  const prevTotalGiftCountRef = useRef(totalGiftCount);
  useEffect(() => {
    if (totalGiftCount !== prevTotalGiftCountRef.current) {
      prevTotalGiftCountRef.current = totalGiftCount;
      setPointsBump(true);
      const t = setTimeout(() => setPointsBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [totalGiftCount]);

  // Aggregate raw gift rows into a per-user leaderboard. Grouped by the
  // real sender_id, so "donateurs" always reflects actual people who
  // actually sent gifts — never invented names.
  const giftLeaderboard = useMemo(() => {
    const bySender = new Map();
    for (const row of giftRows) {
      const key = row.sender_id;
      if (!key) continue; // skip malformed rows defensively
      const giftEntry = {
        id: row.id,
        icon: row.gift_icon,
        name: row.gift_name,
        cost: row.gift_cost,
        recipientName: row.recipient_name,
        timestamp: new Date(row.created_at).getTime(),
      };
      const existing = bySender.get(key);
      if (existing) {
        existing.totalSpent += row.gift_cost;
        existing.giftCount += 1;
        existing.gifts.push(giftEntry);
        if (row.gift_cost > existing._topCost) {
          existing._topCost = row.gift_cost;
          existing.topGift = row.gift_icon;
        }
      } else {
        bySender.set(key, {
          id: key,
          senderId: key,
          index: Math.abs(hashStr(key)) % 40,
          name: row.sender_name || "Utilisateur",
          avatarUrl: (currentUser && key === currentUser.id) ? currentUser.avatarUrl : row.sender_avatar_url,
          totalSpent: row.gift_cost,
          giftCount: 1,
          topGift: row.gift_icon,
          _topCost: row.gift_cost,
          isMe: currentUser && key === currentUser.id,
          gifts: [giftEntry],
        });
      }
    }
    return Array.from(bySender.values())
      .map((d) => (d.isMe && currentUser?.fullName ? { ...d, name: currentUser.fullName } : d))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [giftRows, currentUser?.id, currentUser?.fullName, currentUser?.avatarUrl]);

  const [selectedDonor, setSelectedDonor] = useState(null);
  useEffect(() => {
    if (!selectedDonor) return;
    const fresh = giftLeaderboard.find((d) => d.id === selectedDonor.id);
    if (fresh && fresh !== selectedDonor) setSelectedDonor(fresh);
  }, [giftLeaderboard, selectedDonor]);
  const [donorTab, setDonorTab] = useState("all");
  const accent = isRegistration ? "#6C63FF" : comp.accent;
  const rulesInfo = buildRulesInfo(comp);
  const [rulesExpanded, setRulesExpanded] = useState(false);
  // Prize — the organizer sets this explicitly in the edit panel; there is
  // no auto-generated fallback amount anymore.
  const WINNER_GIFT_SHARE = 0.3;
  const basePrizePool = comp.prizeAmount != null && comp.prizeAmount !== ""
    ? Number(comp.prizeAmount)
    : 0;
  // Real registrants for this competition, fetched from Supabase. Always
  // fetched (not just during "registration") since the voting-phase
  // classement/albums/gift-picker below are now built from these rows
  // instead of fake generated names.
  const [showAllRegistrants, setShowAllRegistrants] = useState(false);
  const [registrants, setRegistrants] = useState([]);
  const [registrantsLoading, setRegistrantsLoading] = useState(true);
  const [removingRegistrantId, setRemovingRegistrantId] = useState(null);
  const liveRegistered = registrantsLoading ? comp.registeredCount : registrants.length;
  // Admin-only: pull a participant out of a competition, but only while it's
  // still in the registration phase (once it's live, votes/gifts may already
  // reference them). Always refunds the registration fee they paid, if any.
  const canRemoveParticipants = isOwnCompetition && isRegistration;
  async function handleRemoveParticipant(r) {
    if (!canRemoveParticipants || removingRegistrantId) return;
    const confirmMsg = r.fee > 0
      ? `Retirer ${r.name} de la compétition ? ${r.fee} gourdes lui seront remboursées.`
      : `Retirer ${r.name} de la compétition ?`;
    if (!window.confirm(confirmMsg)) return;
    setRemovingRegistrantId(r.id);
    const { error } = await deleteRegistration(r.id);
    if (error) {
      console.error("remove participant error:", error);
      showToast?.("Échec du retrait du participant.");
      setRemovingRegistrantId(null);
      return;
    }
    if (r.fee > 0) {
      const { error: refundError } = await refundRegistrationFee({
        userId: r.userId,
        amount: r.fee,
        competitionTitle: comp.title,
      });
      if (refundError) {
        console.error("refund error:", refundError);
        showToast?.(`${r.name} retiré, mais le remboursement a échoué.`);
        setRegistrants((prev) => prev.filter((x) => x.id !== r.id));
        setRemovingRegistrantId(null);
        return;
      }
    }
    setRegistrants((prev) => prev.filter((x) => x.id !== r.id));
    showToast?.(
      r.fee > 0 ? `${r.name} retiré — ${r.fee} gourdes remboursées.` : `${r.name} retiré.`
    );
    setRemovingRegistrantId(null);
  }


  // Participant-submitted media (their own photos/videos), pending organizer
  // approval before it shows up publicly. Backed by Supabase directly so it
  // actually syncs between the uploader's device and the organizer's device —
  // create these in Supabase if they don't exist yet:
  //   table "participant_media": id uuid pk default gen_random_uuid(),
  //     competition_id, uploader_id text, uploader_name text,
  //     media_url text, media_type text, status text default 'pending',
  //     created_at timestamptz default now()
  //   storage bucket "participant-media" (public read)
  const [participantUploads, setParticipantUploads] = useState([]); // flat rows for this competition
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("participant_media")
      .select("*")
      .eq("edition_id", comp.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error("fetch participant_media error:", error); return; }
        setParticipantUploads(data || []);
      });
    return () => { cancelled = true; };
  }, [comp.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`participant-media-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "participant_media", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setParticipantUploads((prev) => (prev.some((r) => r.id === payload.new.id) ? prev : [payload.new, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "participant_media", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          setParticipantUploads((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  const myUploads = currentUser ? participantUploads.filter((u) => u.uploader_id === currentUser.id) : [];
  const approvedUploads = participantUploads.filter((u) => u.status === "approved");
  const pendingUploads = participantUploads.filter((u) => u.status === "pending");

  async function addOwnUpload(file) {
    if (!currentUser || !file) return;
    setUploadingMedia(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${comp.id}/${currentUser.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("participant-media").upload(path, file);
    if (uploadError) {
      console.error("participant media upload error:", uploadError);
      showToast?.("Échec de l'envoi du média.");
      setUploadingMedia(false);
      return;
    }
    const { data: pub } = supabase.storage.from("participant-media").getPublicUrl(path);
    const type = file.type.startsWith("video") ? "video" : "photo";
    const { data: inserted, error: insertError } = await supabase
      .from("participant_media")
      .insert({
        competition_id: comp.competitionId,
        edition_id: comp.id,
        uploader_id: currentUser.id,
        uploader_name: currentUser.fullName,
        media_url: pub.publicUrl,
        media_type: type,
        status: "pending",
      })
      .select()
      .single();
    setUploadingMedia(false);
    if (insertError) {
      console.error("participant media insert error:", insertError);
      showToast?.("Échec de l'envoi du média.");
      return;
    }
    setParticipantUploads((prev) => (prev.some((r) => r.id === inserted.id) ? prev : [inserted, ...prev]));
    showToast?.("Média envoyé — en attente d'approbation.");
  }

  async function reviewUpload(id, status) {
    setParticipantUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u))); // optimistic
    const { error } = await supabase.from("participant_media").update({ status }).eq("id", id);
    if (error) {
      console.error("participant media review error:", error);
      showToast?.("Échec de la mise à jour.");
      return;
    }
    showToast?.(status === "approved" ? "Média approuvé." : "Média rejeté.");
  }

  useEffect(() => {
    let cancelled = false;
    setRegistrantsLoading(true);
    fetchRegistrations(comp.id).then((rows) => {
      if (cancelled) return;
      setRegistrants(
        rows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          name: r.full_name,
          avatarUrl: (currentUser && r.user_id === currentUser.id) ? currentUser.avatarUrl : r.avatar_url,
          fee: r.fee_paid,
          date: new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
          time: new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        }))
      );
      setRegistrantsLoading(false);
    });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect registrations made by ANY user, live, while this
  // board is open — not just the ones fetched at mount time.
  useEffect(() => {
    const channel = supabase
      .channel(`registrations-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          const r = payload.new;
          setRegistrants((prev) => {
            if (prev.some((existing) => existing.id === r.id)) return prev;
            return [
              {
                id: r.id,
                userId: r.user_id,
                name: r.full_name,
                avatarUrl: (currentUser && r.user_id === currentUser.id) ? currentUser.avatarUrl : r.avatar_url,
                fee: r.fee_paid,
                date: new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                time: new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  // Real per-participant total, straight from the same `gifts` rows that
  // back the donateurs section — sum of actual gift_cost, keyed by the
  // recipient_index every real gift was recorded against. No mock data.
  const giftTotalsByIndex = useMemo(() => {
    const totals = {};
    for (const row of giftRows) {
      if (row.recipient_index == null) continue;
      totals[row.recipient_index] = (totals[row.recipient_index] || 0) + (row.gift_cost || 0);
    }
    return totals;
  }, [giftRows]);

  // Database-backed participant list — real registrants only, ranked by
  // real donations received. Never falls back to invented names or invented
  // vote/point totals; if there are no real registrations yet (or the fetch
  // is still in flight), the classement, albums strip, and gift picker
  // simply show nothing, same as donateurs.
  const dbParticipants = useMemo(() => {
    const base = buildParticipantsFromRegistrants(registrants);
    return base
      .map((p) => {
        const real = giftTotalsByIndex[p.index] || 0;
        return { ...p, votes: real, points: real };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [registrants, giftTotalsByIndex]);
  const participantsFull = registrantsLoading ? [] : dbParticipants;
  // Never let someone show up as their own selectable gift recipient — this
  // is what let a self-gift slip through before (the "contestants can't
  // gift in their own competition" check alone wasn't enough, since it
  // relies on the isRegistered flag which can be stale/unpopulated).
  const giftableParticipants = currentUser
    ? participantsFull.filter((p) => p.userId !== currentUser.id)
    : participantsFull;

  // Top 5 by real donations received. dbParticipants already recomputes
  // whenever registrants or real gift rows change (including the realtime
  // `gifts` subscription above and the optimistic row added right after a
  // send), so this is always live — no shadow vote state needed.
  const ranked = participantsFull.slice(0, 5);
  const topPoints = Math.max(...ranked.map((p) => p.points), 1);
  const leader = ranked[0];
  const secondPlace = ranked[1];
  const thirdPlace = ranked[2];
  const leaderMargin = leader && secondPlace ? leader.points - secondPlace.points : null;
  const marginSafe = leaderMargin != null && leader.points > 0 ? leaderMargin / leader.points >= 0.15 : true;

  // Momentum flash: leader just gained votes → brief "+X" burst + "hot" dot for a few seconds
  useEffect(() => {
    if (!leader) return;
    if (prevLeaderVotesRef.current == null) {
      prevLeaderVotesRef.current = leader.votes;
      return;
    }
    const delta = leader.votes - prevLeaderVotesRef.current;
    prevLeaderVotesRef.current = leader.votes;
    if (delta > 0) {
      setLeaderFlash(delta);
      setLeaderHot(true);
      clearTimeout(leaderFlashTimeoutRef.current);
      leaderFlashTimeoutRef.current = setTimeout(() => setLeaderFlash(null), 1200);
      clearTimeout(leaderHotTimeoutRef.current);
      leaderHotTimeoutRef.current = setTimeout(() => setLeaderHot(false), 4000);
    }
  }, [leader?.votes]);

  // Margin trend: compare margin tick-to-tick, flash an arrow for a few seconds
  useEffect(() => {
    if (leaderMargin == null) return;
    if (prevMarginRef.current == null) {
      prevMarginRef.current = leaderMargin;
      return;
    }
    if (leaderMargin !== prevMarginRef.current) {
      setMarginTrend(leaderMargin > prevMarginRef.current ? "up" : "down");
      prevMarginRef.current = leaderMargin;
      clearTimeout(marginTrendTimeoutRef.current);
      marginTrendTimeoutRef.current = setTimeout(() => setMarginTrend(null), 4000);
    }
  }, [leaderMargin]);

  // Time in lead — ticks with the existing 1s countdown heartbeat (tickFlash)
  const leaderElapsedSec = Math.max(0, Math.floor((Date.now() - leaderSinceRef.current) / 1000));
  const fmtLeadTime = (s) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h}h${String(m % 60).padStart(2, "0")}`;
  };
  const leaderGiftCredits = leader ? leader.points : 0;
  const bonusValue = isRegistration ? 0 : Math.round(leaderGiftCredits * WINNER_GIFT_SHARE);
  const winnerPrize = basePrizePool + bonusValue;
  const heroPrizeValue = isRegistration ? basePrizePool : winnerPrize;
  // Only the bonus bumps/flashes live — the base prize number stays put
  const prevBonusRef = useRef(bonusValue);
  useEffect(() => {
    if (bonusValue !== prevBonusRef.current) {
      const delta = bonusValue - prevBonusRef.current;
      prevBonusRef.current = bonusValue;
      setBonusBump(true);
      const t = setTimeout(() => setBonusBump(false), 380);
      if (delta > 0) {
        setCagnotteFlash({ id: Date.now(), amount: delta });
        clearTimeout(cagnotteFlashTimeoutRef.current);
        cagnotteFlashTimeoutRef.current = setTimeout(() => setCagnotteFlash(null), 1400);
      }
      return () => clearTimeout(t);
    }
  }, [bonusValue]);
  // Contribution breakdown — how much of the pot is base vs. gift bonus
  const giftBonusValue = Math.max(0, heroPrizeValue - basePrizePool);
  const giftBonusPct = heroPrizeValue > 0 ? Math.min(100, Math.round((giftBonusValue / heroPrizeValue) * 100)) : 0;
  // Next round milestone, to create a little anticipation
  const nextMilestone = (() => {
    const v = heroPrizeValue;
    const step = v < 5000 ? 1000 : v < 20000 ? 5000 : v < 100000 ? 10000 : 50000;
    return Math.ceil((v + 1) / step) * step;
  })();
  const milestoneProgressPct = nextMilestone > 0 ? Math.min(100, Math.round((heroPrizeValue / nextMilestone) * 100)) : 0;
  function mapCommentRow(row) {
    const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60000));
    const isMine = currentUser && row.user_id === currentUser.id;
    return {
      id: row.id,
      index: Math.abs(hashStr(row.user_id || row.id)) % 40,
      name: row.full_name,
      // Prefer the live avatar for the viewer's own comments (so a picture
      // change shows up immediately), otherwise whatever the row has.
      avatarUrl: isMine ? currentUser.avatarUrl : row.avatar_url,
      text: row.text,
      minutesAgo,
      likes: 0,
      isMine,
    };
  }

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [likedCommentIds, setLikedCommentIds] = useState(() => new Set());
  const [expandedReplies, setExpandedReplies] = useState(() => new Set());
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyDraft, setReplyDraft] = useState("");
  const scrollRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // If the user renames themselves mid-session, immediately reflect the new
  // name on anything of theirs already loaded into this board (their own
  // registration entry, their own media uploads, their own comments) instead
  // of leaving the old name stuck until a hard refresh re-fetches from the
  // database. Historical rows in the database keep the name as it was at
  // creation time — this just keeps what's on screen in sync for the
  // person currently renaming themselves.
  useEffect(() => {
    if (!currentUser) return;
    setRegistrants((prev) =>
      prev.map((r) => (r.userId === currentUser.id && r.name !== currentUser.fullName ? { ...r, name: currentUser.fullName } : r))
    );
    setParticipantUploads((prev) =>
      prev.map((u) => (u.uploader_id === currentUser.id && u.uploader_name !== currentUser.fullName ? { ...u, uploader_name: currentUser.fullName } : u))
    );
    setComments((prev) =>
      prev.map((c) => ({
        ...c,
        name: c.isMine ? currentUser.fullName : c.name,
        replies: (c.replies || []).map((r) => (r.isMine ? { ...r, name: currentUser.fullName } : r)),
      }))
    );
  }, [currentUser?.fullName, currentUser?.id]);

  // Load comments (and their replies) for this competition from the database.
  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    fetchComments(comp.id).then((rows) => {
      if (cancelled) return;
      setComments(
        rows.map((c) => ({
          ...mapCommentRow(c),
          replies: (c.replies || []).map(mapCommentRow),
        }))
      );
      setCommentsLoading(false);
    });
    return () => { cancelled = true; };
  }, [comp.id]);

  // Real-time sync: reflect comments/replies posted by ANY user, live, while
  // this board is open.
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${comp.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `edition_id=eq.${comp.id}` },
        (payload) => {
          const row = payload.new;
          if (row.parent_id) {
            setComments((prev) => prev.map((cm) => {
              if (cm.id !== row.parent_id) return cm;
              if ((cm.replies || []).some((r) => r.id === row.id)) return cm;
              return { ...cm, replies: [...(cm.replies || []), mapCommentRow(row)] };
            }));
          } else {
            setComments((prev) => {
              if (prev.some((c) => c.id === row.id)) return prev;
              return [{ ...mapCommentRow(row), replies: [] }, ...prev];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comp.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const SCROLL_THRESHOLD = 140;
  const t = Math.min(scrollY / SCROLL_THRESHOLD, 1);
  const headerBg = `rgba(255,255,255,${t})`;
  const borderColor = t > 0.5 ? `rgba(0,0,0,0.1)` : `rgba(255,255,255,0.3)`;


  // (Removed: fake simulated registration-count timer. liveRegistered is now
  // sourced for real from the database — see the fetch + realtime effects above.)

  async function handlePostComment() {
    const text = commentDraft.trim();
    if (!text) return;
    if (!currentUser) {
      onRequestAuth?.();
      return;
    }
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
    if (error) {
      console.error("insertComment error:", error);
      return;
    }
    setComments((prev) => {
      if (prev.some((c) => c.id === data.id)) return prev;
      return [{ ...mapCommentRow(data), replies: [] }, ...prev];
    });
    setCommentDraft("");
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
    if (error) {
      console.error("insertComment (reply) error:", error);
      return;
    }
    setComments((prev) => prev.map((cm) => {
      if (cm.id !== parentId) return cm;
      if ((cm.replies || []).some((r) => r.id === data.id)) return cm;
      return { ...cm, replies: [...(cm.replies || []), mapCommentRow(data)] };
    }));
    setExpandedReplies((prev) => new Set([...prev, parentId]));
    setReplyDraft("");
    setReplyingTo(null);
  }

  function handleToggleLike(commentId) {
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  // Interleave live gift entries and comments into one chronological feed, TikTok-style.
  // Derived straight from giftRows (Supabase-backed + realtime-synced) so the
  // live feed survives a refresh, instead of the old local-only liveLog state
  // which reset to [] on every reload and lost every gift already sent.
  const feedItems = useMemo(() => {
    const sortedGiftRows = [...giftRows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const giftItems = sortedGiftRows.map((row, i) => ({
      type: "gift",
      key: `gift-${row.id}`,
      minutesAgo: i * 2,
      entry: {
        id: row.id,
        pIndex: row.recipient_index ?? 0,
        pName: row.recipient_name,
        gift: { icon: row.gift_icon, name: row.gift_name, cost: row.gift_cost },
        senderName: row.sender_name,
        ago: i === 0 ? "À l'instant" : `il y a ${i * 2} min`,
      },
    }));
    const commentItems = comments.map((c) => ({
      type: "comment",
      key: `comment-${c.id}`,
      minutesAgo: c.minutesAgo,
      comment: c,
    }));
    return [...giftItems, ...commentItems].sort((a, b) => a.minutesAgo - b.minutesAgo);
  }, [giftRows, comments]);

  const heroBannerSlides = useMemo(() => {
    const images = comp.images || [];
    if (images.length === 0) return [{ type: "placeholder" }];
    return images.map((img) => ({ type: "image", src: img.url }));
  }, [comp.images]);

  return (
    <div ref={scrollRef} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#F2F2F0", overflowY: "auto" }}>

      {/* ── STICKY TRANSPARENT HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 12px",
        background: headerBg,
        borderBottom: t > 0.5 ? `1px solid rgba(0,0,0,${0.08 * t})` : "none",
        pointerEvents: "none",
        opacity: bannerFullscreen ? 0 : 1,
        transition: "opacity 0.3s",
      }}>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.4)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
          color: "#222", fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "all",
        }}><X size={14} /></button>

        {/* Competition follow — separate from organiser follow */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "all" }}>
          <button
            onClick={() => onToggleFollow?.(comp)}
            title={isFollowed ? "Ne plus suivre cette compétition" : "Suivre cette compétition"}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: isFollowed ? `${accent}33` : "rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px) saturate(180%)",
              WebkitBackdropFilter: "blur(12px) saturate(180%)",
              border: isFollowed ? `1px solid ${accent}88` : "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              color: isFollowed ? accent : "#222",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Bell size={13} strokeWidth={isFollowed ? 2.5 : 2} fill={isFollowed ? accent : "none"} />
          </button>

          <button
            title="Partager"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              backdropFilter: "blur(12px) saturate(180%)",
              WebkitBackdropFilter: "blur(12px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
              color: "#222",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Share2 size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", width: "100%", background: accent, paddingBottom: 0, marginTop: -46 }}>

        {/* Banner slides */}
        {(() => {
          const bannerSlides = heroBannerSlides;
          return (
            <>
              {/* Main slider */}
              <div style={{ width: "100%", aspectRatio: "3 / 1", position: "relative", overflow: "hidden" }}>
                {bannerSlides.map((slide, i) => (
                  <div key={i} style={{
                    position: "absolute", inset: 0,
                    opacity: i === activeBanner ? 1 : 0,
                    transition: "opacity 0.4s ease",
                  }}>
                    {slide.type === "video" ? (
                      <>
                        <video
                          ref={(el) => { if (el) bannerVideoRefs.current[i] = el; }}
                          src={slide.src}
                          poster={slide.poster}
                          muted
                          loop
                          playsInline
                          onError={() => setVideoErrors((e) => ({ ...e, [i]: true }))}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        {videoErrors[i] && (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: "50%",
                              background: "rgba(0,0,0,0.45)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Play size={24} fill="#fff" color="#fff" strokeWidth={0} style={{ marginLeft: 2 }} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : slide.type === "placeholder" ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e5e5" }}>
                        <ImageIcon size={40} color="#bbb" />
                      </div>
                    ) : (
                      <img src={slide.src} alt={`${comp.title} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: `${accent}44`, mixBlendMode: "multiply" }} />
                  </div>
                ))}
                {/* Gradient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
                  zIndex: 1,
                }} />
                {/* Hero content */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5, padding: "0 8px 16px", opacity: bannerFullscreen ? 0 : 1, transition: "opacity 0.3s", pointerEvents: bannerFullscreen ? "none" : "all" }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>{comp.niche}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.05, textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{comp.title}</div>
                </div>
                {/* Focus icon — bottom right */}
                <div
                  style={{ position: "absolute", bottom: 12, right: 12, zIndex: 6, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", padding: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setBannerFullscreen((v) => !v); }}
                >
                  {bannerFullscreen ? (
                    /* Minimize — inward arrows */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M9 14H3M9 14V20M9 14L3 20"/>
                      <path d="M15 14h6M15 14v6M15 14l6 6"/>
                      <path d="M9 10H3M9 10V4M9 10L3 4"/>
                      <path d="M15 10h6M15 10V4M15 10L21 4"/>
                    </svg>
                  ) : (
                    /* Maximize — outward corner arrows */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                      <path d="M3 9V3h6M3 3l6 6"/>
                      <path d="M21 9V3h-6M21 3l-6 6"/>
                      <path d="M3 15v6h6M3 21l6-6"/>
                      <path d="M21 15v6h-6M21 21l-6-6"/>
                    </svg>
                  )}
                </div>
              </div>

            </>
          );
        })()}
      </div>

      {/* ── CONTENT SHEET — rounded top corners, sits flush below the hero ── */}
      <div style={{
        position: "relative",
        borderRadius: "22px 22px 0 0",
        background: "#F2F2F0",
        overflow: "hidden",
      }}>

      {/* ── Thumbnail selector — lives inside the sheet so the curve never covers it. Only worth showing when there's something to switch between. ── */}
      {heroBannerSlides.length > 1 && (
        <div style={{ background: "#fff", padding: "12px 8px 8px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {heroBannerSlides.map((slide, i) => (
            <div
              key={i}
              onClick={() => setActiveBanner(i)}
              style={{
                width: 60, height: 60, flexShrink: 0,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden", cursor: "pointer",
                outline: i === activeBanner ? `2px solid ${accent}` : "2px solid transparent",
                outlineOffset: "-2px",
                transition: "outline-color 0.2s, opacity 0.2s",
                opacity: i === activeBanner ? 1 : 0.45,
              }}
            >
              {slide.type === "placeholder" ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#eee" }}>
                  <ImageIcon size={20} color="#ccc" />
                </div>
              ) : (
                <img src={slide.type === "video" ? slide.poster : slide.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              {slide.type === "video" && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Play size={11} fill="#111" color="#111" strokeWidth={0} style={{ marginLeft: 1 }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ORGANISER BAR ── */}
      <OrgBar comp={comp} accent={accent} />

      {/* ── TABS ── */}
      <div style={{
        display: "flex", background: "#fff", borderBottom: "1px solid #e0e0e0",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        {[
          { key: "home", label: "Home" },
          { key: "participants", label: "Participants" },
          { key: "medias", label: "Médias" },
          { key: "donateurs", label: "Donateurs" },
          { key: "live", label: "Live" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, border: "none", background: "none", cursor: "pointer",
              padding: "13px 4px 11px",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
              color: activeTab === tab.key ? "#111" : "#aaa",
              borderBottom: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {tab.key === "live" && !isRegistration ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                {tab.label}
              </span>
            ) : tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 0 132px" }}>

        {activeTab === "home" && (
        <>
        {isCompleted && (
          <div style={{
            background: "linear-gradient(135deg, #2c2c2c, #111)",
            padding: "18px 16px", textAlign: "center", color: "#fff",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <Trophy size={22} color="#F0C420" strokeWidth={2.2} />
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800, color: "#F0C420", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              Compétition terminée
            </div>
            {comp.winnerUserId ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
                  {comp.winnerName} remporte {Number(comp.winnerPrize || 0).toLocaleString("fr-FR")} HTG
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Félicitations au gagnant 🎉
                </div>
              </>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                Aucun participant n'a reçu de cadeaux — pas de gagnant à annoncer.<br />
                Les frais d'inscription ont été remboursés à tous les participants.
              </div>
            )}
          </div>
        )}
        {/* ── À PROPOS / RÈGLEMENT ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 10px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10,
          }}>
            <Info size={13} strokeWidth={2.5} />
            À propos
          </div>

          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: rulesInfo.description ? "#444" : "#aaa",
            lineHeight: 1.55, margin: "0 0 12px",
            fontStyle: rulesInfo.description ? "normal" : "italic",
          }}>
            {rulesInfo.description || "Aucune description pour le moment."}
          </p>

          {/* Prize — single winner: registration fees (base) + 30% of their personal gifts */}
          <div style={{ marginBottom: 12 }}>

            {/* Hero cagnotte — full-width section, no card wrapper */}
            <div style={{ position: "relative", padding: "2px 2px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Trophy size={14} color="#C99A2E" strokeWidth={2.3} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 800, color: "#C99A2E", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                  {isRegistration ? "Prix à gagner" : "Cagnotte à gagner"}
                </span>
                {!isRegistration && !isCompleted && (
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#e74c3c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Live
                    </span>
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                {/* Base prize — static, never bumps or increments */}
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 800, color: "#111",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {basePrizePool.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#999" }}>
                  HTG
                </span>

                {/* Gift bonus — lives in the same row, this is the only piece that bumps/increments */}
                {!isRegistration && (
                  <span style={{ position: "relative", display: "inline-flex" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: `${accent}18`, color: accent,
                      padding: "3px 9px", borderRadius: 999,
                      fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      transform: bonusBump ? "scale(1.08)" : "scale(1)",
                      transformOrigin: "left center",
                      transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <Gift size={11} color={accent} strokeWidth={2.3} />
                      +{bonusValue.toLocaleString("fr-FR")} HTG bonus
                    </span>
                    {cagnotteFlash != null && (
                      <span key={cagnotteFlash.id} style={{
                        position: "absolute", left: "100%", top: -2, marginLeft: 6,
                        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 800, color: "#27ae60",
                        whiteSpace: "nowrap", animation: "float-up-fade 1.4s ease-out forwards",
                      }}>
                        +{cagnotteFlash.amount.toLocaleString("fr-FR")}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {isRegistration ? (
                <div style={{ marginTop: 4, fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888" }}>
                  + un bonus basé sur les cadeaux reçus par le gagnant
                </div>
              ) : (
                <>
                  {/* Contribution breakdown — base prize vs. gift bonus, as a thin segmented bar */}
                  {heroPrizeValue > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", width: "100%", height: 5, borderRadius: 3, overflow: "hidden", background: "#eee" }}>
                        <div style={{ width: `${100 - giftBonusPct}%`, background: "#ccc", transition: "width 0.4s ease" }} />
                        <div style={{ width: `${giftBonusPct}%`, background: accent, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontFamily: "Inter, sans-serif", fontSize: 9, color: "#aaa" }}>
                        <span>Mise de base {(100 - giftBonusPct)}%</span>
                        <span>Cadeaux {giftBonusPct}%</span>
                      </div>
                    </div>
                  )}

                  {/* Milestone marker — a little anticipation for the next round number */}
                  <div style={{ marginTop: 8, fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa" }}>
                    Prochain palier : {nextMilestone.toLocaleString("fr-FR")} HTG
                    <span style={{ marginLeft: 6, color: "#ccc" }}>({milestoneProgressPct}%)</span>
                  </div>
                </>
              )}
            </div>

            {rulesInfo.rewardExtra && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", marginTop: 8, padding: "0 2px" }}>
                {rulesInfo.rewardExtra}
              </div>
            )}

          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            {(isRegistration ? [
              { value: liveRegistered, label: "Inscrits" },
              { value: comp.contestants, label: "Places", accent: true },
              { value: `${registrationFee} G`, label: "Frais insc." },
            ] : [
              { value: liveRegistered, label: "Candidats" },
              { value: fmtVotes(totalGiftCount), label: "Cadeaux", accent: true, bump: pointsBump },
              { value: fmtAbsoluteDate(resolveEndsAt()), label: "Fin dans", hot: comp.hot, timer: true },
            ]).map((s, i) => {
              const hotTimer = s.timer && s.hot;
              return (
                <div key={i} style={{
                  borderLeft: i > 0 ? "1px solid #f0f0f0" : "none",
                  padding: "10px 4px",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  background: hotTimer ? "rgba(192,57,43,0.06)" : "transparent",
                  transition: "background 0.3s",
                }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: s.timer ? 15 : 24, fontWeight: 800,
                    color: hotTimer ? "#c0392b" : s.accent ? accent : "#111",
                    lineHeight: 1.15,
                    transition: s.timer ? "opacity 0.12s, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
                    opacity: s.timer ? (tickFlash ? 1 : 0.6) : 1,
                    transform: s.bump ? "scale(1.14)" : "scale(1)",
                    fontVariantNumeric: s.timer ? "normal" : "tabular-nums",
                    whiteSpace: s.timer ? "nowrap" : "normal",
                  }}>{s.timer ? fmtCountdown(secondsLeft) : s.value}</div>
                  {s.timer && (
                    <div style={{
                      fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb",
                      marginTop: 2, whiteSpace: "nowrap",
                    }}>{fmtAbsoluteDate(resolveEndsAt())}</div>
                  )}
                  <div style={{
                    fontFamily: "Inter, sans-serif", fontSize: 9.5, color: "#999",
                    textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4,
                    fontWeight: 600, textAlign: "center",
                  }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RULES (lower-priority disclosure, separate from the vitals above) ── */}
        {rulesInfo.rules.length > 0 && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 10px" }}>
            <button
              onClick={() => setRulesExpanded((v) => !v)}
              style={{
                width: "100%", border: "none", borderRadius: 14, background: "#f5f5f5",
                padding: "6px 8px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                color: "#333", textTransform: "uppercase", letterSpacing: "0.06em",
              }}
            >
              Règlement complet
              <ChevronRight
                size={14}
                style={{ transform: rulesExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              />
            </button>

            {rulesExpanded && (
              <ol style={{
                margin: "10px 0 0", padding: "0 0 0 12px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {rulesInfo.rules.map((rule, i) => (
                  <li key={i} style={{
                    fontFamily: "Inter, sans-serif", fontSize: 12.5, color: "#555",
                    lineHeight: 1.5,
                  }}>
                    {rule}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {isRegistration && (
          <div style={{
            background: "#fff",
            borderBottom: "1px solid #e0e0e0",
            padding: "6px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa",
              textTransform: "uppercase", letterSpacing: "0.1em",
              fontWeight: 600,
            }}>Fin inscr.</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 800,
                color: comp.hot ? "#c0392b" : "#6C63FF",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}>{fmtCountdown(secondsLeft)}</span>
              <span style={{
                fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa",
                lineHeight: 1.1,
                transition: "opacity 0.12s",
                opacity: tickFlash ? 1 : 0.6,
                whiteSpace: "nowrap",
              }}>{fmtAbsoluteDate(resolveEndsAt())}</span>
            </div>
          </div>
        )}

        {/* ── COUNTDOWN BAR ── */}
        <div style={{
          background: isRegistration ? "#f0ebff" : comp.hot ? "#fff0ed" : "#f7f7f5",
          borderBottom: "1px solid #e0e0e0",
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isRegistration ? "#6C63FF" : comp.hot ? "#e74c3c" : "#bbb",
            display: "inline-block", flexShrink: 0,
            animation: (isRegistration || comp.hot) ? "pulse-dot 1.2s infinite" : "none",
          }} />
          <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
            color: isRegistration ? "#6C63FF" : comp.hot ? "#c0392b" : "#888",
          }}>
            {isRegistration 
              ? `Inscriptions ouvertes — ${comp.contestants - liveRegistered} place${comp.contestants - liveRegistered !== 1 ? 's' : ''} disponible${comp.contestants - liveRegistered !== 1 ? 's' : ''} · ${fmtCountdown(secondsLeft)}` 
              : comp.hot ? `Compétition très active — ${fmtCountdown(secondsLeft)}` : `Se termine dans ${fmtCountdown(secondsLeft)}`}
          </span>
        </div>

        {/* ── PARTICIPANTS PREVIEW ── */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12, paddingLeft: 10, paddingRight: 10,
          }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
            }}><Users size={13} strokeWidth={2.5} />Participants</span>
            <button
              onClick={() => setActiveTab("participants")}
              style={{
                border: "none", background: "none", color: accent,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              Voir plus
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
            </button>
          </div>

          <div style={{ paddingLeft: 10, paddingRight: 10 }}>
            {isRegistration ? (
              registrants.slice(0, 3).map((r, idx, arr) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "3px 0",
                  borderBottom: idx < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "#f0ebff", color: "#6C63FF",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                      Inscrit le {r.date} à {r.time}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    color: "#6C63FF", flexShrink: 0,
                  }}>
                    {r.fee} gourdes
                  </span>
                </div>
              ))
            ) : (
              ranked.slice(0, 3).map((p, rank, arr) => {
                const pct = Math.max(8, Math.round((p.points / topPoints) * 100));
                return (
                  <div key={p.id ?? p.index} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "5px 0",
                    borderBottom: rank < arr.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    {/* Rank */}
                    <span style={{
                      width: 20, flexShrink: 0, textAlign: "center",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: rank === 0 ? 16 : 12, fontWeight: 700,
                      color: rank === 0 ? accent : "#ccc",
                    }}>
                      {rank === 0 ? "🥇" : rank + 1}
                    </span>

                    {/* Profile pic */}
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      overflow: "hidden", background: "#fff",
                      border: rank === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                    }}>
                      <EntityAvatar url={p.avatarUrl} name={p.name} />
                    </div>

                    {/* Name + points/coin above, full-width progress bar below */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{
                          fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                          color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{p.name}</span>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                          color: rank === 0 ? accent : "#555", flexShrink: 0,
                        }}>
                          🪙 {p.points.toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                        <div
                          className="bar-shimmer"
                          style={{
                            height: "100%", borderRadius: 2,
                            width: `${pct}%`,
                            background: rank === 0
                              ? `linear-gradient(90deg, ${accent} 0%, ${accent}cc 50%, ${accent} 100%)`
                              : "linear-gradient(90deg, #ddd 0%, #eee 50%, #ddd 100%)",
                            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── MÉDIAS PREVIEW ──
             Approved media from everyone, plus the current user's own
             uploads even while still pending (tagged "En attente") so they
             can see their submission sitting in the row while it's reviewed. */}
        {!isRegistration && (() => {
          const homeMediaItems = participantUploads.filter(
            (u) => u.status === "approved" || (currentUser && u.uploader_id === currentUser.id && u.status === "pending")
          );
          return homeMediaItems.length > 0 && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><ImageIcon size={13} strokeWidth={2.5} />Médias</span>
              <button
                onClick={() => setActiveTab("medias")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
              {homeMediaItems.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={() => { if (item.status === "approved") setMediaLightbox(item); }}
                  style={{ position: "relative", flexShrink: 0, width: 110, aspectRatio: "1 / 1", overflow: "hidden", background: "#111", cursor: item.status === "approved" ? "pointer" : "default" }}
                >
                  {item.media_type === "video" ? (
                    <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.status === "pending" ? 0.55 : 1 }} muted />
                  ) : (
                    <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.status === "pending" ? 0.55 : 1 }} />
                  )}
                  {item.status === "pending" && (
                    <span style={{
                      position: "absolute", top: 6, left: 6,
                      background: "#e74c3c", color: "#fff",
                      fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                      padding: "2px 6px", letterSpacing: "0.02em",
                    }}>
                      En attente
                    </span>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.uploader_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ── DONATEURS PREVIEW ── */}
        {!isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Gift size={13} strokeWidth={2.5} />Donateurs</span>
              <button
                onClick={() => setActiveTab("donateurs")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {giftLeaderboard.length === 0 ? (
              <div style={{ padding: "2px 10px 0px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                Aucun donateur pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
                {giftLeaderboard.slice(0, 10).map((donor, i) => (
                  <div key={donor.id} style={{ flexShrink: 0, width: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                      border: i === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      position: "relative",
                    }}>
                      <EntityAvatar url={donor.avatarUrl} name={donor.name} bg={donor.isMe ? "#111" : "#ddd"} color={donor.isMe ? "#fff" : "#666"} />
                      {i === 0 && (
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 14 }}>👑</span>
                      )}
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#333", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {donor.name}
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800, color: i === 0 ? accent : "#888" }}>
                      🪙 {formatCoins(donor.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE PREVIEW ── */}
        {!isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12, paddingLeft: 10, paddingRight: 10,
            }}>
              <span style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e74c3c", display: "inline-block", animation: "pulse-dot 1s infinite" }} />
                Live
              </span>
              <button
                onClick={() => setActiveTab("live")}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir plus
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {feedItems.length === 0 ? (
              <div style={{ padding: "2px 10px 0px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                Aucune activité pour le moment.
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingLeft: 10, paddingRight: 10, scrollbarWidth: "none" }}>
                {feedItems.slice(0, 10).map((item) => {
                  if (item.type === "gift") {
                    const entry = item.entry;
                    const liked = likedCommentIds.has(entry.id);
                    // entry.id is a UUID string (from Supabase), not the old
                    // Date.now() number — hash it to a stable int before % so
                    // this doesn't produce NaN like it did right after the
                    // liveLog -> giftRows switch.
                    let idHash = 0;
                    for (let ci = 0; ci < String(entry.id).length; ci++) {
                      idHash = (idHash * 31 + String(entry.id).charCodeAt(ci)) | 0;
                    }
                    idHash = Math.abs(idHash);
                    const likeCount = (idHash % 12) + (liked ? 1 : 0);
                    const replyCount = idHash % 3;
                    return (
                      <div key={item.key} style={{
                        flexShrink: 0, width: 170,
                        border: "1px solid #f0f0f0",
                        display: "flex", flexDirection: "column",
                      }}>
                        {/* Body */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "7px 8px 6px" }}>
                          {/* Header — sender profile, same as a comment card */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                              background: "#111",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>
                                {(entry.senderName || "V").charAt(0)}
                              </span>
                            </div>
                            <span style={{ flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {entry.senderName || "Vous"}
                            </span>
                            {/* Gift tag — distinguishes this from a comment card */}
                            <span style={{
                              flexShrink: 0,
                              display: "flex", alignItems: "center", gap: 2,
                              background: `${accent}18`, color: accent,
                              fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.04em",
                              padding: "2px 5px", borderRadius: 999,
                            }}>
                              🎁 Cadeau
                            </span>
                          </div>

                          {/* Emoji — the central element */}
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "3px 0" }}>
                            <span style={{ fontSize: 26, lineHeight: 1 }}>{entry.gift.icon}</span>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: accent }}>
                              {entry.gift.name}
                            </span>
                          </div>

                          {/* Recipient — who the gift is for */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5,
                            paddingTop: 4, borderTop: "1px solid #f0f0f0",
                          }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1px solid #eee" }}>
                              <EntityAvatar url={entry.pAvatarUrl} name={entry.pName || fakeName(entry.pIndex)} />
                            </div>
                            <span style={{
                              fontFamily: "Inter, sans-serif", fontSize: 10, color: "#888",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              pour <span style={{ fontWeight: 700, color: "#666" }}>{entry.pName || fakeName(entry.pIndex)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Engagement bar — edge-to-edge separator, always at the bottom */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderTop: "1px solid #f0f0f0" }}>
                          <button onClick={() => handleToggleLike(entry.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                            <Heart size={12} fill={liked ? "#e74c3c" : "none"} color={liked ? "#e74c3c" : "#bbb"} strokeWidth={2} />
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: liked ? "#e74c3c" : "#999" }}>{likeCount}</span>
                          </button>
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <MessageCircle size={12} color="#bbb" strokeWidth={2} />
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#999" }}>{replyCount}</span>
                          </div>
                          <span style={{ marginLeft: "auto", fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", whiteSpace: "nowrap" }}>
                            {fmtAgoFr(item.minutesAgo)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  const c = item.comment;
                  const liked = likedCommentIds.has(c.id);
                  return (
                    <div key={item.key} style={{
                      flexShrink: 0, width: 170,
                      border: "1px solid #f0f0f0",
                      display: "flex", flexDirection: "column",
                    }}>
                      {/* Body */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, padding: "7px 8px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                            background: c.isMine ? "#111" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {c.isMine ? (
                              <span style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700 }}>{c.name.charAt(0)}</span>
                            ) : (
                              <EntityAvatar url={c.avatarUrl} name={c.name} />
                            )}
                          </div>
                          <span style={{ flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.name}
                          </span>
                        </div>
                        <p style={{
                          flex: 1,
                          fontFamily: "Inter, sans-serif", fontSize: 11, color: "#666", lineHeight: 1.4, margin: 0,
                          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {c.text}
                        </p>
                      </div>

                      {/* Engagement bar — edge-to-edge separator, always at the bottom */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderTop: "1px solid #f0f0f0" }}>
                        <button onClick={() => handleToggleLike(c.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                          <Heart size={12} fill={liked ? "#e74c3c" : "none"} color={liked ? "#e74c3c" : "#bbb"} strokeWidth={2} />
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: liked ? "#e74c3c" : "#999" }}>{c.likes + (liked ? 1 : 0)}</span>
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MessageCircle size={12} color="#bbb" strokeWidth={2} />
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "#999" }}>{c.replies.length}</span>
                        </div>
                        <span style={{ marginLeft: "auto", fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", whiteSpace: "nowrap" }}>
                          {fmtAgoFr(item.minutesAgo)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        </>
        )}

        {/* ── TOP 5 LEADERBOARD or REGISTRATION INFO ── */}
        {activeTab === "participants" && (
        isRegistration ? (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Users size={13} strokeWidth={2.5} />Inscription en cours</span>
            </div>
            <div style={{
              padding: "20px", background: "#f8f7fc", borderRadius: 16,
              textAlign: "center", marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700,
                color: "#6C63FF", marginBottom: 4,
                transition: "color 0.2s",
              }}>
                {liveRegistered}/{comp.contestants}
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666",
                marginBottom: 12,
              }}>
                personnes inscrites
              </div>
              {/* Animated fill bar */}
              <div style={{ height: 8, borderRadius: 999, background: "#e0d5ff", width: "100%", marginBottom: 12, overflow: "hidden" }}>
                <div
                  className="bar-shimmer"
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    width: `${Math.round((liveRegistered / comp.contestants) * 100)}%`,
                    background: liveRegistered >= comp.contestants
                      ? "linear-gradient(90deg, #00B894 0%, #00d4a8 50%, #00B894 100%)"
                      : "linear-gradient(90deg, #6C63FF 0%, #a89dff 50%, #6C63FF 100%)",
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999",
                lineHeight: 1.5,
              }}>
                {comp.contestants - liveRegistered > 0
                  ? `${comp.contestants - liveRegistered} place${comp.contestants - liveRegistered !== 1 ? 's' : ''} encore disponible${comp.contestants - liveRegistered !== 1 ? 's' : ''}`
                  : "Les inscriptions sont complètes"}
              </div>
            </div>

            {/* Registered members list */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Users size={13} strokeWidth={2.5} />Membres inscrits</span>
              {registrants.length > 5 && (
                <button
                  onClick={() => setShowAllRegistrants(true)}
                  style={{
                    border: "none", background: "none", color: accent,
                    fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  Voir tout ({registrants.length})
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                  </svg>
                </button>
              )}
            </div>

            {registrantsLoading ? (
              <div style={{
                padding: "20px 0 24px", textAlign: "center",
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb",
              }}>
                Chargement des inscrits...
              </div>
            ) : registrants.length === 0 ? (
              <div style={{
                padding: "20px 0 24px", textAlign: "center",
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb",
              }}>
                Aucune inscription pour le moment.
              </div>
            ) : (
              registrants.slice(0, 5).map((r, idx, arr) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0",
                  borderBottom: idx < arr.length - 1 ? "1px solid #f3f3f3" : "none",
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "#f0ebff", color: "#6C63FF",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                      Inscrit le {r.date} à {r.time}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    color: "#6C63FF", flexShrink: 0,
                  }}>
                    {r.fee} gourdes
                  </span>
                  {canRemoveParticipants && (
                    <button
                      onClick={() => handleRemoveParticipant(r)}
                      disabled={removingRegistrantId === r.id}
                      title="Retirer ce participant"
                      style={{
                        width: 24, height: 24, flexShrink: 0, marginLeft: 4,
                        border: "1px solid #f3d0cd", borderRadius: "50%",
                        background: "#fdf1f0", color: "#e74c3c",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: removingRegistrantId === r.id ? "default" : "pointer",
                        opacity: removingRegistrantId === r.id ? 0.5 : 1,
                        padding: 0,
                      }}
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div style={{ height: 12 }} />
          </div>
        ) : (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14,
            }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              }}><Trophy size={13} strokeWidth={2.5} />Classement · Top 5</span>
              <button
                onClick={() => setShowAll(true)}
                style={{
                  border: "none", background: "none", color: accent,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Voir tout ({comp.contestants})
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
                </svg>
              </button>
            </div>

            {ranked.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
                Aucun participant pour le moment.
              </div>
            ) : ranked.map((p, rank) => {
              const pct = Math.max(8, Math.round((p.points / topPoints) * 100));
              return (
                <div key={p.id ?? p.index} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 0",
                  borderBottom: rank < ranked.length - 1 ? "1px solid #f0f0f0" : "none",
                }}>
                  {/* Rank */}
                  <span style={{
                    width: 20, flexShrink: 0, textAlign: "center",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: rank === 0 ? 16 : 12, fontWeight: 700,
                    color: rank === 0 ? accent : "#ccc",
                  }}>
                    {rank === 0 ? "🥇" : rank + 1}
                  </span>

                  {/* Profile pic */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    overflow: "hidden", background: "#fff",
                    border: rank === 0 ? `2px solid ${accent}` : "2px solid #eee",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
                  }}>
                    <EntityAvatar url={p.avatarUrl} name={p.name} />
                  </div>

                  {/* Name + points/coin above, full-width progress bar below */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                        color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{p.name}</span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                        color: rank === 0 ? accent : "#555", flexShrink: 0,
                        transition: "color 0.3s",
                      }}>
                        🪙 {p.points.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        className="bar-shimmer"
                        style={{
                          height: "100%", borderRadius: 2,
                          width: `${pct}%`,
                          background: rank === 0
                            ? `linear-gradient(90deg, ${accent} 0%, ${accent}cc 50%, ${accent} 100%)`
                            : "linear-gradient(90deg, #ddd 0%, #eee 50%, #ddd 100%)",
                          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: 12 }} />
          </div>
        )
        )}

        {/* ── PARTICIPANTS STRIP (only for voting phase) ── */}
        {activeTab === "medias" && !isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", paddingTop: 14, paddingBottom: 14 }}>
            {/* Organizer-only: media submitted by participants, awaiting approval.
                Always visible to the organizer (not just when something's
                pending) so there's a stable, discoverable place to check. */}
            {currentUser?.isOrganizer && (
              <div style={{ marginBottom: 16, paddingLeft: 8, paddingRight: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                  color: pendingUploads.length > 0 ? "#e74c3c" : "#888", textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 10,
                }}>
                  <Clock size={13} strokeWidth={2.5} />
                  Médias à approuver{pendingUploads.length > 0 ? ` (${pendingUploads.length})` : ""}
                </div>
                {pendingUploads.length === 0 ? (
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb", padding: "4px 0 2px" }}>
                    Rien à approuver pour l'instant.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pendingUploads.map((item) => (
                      <div key={item.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        border: "1px solid #eee", padding: 8,
                      }}>
                        <div style={{ width: 46, height: 46, flexShrink: 0, overflow: "hidden", background: "#111" }}>
                          {item.media_type === "video" ? (
                            <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                          ) : (
                            <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.uploader_name}
                          </div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#aaa" }}>
                            {item.media_type === "video" ? "Vidéo" : "Photo"} envoyée
                          </div>
                        </div>
                        <button
                          onClick={() => reviewUpload(item.id, "rejected")}
                          style={{ border: "1px solid #eee", background: "#fff", color: "#999", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => reviewUpload(item.id, "approved")}
                          style={{ border: "none", background: accent, color: "#fff", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
              marginBottom: 12, paddingLeft: 8, paddingRight: 8,
            }}>
              <ImageIcon size={13} strokeWidth={2.5} />
              Médias des participants
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, paddingLeft: 8, paddingRight: 8 }}>
              {/* "Mon album" — lets a registered participant manage their own uploads */}
              {isRegistered && currentUser && (
                <div
                  onClick={() => setAlbumSheet(true)}
                  style={{
                    position: "relative", cursor: "pointer", aspectRatio: "1 / 1",
                    border: `1.5px dashed ${accent}`, background: `${accent}0a`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {myUploads.some((u) => u.status === "pending") && (
                    <span style={{
                      position: "absolute", top: 7, right: 7,
                      background: "#e74c3c", color: "#fff",
                      fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                      padding: "2px 6px",
                    }}>
                      En attente
                    </span>
                  )}
                  <Plus size={20} color={accent} strokeWidth={2.5} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: accent }}>
                    Mon album
                  </span>
                </div>
              )}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).slice(0, 11).map((item) => (
                <div key={item.id} onClick={() => setMediaLightbox(item)} style={{ position: "relative", cursor: "pointer", aspectRatio: "1 / 1", overflow: "hidden", background: "#111" }}>
                  {item.media_type === "video" ? (
                    <video src={item.media_url} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} muted />
                  ) : (
                    <img src={item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "5px 9px", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                  }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.uploader_name}
                    </span>
                  </div>
                </div>
              ))}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length > 11 && (
                <div
                  onClick={() => setShowAllAlbums(true)}
                  style={{
                    border: "1px dashed #ddd", background: "#fafafa",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 6, cursor: "pointer",
                    aspectRatio: "1/1",
                  }}
                >
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#bbb" }}>
                    +{approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length - 11}
                  </span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Voir tout
                  </span>
                </div>
              )}
              {approvedUploads.filter((u) => u.uploader_id !== currentUser?.id).length === 0 && !(isRegistered && currentUser) && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Aucun média approuvé pour l'instant.
                </div>
              )}
            </div>
          </div>
        )}


        {/* ── TOP DONATEURS ── */}
        {activeTab === "donateurs" && !isRegistration && (
          <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 8px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Gift size={14} color={accent} strokeWidth={2.5} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Top Donateurs
                </span>
              </div>
              {giftLeaderboard.length === 0 && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb" }}>Aucun encore</span>
              )}
            </div>

            {giftLeaderboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>
                  Soyez le premier à envoyer un cadeau !
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {giftLeaderboard.map((donor, i) => {
                  const isFirst = i === 0;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={donor.id}
                      onClick={() => { setSelectedDonor(donor); setDonorTab("all"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 10px",
                        background: isFirst ? `${accent}0f` : donor.isMe ? "#f8f8f8" : "#fff",
                        border: isFirst ? `1px solid ${accent}33` : donor.isMe ? "1px solid #e0e0e0" : "1px solid transparent",
                        transition: "background 0.2s",
                        cursor: "pointer",
                      }}
                    >
                      {/* Rank */}
                      <div style={{ width: 24, textAlign: "center", flexShrink: 0 }}>
                        {i < 3 ? (
                          <span style={{ fontSize: 16 }}>{medals[i]}</span>
                        ) : (
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#bbb" }}>#{i + 1}</span>
                        )}
                      </div>
                      {/* Avatar */}
                      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: isFirst ? `2px solid ${accent}` : "2px solid #eee" }}>
                        <EntityAvatar url={donor.avatarUrl} name={donor.name} bg={donor.isMe ? "#111" : "#ddd"} color={donor.isMe ? "#fff" : "#666"} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: isFirst ? accent : "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {donor.name}
                          </span>
                          {donor.isMe && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: accent, background: `${accent}18`, padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vous</span>}
                          {isFirst && <span style={{ fontSize: 13 }}>👑</span>}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 1 }}>
                          {donor.giftCount} cadeau{donor.giftCount > 1 ? "x" : ""} · meilleur: {donor.topGift}
                        </div>
                      </div>
                      {/* Total */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 800, color: isFirst ? accent : "#333" }}>
                          🪙 {formatCoins(donor.totalSpent)}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em" }}>points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── LIVE TAB (gifts + comments interleaved, TikTok-style) ── */}
        {activeTab === "live" && !isRegistration && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "14px 16px 20px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
            fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
            color: "#888", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {!isRegistration ? (
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#e74c3c",
                display: "inline-block", animation: "pulse-dot 1s infinite",
              }} />
            ) : (
              <MessageCircle size={13} strokeWidth={2.5} />
            )}
            Activité · Commentaires ({comments.length})
          </div>

          {/* Composer — only shown during registration; voting phase types from the sticky bottom bar */}
          {isRegistration && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <MyAvatar user={currentUser} size={30} fontSize={12} iconSize={14} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onFocus={() => { if (!currentUser) onRequestAuth?.(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                  placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                  style={{
                    flex: 1, minWidth: 0, border: "none", borderRadius: 999, background: "#f5f5f5",
                    padding: "10px 16px", fontFamily: "Inter, sans-serif", fontSize: 13,
                    color: "#333", outline: "none",
                  }}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentDraft.trim() || posting}
                  style={{
                    border: "none", borderRadius: 999, background: commentDraft.trim() ? accent : "#eee",
                    color: commentDraft.trim() ? "#fff" : "#bbb",
                    padding: "10px 14px", flexShrink: 0, whiteSpace: "nowrap",
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                    cursor: commentDraft.trim() ? "pointer" : "default",
                  }}
                >
                  Publier
                </button>
              </div>
            </div>
          )}

          {/* Interleaved feed: gifts + comments, newest first */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {commentsLoading ? (
              <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                Chargement…
              </div>
            ) : feedItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                Aucune activité pour le moment. Soyez le premier à commenter !
              </div>
            ) : feedItems.map((item, i) => {
              const isLast = i === feedItems.length - 1;

              if (item.type === "gift") {
                const entry = item.entry;
                return (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: isLast ? "none" : "1px solid #f5f5f5",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        flexShrink: 0, overflow: "hidden",
                        border: i === 0 ? `2px solid ${accent}` : "2px solid #eee",
                      }}>
                        <EntityAvatar url={entry.pAvatarUrl} name={entry.pName || fakeName(entry.pIndex)} />
                      </div>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", fontWeight: 500 }}>
                        <span style={{ fontSize: 14 }}>{entry.gift.icon}</span>{" "}
                        <span style={{ fontWeight: 700, color: accent }}>{entry.gift.name}</span>
                        {" "}envoyé à{" "}
                        <span style={{ color: accent, fontWeight: 700 }}>{entry.pName || fakeName(entry.pIndex)}</span>
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb",
                      fontWeight: 500, flexShrink: 0, marginLeft: 10,
                    }}>{entry.ago}</span>
                  </div>
                );
              }

              const c = item.comment;
              const liked = likedCommentIds.has(c.id);
              const repliesOpen = expandedReplies.has(c.id);
              const isReplying = replyingTo === c.id;
              return (
                <div key={item.key} style={{
                  borderBottom: isLast ? "none" : "1px solid #f0f0f0",
                  padding: "10px 0",
                }}>
                  {/* Main comment */}
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
                          {c.minutesAgo === 0 ? "À l'instant" : `il y a ${fmtCommentTime(c.minutesAgo)}`}
                        </span>
                      </div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#444", lineHeight: 1.4, margin: "0 0 6px" }}>{c.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button onClick={() => handleToggleLike(c.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: liked ? "#e74c3c" : "#aaa" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "#e74c3c" : "none"} stroke={liked ? "#e74c3c" : "#aaa"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          {c.likes + (liked ? 1 : 0)}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyDraft(""); }}
                          style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: isReplying ? accent : "#aaa" }}
                        >
                          Répondre
                        </button>
                        {c.replies?.length > 0 && (
                          <button
                            onClick={() => setExpandedReplies((prev) => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: accent }}
                          >
                            {repliesOpen ? "Masquer" : `${c.replies.length} réponse${c.replies.length > 1 ? "s" : ""}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply input */}
                  {isReplying && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 38 }}>
                      <input
                        autoFocus
                        type="text"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handlePostReply(c.id);
                        }}
                        placeholder={`Répondre à ${c.name}…`}
                        style={{ flex: 1, minWidth: 0, border: "1px solid #e0e0e0", background: "#fafafa", padding: "7px 10px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#333", outline: "none" }}
                      />
                      <button
                        onClick={() => handlePostReply(c.id)}
                        style={{ border: "none", background: accent, color: "#fff", padding: "7px 12px", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center" }}
                      ><Send size={13} /></button>
                    </div>
                  )}


                  {/* Sub-comments */}
                  {repliesOpen && c.replies?.length > 0 && (
                    <div style={{ marginLeft: 38, marginTop: 8, borderLeft: `2px solid #f0f0f0`, paddingLeft: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {c.replies.map((r) => {
                        const rLiked = likedCommentIds.has(r.id);
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
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb" }}>
                                  {r.minutesAgo === 0 ? "À l'instant" : `il y a ${fmtCommentTime(r.minutesAgo)}`}
                                </span>
                              </div>
                              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#555", lineHeight: 1.4, margin: "0 0 4px" }}>{r.text}</p>
                              <button onClick={() => handleToggleLike(r.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: rLiked ? "#e74c3c" : "#bbb" }}>
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
        </div>
        )}

      </div>

      </div>

      {/* ── GIFT TRAY BACKDROP ── */}
      {!isRegistration && showGiftBar && (
        <div
          onClick={() => setShowGiftBar(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* ── GIFT TRAY (slides up, only for voting phase) ── */}
      {!isRegistration && showGiftBar && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: `2px solid ${accent}`,
          zIndex: 1001, padding: "14px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.1)",
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {(giftStep === "gift" || giftStep === "confirm") && (
                  <button
                    onClick={() => {
                      if (giftStep === "confirm") {
                        if (giftConfirmPhase === "pin") {
                          setGiftConfirmPhase("summary");
                          setGiftPin("");
                          setGiftPinError(false);
                          return;
                        }
                        setGiftStep("gift");
                        setSelectedGift(null);
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setGiftPinError(false);
                        return;
                      }
                      setGiftStep("participant");
                      setSelectedParticipant(null);
                    }}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#888", padding: 0, lineHeight: 0, display: "flex", alignItems: "center" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
                  </button>
                )}
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {giftStep === "participant"
                    ? "Choisir un participant"
                    : giftStep === "gift"
                    ? `Cadeau pour ${selectedParticipant?.name}`
                    : giftConfirmPhase === "pin"
                    ? "Code PIN"
                    : "Confirmer le paiement"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>
                  <Wallet size={14} strokeWidth={2.5} color={accent} />
                  {balance.toLocaleString("fr-FR")} HTG
                </span>
                <button
                  onClick={() => {
                    setShowGiftBar(false);
                    setGiftStep("participant");
                    setSelectedParticipant(null);
                    setSelectedGift(null);
                    setGiftConfirmPhase("summary");
                    setGiftPin("");
                    setGiftPinError(false);
                  }}
                  style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", color: "#666", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Step 1 — pick participant */}
            {giftStep === "participant" && (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {giftableParticipants.length === 0 ? (
                  <div style={{ padding: "12px 4px", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa" }}>
                    Aucun participant à qui envoyer un cadeau pour le moment.
                  </div>
                ) : giftableParticipants.slice(0, Math.min(comp.contestants, 15)).map((p) => (
                  <button
                    key={p.id ?? p.index}
                    onClick={() => { setSelectedParticipant(p); setGiftStep("gift"); }}
                    style={{
                      flexShrink: 0, width: 72,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 5,
                      border: "1px solid #ddd",
                      background: "#fff",
                      padding: "8px 4px",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: `2px solid ${accent}22` }}>
                      <EntityAvatar url={p.avatarUrl} name={p.name} />
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, color: "#333", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 64 }}>
                      {p.name.split(" ")[0]}
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: "#aaa" }}>
                      {fmtVotes(p.votes)} pts
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — pick gift */}
            {giftStep === "gift" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  maxHeight: "44vh",
                  overflowY: "auto",
                  paddingBottom: 8,
                  paddingRight: 2,
                }}
              >
                {GIFT_CATALOG.map((gift) => {
                  const price = giftPriceHTG(gift);
                  const affordable = balance >= price;
                  const isSelected = activeGift === gift.id;
                  return (
                    <button
                      key={gift.id}
                      onClick={() => {
                        if (!affordable) { showToast && showToast("Solde insuffisant — rechargez votre portefeuille"); return; }
                        setActiveGift(gift.id);
                        setSelectedGift(gift);
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setGiftPinError(false);
                        setGiftStep("confirm");
                      }}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 4,
                        border: "none",
                        background: isSelected ? `${accent}12` : "transparent",
                        borderRadius: 10,
                        padding: "10px 2px",
                        cursor: affordable ? "pointer" : "default",
                        opacity: affordable ? 1 : 0.35,
                        transition: "background 0.15s, transform 0.15s",
                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                      }}
                    >
                      <div
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 6px ${accent}88)` : "none",
                          transition: "filter 0.15s",
                        }}
                      >
                        <AnimatedGiftIcon emoji={gift.icon} size={44} />
                      </div>
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 800, color: affordable ? accent : "#bbb" }}>
                        {gift.cost.toLocaleString("fr-FR")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3 — confirm cost + pay + PIN */}
            {giftStep === "confirm" && selectedGift && (
              <div style={{ padding: "4px 2px 8px" }}>
                {giftConfirmPhase === "summary" && (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0 18px" }}>
                      <AnimatedGiftIcon emoji={selectedGift.icon} size={72} />
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#666" }}>
                        {selectedGift.name}
                      </span>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>Destinataire</span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>{selectedParticipant?.name}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888" }}>Points</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>{selectedGift.cost.toLocaleString("fr-FR")} pts</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#111" }}>Total à payer</span>
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 800, color: accent }}>
                          {giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setGiftConfirmPhase("pin")}
                      style={{
                        width: "100%", border: "none", borderRadius: 10,
                        background: accent, color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                        padding: "13px 0", cursor: "pointer",
                      }}
                    >
                      Payer {giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG
                    </button>
                  </>
                )}

                {giftConfirmPhase === "pin" && (
                  <>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 14, textAlign: "center" }}>
                      Entrez votre code PIN à 4 chiffres pour confirmer le paiement de{" "}
                      <strong style={{ color: "#111" }}>{giftPriceHTG(selectedGift).toLocaleString("fr-FR")} HTG</strong>.
                    </p>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      autoFocus
                      value={giftPin}
                      onChange={(e) => {
                        setGiftPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                        setGiftPinError(false);
                      }}
                      style={{
                        width: "100%", textAlign: "center", letterSpacing: "0.5em",
                        fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700,
                        border: `1px solid ${giftPinError ? "#E74C3C" : "#ddd"}`,
                        borderRadius: 10, padding: "12px 0", marginBottom: 8,
                        outline: "none",
                      }}
                    />
                    {giftPinError && (
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#E74C3C", textAlign: "center", marginBottom: 8 }}>
                        Code PIN incorrect. Réessayez.
                      </div>
                    )}
                    <button
                      disabled={giftPin.length !== 4 || giftSubmitting}
                      onClick={async () => {
                        if (giftPin.length !== 4) return;
                        if (isCompleted) {
                          setShowGiftBar(false);
                          showToast?.("Cette compétition est terminée — les cadeaux ne sont plus acceptés.");
                          return;
                        }
                        if (giftPin !== WALLET_PIN) {
                          setGiftPinError(true);
                          return;
                        }
                        // Every user must be a real, authenticated account to
                        // send a gift — donateurs are never anonymous.
                        if (!currentUser?.id) {
                          setShowGiftBar(false);
                          onRequestAuth?.();
                          return;
                        }
                        // Contestants can't gift inside their own competition.
                        if (isRegistered) {
                          setShowGiftBar(false);
                          showToast?.("Les participants ne peuvent pas envoyer de cadeaux dans leur propre compétition.");
                          return;
                        }
                        // Belt-and-suspenders: isRegistered can be stale (it's
                        // client-side Set state), so also block outright if the
                        // chosen recipient turns out to be the sender themself.
                        if (selectedParticipant?.userId && selectedParticipant.userId === currentUser.id) {
                          setShowGiftBar(false);
                          showToast?.("Vous ne pouvez pas vous envoyer un cadeau à vous-même.");
                          return;
                        }
                        const gift = selectedGift;
                        setGiftSubmitting(true);

                        const giftId = (typeof crypto !== "undefined" && crypto.randomUUID)
                          ? crypto.randomUUID()
                          : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                        const nowIso = new Date().toISOString();

                        const { error: giftError } = await supabase.from("gifts").insert({
                          id: giftId,
                          competition_id: comp.competitionId,
                          edition_id: comp.id,
                          sender_id: currentUser.id,
                          sender_name: currentUser.fullName,
                          sender_avatar_url: currentUser.avatarUrl || null,
                          recipient_name: selectedParticipant?.name || null,
                          recipient_index: selectedParticipant?.index ?? null,
                          recipient_user_id: selectedParticipant?.userId || null,
                          gift_icon: gift.icon,
                          gift_name: gift.name,
                          gift_cost: gift.cost,
                          price_htg: giftPriceHTG(gift),
                          created_at: nowIso,
                        });
                        if (giftError) {
                          console.error("gift insert error:", giftError);
                          showToast?.("Échec de l'envoi du cadeau. Réessayez.");
                          setGiftSubmitting(false);
                          return;
                        }

                        onSendGift(gift, { ...comp, recipientName: selectedParticipant?.name, priceHTG: giftPriceHTG(gift) });
                        setVoted(true);
                        // Optimistically add the real row to local state — the
                        // realtime subscription will also deliver it (and skip
                        // it as a dupe by id), keeping donateurs consistent
                        // across every device watching this competition.
                        setGiftRows((prev) => (prev.some((r) => r.id === giftId) ? prev : [
                          {
                            id: giftId,
                            competition_id: comp.competitionId,
                            edition_id: comp.id,
                            sender_id: currentUser.id,
                            sender_name: currentUser.fullName,
                            sender_avatar_url: currentUser.avatarUrl || null,
                            recipient_name: selectedParticipant?.name || null,
                            recipient_index: selectedParticipant?.index ?? null,
                            recipient_user_id: selectedParticipant?.userId || null,
                            gift_icon: gift.icon,
                            gift_name: gift.name,
                            gift_cost: gift.cost,
                            price_htg: giftPriceHTG(gift),
                            created_at: nowIso,
                          },
                          ...prev,
                        ]));
                        setGiftSubmitting(false);
                        setShowGiftBar(false);
                        setActiveGift(null);
                        setSelectedGift(null);
                        setGiftStep("participant");
                        setGiftConfirmPhase("summary");
                        setGiftPin("");
                        setSelectedParticipant(null);
                      }}
                      style={{
                        width: "100%", border: "none", borderRadius: 10,
                        background: giftPin.length === 4 && !giftSubmitting ? "#111" : "#ccc",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700,
                        padding: "13px 0",
                        cursor: giftPin.length === 4 && !giftSubmitting ? "pointer" : "not-allowed",
                      }}
                    >
                      {giftSubmitting ? "Traitement..." : "Confirmer le paiement"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DONOR GIFT HISTORY SCREEN ── */}
      {selectedDonor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#F2F2F0", overflowY: "auto" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
            <button
              onClick={() => setSelectedDonor(null)}
              style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <ArrowLeft size={17} strokeWidth={2.5} />
            </button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "2px solid #eee" }}>
              <EntityAvatar url={selectedDonor.avatarUrl} name={selectedDonor.name} bg={selectedDonor.isMe ? "#111" : "#ddd"} color={selectedDonor.isMe ? "#fff" : "#666"} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedDonor.name}
              </span>
              <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999" }}>
                {selectedDonor.giftCount} cadeau{selectedDonor.giftCount > 1 ? "x" : ""} · 🪙 {formatCoins(selectedDonor.totalSpent)} points au total
              </span>
            </div>
          </div>

          <div style={{ padding: "10px 14px 40px", maxWidth: 600, margin: "0 auto" }}>
            {(!selectedDonor.gifts || selectedDonor.gifts.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎁</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bbb" }}>Aucun cadeau enregistré</div>
              </div>
            ) : (() => {
              const sortedGifts = [...selectedDonor.gifts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

              // Group repeats of the same gift into tabs (e.g. "💎 Diamant x3")
              const groupsMap = new Map();
              sortedGifts.forEach((g) => {
                const existing = groupsMap.get(g.name);
                if (existing) {
                  existing.count += 1;
                } else {
                  groupsMap.set(g.name, { name: g.name, icon: g.icon, count: 1 });
                }
              });
              const groups = Array.from(groupsMap.values()).sort((a, b) => b.count - a.count);
              const showTabs = groups.length > 1;

              const filteredGifts = donorTab === "all" ? sortedGifts : sortedGifts.filter((g) => g.name === donorTab);

              return (
                <>
                  {showTabs && (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                      <button
                        onClick={() => setDonorTab("all")}
                        style={{
                          flexShrink: 0, border: "none", borderRadius: 999,
                          padding: "7px 16px",
                          background: donorTab === "all" ? "#111" : "#f0f0f0",
                          color: donorTab === "all" ? "#fff" : "#666",
                          fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", whiteSpace: "nowrap",
                        }}
                      >
                        Tous ({sortedGifts.length})
                      </button>
                      {groups.map((grp) => (
                        <button
                          key={grp.name}
                          onClick={() => setDonorTab(grp.name)}
                          style={{
                            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
                            border: "none", borderRadius: 999,
                            padding: "6px 14px",
                            background: donorTab === grp.name ? "#111" : "#f0f0f0",
                            color: donorTab === grp.name ? "#fff" : "#666",
                            fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 800,
                            cursor: "pointer", whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{grp.icon}</span>
                          × {grp.count}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {filteredGifts.map((g, i) => (
                      <div
                        key={g.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "13px 4px",
                          borderBottom: i === filteredGifts.length - 1 ? "none" : "1px solid #ececec",
                        }}
                      >
                        <div style={{ flexShrink: 0 }}>
                          <AnimatedGiftIcon emoji={g.icon} size={26} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, fontWeight: 600, color: "#1a1a1a" }}>{g.name}</div>
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10.5, color: "#aaa", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {g.recipientName ? `À ${g.recipientName} · ` : ""}{fmtAgoFr(Math.max(0, Math.floor((Date.now() - (g.timestamp || Date.now())) / 60000)))}
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {g.cost.toLocaleString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── STICKY FOOTER CTA ── */}
      {!showGiftBar && (
      <div style={{
        position: "fixed", bottom: isRegistration ? 8 : 0, left: isRegistration ? 8 : 0, right: isRegistration ? 8 : 0,
        background: "#fff",
        borderTop: isRegistration ? "none" : "1px solid #eee",
        borderRadius: isRegistration ? 20 : 0,
        boxShadow: isRegistration ? "0 -2px 24px rgba(0,0,0,0.15)" : "0 -2px 16px rgba(0,0,0,0.06)",
        padding: isRegistration ? "10px 12px" : "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
        zIndex: 1001,
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {isRegistration ? (
            isOwnCompetition ? (
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 999,
                  background: "#f2f2f2",
                  color: "#333",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "13px 16px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <BadgeCheck size={15} strokeWidth={2.5} />
                Modifier ma compétition
              </button>
            ) : isRegistered ? (
              <div
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 999,
                  background: "#e8f8f3",
                  color: "#00875A",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "13px 16px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Check size={15} strokeWidth={2.5} />
                Vous êtes inscrit
              </div>
            ) : (
            // Registration footer
            <button
              onClick={() => {
                onRegister?.(comp);
                onClose();
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                background: "#6C63FF",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "13px 16px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(108,99,255,0.35)",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              S'inscrire maintenant
            </button>
            )
          ) : (
            // Voting footer — comment input with sticker + gift embedded, swapping to a send icon while typing
            (() => {
              const isTyping = commentDraft.trim().length > 0;
              // Admins/organizers manage their own competition, they don't send themselves gifts —
              // so the gift button is swapped out for an edit entry point instead.
              const showGiftOption = !isOwnCompetition && !isRegistered;
              return (
                <>
                  <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                    <input
                      type="text"
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      onFocus={() => { if (!currentUser) onRequestAuth?.(); }}
                      onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                      placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                      style={{
                        width: "100%", minWidth: 0, border: "1px solid #ececec", borderRadius: 999,
                        background: "#f5f5f5",
                        padding: isTyping ? "11px 52px 11px 16px" : (showGiftOption ? "11px 90px 11px 16px" : "11px 52px 11px 16px"),
                        fontFamily: "Inter, sans-serif", fontSize: 13,
                        color: "#111", outline: "none",
                        transition: "padding 0.15s",
                      }}
                    />

                    {isTyping ? (
                      /* Send button — replaces sticker + gift while typing */
                      <button
                        onClick={handlePostComment}
                        style={{
                          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                          width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                          border: "none", background: accent,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Send size={15} color="#fff" strokeWidth={2.2} />
                      </button>
                    ) : (
                      <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Sticker button */}
                        <button
                          title="Autocollants"
                          style={{
                            width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                            border: "none", background: "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Sticker size={17} color="#888" strokeWidth={2} />
                        </button>

                        {/* Gift button — hidden for the organizer/admin of this competition */}
                        {showGiftOption && (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                onRequestAuth?.();
                                return;
                              }
                              setShowGiftBar((v) => {
                                if (v) {
                                  setGiftStep("participant");
                                  setSelectedParticipant(null);
                                  setSelectedGift(null);
                                  setGiftConfirmPhase("summary");
                                  setGiftPin("");
                                  setGiftPinError(false);
                                }
                                return !v;
                              });
                            }}
                            style={{
                              width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                              border: "none", background: showGiftBar ? `${accent}18` : "transparent",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Gift size={17} color={accent} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit button — lives outside the input, replacing the gift entry point for the organizer/admin */}
                  {isOwnCompetition && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      title="Modifier la compétition"
                      style={{
                        width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
                        border: "none", background: `${accent}18`,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Pencil size={17} color={accent} strokeWidth={2.3} />
                    </button>
                  )}
                </>
              );
            })()
          )}
        </div>
      </div>
      )}

      {/* ── FLOATING LIVE COMMENTARY BUTTON ── */}
      {/* TEST STREAM: using SomaFM's free, freely-streamable "Groove Salad"
          Icecast/MP3 feed as a stand-in so playback can actually be tested.
          Swap the src for your real commentary stream when one exists. */}
      {showCommentaryBand && (
        <div
          style={{
            position: "fixed",
            right: 14,
            bottom: (isRegistration ? 8 : 0) + 78,
            zIndex: 1050,
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6,
          }}
        >
          <audio ref={commentaryAudioRef} src="https://ice1.somafm.com/groovesalad-128-mp3" loop muted preload="auto" playsInline style={{ display: "none" }} />

          {commentarySheetOpen && (
            <CommentaryStreamSheet
              comp={comp}
              commentator={commentator}
              coSpeakers={coSpeakers}
              accent={accent}
              muted={commentaryMuted}
              onToggleMute={toggleCommentaryMute}
              onClose={() => setCommentarySheetOpen(false)}
            />
          )}

          <button
            onClick={openCommentaryRoom}
            aria-label="Voir le chroniqueur en direct"
            style={{
              width: 54, height: 54, borderRadius: "50%",
              border: "none", background: accent, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              position: "relative",
            }}
          >
            <AudioBarsLoader
              height="22"
              width="22"
              color="#fff"
              ariaLabel="commentaire-audio-en-cours"
              visible={true}
            />
            <span style={{
              position: "absolute", top: -2, right: -2,
              width: 12, height: 12, borderRadius: "50%",
              background: "#e74c3c", border: "2px solid #fff",
              animation: "pulse-dot 1.2s infinite",
            }} />
          </button>

        </div>
      )}

      {showAll && (
        <ParticipantListOverlay comp={comp} onClose={() => setShowAll(false)} />
      )}

      {showAllAlbums && (
        <AlbumGridOverlay
          items={approvedUploads.filter((u) => u.uploader_id !== currentUser?.id)}
          onClose={() => setShowAllAlbums(false)}
          onOpenItem={(item) => setMediaLightbox(item)}
        />
      )}

      {showAllRegistrants && (
        <RegistrantListOverlay
          comp={comp}
          registrants={registrants}
          accent={accent}
          onClose={() => setShowAllRegistrants(false)}
          canRemove={canRemoveParticipants}
          onRemove={handleRemoveParticipant}
          removingRegistrantId={removingRegistrantId}
        />
      )}

      {albumSheet && (
        <AlbumSheet
          accent={accent}
          uploads={myUploads}
          uploading={uploadingMedia}
          onUpload={addOwnUpload}
          onClose={() => setAlbumSheet(null)}
        />
      )}

      {mediaLightbox && (
        <MediaLightbox item={mediaLightbox} onClose={() => setMediaLightbox(null)} />
      )}

      {showEditModal && (
        <div style={{
          position: "fixed", inset: 0, background: "#fff",
          zIndex: 2000, display: "flex", flexDirection: "column",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 16px", borderBottom: "1px solid #eee", flexShrink: 0,
          }}>
            <button onClick={() => setShowEditModal(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} color="#333" />
            </button>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#111" }}>
              Modifier la compétition
            </span>
            <button onClick={() => setShowEditModal(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              <X size={18} color="#999" />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20, paddingBottom: 100 }}>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Titre</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Édition</label>
            <input
              type="text"
              value={editEdition}
              onChange={(e) => setEditEdition(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>État</label>
            {/* Phase is never admin-editable — it's derived entirely from the
                registration countdown + fill rate, the same way "completed" is
                derived from the live countdown. An organizer picking "En direct"
                by hand could put a competition live with an empty roster, or
                stall a full one in "Inscriptions" past its deadline, so the
                toggle that used to sit here has been replaced with a read-only
                status. See `open_expired_registrations` (pg_cron, paired with
                `close_expired_competitions`) for the actual transition logic:
                once the registration deadline passes, it flips to "live" if
                every place is taken, otherwise it pushes endsAt out by 24h and
                leaves the competition open for registration. */}
            {isCompleted ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #eee", background: "#f7f7f7", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#999" }}>
                🏆 Terminée — archivée dans l'historique, l'état ne peut plus être modifié
              </div>
            ) : (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, border: "1px solid #eee",
                  background: "#f7f7f7", borderRadius: 10, padding: "10px 12px", marginBottom: 6,
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                  color: isRegistration ? "#888" : "#00B894",
                }}>
                  {isRegistration ? "🕒 Inscriptions" : "● En direct"}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14, lineHeight: 1.4 }}>
                  {isRegistration
                    ? "Passe automatiquement en direct dès que le compte à rebours se termine, si toutes les places sont prises. Sinon, les inscriptions sont prolongées de 24h."
                    : "Basée sur le minuteur — non modifiable manuellement."}
                </div>
              </>
            )}

            {!isCompleted && (
            <>
            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Durée de la compétition</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const end = new Date(Date.now() + p.ms);
                    setEditEndsAt(toDatetimeLocal(end.toISOString()));
                    setEditEnds(p.label);
                  }}
                  style={{
                    border: editEnds === p.label ? "1px solid #111" : "1px solid #e0e0e0",
                    background: editEnds === p.label ? "#111" : "#fff",
                    color: editEnds === p.label ? "#fff" : "#555",
                    borderRadius: 999,
                    padding: "7px 13px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {p.display}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              Choisissez une durée à partir de maintenant — le vrai compte à rebours et la date de fin ci-dessous se réglent automatiquement.
            </div>

            <details style={{ marginBottom: 14 }}>
              <summary style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer", marginBottom: 8 }}>
                Ou choisir une date et heure précises
              </summary>
              <div style={{ marginTop: 10 }}>
                <input
                  type="datetime-local"
                  value={editEndsAt}
                  onChange={(e) => { setEditEndsAt(e.target.value); setEditEnds(""); }}
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
                />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
                  Pilote le vrai compte à rebours. Laissez vide pour désactiver le compte à rebours réel.
                </div>
              </div>
            </details>
            </>
            )}

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Places disponibles</label>
            <input
              type="number"
              min="0"
              value={editContestants}
              onChange={(e) => setEditContestants(e.target.value)}
              placeholder="ex: 20"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Frais d'inscription (gourdes)</label>
            <input
              type="number"
              min="0"
              value={editFee}
              onChange={(e) => setEditFee(e.target.value)}
              placeholder="ex: 100"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Décrivez la compétition, son format et son déroulement…"
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14, resize: "vertical" }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Prix garanti (crédits)</label>
            <input
              type="number"
              min="0"
              value={editPrizeAmount}
              onChange={(e) => setEditPrizeAmount(e.target.value)}
              placeholder="ex: 500"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 4 }}
            />
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 14 }}>
              Laissez vide pour ne définir aucun prix garanti.
            </div>

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Récompense additionnelle</label>
            <input
              type="text"
              value={editRewardExtra}
              onChange={(e) => setEditRewardExtra(e.target.value)}
              placeholder="ex: Trophée officiel et mise en avant"
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 14 }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Règlement (une règle par ligne)</label>
            <textarea
              value={editRules}
              onChange={(e) => setEditRules(e.target.value)}
              placeholder={"ex:\nInscription ouverte à tous.\nChaque participant doit soumettre…"}
              rows={6}
              style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 14, color: "#333", outline: "none", marginBottom: 18, resize: "vertical" }}
            />

            <label style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Galerie / miniatures</label>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              Touchez <strong>Bannière</strong> sur une image pour en faire celle affichée sur la carte de la compétition et dans le carrousel de la page d'accueil.
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              marginBottom: 18,
            }}>
              {images.map((img) => {
                const isBanner = editBannerUrl === img.url;
                return (
                  <div key={img.id} style={{
                    position: "relative", width: "100%", aspectRatio: "1 / 1",
                    borderRadius: 10, overflow: "hidden", background: "#f5f5f5",
                    boxShadow: isBanner ? `0 0 0 2px ${accent}` : "none",
                  }}>
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                      onClick={() => handleRemoveImage(img.id)}
                      disabled={removingImageId === img.id}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 20, height: 20, borderRadius: "50%",
                        border: "none", background: "rgba(0,0,0,0.55)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", padding: 0,
                      }}
                    >
                      {removingImageId === img.id ? (
                        <span style={{ fontSize: 9 }}>…</span>
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => handleSetBanner(img.url)}
                      style={{
                        position: "absolute", bottom: 4, left: 4, right: 4,
                        border: "none", borderRadius: 6,
                        background: isBanner ? accent : "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        padding: "4px 0",
                        cursor: "pointer",
                      }}
                    >
                      {isBanner ? "★ Bannière" : "Bannière"}
                    </button>
                  </div>
                );
              })}

              {/* Add wrapper — always the last tile in the grid */}
              <label style={{
                width: "100%", aspectRatio: "1 / 1", borderRadius: 10,
                border: "1.5px dashed #ccc", background: "#fafafa",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: uploadingImage ? "default" : "pointer",
              }}>
                <input type="file" accept="image/*" onChange={handleAddImageFile} disabled={uploadingImage} style={{ display: "none" }} />
                {uploadingImage ? (
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#999" }}>Envoi…</span>
                ) : (
                  <Plus size={22} color="#aaa" />
                )}
              </label>
            </div>
          </div>

          <div style={{
            display: "flex", gap: 10, padding: 16,
            borderTop: "1px solid #eee", flexShrink: 0,
            background: "#fff",
          }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ flex: 1, border: "1px solid #e0e0e0", background: "#fff", color: "#555", borderRadius: 999, padding: "12px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editTitle.trim()}
              style={{ flex: 1, border: "none", background: accent, color: "#fff", borderRadius: 999, padding: "12px 16px", fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", cursor: savingEdit ? "default" : "pointer", opacity: savingEdit ? 0.7 : 1 }}
            >
              {savingEdit ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NICHE ROW ─────────────────────────────────────────────────────────── */

function NicheRow({ niche, onOpen, onRegister, registeredCompIds, currentUser }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function checkScroll() {
    const el = railRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function scroll(dir) {
    railRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <section style={{ marginBottom: 0, borderBottom: "2px solid #e0e0e0", paddingBottom: 8, paddingTop: 8 }}>
      {/* Row header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 2,
        }}
      >
        {(() => { const Icon = NICHE_ICONS[niche.label]; return Icon ? <Icon size={16} strokeWidth={2.5} color={niche.accent} style={{ flexShrink: 0 }} /> : null; })()}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#333",
            letterSpacing: "-0.01em",
          }}
        >
          {niche.label}
        </span>

        <button
          style={{
            marginLeft: "auto",
            border: "none",
            background: "none",
            color: "#333",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: 0,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#333"; }}
        >
          Voir tout
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter"/>
          </svg>
        </button>
      </div>

      {/* Horizontal scroll rail */}
      <div
        ref={railRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {niche.competitions.map((comp) => (
          <CompCard key={comp.id} comp={comp} accent={niche.accent} onOpen={onOpen} onRegister={onRegister} isRegistered={registeredCompIds?.has(comp.id)} isOwnCompetition={currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE} />
        ))}

      </div>
    </section>
  );
}

/* ─── WALLET PAGE ───────────────────────────────────────────────────────── */

const DEPOSIT_METHODS = PAYMENT_METHODS.filter((m) => m.id === "moncash" || m.id === "natcash");

function DepositModal({ onClose, onDeposit, lastMethod }) {
  const [method, setMethod] = useState(lastMethod || "moncash");
  const [copied, setCopied] = useState(false);

  const phoneNumber = MOBILE_MONEY_NUMBERS[method].number;
  const accountName = MOBILE_MONEY_NUMBERS[method].name;
  const currentMethod = PAYMENT_METHODS.find((m) => m.id === method);
  const methodLabel = currentMethod?.label;
  const accentColor = currentMethod?.accent ?? "#111";

  function handleCopy() {
    navigator.clipboard?.writeText(phoneNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onDeposit(method);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderTop: "2px solid #111",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Déposer des fonds
          </span>
          <button onClick={handleClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <>
          {/* Method tabs */}
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Méthode de paiement
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {DEPOSIT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      border: `1px solid ${active ? "#111" : "#ddd"}`,
                      background: active ? "#111" : "#fff",
                      color: active ? "#fff" : "#333",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "10px 6px",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: m.accent,
                        color: "#fff",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {m.label.charAt(0)}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Account details */}
            <div
              style={{
                border: "2px solid #111",
                borderLeft: `5px solid ${accentColor}`,
                background: "#f7f7f5",
                marginBottom: 12,
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #ddd" }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, marginBottom: 6 }}>
                  Nom
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#111" }}>
                  {accountName}
                </div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, marginBottom: 6 }}>
                    Numéro {methodLabel}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: "#111" }}>
                    {phoneNumber}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  aria-label="Copier le numéro"
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    border: `1px solid ${accentColor}`,
                    background: copied ? accentColor : "#fff",
                    color: copied ? "#fff" : accentColor,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#C0392B", lineHeight: 1.5, marginBottom: 4 }}>
              ⚠ Envoyez uniquement à partir du numéro {methodLabel} enregistré sur votre compte.
            </div>
          </>
      </div>
    </div>
  );
}

const WALLET_PIN = "1234"; // demo PIN

function WithdrawModal({ balance, onClose, onWithdraw }) {
  const [amountStr, setAmountStr] = useState("");
  const [method, setMethod] = useState("moncash");
  const [step, setStep] = useState("form"); // "form" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const amount = parseInt(amountStr, 10) || 0;
  const canSubmit = amount > 0 && amount <= balance;
  const methodLabel = PAYMENT_METHODS.find((m) => m.id === method)?.label;

  function handlePinChange(v) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setPinError(false);
  }

  function handleConfirm() {
    if (pin.length !== 4) return;
    if (pin !== WALLET_PIN) {
      setPinError(true);
      return;
    }
    onWithdraw(amount, methodLabel);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(17,17,17,0.5)",
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
          background: "#fff",
          borderTop: "2px solid #111",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #e0e0e0" }}>
          {step === "pin" && (
            <button onClick={() => { setStep("form"); setPin(""); setPinError(false); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 0, lineHeight: 0 }}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <span style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            {step === "form" ? "Retirer des fonds" : "Confirmer le retrait"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#333", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Solde disponible : {balance.toLocaleString("fr-FR")} HTG
            </div>

            <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", padding: "12px 14px", marginBottom: 12 }}>
              <input
                type="number"
                min="1"
                max={balance}
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#333",
                  minWidth: 0,
                }}
              />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", fontWeight: 600 }}>HTG</span>
              <button
                onClick={() => setAmountStr(String(balance))}
                style={{ marginLeft: 10, border: "1px solid #ddd", background: "#fff", color: "#333", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "6px 10px", cursor: "pointer" }}
              >
                Max
              </button>
            </div>
            {amount > balance && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#e74c3c", fontWeight: 600, marginBottom: 12 }}>
                Le montant dépasse votre solde disponible.
              </div>
            )}

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Destination
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1,
                      border: `1px solid ${active ? "#111" : "#ddd"}`,
                      background: active ? "#111" : "#fff",
                      color: active ? "#fff" : "#333",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "10px 6px",
                      cursor: "pointer",
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", lineHeight: 1.5, marginBottom: 16 }}>
              Les retraits sont traités vers votre compte {methodLabel} sous 24h maximum.
            </div>

            <button
              onClick={() => canSubmit && setStep("pin")}
              disabled={!canSubmit}
              style={{
                width: "100%",
                border: "none",
                background: canSubmit ? "#111" : "#ccc",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "14px 20px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
              Retirer — {amount.toLocaleString("fr-FR")} HTG
            </button>
          </>
        )}

        {step === "pin" && (
          <>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888", lineHeight: 1.5, marginBottom: 20 }}>
              Entrez votre code PIN à 4 chiffres pour confirmer le retrait de <strong>{amount.toLocaleString("fr-FR")} HTG</strong> vers {methodLabel}.
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
                border: `1px solid ${pinError ? "#E74C3C" : "#ddd"}`,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.4em",
                textAlign: "center",
                color: "#333",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={pin.length !== 4}
              style={{
                width: "100%",
                border: "none",
                background: pin.length === 4 ? "#111" : "#ccc",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "14px 20px",
                cursor: pin.length === 4 ? "pointer" : "not-allowed",
                marginTop: 12,
              }}
            >
              Confirmer le retrait
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Note: the Google button below calls supabase.auth.signInWithOAuth, which
// requires the Google provider to be enabled (with a client ID/secret) under
// Authentication → Providers in the Supabase dashboard, and the app's URL
// added to the allowed redirect list. See the setup steps in competitionData.js.
function AuthOverlay({ onClose, onAuthenticated, compTitle, followIntent }) {
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
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "12px 12px 12px 40px",
    fontFamily: "Inter, sans-serif", fontSize: 14,
    background: "#fafafa", color: "#333",
    boxSizing: "border-box",
    outline: "none",
  };
  const labelStyle = {
    fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
    color: "#888", textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 6,
  };
  const fieldIconStyle = { position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb", pointerEvents: "none" };

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
          background: "#fff",
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
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#e0e0e0" }} />
        </div>

        {mode === "reset" && (
          <button
            onClick={() => switchMode("login")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, marginBottom: 10, display: "flex", alignItems: "center", gap: 6, color: "#888" }}
          >
            <ArrowLeft size={16} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>Retour</span>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.01em" }}>
            {mode === "login" ? "Connexion requise" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", cursor: "pointer", color: "#333", padding: 8, borderRadius: "50%", display: "flex", lineHeight: 0 }}>
            <X size={16} />
          </button>
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#888", display: "block", marginBottom: 20, lineHeight: 1.5 }}>
          {mode === "reset"
            ? "Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe."
            : compTitle ? `Connectez-vous pour vous inscrire à ${compTitle}.`
            : followIntent ? `Connectez-vous pour suivre ${followIntent}.`
            : "Connectez-vous pour accéder à votre compte."}
        </span>

        {mode !== "reset" && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f2f2f0", borderRadius: 999, padding: 4 }}>
            <button
              onClick={() => switchMode("login")}
              style={{
                flex: 1, border: "none", borderRadius: 999,
                background: mode === "login" ? "#111" : "transparent",
                color: mode === "login" ? "#fff" : "#888",
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
                background: mode === "signup" ? "#111" : "transparent",
                color: mode === "signup" ? "#fff" : "#888",
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
                    style={{ border: "none", background: "none", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: "#6C63FF" }}
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
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#bbb", padding: 4, display: "flex" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === "signup" && (
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", marginTop: 5, display: "block" }}>
                  Au moins 6 caractères.
                </span>
              )}
            </div>
          )}

          {info && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#00B894", background: "#f0fbf7", border: "1px solid #b8edd9", borderRadius: 10, padding: "8px 10px" }}>
              {info}
            </span>
          )}
          {error && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", background: "#fff0ed", border: "1px solid #ffcfc7", borderRadius: 10, padding: "8px 10px" }}>
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
            background: "#111",
            color: "#fff",
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
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" }}>ou continuer avec</span>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
            </div>

            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthProvider}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                border: "1px solid #e0e0e0", borderRadius: 999, background: "#fff",
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
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#333" }}>
                {oauthProvider === "google" ? "Redirection…" : "Continuer avec Google"}
              </span>
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ccc", letterSpacing: "0.02em" }}>
            Propulsé par <span style={{ fontWeight: 700, color: "#999" }}>Mima</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({ comp, onClose, onRegister, showToast, currentUser, balance, onOpenBuy }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const fee = getRegistrationFee(comp);
  const canAfford = balance >= fee;

  function handleContinue() {
    if (!canAfford) {
      showToast("Gourdes insuffisantes pour l'inscription");
      onOpenBuy?.();
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
    const result = await onRegister(comp, fee);
    setIsSubmitting(false);

    if (!result?.success) {
      setRegisterError(result?.error || "Une erreur est survenue. Réessayez.");
      return;
    }

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
            background: "#fff",
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
            color: "#111", display: "block", marginBottom: 8, letterSpacing: "-0.01em",
          }}>
            Inscription confirmée !
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: "#888",
            display: "block", lineHeight: 1.6,
          }}>
            Vous êtes inscrit à <strong style={{ color: "#333" }}>{comp.title}</strong>. Attendez le début de la compétition pour participer.
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
          background: "#fff",
          padding: "10px 18px 20px",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e3e3e3" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          {step === "pin" && (
            <button onClick={() => { setStep("form"); setPin(""); setPinError(false); }} style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#111", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              S'inscrire à {comp.title}
            </span>
            <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500 }}>
              {comp.edition} · {comp.registeredCount}/{comp.contestants} inscrits
            </span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f5f5f5", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#333", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {step === "form" && (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#fafafa" }}>
              <MyAvatar user={currentUser} size={34} fontSize={13} iconSize={16} loggedBg="#6C63FF" />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>{currentUser.fullName}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</span>
              </div>
            </div>
          )}

          {/* Receipt-style fee summary */}
          <div style={{
            borderRadius: 14,
            border: `1px solid ${canAfford ? "#eee" : "#f5c6c6"}`,
            background: canAfford ? "#fafafa" : "#fdf2f2",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                Frais d'inscription
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#111" }}>
                {fee} <span style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>gourdes</span>
              </span>
            </div>
            <div style={{ borderTop: `1px dashed ${canAfford ? "#e0e0e0" : "#f0c4c4"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", fontWeight: 600 }}>
                Votre solde
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: canAfford ? "#333" : "#E74C3C" }}>
                {balance.toLocaleString("fr-FR")} gourdes
              </span>
            </div>
          </div>

          {!canAfford && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", padding: "0 2px" }}>
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
            background: canAfford ? "#6C63FF" : "#111",
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

        {step === "pin" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#f0ebff", color: "#6C63FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <BadgeCheck size={22} strokeWidth={2.25} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888", lineHeight: 1.6 }}>
                Entrez votre code PIN pour confirmer le paiement de<br />
                <strong style={{ color: "#333" }}>{fee} gourdes</strong> pour {comp.title}.
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
                border: `1.5px solid ${pinError ? "#E74C3C" : "#e3e3e3"}`,
                borderRadius: 14,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.5em",
                textAlign: "center",
                color: "#111",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}
            {registerError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#E74C3C", fontWeight: 600, marginBottom: 12 }}>
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
                background: isSubmitting ? "#ddd" : pin.length === 4 ? "#6C63FF" : "#e8e8e8",
                color: pin.length === 4 || isSubmitting ? "#fff" : "#aaa",
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

const TX_VISUALS = {
  deposit:            { icon: ArrowDownLeft, color: "#00B894", bg: "#f0fbf7" },
  withdrawal:         { icon: ArrowUpRight, color: "#E17055", bg: "#fff4f0" },
  gift_sent:          { icon: Gift, color: "#6C63FF", bg: "#f0ebff" },
  competition_prize:  { icon: Trophy, color: "#FDCB6E", bg: "#fffaf0" },
};

function txReference(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `TXN-${code}`;
}

function TransactionRow({ tx, isLast, showToast }) {
  const isCredit = tx.amount != null ? tx.amount > 0 : tx.type === "deposit";
  const visual = TX_VISUALS[tx.type] || { icon: ArrowUpRight, color: "#888", bg: "#f7f7f5" };
  const Icon = visual.icon;
  const time = tx.date.includes(",") ? tx.date.split(",").slice(1).join(",").trim() : tx.date;
  const reference = txReference(tx.id);

  function copyReference(e) {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference).catch(() => {});
    }
    showToast && showToast("Référence copiée");
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          border: `1px solid ${visual.color}33`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: visual.bg,
        }}
      >
        <Icon size={15} color={visual.color} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.label}
        </span>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
          <span>{time}</span>
          <span style={{ color: "#ddd" }}>·</span>
          <span
            onClick={copyReference}
            title="Copier la référence"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              color: "#bbb",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {reference}
            <Copy size={10} strokeWidth={2} />
          </span>
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: isCredit ? "#00B894" : tx.type === "withdrawal" ? "#FF5252" : "#333",
          flexShrink: 0,
        }}
      >
        {isCredit ? "+" : ""}{tx.amount.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}

function MyCompetitionsPage({ registeredEntries, followedEntries, onOpen }) {
  const [activeSection, setActiveSection] = useState("inscrit");

  const entries = activeSection === "inscrit" ? registeredEntries : followedEntries;

  function CompRow({ comp, niche, badge }) {
    return (
      <div
        onClick={() => onOpen({ ...comp, accent: niche.accent, niche: niche.label })}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          border: "1px solid #e0e0e0", background: "#fff",
          padding: "12px 14px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 44, height: 44, flexShrink: 0, overflow: "hidden",
          border: `2px solid ${niche.accent}`,
          background: "#eee", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {(comp.bannerUrl || comp.images?.[0]?.url) ? (
            <img src={comp.bannerUrl || comp.images[0].url} alt={comp.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <ImageIcon size={16} color="#ccc" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {comp.title}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
            {niche.label} · {comp.edition}
            {comp.phase === "registration" && (
              <span style={{ color: "#6C63FF", fontWeight: 600 }}> · {comp.registeredCount}/{comp.contestants} inscrits</span>
            )}
          </span>
        </div>
        {badge}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ padding: "16px 16px 0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Mes compétitions
          </span>
        </div>
        {/* Section tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #f0f0f0", marginTop: 12 }}>
          {[
            { id: "inscrit", label: "Inscrit", count: registeredEntries.length },
            { id: "suivi", label: "Suivi", count: followedEntries.length },
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "none",
                  borderBottom: isActive ? "2px solid #111" : "2px solid transparent",
                  padding: "10px 0",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#111" : "#aaa",
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "color 0.15s, border-color 0.15s",
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                    background: isActive ? "#111" : "#e0e0e0",
                    color: isActive ? "#fff" : "#888",
                    padding: "1px 6px",
                    minWidth: 18, textAlign: "center",
                    transition: "background 0.15s, color 0.15s",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", marginBottom: 8 }}>
              {activeSection === "inscrit" ? "Aucune inscription" : "Aucun suivi"}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
              {activeSection === "inscrit"
                ? "Inscrivez-vous à une compétition pour la voir apparaître ici."
                : "Suivez une compétition depuis sa fiche pour surveiller les inscriptions sans vous engager."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map(({ comp, niche }) => (
              <CompRow
                key={comp.id}
                comp={comp}
                niche={niche}
                badge={
                  activeSection === "inscrit" ? (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "#00875A", background: "#e8f8f3", border: "1px solid #c8ede1",
                      padding: "4px 8px",
                    }}>
                      <Check size={11} strokeWidth={2.5} />
                      Inscrit
                    </div>
                  ) : (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: "#6C63FF", background: "#f0ebff", border: "1px solid #d5c8ff",
                      padding: "4px 8px",
                    }}>
                      Suivi
                    </div>
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountPage({ currentUser, balance, onOpenWallet, onLoginRequest, onLogout, onOpenAdmin, onUpdateFullName, onUpdateAvatar, showToast }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  function startEditingName() {
    setNameDraft(currentUser?.fullName || "");
    setEditingName(true);
  }

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === currentUser?.fullName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onUpdateFullName?.(trimmed);
      showToast?.("Nom mis à jour");
      setEditingName(false);
    } catch (err) {
      showToast?.(err?.message || "Échec de la mise à jour du nom.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await onUpdateAvatar?.(file);
      showToast?.("Photo de profil mise à jour");
    } catch (err) {
      showToast?.(err?.message || "Échec de la mise à jour de la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 16px",
        }}
      >
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
          Compte
        </span>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Identity block */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 4px", marginBottom: 16 }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <button
              onClick={() => { if (!currentUser) { onLoginRequest?.(); return; } avatarInputRef.current?.click(); }}
              disabled={uploadingAvatar}
              title={currentUser ? "Changer la photo de profil" : "Se connecter"}
              style={{
                border: "none", padding: 0, cursor: "pointer", background: "none",
                width: 56, height: 56, borderRadius: "50%", display: "block",
                opacity: uploadingAvatar ? 0.5 : 1,
              }}
            >
              <MyAvatar user={currentUser} size={56} fontSize={22} iconSize={24} />
            </button>
            {currentUser && (
              <div
                aria-hidden="true"
                style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#6C63FF", border: "2px solid #F2F2F0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Pencil size={10} strokeWidth={2.5} color="#fff" />
              </div>
            )}
            {currentUser && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                style={{ display: "none" }}
              />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0, flex: 1 }}>
            {currentUser && editingName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  autoFocus
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  disabled={savingName}
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#333",
                    border: "none", borderBottom: "2px solid #111", outline: "none",
                    padding: "0 0 2px", minWidth: 0, flex: 1, background: "transparent",
                  }}
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  style={{ border: "none", background: "none", padding: 4, cursor: "pointer", color: "#27ae60", flexShrink: 0 }}
                >
                  <Check size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  disabled={savingName}
                  style={{ border: "none", background: "none", padding: 4, cursor: "pointer", color: "#999", flexShrink: 0 }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser ? currentUser.fullName : "Non connecté"}
                </span>
                {currentUser && (
                  <button
                    onClick={startEditingName}
                    title="Modifier le nom"
                    style={{ border: "none", background: "none", padding: 2, cursor: "pointer", color: "#aaa", flexShrink: 0, display: "flex", alignItems: "center" }}
                  >
                    <Pencil size={14} strokeWidth={2.3} />
                  </button>
                )}
              </span>
            )}
            {currentUser ? (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </span>
            ) : (
              <button
                onClick={onLoginRequest}
                style={{ border: "none", background: "none", padding: 0, marginTop: 2, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6C63FF", fontWeight: 700 }}
              >
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Admin entry point — only ever rendered for the platform organizer */}
        {currentUser?.isOrganizer && (
          <button
            onClick={onOpenAdmin}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #6C63FF", background: "#f0ebff", color: "#6C63FF",
              padding: "14px 16px", marginBottom: 12, cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BadgeCheck size={18} strokeWidth={2.5} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
                Panneau d'administration
              </span>
            </div>
            <ChevronRight size={16} />
          </button>
        )}

        {/* Credits chip — drills into wallet */}
        <button
          onClick={onOpenWallet}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: "1px solid #111", background: "#111", color: "#fff",
            padding: "14px 16px", marginBottom: 24, cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={18} strokeWidth={2.5} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
              {balance.toLocaleString("fr-FR")} crédits
            </span>
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
            Gérer <ChevronRight size={11} style={{ display: "inline" }} />
          </span>
        </button>

        {/* Other account links — placeholders for future screens */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid #e0e0e0", background: "#fff" }}>
          {[
            { label: "Compétitions suivies", icon: BadgeCheck },
            { label: "Paramètres", icon: User },
            { label: "Aide & support", icon: Bell },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 14px", borderBottom: "1px solid #f0f0f0",
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#333",
              }}
            >
              <item.icon size={16} strokeWidth={2} color="#888" />
              {item.label}
            </div>
          ))}
          {currentUser && (
            <button
              onClick={onLogout}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 14px", border: "none", background: "none", width: "100%", textAlign: "left",
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#FF5252", cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} strokeWidth={2} color="#FF5252" />
              Se déconnecter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN PAGE ────────────────────────────────────────────────────────
   Only ever rendered for the platform organizer (yonetoussaint25@gmail.com,
   gated both by the entry point in AccountPage and by the isOrganizer check
   where this is mounted in App()). Lists every competition across every
   niche in one place so nothing needs to be found by browsing the homepage
   first — tapping a row jumps straight into that competition's edit panel. */
function AdminPage({ niches, seedCompetitions, onOpenComp, onToggleActive, onCreateEdition, onPublishEdition, onDeleteEdition, onBack }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Total");
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  async function handlePublishClick(comp) {
    setPublishingId(comp.id);
    await onPublishEdition(comp);
    setPublishingId(null);
  }

  async function handleDeleteClick(comp) {
    if (!window.confirm(`Supprimer définitivement « ${comp.title} » (${comp.edition}) ? Cette action est irréversible.`)) return;
    setDeletingId(comp.id);
    await onDeleteEdition(comp);
    setDeletingId(null);
  }

  const allEntries = niches.flatMap((niche) =>
    niche.competitions.map((comp) => ({ comp, niche }))
  );

  const searchedEntries = query.trim() === ""
    ? allEntries
    : allEntries.filter(({ comp }) =>
        comp.title.toLowerCase().includes(query.toLowerCase()) ||
        comp.edition.toLowerCase().includes(query.toLowerCase()) ||
        comp.niche === undefined ? false : true
      ).filter(({ comp, niche }) =>
        comp.title.toLowerCase().includes(query.toLowerCase()) ||
        comp.edition.toLowerCase().includes(query.toLowerCase()) ||
        niche.label.toLowerCase().includes(query.toLowerCase())
      );

  const filteredEntries =
    statusFilter === "Total" ? searchedEntries
    : statusFilter === "En direct" ? searchedEntries.filter((e) => e.comp.phase === "live")
    : statusFilter === "Inscriptions" ? searchedEntries.filter((e) => e.comp.phase === "registration")
    : statusFilter === "Brouillons" ? searchedEntries.filter((e) => e.comp.phase === "draft")
    : statusFilter === "Désactivées" ? searchedEntries.filter((e) => !e.comp.active)
    : searchedEntries;

  const totalComps = allEntries.length;
  const liveCount = allEntries.filter((e) => e.comp.phase === "live").length;
  const registrationCount = allEntries.filter((e) => e.comp.phase === "registration").length;
  const draftCount = allEntries.filter((e) => e.comp.phase === "draft").length;
  const offCount = allEntries.filter((e) => !e.comp.active).length;
  const totalRegistered = allEntries.reduce((sum, e) => sum + (e.comp.registeredCount || 0), 0);

  // Templates (seed competitions) are never edited or deleted from here —
  // they're just the source list an admin picks from when starting a new
  // edition. Picking one is handled entirely inside the overlay below.
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [creatingTemplateKey, setCreatingTemplateKey] = useState(null);

  async function handlePickTemplate(found) {
    if (!found || creatingTemplateKey) return;
    setCreatingTemplateKey(found.key);
    await onCreateEdition(found.comp, found.niche);
    setCreatingTemplateKey(null);
    setShowTemplatePicker(false);
    setTemplateQuery("");
  }

  const templatesByNiche = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    const groups = new Map();
    for (const s of seedCompetitions) {
      if (q && !s.comp.title.toLowerCase().includes(q) && !s.niche.label.toLowerCase().includes(q)) continue;
      if (!groups.has(s.niche.label)) groups.set(s.niche.label, { niche: s.niche, items: [] });
      groups.get(s.niche.label).items.push(s);
    }
    return Array.from(groups.values());
  }, [seedCompetitions, templateQuery]);

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #e0e0e0",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <ArrowLeft size={20} color="#333" />
        </button>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
            Administration
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#aaa" }}>
            Gérer toutes les compétitions
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une compétition…"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #e0e0e0", borderRadius: 999,
              padding: "10px 14px 10px 36px",
              fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333",
              background: "#fff", outline: "none",
            }}
          />
        </div>

        {/* Stats as filter pills */}
        <div
          className="admin-stats-row"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 18,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          <style>{`.admin-stats-row::-webkit-scrollbar { display: none; }`}</style>
          {[
            { label: "Total", value: totalComps },
            { label: "En direct", value: liveCount },
            { label: "Inscriptions", value: registrationCount },
            { label: "Brouillons", value: draftCount },
            { label: "Inscrits", value: totalRegistered },
            { label: "Désactivées", value: offCount },
          ].map((stat) => {
            const isActive = statusFilter === stat.label;
            return (
              <button
                key={stat.label}
                onClick={() => setStatusFilter(stat.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: "0 0 auto",
                  border: isActive ? "1px solid #111" : "1px solid #e0e0e0",
                  background: isActive ? "#111" : "#fff",
                  borderRadius: 999,
                  padding: "8px 14px",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "#555", whiteSpace: "nowrap" }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? "#111" : "#666",
                    background: isActive ? "#fff" : "#F2F2F0",
                    borderRadius: 999,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {stat.value.toLocaleString("fr-FR")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Start a new edition/season for any competition series. Templates
            (seed competitions) never appear as rows in the list below —
            this overlay is the only place they're surfaced, purely as
            picks for spinning up a new edition. */}
        <button
          onClick={() => setShowTemplatePicker(true)}
          style={{
            width: "100%", marginBottom: 14,
            border: "1px dashed #ccc", borderRadius: 10, padding: "12px 16px",
            background: "#fff", color: "#333",
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={14} /> Nouvelle édition à partir d'un modèle
        </button>
        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
              Aucune compétition ne correspond à « {query} »
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredEntries.map(({ comp, niche }) => {
              const thumb = comp.bannerUrl || comp.images?.[0]?.url;
              const isDraft = comp.phase === "draft";
              const isDeleting = deletingId === comp.id;
              const isPublishing = publishingId === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => onOpenComp(comp, niche)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14,
                    padding: 10, cursor: "pointer",
                    opacity: comp.active ? 1 : 0.55,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "#f0f0f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <ImageIcon size={18} color="#ccc" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {comp.title}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        color: "#fff", background: niche.accent,
                        borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {niche.label}
                      </span>
                      {!comp.active && (
                        <span style={{
                          fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                          color: "#fff", background: "#c0392b",
                          borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.03em",
                        }}>
                          Désactivée
                        </span>
                      )}
                      <span style={{
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        color: comp.phase === "live" ? "#00B894" : comp.phase === "completed" ? "#999" : comp.phase === "draft" ? "#c07a00" : "#888",
                        textTransform: "uppercase", letterSpacing: "0.03em",
                      }}>
                        {comp.phase === "live" ? "● En direct" : comp.phase === "completed" ? "Terminé" : comp.phase === "draft" ? "Brouillon" : "Inscriptions"}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb" }}>
                        {comp.edition}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#333" }}>
                      {(comp.registeredCount || 0).toLocaleString("fr-FR")}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      inscrits
                    </span>
                  </div>

                  {/* Publish — only surfaced for drafts, turns them live/open */}
                  {isDraft && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handlePublishClick(comp); }}
                      disabled={isPublishing}
                      style={{
                        flexShrink: 0,
                        border: "none", borderRadius: 8, padding: "6px 10px",
                        background: "#00B894", color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                        cursor: isPublishing ? "default" : "pointer",
                        opacity: isPublishing ? 0.5 : 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isPublishing ? "…" : "Publier"}
                    </button>
                  )}

                  {/* Delete edition — stopPropagation so it doesn't also open the edit panel */}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); handleDeleteClick(comp); }}
                    disabled={isDeleting}
                    aria-label="Supprimer cette édition"
                    title="Supprimer cette édition"
                    style={{
                      flexShrink: 0,
                      border: "none", borderRadius: 8, padding: 6,
                      background: "transparent", color: "#e74c3c",
                      cursor: isDeleting ? "default" : "pointer",
                      opacity: isDeleting ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isDeleting ? <span style={{ fontSize: 10 }}>…</span> : <X size={14} strokeWidth={2.5} />}
                  </button>

                  <ChevronRight size={16} color="#ccc" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template picker overlay — the only place seed competitions
          (templates) are ever shown in the admin experience. Picking a
          card creates a fresh draft edition of that template and drops
          straight into its edit form (via onCreateEdition). */}
      {showTemplatePicker && (
        <div
          onClick={() => setShowTemplatePicker(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560, maxHeight: "82vh",
              background: "#F2F2F0", borderRadius: "20px 20px 0 0",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{
              padding: "16px 16px 12px", background: "#fff",
              borderBottom: "1px solid #e0e0e0",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#222" }}>
                  Choisir un modèle
                </span>
                <button
                  onClick={() => setShowTemplatePicker(false)}
                  style={{ border: "none", background: "none", cursor: "pointer", padding: 4, display: "flex" }}
                  aria-label="Fermer"
                >
                  <X size={20} color="#666" />
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#bbb" }} />
                <input
                  type="text"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Rechercher un modèle…"
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1px solid #e0e0e0", borderRadius: 999,
                    padding: "9px 12px 9px 32px",
                    fontFamily: "Inter, sans-serif", fontSize: 13, color: "#333",
                    background: "#fff", outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {templatesByNiche.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 8px" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa" }}>
                    Aucun modèle ne correspond à « {templateQuery} »
                  </span>
                </div>
              ) : (
                templatesByNiche.map(({ niche, items }) => (
                  <div key={niche.label}>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                      color: "#999", textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {niche.label}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {items.map((s) => {
                        const isCreating = creatingTemplateKey === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => handlePickTemplate(s)}
                            disabled={!!creatingTemplateKey}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              background: "#fff", border: "1px solid #e0e0e0", borderRadius: 14,
                              padding: 10, cursor: creatingTemplateKey ? "default" : "pointer",
                              opacity: creatingTemplateKey && !isCreating ? 0.5 : 1,
                              textAlign: "left", width: "100%", boxSizing: "border-box",
                            }}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                              overflow: "hidden", background: "#f0f0f0",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {s.comp.bannerUrl || s.comp.images?.[0]?.url ? (
                                <img src={s.comp.bannerUrl || s.comp.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              ) : (
                                <ImageIcon size={16} color="#ccc" />
                              )}
                            </div>
                            <span style={{
                              flex: 1, minWidth: 0,
                              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#222",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {s.comp.title}
                            </span>
                            {isCreating ? (
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#999", flexShrink: 0 }}>…</span>
                            ) : (
                              <ChevronRight size={16} color="#ccc" style={{ flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TX_FILTERS = [
  { id: "all", label: "Tous" },
  { id: "deposit", label: "Dépôts" },
  { id: "withdrawal", label: "Retraits" },
  { id: "gift_sent", label: "Cadeaux" },
];

function groupTransactionsByDay(list) {
  const groups = [];
  const map = new Map();
  for (const tx of list) {
    const day = tx.date.includes(",") ? tx.date.split(",")[0].trim() : tx.date;
    if (!map.has(day)) {
      const group = { day, items: [] };
      map.set(day, group);
      groups.push(group);
    }
    map.get(day).items.push(tx);
  }
  return groups;
}

function DepositNumbersCard({ currentUser, onUpdateNumber, showToast }) {
  const [method, setMethod] = useState("moncash");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const current = PAYMENT_METHODS.find((m) => m.id === method);
  const userNumber = method === "moncash" ? currentUser?.moncashNumber : currentUser?.natcashNumber;
  const isVerified = method === "moncash" ? currentUser?.moncashVerified : currentUser?.natcashVerified;

  function startEditing() {
    setInputValue(userNumber || "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setInputValue("");
  }

  async function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onUpdateNumber?.(method, trimmed);
      showToast && showToast(`Numéro ${current?.label} enregistré`);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save mobile money number:", err);
      showToast && showToast(err?.message ? `Erreur : ${err.message}` : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        background: "#fff",
        borderRadius: 14,
        marginBottom: 16,
        padding: 14,
      }}
    >
      {/* Pill tabs: MonCash / NatCash */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {DEPOSIT_METHODS.map((m) => {
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMethod(m.id); setEditing(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: active ? `1px solid ${m.accent}` : "1px solid #e0e0e0",
                borderRadius: 999,
                background: active ? m.accent : "#fff",
                color: active ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "rgba(255,255,255,0.25)" : m.accent,
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.label.charAt(0)}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      {/* User's own number for the active method */}
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 6 }}>
        Votre numéro {current?.label}
      </div>

      {editing ? (
        <div>
          <input
            autoFocus
            type="tel"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ex : ${MOBILE_MONEY_NUMBERS[method]?.number ?? "+509 XX XX XX XX"}`}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#111",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || !inputValue.trim()}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: saving ? "default" : "pointer",
                opacity: saving || !inputValue.trim() ? 0.5 : 1,
              }}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              style={{
                flex: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 999,
                background: "#fff",
                color: "#666",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 0",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            {userNumber ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.04em", color: "#111" }}>
                  {userNumber}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: isVerified ? "#E8F7EE" : "#FFF6E5",
                    color: isVerified ? "#1E8449" : "#B7791F",
                  }}
                >
                  {isVerified ? "✓ Vérifié" : "⏳ En attente"}
                </span>
              </div>
            ) : (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#999", fontStyle: "italic" }}>
                Aucun numéro {current?.label} enregistré
              </div>
            )}
          </div>
          <button
            onClick={startEditing}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${current?.accent ?? "#111"}`,
              borderRadius: 999,
              background: "#fff",
              color: current?.accent ?? "#111",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            {userNumber ? <Copy size={13} strokeWidth={2.5} /> : <Plus size={13} strokeWidth={2.5} />}
            {userNumber ? "Modifier" : "Ajouter"}
          </button>
        </div>
      )}

      {!editing && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: userNumber ? "#C0392B" : "#888", lineHeight: 1.5, marginTop: 10 }}>
          {userNumber
            ? isVerified
              ? `⚠ Vos dépôts ${current?.label} ne seront acceptés que s'ils proviennent de ce numéro.`
              : `Ce numéro sera vérifié automatiquement dès votre premier dépôt réel ${current?.label} depuis celui-ci.`
            : `Ajoutez votre numéro ${current?.label} pour pouvoir déposer avec cette méthode.`}
        </div>
      )}
    </div>
  );
}

function WalletPage({ balance, transactions, currentUser, isAuthenticated, onOpenDeposit, onOpenWithdraw, onOpenNotifications, onUpdateNumber, onRequireAuth, showToast, onBack }) {
  const [txFilter, setTxFilter] = useState("all");
  const [txQuery, setTxQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const effectiveBalance = isAuthenticated ? balance : 0;
  const effectiveTransactions = isAuthenticated ? transactions : [];

  const filteredTx = effectiveTransactions
    .filter((t) => txFilter === "all" || t.type === txFilter)
    .filter((t) => !txQuery.trim() || t.label.toLowerCase().includes(txQuery.trim().toLowerCase()));
  const groups = groupTransactionsByDay(filteredTx);

  const totalDeposited = effectiveTransactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalGifted = effectiveTransactions
    .filter((t) => t.type === "gift_sent")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const dayChange = effectiveTransactions
    .filter((t) => t.date && t.date.startsWith("Aujourd'hui"))
    .reduce((sum, t) => sum + t.amount, 0);
  const priorBalance = effectiveBalance - dayChange;
  const dayChangePct = priorBalance !== 0 ? (dayChange / Math.abs(priorBalance)) * 100 : 0;


  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 80 }}>
      {/* Header */}
      <header
        style={{
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "8px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => showToast && showToast("Menu bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Menu size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Messagerie bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <MessageCircle size={20} strokeWidth={2.25} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onOpenNotifications}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <Bell size={20} strokeWidth={2.25} />
          </button>
          <button
            onClick={() => showToast && showToast("Aide bientôt disponible")}
            style={{ border: "none", background: "none", cursor: "pointer", padding: 6, lineHeight: 0, color: "#333", flexShrink: 0, display: "flex" }}
          >
            <HelpCircle size={20} strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "16px 8px" }}>
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "14px 16px",
            marginBottom: 10,
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#aaa",
              }}
            >
              Solde disponible
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "3px 7px",
                borderRadius: 6,
                background: dayChange >= 0 ? "#00B89418" : "#FF525218",
                flexShrink: 0,
              }}
            >
              {dayChange >= 0 ? (
                <ArrowUpRight size={12} strokeWidth={2.75} color="#00B894" style={{ flexShrink: 0 }} />
              ) : (
                <ArrowDownLeft size={12} strokeWidth={2.75} color="#FF5252" style={{ flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: dayChange >= 0 ? "#00B894" : "#FF5252",
                  whiteSpace: "nowrap",
                }}
              >
                {dayChangePct >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px, 7vw, 32px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#111", wordBreak: "break-all" }}>
              {effectiveBalance.toLocaleString("fr-FR")}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#999" }}>
              HTG
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600, color: dayChange >= 0 ? "#00B894" : "#FF5252", marginLeft: "auto" }}>
              {dayChange >= 0 ? "+" : ""}{dayChange.toLocaleString("fr-FR")} aujourd'hui
            </span>
          </div>
        </div>

        {/* Deposit numbers — MonCash / NatCash tabs */}
        {isAuthenticated ? (
          <DepositNumbersCard currentUser={currentUser} onUpdateNumber={onUpdateNumber} showToast={showToast} />
        ) : (
          <div
            style={{
              border: "1px solid #e0e0e0",
              background: "#fafafa",
              borderRadius: 14,
              marginBottom: 16,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#666", marginBottom: 10 }}>
              Connectez-vous pour voir votre portefeuille et gérer vos numéros de dépôt.
            </div>
            <button
              onClick={onRequireAuth}
              style={{
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                fontFamily: "Inter, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                padding: "10px 20px",
                cursor: "pointer",
              }}
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Total déposé
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#00B894", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              +{totalDeposited.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 0, border: "1px solid #e0e0e0", background: "#fff", padding: "10px 12px", borderRadius: 12 }}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 4 }}>
              Cadeaux envoyés
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              -{totalGifted.toLocaleString("fr-FR")} <span style={{ fontSize: 10, fontWeight: 600, color: "#aaa" }}>HTG</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Déposer", icon: Plus, onClick: isAuthenticated ? onOpenDeposit : onRequireAuth, filled: true },
            { label: "Retirer", icon: ArrowUpRight, onClick: isAuthenticated ? onOpenWithdraw : onRequireAuth, filled: false },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              style={{
                flex: "1 1 130px",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                borderRadius: 24,
                border: action.filled ? "1px solid #111" : "1px solid #e0e0e0",
                background: action.filled ? "#111" : "#fff",
                color: action.filled ? "#fff" : "#333",
                cursor: "pointer",
                padding: "0 20px",
              }}
            >
              <action.icon size={18} strokeWidth={2.5} />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Info note */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            background: "#fff",
            padding: "12px 14px",
            marginBottom: 24,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#aaa",
            lineHeight: 1.5,
            borderRadius: 12,
          }}
        >
          Votre solde est en gourdes haïtiennes (HTG) et représente de l'argent réel. Déposez via MonCash, NatCash ou carte bancaire, et retirez à tout moment vers votre compte mobile money.
        </div>

        {/* Transaction history */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: "#888",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Historique
        </div>

        {/* Search bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${searchFocused ? "#111" : "#e0e0e0"}`,
            background: "#f9f9f9",
            height: 38,
            borderRadius: 10,
            padding: "0 10px",
            marginBottom: 12,
            transition: "border-color 0.15s",
          }}
        >
          <Search size={15} color={searchFocused ? "#333" : "#aaa"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={txQuery}
            onChange={(e) => setTxQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "#333",
              background: "transparent",
              height: "100%",
            }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
          {TX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTxFilter(f.id)}
              style={{
                flexShrink: 0,
                border: `1px solid ${txFilter === f.id ? "#111" : "#e0e0e0"}`,
                background: txFilter === f.id ? "#111" : "#fff",
                color: txFilter === f.id ? "#fff" : "#666",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px", border: "1px solid #e0e0e0", background: "#fff", color: "#aaa", fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 12 }}>
            Aucune transaction pour le moment.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {groups.map((g) => (
              <div
                key={g.day}
                style={{
                  border: "1px solid #e0e0e0",
                  background: "#fff",
                  overflow: "hidden",
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#999",
                    padding: "10px 14px",
                    background: "#fafafa",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {g.day}
                </div>
                <div>
                  {g.items.map((tx, i) => (
                    <TransactionRow key={tx.id} tx={tx} isLast={i === g.items.length - 1} showToast={showToast} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// The home banner slider used to fall back to static stock photos per niche.
// It now only features competitions that have a real uploaded image in the
// competition-images storage bucket — computed inside App() from `compImages`
// (see `homeBannerSlides`) so nothing fake ever shows up here.

/* ─── NOTIFICATIONS DATA ────────────────────────────────────────────────── */

const INITIAL_NOTIFS = [
  { id: "n1", type: "result",       read: false, ts: Date.now() - 1000 * 60 * 8,    icon: "🏆", title: "Résultats disponibles",     body: "Voix d'Or — la finale est terminée. Découvrez le classement final.", compId: "m2" },
  { id: "n2", type: "activity",     read: false, ts: Date.now() - 1000 * 60 * 23,   icon: "🔥", title: "Battle Hip-Hop s'emballe",   body: "4 820 votes en moins de 2 jours — la compétition est très active.", compId: "m1" },
  { id: "n3", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 61,   icon: "⚡", title: "Plus que 3 places",          body: "DJ Set Open — il ne reste que 3 inscriptions disponibles.", compId: "m4" },
  { id: "n4", type: "system",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 5, icon: "💎", title: "550 crédits ajoutés",       body: "Votre achat a été confirmé. Solde actuel : 425 crédits." },
  { id: "n5", type: "activity",     read: true,  ts: Date.now() - 1000 * 60 * 60 * 9, icon: "👑", title: "Couronne envoyée",          body: "Votre cadeau a été remis à un participant de Voix d'Or." },
  { id: "n6", type: "result",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 22, icon: "🥇", title: "FIFA Masters — Top 3",     body: "Le classement de mi-parcours est disponible. 14 500 votes comptabilisés.", compId: "g1" },
  { id: "n7", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 60 * 26, icon: "📋", title: "Illustration Duel ouvert", body: "Les inscriptions pour Illustration Duel viennent d'ouvrir. 40 places.", compId: "a3" },
];

function fmtNotifTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

const NOTIF_TYPE_COLOR = {
  result:       { bg: "#fff8e6", border: "#ffe08a", dot: "#f39c12" },
  activity:     { bg: "#fff0ed", border: "#ffcfc7", dot: "#e74c3c" },
  registration: { bg: "#f0ebff", border: "#d5c8ff", dot: "#6C63FF" },
  system:       { bg: "#f0fbf7", border: "#b8edd9", dot: "#00B894" },
  action:       { bg: "#f7f7f5", border: "#e0e0e0", dot: "#888"    },
};

function NotificationsPage({ notifications, onMarkAllRead, onMarkRead, onOpen }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F0", paddingBottom: 80 }}>
      <header style={{
        borderBottom: "1px solid #e0e0e0", background: "#fff",
        position: "sticky", top: 0, zIndex: 50,
        padding: "16px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#333", letterSpacing: "-0.01em" }}>
          Notifications
          {unread > 0 && (
            <span style={{
              marginLeft: 8,
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              background: "#e74c3c", color: "#fff",
              padding: "2px 7px",
              verticalAlign: "middle",
            }}>{unread}</span>
          )}
        </span>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{
              border: "none", background: "none",
              fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
              color: "#888", letterSpacing: "0.04em", textTransform: "uppercase",
              cursor: "pointer", padding: 0,
            }}
          >Tout lire</button>
        )}
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 6 }}>
              Aucune notification
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
              Les activités de vos compétitions apparaîtront ici.
            </div>
          </div>
        ) : notifications.map((notif) => {
          const colors = NOTIF_TYPE_COLOR[notif.type] ?? NOTIF_TYPE_COLOR.action;
          return (
            <div
              key={notif.id}
              onClick={() => {
                onMarkRead(notif.id);
                if (notif.compId) onOpen?.(notif.compId);
              }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: notif.read ? "#fff" : colors.bg,
                border: `1px solid ${notif.read ? "#e0e0e0" : colors.border}`,
                padding: "12px 14px",
                cursor: notif.compId ? "pointer" : "default",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              {/* Icon + unread dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38,
                  background: notif.read ? "#f7f7f5" : colors.bg,
                  border: `1px solid ${notif.read ? "#e8e8e8" : colors.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, lineHeight: 1,
                }}>
                  {notif.icon}
                </div>
                {!notif.read && (
                  <div style={{
                    position: "absolute", top: -3, right: -3,
                    width: 8, height: 8, borderRadius: "50%",
                    background: colors.dot,
                    border: "2px solid #fff",
                  }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  gap: 8, marginBottom: 2,
                }}>
                  <span style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700,
                    color: "#222", lineHeight: 1.2,
                  }}>{notif.title}</span>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 10, color: "#bbb",
                    fontWeight: 500, flexShrink: 0,
                  }}>{fmtNotifTime(notif.ts)}</span>
                </div>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666",
                  lineHeight: 1.45, display: "block",
                }}>{notif.body}</span>
                {notif.compId && (
                  <span style={{
                    display: "inline-block", marginTop: 6,
                    fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                    color: colors.dot,
                  }}>Voir la compétition <ChevronRight size={11} style={{ display: "inline" }} /></span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default function App() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const [homeSearchFocused, setHomeSearchFocused] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedComp, setSelectedComp] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [lastDepositMethod, setLastDepositMethod] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationComp, setRegistrationComp] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Load real balance + transaction history from Supabase once authenticated.
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;

    supabase
      .from("wallet_balances")
      .select("balance")
      .eq("user_id", currentUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("wallet_balances fetch error:", error);
        setBalance(data?.balance || 0);
      });

    supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("wallet_transactions fetch error:", error);
          return;
        }
        setTransactions(
          (data || []).map((t) => ({
            id: t.id,
            type: t.type,
            label: t.label,
            amount: Number(t.amount),
            date: new Date(t.created_at).toLocaleString("fr-FR", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            }),
          }))
        );
      });

    return () => { cancelled = true; };
  }, [currentUser?.id]);

  // Real-time: the moment the SMS server auto-credits a matching deposit,
  // push it straight into the wallet — no user action, no page refresh.
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel(`wallet-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          const t = payload.new;
          const amt = Number(t.amount);
          setBalance((b) => b + amt);
          setTransactions((tx) => {
            if (tx.some((existing) => existing.id === t.id)) return tx;
            return [
              { id: t.id, type: t.type, label: t.label, amount: amt, date: "À l'instant" },
              ...tx,
            ];
          });
          if (amt > 0) {
            showToast(`+${amt.toLocaleString("fr-FR")} HTG crédités`);
            pushNotif({ type: "action", icon: "💰", title: "Dépôt reçu", body: t.label });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);
  const [registeredCompIds, setRegisteredCompIds] = useState(() => new Set());
  const [followedCompIds, setFollowedCompIds] = useState(() => new Set());
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [pendingRegistrationComp, setPendingRegistrationComp] = useState(null);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [editionsByComp, setEditionsByComp] = useState({}); // { [competitionId]: [edition, ...] }
  const [compImages, setCompImages] = useState({});
  const [compRegCounts, setCompRegCounts] = useState({}); // keyed by edition_id now
  const [compEditIntent, setCompEditIntent] = useState(false);
  // True only while the admin is filling in the create-edition form for an
  // edition that doesn't exist in the database yet — see
  // handleCreateDraftEdition / handleCreateEditionSave below. Never true
  // for editing an existing edition.
  const [pendingNewEdition, setPendingNewEdition] = useState(false);
  const [draftEditionTarget, setDraftEditionTarget] = useState(null); // { competitionId, niche } while creating a new edition

  useEffect(() => {
    fetchCompetitionEditions().then(setEditionsByComp);
    fetchAllCompetitionImages().then(setCompImages);
    fetchAllRegistrationCounts().then(setCompRegCounts);
  }, []);

  // ── Live sync for competition_editions ───────────────────────────────────
  // Closing a competition (flipping phase → "completed", picking the
  // winner, paying out the prize) now happens entirely server-side: a
  // Postgres procedure, `close_expired_competitions`, runs on pg_cron and
  // does all three atomically, whether or not anyone has a board open.
  // This subscription is the client's only remaining job — reflect that
  // result everywhere the moment it's committed, instead of the old
  // approach where the one browser that happened to have the board open
  // did the work itself and everyone else waited for a reload.
  // Keeps both the homepage cards (via `editionsByComp`, consumed by
  // `editionsForComp`/`allNichesWithEdits` below) and any currently-open
  // `CompetitionBoard` (via `selectedComp`) in sync from a single channel.
  // Unlike the old single-row-per-competition subscription, this one has to
  // handle INSERT too — a brand-new draft (or a freshly published edition)
  // showing up mid-session, not just an update to a row already in state.
  const notifiedCompletionsRef = useRef(new Set());
  useEffect(() => {
    const channel = supabase
      .channel("competition-editions-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "competition_editions" },
        (payload) => {
          const row = payload.new;
          if (!row?.competition_id) return;
          // Maps snake_case DB columns to the camelCase shape used
          // throughout the client (same shape `saveEditionEdit` writes
          // and `fetchCompetitionEditions` returns).
          const edits = {
            id: row.id,
            competitionId: row.competition_id,
            title: row.title,
            edition: row.edition,
            ends: row.ends,
            phase: row.phase,
            endsAt: row.ends_at,
            contestants: row.contestants,
            description: row.description,
            prizeAmount: row.prize_amount,
            fee: row.fee,
            rewardExtra: row.reward_extra,
            rules: row.rules,
            bannerUrl: row.banner_url,
            active: row.active,
            winnerUserId: row.winner_user_id,
            winnerName: row.winner_name,
            winnerPrize: row.winner_prize,
            closedAt: row.closed_at,
          };
          setEditionsByComp((prev) => {
            const existing = prev[row.competition_id] || [];
            const idx = existing.findIndex((e) => e.id === row.id);
            const nextList =
              idx === -1
                ? [...existing, edits] // brand-new row (a fresh draft, or an edition created directly)
                : existing.map((e, i) => (i === idx ? { ...e, ...edits } : e));
            return { ...prev, [row.competition_id]: nextList };
          });
          setSelectedComp((prev) =>
            prev && prev.id === row.id ? { ...prev, ...edits } : prev
          );
          // Announce a fresh result once per edition per session — a ref
          // (not editionsByComp state) so this isn't tied to a stale closure
          // and doesn't fire again on later, unrelated edits to the same row.
          if (edits.phase === "completed" && !notifiedCompletionsRef.current.has(row.id)) {
            notifiedCompletionsRef.current.add(row.id);
            const label = edits.title || "Une compétition";
            if (edits.winnerUserId) {
              const prizeTxt = Number(edits.winnerPrize || 0).toLocaleString("fr-FR");
              showToast(`${label} est terminée — ${edits.winnerName || "le gagnant"} remporte ${prizeTxt} HTG`);
              pushNotif({
                type: "action",
                icon: "🏆",
                title: "Compétition terminée",
                body: `${edits.winnerName || "Le gagnant"} remporte ${prizeTxt} HTG dans ${label}`,
              });
            } else {
              showToast(`${label} est terminée — aucun gagnant, frais d'inscription remboursés`);
              pushNotif({
                type: "action",
                icon: "↩️",
                title: "Compétition terminée sans gagnant",
                body: `${label} s'est terminée sans qu'aucun participant ne reçoive de cadeaux. Les frais d'inscription ont été remboursés.`,
              });
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Resolves a stored id (a notification's compId, a registeredCompIds /
  // followedCompIds entry) back to its full card + niche. Ids stored
  // anywhere in the app are edition ids now, not the static seed id, so
  // this has to search each seed competition's editions rather than the
  // static NICHES data directly (the old module-level findCompWithNiche
  // could get away with that when there was only ever one edition per
  // competition).
  function findEditionWithNiche(editionId) {
    for (const niche of NICHES) {
      for (const seedComp of niche.competitions) {
        const ed = (editionsByComp[seedComp.id] || []).find((e) => e.id === editionId);
        if (ed) return { comp: editionToCard(seedComp, ed), niche };
      }
    }
    return null;
  }

  const registeredEntries = useMemo(
    () => Array.from(registeredCompIds).map((id) => findEditionWithNiche(id)).filter(Boolean),
    [registeredCompIds, editionsByComp, compImages, compRegCounts]
  );
  const followedEntries = useMemo(
    () => Array.from(followedCompIds).map((id) => findEditionWithNiche(id)).filter(Boolean),
    [followedCompIds, editionsByComp, compImages, compRegCounts]
  );

  // Merges one competition_editions row into its static seed data (the
  // NICHES entry, e.g. "m1") to produce a renderable card. Unlike the old
  // `withEdits`, this takes the edition explicitly rather than looking one
  // up by competition_id, because a seed competition can now have several.
  function editionToCard(comp, e) {
    return {
      ...comp,
      // `id` becomes this edition's own id — every downstream table
      // (gifts, registrations, comments, participant_media) and every
      // realtime subscription in CompetitionBoard is scoped by comp.id,
      // so this one line is what makes all of that edition-scoped.
      id: e.id,
      // The seed id is kept separately — it's still what the shared image
      // gallery, the niche grouping, and "which series is this a season
      // of" are keyed by.
      competitionId: comp.id,
      // A cleared field — or a field never set at all — saves/loads as
      // null. Fall back to the seed value in every case rather than let
      // a blank silently wipe out real data.
      title: e.title != null ? e.title : comp.title,
      edition: e.edition != null ? e.edition : comp.edition,
      ends: e.ends != null ? e.ends : comp.ends,
      phase: e.phase != null ? e.phase : comp.phase,
      endsAt: e.endsAt != null ? e.endsAt : comp.endsAt,
      contestants: e.contestants != null ? e.contestants : comp.contestants,
      bannerUrl: e.bannerUrl != null ? e.bannerUrl : comp.bannerUrl,
      description: e.description != null ? e.description : comp.description,
      prizeAmount: e.prizeAmount != null ? e.prizeAmount : comp.prizeAmount,
      fee: e.fee != null ? e.fee : comp.fee,
      rewardExtra: e.rewardExtra != null ? e.rewardExtra : comp.rewardExtra,
      rules: (e.rules && e.rules.length > 0) ? e.rules : comp.rules,
      // Real count from the registrations table always wins over any
      // seeded placeholder — 0 until someone actually registers for THIS
      // edition (a new season starts back at 0, it doesn't inherit the
      // previous season's registrants).
      registeredCount: compRegCounts[e.id] ?? 0,
      // The gallery is shared across every edition of a series.
      images: compImages[comp.id] || [],
      active: e.active !== false,
      winnerUserId: e.winnerUserId,
      winnerName: e.winnerName,
      winnerPrize: e.winnerPrize,
      closedAt: e.closedAt,
      createdAt: e.createdAt,
    };
  }

  // One card per PUBLISHED (non-draft) edition of this seed competition —
  // zero cards if none have been published yet. This is the direct
  // replacement for the old `withEdits`, which always produced exactly one
  // card per seed competition (there was only ever one edit row to merge).
  // Newest edition first, so a freshly-published season surfaces above an
  // older, wrapping-up one.
  function publishedEditionsForComp(comp) {
    return (editionsByComp[comp.id] || [])
      .filter((e) => e.phase !== "draft")
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((e) => editionToCard(comp, e));
  }

  // A row that's never actually been through the create/edit flow — every
  // overridable field is still null, so editionToCard falls all the way
  // back and renders nothing but the hardcoded NICHES seed data (its
  // title, contestant count, votes, etc. straight out of this file). That
  // only happens for placeholder rows that were never really "created" as
  // an edition, and it's also why they can't be deleted (they're not
  // meant to be — they exist purely so the seed has something to show).
  // A genuine in-progress draft is exempt: it's real, it's just empty so
  // far, and hiding it here would make it un-findable after the admin
  // navigates away from the edit form before filling it in.
  function isUncustomizedMockEdition(e) {
    if (e.phase === "draft") return false;
    const fields = [
      e.title, e.edition, e.ends, e.contestants, e.bannerUrl,
      e.description, e.prizeAmount, e.fee, e.rewardExtra,
    ];
    const rulesEmpty = !e.rules || e.rules.length === 0;
    return fields.every((f) => f == null) && rulesEmpty;
  }

  // Every edition of this seed competition, drafts included — powers the
  // admin page, which needs to see (and finish) drafts too, not just what's
  // already live on the homepage. Mock rows that only ever carried the
  // hardcoded seed data (never actually created/edited through the app)
  // are left out — they aren't real editions and admins can't delete them
  // anyway.
  function allEditionsForComp(comp) {
    return (editionsByComp[comp.id] || [])
      .filter((e) => !isUncustomizedMockEdition(e))
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((e) => editionToCard(comp, e));
  }

  // Quick on/off toggle from the admin list. `comp` here is one edition
  // card (from allNichesWithEdits), so this only ever touches the one
  // edition row the admin clicked — its siblings (other seasons of the
  // same series) are untouched.
  async function handleToggleCompActive(comp) {
    const nextActive = !comp.active;
    const { error } = await saveEditionEdit({
      editionId: comp.id,
      active: nextActive,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("saveEditionEdit error:", error);
      showToast("Impossible de mettre à jour le statut.");
      return;
    }
    setEditionsByComp((prev) => {
      const list = prev[comp.competitionId] || [];
      return {
        ...prev,
        [comp.competitionId]: list.map((e) => (e.id === comp.id ? { ...e, active: nextActive } : e)),
      };
    });
    showToast(nextActive ? "Compétition activée." : "Compétition désactivée — masquée de l'accueil.");
  }

  // Admin page → jump straight to an edition's edit panel, regardless of
  // the homepage's current filter/search state. `comp` here already has
  // edits/images applied (it comes from allNichesWithEdits). This is
  // always an EXISTING edition, never the new-edition form.
  function handleAdminOpenComp(comp, niche) {
    setPendingNewEdition(false);
    setCompEditIntent(true);
    setSelectedComp({ ...comp, accent: niche.accent, niche: niche.label });
  }

  // Opens a blank create-edition form for a seed competition, but doesn't
  // touch the database at all — nothing is written until the admin
  // actually presses "Enregistrer" (see handleCreateEditionSave). Backing
  // out of the form at this point leaves nothing behind, unlike the old
  // flow which inserted a bare empty "draft" row the instant a template
  // was picked, before the admin had typed anything.
  //
  // `id` is a client-only placeholder — never sent to the database, just
  // enough of a stand-in so the competition screen underneath the form
  // (registrations/comments/gallery lookups, realtime channels) has
  // something to key off of instead of `undefined`; it harmlessly finds
  // nothing until the real row exists.
  function handleCreateDraftEdition(comp, niche) {
    const placeholderId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pending-${Date.now()}`;
    const blankEdition = {
      id: placeholderId,
      competitionId: comp.id,
      title: null,
      edition: null,
      ends: null,
      endsAt: null,
      phase: "registration", // every edition starts open for registration — no draft state
      contestants: null,
      bannerUrl: null,
      description: null,
      prizeAmount: null,
      fee: null,
      rewardExtra: null,
      rules: [],
      active: true,
      winnerUserId: null,
      winnerName: null,
      winnerPrize: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
    };
    setPendingNewEdition(true);
    setCompEditIntent(true);
    setSelectedComp(editionToCard({ ...comp, accent: niche.accent, niche: niche.label }, blankEdition));
  }

  // First real save of a brand-new edition — this is an INSERT (the row
  // never existed before), always forced to phase "registration" inside
  // createEdition itself, not an update to an existing row.
  async function handleCreateEditionSave({ competitionId, title, edition, ends, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl }) {
    const { data, error } = await createEdition({
      competitionId,
      title,
      edition,
      ends,
      endsAt,
      contestants,
      description,
      prizeAmount,
      fee,
      rewardExtra,
      rules,
      bannerUrl,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("createEdition error:", error);
      showToast(`Impossible de créer cette édition${error.message ? ` : ${error.message}` : "."}`);
      return { success: false };
    }
    setEditionsByComp((prev) => ({
      ...prev,
      [competitionId]: [...(prev[competitionId] || []), data],
    }));
    setPendingNewEdition(false);
    setSelectedComp((prev) => (prev ? { ...prev, id: data.id, phase: data.phase, active: data.active, createdAt: data.createdAt } : prev));
    showToast(`« ${data.title || title} » créé et ouvert aux inscriptions.`);
    return { success: true, data };
  }

  // Publishes a draft edition — flips it to "registration" phase and marks
  // it active, so it starts showing up on the homepage/admin list as a
  // real, open competition instead of a hidden draft.
  async function handlePublishEdition(comp) {
    const { error } = await saveEditionEdit({
      editionId: comp.id,
      phase: "registration",
      active: true,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("saveEditionEdit (publish) error:", error);
      showToast("Impossible de publier cette édition.");
      return;
    }
    setEditionsByComp((prev) => {
      const list = prev[comp.competitionId] || [];
      return {
        ...prev,
        [comp.competitionId]: list.map((e) =>
          e.id === comp.id ? { ...e, phase: "registration", active: true } : e
        ),
      };
    });
    showToast(`« ${comp.title} » publié — ouvert aux inscriptions !`);
  }

  // Permanently deletes an edition (draft or published) from the admin
  // list. `comp` is an edition card, so competitionId tells us which
  // seed's bucket in editionsByComp to update locally after the delete.
  //
  // An edition with real activity (registrations, gifts, comments,
  // participant media, gallery images) can't just be deleted outright —
  // `registrations`/`gifts`/`comments`/`participant_media`/
  // `competition_images` all reference it and the DB rejects an orphaning
  // delete. So: refund every registrant's fee first (real money, has to
  // go back before the record of it disappears), then remove the
  // dependent rows, then the edition itself.
  async function handleDeleteEdition(comp) {
    const registrants = await fetchRegistrations(comp.id);

    for (const r of registrants) {
      if (!r.fee_paid || r.fee_paid <= 0) continue;
      const { error: refundError } = await refundRegistrationFee({
        userId: r.user_id,
        amount: r.fee_paid,
        competitionTitle: comp.title,
      });
      if (refundError) {
        console.error("refundRegistrationFee error:", refundError);
        showToast(`Remboursement échoué pour ${r.full_name || "un participant"} — suppression annulée.`);
        return;
      }
    }

    // participant_media used to rely on a BEFORE DELETE trigger to remove
    // the matching storage file (trigger_delete_participant_media_storage),
    // but it called storage.delete(...) — not a real SQL function — so
    // every delete on this table errored and aborted the whole edition
    // deletion. That trigger's gone now; storage cleanup happens here
    // instead, the same fetch-then-remove pattern deleteCompetitionImage
    // already uses for gallery images. A storage-removal failure is
    // logged but doesn't block the deletion — an orphaned file in
    // storage is recoverable later, an edition stuck forever isn't.
    const { data: mediaRows, error: mediaFetchError } = await supabase
      .from("participant_media")
      .select("media_url")
      .eq("edition_id", comp.id);
    if (mediaFetchError) {
      console.error("participant_media fetch error:", mediaFetchError);
    } else if (mediaRows?.length) {
      const paths = mediaRows
        .map((r) => r.media_url?.replace(/^.*\/participant-media\//, ""))
        .filter(Boolean);
      if (paths.length) {
        const { error: mediaStorageError } = await supabase.storage.from("participant-media").remove(paths);
        if (mediaStorageError) {
          console.error("participant_media storage cleanup error:", mediaStorageError);
        }
      }
    }

    const cleanupTables = ["comments", "gifts", "participant_media", "competition_images", "registrations"];
    for (const table of cleanupTables) {
      const { error: cleanupError } = await supabase.from(table).delete().eq("edition_id", comp.id);
      if (cleanupError) {
        console.error(`cleanup error (${table}):`, cleanupError);
        showToast(`Échec de la suppression des données liées (${table}). Édition non supprimée.`);
        return;
      }
    }

    const { error } = await deleteDraftEdition(comp.id);
    if (error) {
      console.error("deleteDraftEdition error:", error);
      showToast("Impossible de supprimer cette édition.");
      return;
    }
    // A Supabase/PostgREST delete can come back with no `error` even when
    // zero rows were actually removed — most commonly an RLS policy on
    // `competition_editions` silently filtering the row out of the delete's
    // WHERE clause. That's exactly what made deletions "stick" locally but
    // reappear after a refresh: we were trusting the absence of an error
    // instead of confirming the row was actually gone server-side. So
    // re-fetch the truth from the DB before touching local state, and
    // surface an honest failure immediately instead of a false success.
    const freshEditions = await fetchCompetitionEditions();
    const stillExists = (freshEditions[comp.competitionId] || []).some((e) => e.id === comp.id);
    if (stillExists) {
      console.error("deleteDraftEdition: row still present after delete — likely blocked by an RLS policy.");
      showToast("Suppression refusée par le serveur (droits insuffisants). Rien n'a été supprimé.");
      setEditionsByComp(freshEditions);
      return;
    }
    setEditionsByComp(freshEditions);
    // Registration counts and gallery images are cached separately from
    // editionsByComp — refresh both so the admin list's "inscrits" count
    // and any shared gallery view don't keep referencing rows we just
    // wiped out.
    fetchAllRegistrationCounts().then(setCompRegCounts);
    fetchAllCompetitionImages().then(setCompImages);
    const refundedCount = registrants.filter((r) => r.fee_paid > 0).length;
    showToast(
      refundedCount > 0
        ? `« ${comp.title} » supprimée — ${refundedCount} participant${refundedCount > 1 ? "s" : ""} remboursé${refundedCount > 1 ? "s" : ""}.`
        : `« ${comp.title} » supprimée.`
    );
  }


  // Home banner slides: any published edition with a dedicated banner (set
  // from the edit screen's "Bannière" section) is shown on the homepage —
  // that's the whole point of that control. Editions without a banner fall
  // back to their series' first gallery image, but only if they're flagged
  // "hot"; nothing fake or unintentional ever shows up here. Drafts never
  // appear — publishedEditionsForComp already excludes them.
  const homeBannerSlides = useMemo(() => {
    return NICHES.flatMap((niche) =>
      niche.competitions.flatMap((seed) =>
        publishedEditionsForComp(seed)
          .filter((c) => c.active !== false)
          .filter((c) => c.bannerUrl || (c.hot && compImages[c.competitionId]?.length > 0))
          .map((c) => ({
            ...c,
            niche,
            color: niche.accent,
            image: c.bannerUrl || compImages[c.competitionId][0].url,
          }))
      )
    ).slice(0, 6);
  }, [compImages, editionsByComp, compRegCounts]);


  async function handleEditComp({ editionId, competitionId, title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl }) {
    // TEMP DEBUG — remove once we've confirmed the session is attached.
    const { data: debugSession } = await supabase.auth.getSession();
    console.log("[DEBUG] session email:", debugSession.session?.user?.email, "has token:", !!debugSession.session?.access_token);
    const edits = { title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl };
    const { data, error } = await saveEditionEdit({
      editionId,
      ...edits,
      updatedBy: currentUser?.id,
    });
    if (error) {
      console.error("saveEditionEdit error:", error);
      // TEMPORARY DIAGNOSTIC — remove once the RLS 403 is resolved.
      // Surfaces the session state on-screen (via the existing toast) since
      // devtools/console isn't available in this testing environment.
      const { data: sessionData } = await supabase.auth.getSession();
      const sessEmail = sessionData?.session?.user?.email || "none";
      const hasToken = !!sessionData?.session?.access_token;
      showToast(`Échec: ${error.message} | session=${sessEmail} | token=${hasToken}`);
      return { success: false };
    }
    setEditionsByComp((prev) => {
      const list = prev[competitionId] || [];
      const idx = list.findIndex((e) => e.id === editionId);
      const nextList = idx === -1 ? [...list, data] : list.map((e, i) => (i === idx ? { ...e, ...data } : e));
      return { ...prev, [competitionId]: nextList };
    });
    setSelectedComp((prev) => (prev && prev.id === editionId ? {
      ...prev,
      ...edits,
      contestants: edits.contestants != null ? edits.contestants : prev.contestants,
      endsAt: edits.endsAt != null ? edits.endsAt : prev.endsAt,
      fee: edits.fee != null ? edits.fee : prev.fee,
    } : prev));
    showToast(phase === "draft" ? "Brouillon enregistré." : "Compétition mise à jour.");
    return { success: true, data };
  }

  async function handleAddCompImage(competitionId, file) {
    const position = (compImages[competitionId] || []).length;
    const { data, error } = await addCompetitionImage({ competitionId, file, position });
    if (error) {
      console.error("addCompetitionImage error:", error);
      showToast("Échec de l'envoi de l'image.");
      return null;
    }
    setCompImages((prev) => ({ ...prev, [competitionId]: [...(prev[competitionId] || []), data] }));
    setSelectedComp((prev) => (prev && prev.competitionId === competitionId ? { ...prev, images: [...(prev.images || []), data] } : prev));
    return data;
  }

  async function handleRemoveCompImage(competitionId, imageId) {
    const { error } = await deleteCompetitionImage(imageId);
    if (error) {
      console.error("deleteCompetitionImage error:", error);
      showToast("Échec de la suppression de l'image.");
      return;
    }
    setCompImages((prev) => ({ ...prev, [competitionId]: (prev[competitionId] || []).filter((i) => i.id !== imageId) }));
    setSelectedComp((prev) => (prev && prev.competitionId === competitionId ? { ...prev, images: (prev.images || []).filter((i) => i.id !== imageId) } : prev));
  }

  function pushNotif(notif) {
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, read: false, ts: Date.now(), ...notif },
      ...prev,
    ]);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  useEffect(() => {
    if (homeBannerSlides.length === 0) return;
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % homeBannerSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [homeBannerSlides.length]);

  // Background activity: push a notif for a random hot comp every ~45s
  useEffect(() => {
    const ACTIVITY_NOTIFS = [
      (c, n) => ({ type: "activity", icon: "🔥", title: `${c.title} s'emballe`, body: `${fmtVotes(c.votes + Math.floor(Math.random() * 500))} votes comptabilisés — la compétition est très active.`, compId: c.id }),
      (c, n) => ({ type: "result",   icon: "🏆", title: `Nouveau leader — ${c.title}`, body: `${fakeName(Math.floor(Math.random() * 10))} prend la tête du classement.`, compId: c.id }),
      (c, n) => ({ type: "activity", icon: "⚡", title: `Dernières heures — ${c.title}`, body: `La compétition se termine dans ${c.ends}. Votez maintenant !`, compId: c.id }),
    ];
    function scheduleNext() {
      const delay = 40000 + Math.random() * 20000;
      return setTimeout(() => {
        const hotComps = NICHES.flatMap((n) =>
          n.competitions.flatMap((seed) => publishedEditionsForComp(seed).filter((c) => c.hot && c.active !== false))
        );
        const comp = hotComps[Math.floor(Math.random() * hotComps.length)];
        const template = ACTIVITY_NOTIFS[Math.floor(Math.random() * ACTIVITY_NOTIFS.length)];
        pushNotif(template(comp));
        timerRef.current = scheduleNext();
      }, delay);
    }
    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, []);

  // Rebuild the registered-competitions set from the database whenever we
  // know who the current user is — this runs both after a fresh login and
  // after the session is restored on page refresh, so registration state
  // survives a reload instead of resetting to an empty Set.
  useEffect(() => {
    if (!currentUser?.id) {
      setRegisteredCompIds(new Set());
      return;
    }
    console.log("Fetching registrations for user:", currentUser.id); // debug
    let cancelled = false;
    fetchUserRegistrations(currentUser.id).then((rows) => {
      if (cancelled) return;
      console.log("Registrations returned:", rows); // debug
      setRegisteredCompIds(new Set(rows.map((r) => r.edition_id).filter(Boolean)));
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const nichesByFilter = (
    activeFilter === "Tous"
      ? NICHES
      : NICHES.filter((n) => n.label === activeFilter)
  )
    .map((niche) => ({
      ...niche,
      // Homepage only ever shows published editions the admin has left
      // switched on — one card per non-draft edition, zero if none exist.
      competitions: niche.competitions.flatMap(publishedEditionsForComp).filter((c) => c.active),
    }))
    // A niche with nothing published (or everything switched off)
    // shouldn't appear as an empty section on the homepage at all.
    .filter((niche) => niche.competitions.length > 0);

  // Full, unfiltered list (every niche, every edition — drafts included) —
  // powers the admin page so the platform organizer can find, edit, and
  // finish anything regardless of the homepage's current filter/search
  // state or publish status.
  const allNichesWithEdits = NICHES.map((niche) => ({
    ...niche,
    competitions: niche.competitions.flatMap(allEditionsForComp),
  }));

  // Every seed competition, flat — powers the admin "new edition" picker.
  // Unlike allNichesWithEdits, this always includes a seed competition even
  // if it has zero editions yet, since that's the only way to create its
  // very first one.
  const seedCompetitionsList = NICHES.flatMap((niche) =>
    niche.competitions.map((comp) => ({ key: comp.id, comp, niche }))
  );

  const visibleNiches = query.trim() === ""
    ? nichesByFilter
    : nichesByFilter
        .map((niche) => ({
          ...niche,
          competitions: niche.competitions.filter((c) =>
            c.title.toLowerCase().includes(query.toLowerCase()) ||
            c.edition.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((niche) => niche.competitions.length > 0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleDeposit(methodId) {
    setLastDepositMethod(methodId);
    setShowBuyModal(false);
  }

  function handleWithdraw(amount, methodLabel) {
    if (amount > balance) {
      showToast("Solde insuffisant");
      return;
    }
    setBalance((b) => b - amount);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "withdrawal", label: `Retrait — ${methodLabel}`, amount: -amount, date: "À l'instant" },
      ...tx,
    ]);
    setShowWithdrawModal(false);
    showToast(`Retrait de ${amount.toLocaleString("fr-FR")} HTG en cours`);
  }


  function handleSendGift(gift, comp) {
    if (!currentUser?.id) {
      setShowAuthOverlay(true);
      return;
    }
    const price = comp?.priceHTG ?? gift.cost;
    if (balance < price) {
      showToast("Crédits insuffisants");
      return;
    }
    setBalance((b) => b - price);
    const recipient = comp?.recipientName;
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "gift_sent", label: comp ? `${gift.name} envoyé à ${recipient || "un participant"} — ${comp.title}` : `${gift.name} envoyé`, amount: -price, date: "À l'instant" },
      ...tx,
    ]);
    if (comp) pushNotif({ type: "action", icon: gift.icon, title: `${gift.name} envoyé`, body: `Votre cadeau a été remis à ${recipient || "un participant"} de ${comp.title}.`, compId: comp.id });
    showToast(comp ? `${gift.icon} ${gift.name} → ${recipient || "participant"}` : `${gift.icon} ${gift.name} envoyé`);
  }

  async function handleRegister(comp, fee) {
    if (!currentUser?.id) {
      return { success: false, error: "Vous devez être connecté pour vous inscrire." };
    }
    if (currentUser.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE) {
      return { success: false, error: "Un organisateur ne peut pas s'inscrire à sa propre compétition." };
    }

    const { error } = await insertRegistration({
      editionId: comp.id,
      competitionId: comp.competitionId,
      userId: currentUser.id,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      fee: fee || 0,
    });

    if (error) {
      const alreadyRegistered = error.code === "23505"; // unique(edition_id, user_id) violation
      return {
        success: false,
        error: alreadyRegistered
          ? "Vous êtes déjà inscrit à cette compétition."
          : "Une erreur est survenue. Réessayez.",
      };
    }

    if (fee) {
      setBalance((b) => b - fee);
      setTransactions((tx) => [
        { id: `t-${Date.now()}`, type: "gift_sent", label: `Inscription — ${comp.title}`, amount: -fee, date: "À l'instant" },
        ...tx,
      ]);
    }
    setRegisteredCompIds((prev) => new Set(prev).add(comp.id));
    pushNotif({ type: "action", icon: "✅", title: `Inscription confirmée`, body: `Vous êtes inscrit à ${comp.title}. Bonne chance !`, compId: comp.id });
    showToast(`Inscrit à ${comp.title}!`);
    return { success: true };
  }

  function toggleFollowComp(comp) {
    if (!isAuthenticated) {
      setPendingRegistrationComp({ ...comp, _pendingAction: "follow" });
      setShowAuthOverlay(true);
      return;
    }
    setFollowedCompIds((prev) => {
      const next = new Set(prev);
      if (next.has(comp.id)) {
        next.delete(comp.id);
        showToast(`Suivi retiré — ${comp.title}`);
      } else {
        next.add(comp.id);
        pushNotif({ type: "registration", icon: "🔔", title: `Vous suivez ${comp.title}`, body: `Vous recevrez des notifications sur l'évolution des inscriptions et des votes.`, compId: comp.id });
        showToast(`${comp.title} ajouté aux suivis`);
      }
      return next;
    });
  }

  function requestRegistration(comp) {
    if (registeredCompIds.has(comp.id)) {
      showToast(`Vous êtes déjà inscrit à ${comp.title}`);
      return;
    }
    if (currentUser?.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE) {
      showToast("Un organisateur ne peut pas s'inscrire à sa propre compétition");
      return;
    }
    if (!isAuthenticated) {
      setPendingRegistrationComp(comp);
      setShowAuthOverlay(true);
    } else {
      setRegistrationComp(comp);
      setShowRegistrationModal(true);
    }
  }

  async function handleAuthenticated(user) {
    const rawName = user.user_metadata?.full_name;
    const isPlatformOrganizer = user.email?.toLowerCase() === PLATFORM_ORGANIZER_EMAIL.toLowerCase();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, moncash_verified, natcash_verified")
      .eq("id", user.id)
      .maybeSingle();

    // A custom name set via the in-app editor lives in `profiles.full_name`,
    // not in the OAuth provider's metadata — Google (and other providers)
    // re-sync `user_metadata.full_name` from the provider's own profile on
    // every sign-in, which would silently clobber a custom name if we read
    // from there first. `profiles.full_name` always wins when present.
    const fullName = isPlatformOrganizer
      ? PLATFORM_ORGANIZER_SIGLE
      : profileRow?.full_name || rawName || user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    // Same reasoning for the picture: a photo the person uploaded themselves
    // (profiles.avatar_url) always wins over the OAuth provider's photo, so
    // it survives future Google/Facebook sign-ins instead of being clobbered.
    const avatarUrl = profileRow?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    setIsAuthenticated(true);
    setCurrentUser({
      id: user.id,
      email: user.email,
      fullName,
      avatarUrl,
      isOrganizer: isPlatformOrganizer,
      organizerStatus: isPlatformOrganizer ? "approved" : null,
      moncashNumber: user.user_metadata?.moncash_number || null,
      natcashNumber: user.user_metadata?.natcash_number || null,
      moncashVerified: !!profileRow?.moncash_verified,
      natcashVerified: !!profileRow?.natcash_verified,
    });
    setShowAuthOverlay(false);
    if (pendingRegistrationComp) {
      const pending = pendingRegistrationComp;
      setPendingRegistrationComp(null);
      if (pending._pendingAction === "follow") {
        setFollowedCompIds((prev) => {
          const next = new Set(prev);
          next.add(pending.id);
          return next;
        });
        showToast(`${pending.title} ajouté aux suivis`);
      } else {
        setRegistrationComp(pending);
        setShowRegistrationModal(true);
      }
    }
  }

  // Restore an existing Supabase session on load, and keep state in sync
  // with sign-in / sign-out / token refresh events from anywhere in the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthenticated(session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setCurrentUser(null);
      } else if (session?.user) {
        handleAuthenticated(session.user);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast && showToast("Déconnecté");
  }

  async function handleUpdateMobileMoneyNumber(method, number) {
    const metadataKey = method === "moncash" ? "moncash_number" : "natcash_number";
    const verifiedKey = method === "moncash" ? "moncash_verified" : "natcash_verified";
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Votre session a expiré. Reconnectez-vous et réessayez.");
    }
    const userId = sessionData.session.user.id;

    const { error } = await supabase.auth.updateUser({ data: { [metadataKey]: number } });
    if (error) {
      console.error("supabase.auth.updateUser error:", error);
      throw error;
    }

    // If the number is actually changing, it goes back to unverified —
    // it only becomes verified again once a real deposit arrives from it.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select(metadataKey)
      .eq("id", userId)
      .maybeSingle();
    const numberChanged = existingProfile?.[metadataKey] !== number;

    // Also mirror into `profiles` so the SMS server can match this number
    // with a simple queryable column (auth.users metadata isn't queryable
    // from the backend without the admin API).
    const patch = {
      id: userId,
      user_id: userId, // keep both in sync while it exists
      [metadataKey]: number,
      updated_at: new Date().toISOString(),
    };
    if (numberChanged) {
      patch[verifiedKey] = false;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(patch, { onConflict: "id" });
    if (profileError) {
      console.error("profiles upsert error:", profileError);
      if (profileError.code === "23505") {
        throw new Error("Ce numéro est déjà vérifié et lié à un autre compte.");
      }
      throw profileError;
    }
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            moncashNumber: method === "moncash" ? number : prev.moncashNumber,
            natcashNumber: method === "natcash" ? number : prev.natcashNumber,
            moncashVerified: method === "moncash" && numberChanged ? false : prev.moncashVerified,
            natcashVerified: method === "natcash" && numberChanged ? false : prev.natcashVerified,
          }
        : prev
    );
  }

  async function handleUpdateFullName(newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error("Le nom ne peut pas être vide.");
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Votre session a expiré. Reconnectez-vous et réessayez.");
    }
    const userId = sessionData.session.user.id;

    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (error) {
      console.error("supabase.auth.updateUser error:", error);
      throw error;
    }

    // Source of truth for display purposes going forward — this is what
    // survives the next Google (or other OAuth) login, since that flow
    // re-syncs user_metadata.full_name from the provider and would
    // otherwise overwrite a custom name.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, user_id: userId, full_name: trimmed, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (profileError) {
      console.error("profiles full_name upsert error:", profileError);
      throw new Error("Le nom a été mis à jour, mais n'a pas pu être enregistré pour la prochaine connexion.");
    }

    // The name is also copied (denormalized) onto the user's own existing
    // rows in a few tables — backfill those too so the new name is visible
    // to every user, not just reflected locally in this session.
    const [regResult, comResult, mediaResult] = await Promise.all([
      supabase.from("registrations").update({ full_name: trimmed }).eq("user_id", userId),
      supabase.from("comments").update({ full_name: trimmed }).eq("user_id", userId),
      supabase.from("participant_media").update({ uploader_name: trimmed }).eq("uploader_id", userId),
    ]);
    if (regResult.error) console.error("registrations name backfill error:", regResult.error);
    if (comResult.error) console.error("comments name backfill error:", comResult.error);
    if (mediaResult.error) console.error("participant_media name backfill error:", mediaResult.error);

    setCurrentUser((prev) => (prev ? { ...prev, fullName: trimmed } : prev));
  }

  // Lets a signed-in user change their profile picture. Uploads to a public
  // "avatars" Storage bucket (create it in the Supabase dashboard if it
  // doesn't exist yet, with public read access), then persists the URL to
  // `profiles.avatar_url` and backfills it onto the user's own existing rows
  // so the new picture shows up everywhere in the app — comments they've
  // posted, their registration entries, and their donateur history — not
  // just in their account page.
  async function handleUpdateAvatar(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      throw new Error("Choisissez un fichier image (JPG, PNG, etc.).");
    }
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      throw new Error("L'image est trop grande (5 Mo maximum).");
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("Votre session a expiré. Reconnectez-vous et réessayez.");
    }
    const userId = sessionData.session.user.id;

    // Always the same path per user (upsert) so we don't accumulate orphaned
    // files on every change — just overwrite the one avatar they have.
    const path = `${userId}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      console.error("avatar upload error:", uploadError);
      throw new Error("Échec de l'envoi de l'image. Réessayez.");
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so the new photo shows immediately instead of a stale CDN
    // copy at the same URL.
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, user_id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (profileError) {
      console.error("profiles avatar_url upsert error:", profileError);
      throw new Error("La photo a été envoyée, mais n'a pas pu être enregistrée pour la prochaine connexion.");
    }

    // Denormalized copies elsewhere, same pattern as the name backfill above.
    const [regResult, comResult, mediaResult, giftResult] = await Promise.all([
      supabase.from("registrations").update({ avatar_url: avatarUrl }).eq("user_id", userId),
      supabase.from("comments").update({ avatar_url: avatarUrl }).eq("user_id", userId),
      supabase.from("participant_media").update({ uploader_avatar_url: avatarUrl }).eq("uploader_id", userId),
      supabase.from("gifts").update({ sender_avatar_url: avatarUrl }).eq("sender_id", userId),
    ]);
    if (regResult.error) console.error("registrations avatar backfill error:", regResult.error);
    if (comResult.error) console.error("comments avatar backfill error:", comResult.error);
    if (mediaResult.error) console.error("participant_media avatar backfill error:", mediaResult.error);
    if (giftResult.error) console.error("gifts avatar backfill error:", giftResult.error);

    setCurrentUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F2F2F0; }
        @keyframes toast-up {
          0%   { opacity: 0; transform: translateX(-50%) translateY(12px); }
          12%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        }
        @keyframes bar-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .bar-shimmer {
          background-size: 200% 100%;
          animation: bar-shimmer 1.6s linear infinite;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            zIndex: 9999,
            background: "#444",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.04em",
            padding: "10px 22px",
            border: "1px solid #ddd",
            animation: "toast-up 2.5s ease forwards",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {activeTab === "wallet" ? (
        <WalletPage
          balance={balance}
          transactions={transactions}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          onOpenDeposit={() => setShowBuyModal(true)}
          onOpenWithdraw={() => setShowWithdrawModal(true)}
          onOpenNotifications={() => setActiveTab("notifications")}
          onUpdateNumber={handleUpdateMobileMoneyNumber}
          onRequireAuth={() => setShowAuthOverlay(true)}
          showToast={showToast}
          onBack={() => setActiveTab("home")}
        />
      ) : activeTab === "notifications" ? (
        <NotificationsPage
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onOpen={(compId) => {
            const result = findEditionWithNiche(compId);
            if (result) { setCompEditIntent(false); setSelectedComp({ ...result.comp, accent: result.niche.accent, niche: result.niche.label }); }
          }}
        />
      ) : activeTab === "mycomps" ? (
        <MyCompetitionsPage
          registeredEntries={registeredEntries}
          followedEntries={followedEntries}
          onOpen={(comp) => { setCompEditIntent(false); setSelectedComp(comp); }}
        />
      ) : activeTab === "account" ? (
        <AccountPage
          currentUser={currentUser}
          balance={balance}
          onOpenWallet={() => setActiveTab("wallet")}
          onLoginRequest={() => setShowAuthOverlay(true)}
          onLogout={handleLogout}
          onOpenAdmin={() => setActiveTab("admin")}
          onUpdateFullName={handleUpdateFullName}
          onUpdateAvatar={handleUpdateAvatar}
          showToast={showToast}
        />
      ) : activeTab === "admin" && currentUser?.isOrganizer ? (
        <AdminPage
          niches={allNichesWithEdits}
          seedCompetitions={seedCompetitionsList}
          onOpenComp={handleAdminOpenComp}
          onToggleActive={handleToggleCompActive}
          onCreateEdition={handleCreateDraftEdition}
          onPublishEdition={handlePublishEdition}
          onDeleteEdition={handleDeleteEdition}
          onBack={() => setActiveTab("account")}
        />
      ) : (
      <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 64 }}>

        {/* ── HEADER ── */}
        <header
          style={{
            borderBottom: "1px solid #e0e0e0",
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          {/* Search bar */}
          <div style={{ padding: "8px" }}>
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: `1px solid ${homeSearchFocused ? "#111" : "#e0e0e0"}`,
                background: "#f9f9f9",
                height: 38,
                borderRadius: 10,
                padding: "0 10px",
                transition: "border-color 0.15s",
              }}
            >
              <Search size={15} color={homeSearchFocused ? "#333" : "#aaa"} strokeWidth={2.25} style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Rechercher une compétition..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setHomeSearchFocused(true)}
                onBlur={() => setHomeSearchFocused(false)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#333",
                  background: "transparent",
                  height: "100%",
                }}
              />
            </div>
          </div>

          {/* Chips row — edge to edge */}
          <div style={{ display: "flex", gap: 8, padding: "0 8px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
            {ALL_NICHES.map((label) => {
              const active = activeFilter === label;
              const niche = NICHES.find((n) => n.label === label);
              return (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: active ? "#fff" : "#666",
                    background: active ? "#111" : "#f5f5f5",
                    border: `1px solid ${active ? "#111" : "#e5e5e5"}`,
                    borderRadius: 20,
                    padding: "6px 14px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background 0.12s, color 0.12s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {(() => { const Icon = NICHE_ICONS[label]; return Icon ? <Icon size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} /> : null; })()}
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* ── BANNER SLIDER (2:1, real uploaded images only) ── */}
        {homeBannerSlides.length > 0 && (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "2.2 / 1",
            overflow: "hidden",
            borderBottom: "2px solid #111",
          }}
        >
          {homeBannerSlides.map((slide, i) => (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: i === bannerIndex ? 1 : 0,
                transition: "opacity 0.8s ease",
              }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  background: slide.color,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(90deg, ${slide.color}55 0%, transparent 60%)`,
                  mixBlendMode: "multiply",
                }}
              />
            </div>
          ))}

          {/* Dots */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
              zIndex: 2,
            }}
          >
            {homeBannerSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIndex(i)}
                style={{
                  width: i === bannerIndex ? 28 : 8,
                  height: 8,
                  border: "1px solid rgba(255,255,255,0.6)",
                  background: i === bannerIndex ? "#fff" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        )}

        <NewsBand />

        {/* ── NICHE ROWS ── */}
        <main
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            paddingTop: 14,
            paddingBottom: 60,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {visibleNiches.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 8px", borderTop: "1px solid #ddd", background: "#fff" }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: "#333", letterSpacing: "-0.02em" }}>Aucun résultat</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#aaa", marginTop: 8 }}>Aucune compétition ne correspond à « {query} »</div>
              <button onClick={() => setQuery("")} style={{ marginTop: 20, border: "1px solid #ddd", background: "#444", color: "#fff", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer" }}>Effacer la recherche</button>
            </div>
          ) : visibleNiches.map((niche) => (
            <NicheRow
              key={niche.id}
              niche={niche}
              onOpen={(comp) => { setCompEditIntent(false); setSelectedComp({ ...comp, accent: niche.accent, niche: niche.label }); }}
              onRegister={(comp) => requestRegistration({ ...comp, accent: niche.accent, niche: niche.label })}
              registeredCompIds={registeredCompIds}
              currentUser={currentUser}
            />
          ))}
        </main>


      </div>
      )}

      {showBuyModal && (
        <DepositModal onClose={() => setShowBuyModal(false)} onDeposit={handleDeposit} lastMethod={lastDepositMethod} />
      )}
      {showWithdrawModal && (
        <WithdrawModal balance={balance} onClose={() => setShowWithdrawModal(false)} onWithdraw={handleWithdraw} />
      )}
      {showRegistrationModal && registrationComp && (
        <RegistrationModal 
          comp={registrationComp} 
          currentUser={currentUser}
          balance={balance}
          onOpenBuy={() => setShowBuyModal(true)}
          onClose={() => {
            setShowRegistrationModal(false);
            setRegistrationComp(null);
          }}
          onRegister={handleRegister}
          showToast={showToast}
        />
      )}

      {showAuthOverlay && (
        <AuthOverlay
          compTitle={pendingRegistrationComp?._pendingAction !== "follow" ? pendingRegistrationComp?.title : undefined}
          followIntent={pendingRegistrationComp?._pendingAction === "follow" ? pendingRegistrationComp?.title : undefined}
          onClose={() => {
            setShowAuthOverlay(false);
            setPendingRegistrationComp(null);
          }}
          onAuthenticated={handleAuthenticated}
        />
      )}

      <BottomTabBar active={activeTab} onChange={setActiveTab} unreadCount={unreadCount} currentUser={currentUser} />

      {selectedComp && (
        <CompetitionBoard
          key={selectedComp.id}
          comp={selectedComp}
          onClose={() => { setSelectedComp(null); setCompEditIntent(false); setPendingNewEdition(false); }}
          balance={balance}
          onSendGift={handleSendGift}
          onOpenBuy={() => setShowBuyModal(true)}
          onRegister={requestRegistration}
          showToast={showToast}
          isRegistered={registeredCompIds.has(selectedComp.id)}
          isFollowed={followedCompIds.has(selectedComp.id)}
          onToggleFollow={toggleFollowComp}
          currentUser={currentUser}
          onRequestAuth={() => setShowAuthOverlay(true)}
          onEditComp={handleEditComp}
          onCreateComp={handleCreateEditionSave}
          onAddImage={handleAddCompImage}
          onRemoveImage={handleRemoveCompImage}
          startInEditMode={compEditIntent}
          isNewEdition={pendingNewEdition}
        />
      )}
    </>
  );
}
