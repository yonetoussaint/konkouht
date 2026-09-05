import { useState, useRef, useEffect, useMemo } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { Audio as AudioBarsLoader } from "react-loader-spinner";
import { createClient } from "@supabase/supabase-js";
import { Music, PersonStanding, Trophy, Palette, Laugh, Gamepad2, LayoutGrid, Home, Wallet, User, Users, Bell, BadgeCheck, Play, File, Plus, Gift, ArrowDownLeft, ArrowUpRight, ShoppingCart, X, Check, Sparkles, ChevronsUp, ArrowLeft, Send, ChevronRight, ChevronLeft, Copy, CreditCard, HelpCircle, Search, Menu, MessageCircle, Image as ImageIcon, Mail, Lock, Eye, EyeOff, Heart, Share2, Sticker, Info, Volume2, VolumeX, Radio, Mic, MicOff, Hand, Clock, Flame, ArrowUp, ArrowDown, Pencil } from "lucide-react";
import CompCard from "./CompCard";
import CompetitionBoard from "./CompetitionBoard";
import CommentsSheet from "./CommentsSheet";
import ShareSheet from "./ShareSheet";
import { shortenEditionUrl } from "./lib/share";
import { App as CapacitorApp } from "@capacitor/app";
import { isNative } from "./native";
import WalletPage from "./WalletPage";
import ComitePanel from "./ComitePanel";
import HomePage from "./HomePage";

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
//   short_url text,                    -- set once by createEdition() right
//                                       -- after insert (see src/lib/share.js
//                                       -- shortenEditionUrl) so every reader
//                                       -- gets the share link straight off
//                                       -- the row — no client-side prefetch
//                                       -- race. Nullable: a handful of older
//                                       -- rows predate this column and fall
//                                       -- back to the long share URL / the
//                                       -- mount-time backfill.
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
//   live_duration_seconds numeric,     -- set once at creation (or while still
//                                       -- in registration); read by
//                                       -- open_expired_registrations to compute
//                                       -- the live-phase ends_at at transition
//                                       -- time. Not editable once phase='live'.
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
// -- UPDATE: every signed-in user can now create/edit their OWN
// -- competitions, not just the platform organizer. This needs a
// -- `created_by` (+ `organisateur`) column and replaces the three
// -- organizer-only policies above with owner-or-organizer versions —
// -- see allow-user-created-competitions.sql for the full migration
// -- (columns, policies, and what still needs manual attention).
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
//   is_early_bird boolean not null default false, -- true for the first 3
//     -- registrants (by created_at) of an edition; they get half their fee
//     -- refunded instantly via refundRegistrationFee. Queryable so the
//     -- organizer/UI can show an early-bird badge without recomputing it.
//   created_at timestamptz not null default now(),
//   unique (edition_id, user_id)
// );
// -- If upgrading an existing registrations table:
// alter table registrations
//   add column if not exists edition_id uuid,
//   add column if not exists avatar_url text,
//   add column if not exists is_early_bird boolean not null default false;
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
    shortUrl: row.short_url,
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
    liveDurationSeconds: row.live_duration_seconds,
    createdAt: row.created_at,
    // Ownership — whoever actually created this edition. Null for older
    // rows created before this column existed (those fall back to the
    // platform-organizer default in isCompOwner). `organisateur` lets a
    // user-created edition show its own creator's name instead of always
    // inheriting the seed competition's hardcoded "FNCH".
    createdBy: row.created_by ?? null,
    organisateur: row.organisateur ?? null,
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
// Every edition defaults to a fixed schedule — 1 week to register, then
// (if it isn't already full and live by then) 1 week live. The admin can
// still override either with a custom date/duration via the "Date
// personnalisée" tab in the edit form; when they don't, these defaults
// are used.
const WEEK_SECONDS = 7 * 24 * 60 * 60;

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
  liveDurationSeconds,
  updatedBy,
  createdBy,
  organisateur,
}) {
  const { data, error } = await supabase
    .from(EDITIONS_TABLE)
    .insert({
      competition_id: competitionId,
      title,
      edition,
      ends,
      ends_at: endsAt ?? new Date(Date.now() + WEEK_SECONDS * 1000).toISOString(),
      phase: "registration",
      contestants,
      banner_url: bannerUrl,
      description,
      prize_amount: prizeAmount,
      fee,
      reward_extra: rewardExtra,
      rules,
      live_duration_seconds: liveDurationSeconds ?? WEEK_SECONDS,
      active: true,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
      // Ownership is set once, here, at creation — never touched again by
      // later edits (see saveEditionEdit, which never patches these).
      created_by: createdBy,
      organisateur,
    })
    .select()
    .single();

  if (error) {
    console.error("createEdition error:", error);
    return { data: null, error };
  }

  // Shorten ONCE, right here at creation time, and persist it to the row —
  // this is the only place an edition's id is ever new, so it's the only
  // place that needs to call the shortener. Every future read (this admin's
  // own next render, every other client, the share sheet, the native share
  // tap) then just reads short_url straight off the row — no per-client,
  // per-mount fetch, and nothing to race against a quick share tap or a
  // fresh app launch. If the shorten call fails here (network hiccup),
  // shortUrl stays null and callers fall back to the long link or the
  // mount-time backfill in lib/share.js; it's not retried automatically.
  const shortUrl = await shortenEditionUrl(data.id);
  if (shortUrl) {
    const { data: updated, error: shortenError } = await supabase
      .from(EDITIONS_TABLE)
      .update({ short_url: shortUrl })
      .eq("id", data.id)
      .select()
      .single();
    if (!shortenError && updated) {
      return { data: mapEditionRow(updated), error: null };
    }
    console.error("createEdition: failed to persist short_url:", shortenError);
  }

  return { data: mapEditionRow(data), error: null };
}

// ISO-8601 week number (Monday-start, week 1 = the week containing the
// year's first Thursday) for a given date. Used only to label auto-
// generated weekly editions ("Semaine 32"), never sent to the database
// as-is.
export function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1 .. Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
  liveDurationSeconds,
  updatedBy,
}) {
  const patch = { updated_by: updatedBy, updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  if (edition !== undefined) patch.edition = edition;
  if (ends !== undefined) patch.ends = ends;
  if (phase !== undefined) patch.phase = phase;
  if (contestants !== undefined) patch.contestants = contestants;
  if (bannerUrl !== undefined) patch.banner_url = bannerUrl;
  if (description !== undefined) patch.description = description;
  if (prizeAmount !== undefined) patch.prize_amount = prizeAmount;
  if (fee !== undefined) patch.fee = fee;
  if (rewardExtra !== undefined) patch.reward_extra = rewardExtra;
  if (rules !== undefined) patch.rules = rules;
  if (active !== undefined) patch.active = active;
  // endsAt/liveDurationSeconds are no longer admin-typed anywhere — the
  // only caller that still passes them is handlePublishEdition, which
  // computes a fixed "now + 1 week" value to start a draft's clock.
  if (endsAt !== undefined) patch.ends_at = endsAt;
  if (liveDurationSeconds !== undefined) patch.live_duration_seconds = liveDurationSeconds;

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

// Downsizes and re-encodes an image before upload so banners stay
// link-preview-friendly (WhatsApp/Facebook crawlers are unreliable above a
// couple hundred KB). Falls back to the original file if compression fails
// or doesn't actually save space — never blocks an upload on this.
//
// Reads dimensions via a plain <img> first (cheap — the browser doesn't
// have to decode full pixel data just to report width/height), then asks
// createImageBitmap to decode straight to the target size via
// resizeWidth/resizeHeight. Decoding a 12MP camera photo at full res before
// scaling it down (the previous approach) is what was making this slow.
//
// Returns a plain { body, name, type } object rather than a File — the
// Android WebView Capacitor runs in doesn't reliably support `new File(...)`
// even though Blob works fine, so we upload the Blob directly.
async function compressImageFile(file, { maxDimension = 1280, quality = 0.8 } = {}) {
  const original = { body: file, name: file.name, type: file.type };
  if (!file || !file.type?.startsWith("image/")) return original;

  const objectUrl = URL.createObjectURL(file);
  let naturalWidth, naturalHeight;
  try {
    ({ naturalWidth, naturalHeight } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image load failed"));
      img.src = objectUrl;
    }));
  } catch {
    URL.revokeObjectURL(objectUrl);
    return original;
  }
  URL.revokeObjectURL(objectUrl);

  let width = naturalWidth;
  let height = naturalHeight;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "medium",
    });
  } catch {
    return original;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return original;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { body: blob, name: newName, type: "image/jpeg" };
}


// Upload a dedicated banner image for ONE edition and return its public
// URL. This is intentionally separate from the shared per-series gallery
// (competition_images / addCompetitionImage below): that gallery is keyed
// by the seed competition_id and is shared across every edition of a
// series on purpose, so tagging a shared photo as "the banner" let one
// edition's chosen image visually bleed onto sibling editions that shared
// the same pool (and, worse, onto a completely different competition if an
// admin re-picked the same-looking tile while editing another edition).
// Keying this upload by the edition's OWN id — never the seed id — instead
// of a shared folder makes every edition's banner file, path, and URL
// unique in storage as well as in the database, so there's no shared
// resource left for two competitions to collide on. `upsert: true` only
// overwrites THIS edition's own previous banner file (re-uploading a new
// one for the same edition), never another edition's.
async function uploadEditionBanner({ editionId, file }) {
  const img = await compressImageFile(file);
  const ext = img.name.split(".").pop() || "jpg";
  const path = `banners/${editionId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, img.body, { upsert: true, cacheControl: "3600", contentType: img.type });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so re-uploading a new banner for the same edition (same
  // path, upsert) shows up immediately instead of an old cached copy.
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
  const img = await compressImageFile(file);
  const ext = img.name.split(".").pop() || "jpg";
  const filePath = `${competitionId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, img.body, { contentType: img.type });
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

export async function fetchRegistrations(editionId) {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, user_id, full_name, avatar_url, fee_paid, created_at, is_early_bird")
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

// Early-bird rule: the first N registrants (by created_at) on an edition
// get half their registration fee refunded instantly, straight to their
// wallet, as soon as they register. Everyone after them pays full price
// and their fee goes to the prize pool as usual.
// NOTE: the actual early-bird tagging/discount logic now runs inside
// register_for_competition (see wallet_rpc_migration.sql), not here. These
// two constants are kept only for any UI copy that references them (e.g.
// "first 3 spots") — if you change one, change both places.
const EARLY_BIRD_LIMIT = 3;
const EARLY_BIRD_DISCOUNT = 0.5;

// Registration + fee debit + early-bird tagging/discount all happen inside
// one atomic DB transaction (register_for_competition, see
// wallet_rpc_migration.sql) — the client never writes wallet_transactions/
// wallet_balances directly for a registration, and never passes a userId:
// the function always debits auth.uid(), so a client can't pay as someone
// else. This is also where the real balance is checked; there's no local
// "is balance high enough" client check that can go stale or race.
async function insertRegistration({ editionId, competitionId, fullName, avatarUrl, fee }) {
  const { data, error } = await supabase.rpc("register_for_competition", {
    p_edition_id: editionId,
    p_competition_id: competitionId,
    p_full_name: fullName,
    p_avatar_url: avatarUrl,
    p_fee: fee || 0,
  });

  if (error) return { data: null, error };

  // The RPC returns a `table(...)`, so postgrest hands it back as an array.
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row, error: null };
}

// Admin-only removal (enforced both client-side by isOwnCompetition/phase
// checks in App.jsx, and server-side by the "only the platform organizer
// can delete registrations" RLS policy above). Deletes the row outright —
// there's no "removed" status, since a removed registration during the
// registration phase shouldn't linger anywhere in the participant lists.
// Atomic (row-locked update, no more fetch-then-upsert race) and
// organizer-only — refund_registration_fee checks the caller's JWT email
// itself, so this can only ever be called successfully from an
// organizer-authenticated session (edition deletion, participant removal).
export async function refundRegistrationFee({ userId, amount, competitionTitle, isEarlyBird }) {
  if (!amount) return { error: null };

  const { error } = await supabase.rpc("refund_registration_fee", {
    p_user_id: userId,
    p_amount: amount,
    p_competition_title: competitionTitle,
    p_is_early_bird: !!isEarlyBird,
  });
  if (error) {
    console.error("refundRegistrationFee error:", error);
    return { error };
  }

  return { error: null };
}

// Withdrawals and gift-sends used to be local-state-only (setBalance +
// a fake `t-${Date.now()}` transaction) and never touched wallet_balances/
// wallet_transactions at all — the balance and the "history" entry both
// vanished on refresh since nothing was persisted. These two mirror
// insertRegistration/refundRegistrationFee above: one atomic RPC call
// (withdraw_from_wallet / debit_wallet_for_gift, see
// wallet_rpc_migration.sql) that checks the real balance, debits it, and
// logs the wallet_transactions row server-side, scoped to auth.uid() so a
// client can never debit someone else's wallet. The client trusts the
// returned balance instead of subtracting locally.
async function withdrawFromWallet({ amount, methodLabel }) {
  const { data, error } = await supabase.rpc("withdraw_from_wallet", {
    p_amount: amount,
    p_method_label: methodLabel,
  });
  if (error) return { newBalance: null, error };
  return { newBalance: Number(data), error: null };
}

async function debitWalletForGift({ amount, label }) {
  const { data, error } = await supabase.rpc("debit_wallet_for_gift", {
    p_amount: amount,
    p_label: label,
  });
  if (error) return { newBalance: null, error };
  return { newBalance: Number(data), error: null };
}

// ── Admin withdrawal-confirmation PIN + pending-withdrawal review ─────────
// Withdrawals now land as `status: "pending"` (see withdraw_from_wallet in
// the wallet_rpc_migration.sql update) — the balance is debited right
// away so the same funds can't be withdrawn twice, but nothing is actually
// paid out until the organizer reviews it here and confirms with a PIN
// that's stored hashed (bcrypt, via pgcrypto) server-side in
// admin_settings. The client never sees or stores the PIN itself; every
// check happens inside the SECURITY DEFINER RPCs, which also re-verify the
// caller is the organizer.
async function adminPinExists() {
  const { data, error } = await supabase.rpc("admin_pin_exists");
  if (error) return { exists: false, error };
  return { exists: !!data, error: null };
}

async function setAdminPin({ newPin, currentPin }) {
  const { error } = await supabase.rpc("set_admin_pin", {
    p_new_pin: newPin,
    p_current_pin: currentPin || null,
  });
  return { error };
}

async function listPendingWithdrawals() {
  const { data, error } = await supabase.rpc("list_pending_withdrawals");
  if (error) return { withdrawals: [], error };
  return { withdrawals: data || [], error: null };
}

async function confirmWithdrawal({ transactionId, pin }) {
  const { error } = await supabase.rpc("confirm_withdrawal", {
    p_transaction_id: transactionId,
    p_pin: pin,
  });
  return { error };
}

async function rejectWithdrawal({ transactionId, pin, reason }) {
  const { error } = await supabase.rpc("reject_withdrawal", {
    p_transaction_id: transactionId,
    p_pin: pin,
    p_reason: reason || null,
  });
  return { error };
}

/* ─── DATA ─────────────────────────────────────────────────────────────── */

// FNCH ("Fédération Nationale des Concours d'Haïti") is the platform's own
// organizing body — every competition on the app is run under this sigle,
// and this account is auto-recognized as its verified organizer.
const PLATFORM_ORGANIZER_EMAIL = "yonetoussaint25@gmail.com";
export const PLATFORM_ORGANIZER_SIGLE = "FNCH";

// Every signed-in user can create and manage their own competitions now —
// not just the platform organizer. A competition/edition is "owned" by
// whoever created it (comp.createdBy, set once at insert time and never
// changed by later edits — see createEdition). The platform organizer
// remains the owner of every pre-existing/seeded competition (the ones
// with no createdBy yet, or explicitly organized under PLATFORM_ORGANIZER_SIGLE)
// so nothing already live changes hands. Use this everywhere instead of
// re-deriving ownership inline, so the rule stays in one place.
export function isCompOwner(comp, currentUser) {
  if (!comp || !currentUser?.id) return false;
  if (comp.createdBy) return comp.createdBy === currentUser.id;
  return !!currentUser.isOrganizer && comp.organisateur === PLATFORM_ORGANIZER_SIGLE;
}

const NICHES = [
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
];

/* ─── WALLET DATA ───────────────────────────────────────────────────────── */

const DEPOSIT_PACKS = [
  { id: "p1", amount: 500 },
  { id: "p2", amount: 2500 },
  { id: "p3", amount: 5000, popular: true },
  { id: "p4", amount: 10000 },
];

export const MOBILE_MONEY_NUMBERS = {
  moncash: { number: "34697931", name: "Jean Baptiste" },
  natcash: { number: "+509 37 XX XX XX", name: "Jean Baptiste" },
};

export const PAYMENT_METHODS = [
  { id: "moncash", label: "MonCash", accent: "#F26522" },
  { id: "natcash", label: "NatCash", accent: "#0072CE" },
  { id: "card", label: "Carte bancaire", accent: "#111111" },
];

// Turns an emoji character into a Google Noto "Animated Emoji" Lottie URL.
// Google hosts a Lottie JSON per emoji at this CDN path, keyed by the
// emoji's Unicode codepoint(s) joined with "_" (variation selector FE0F is
// dropped from the filename).
const INITIAL_TRANSACTIONS = [
  { id: "t1", type: "deposit", label: "Dépôt — MonCash", amount: 550, date: "Aujourd'hui, 09:14" },
  { id: "t2", type: "gift_sent", label: "Couronne envoyée — Concours de Beauté", amount: -150, date: "Hier, 21:02" },
  { id: "t3", type: "gift_sent", label: "Flamme envoyée — Miss Élégance", amount: -50, date: "Hier, 18:47" },
  { id: "t4", type: "withdrawal", label: "Retrait — NatCash", amount: -200, date: "13 juin, 17:05" },
  { id: "t5", type: "deposit", label: "Dépôt — Carte bancaire", amount: 100, date: "12 juin, 14:30" },
  { id: "t6", type: "gift_sent", label: "Étoile envoyée — Top Model Open", amount: -25, date: "10 juin, 20:15" },
];


const NICHE_ICONS = {
  "Tous": LayoutGrid,
  "Favoris": Heart,
  "Musique": Music,
  "Danse": PersonStanding,
  "Sports": Trophy,
  "Art & Design": Palette,
  "Comédie": Laugh,
  "Beauté": Sparkles,
  "Gaming": Gamepad2,
};

/* ─── HELPERS ───────────────────────────────────────────────────────────── */

// Compact "time remaining" label (e.g. "2j 5h", "3h 20m", "45m") used on
// CompCard's countdown badge — was imported but never defined.
export function fmtCountdown(target) {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return "Terminé";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function fmtVotes(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// Compact formatter for small counter badges (shares, comments, followers)
// on CompCard — same "1.2k" style as fmtVotes, kept as its own export since
// it's conceptually a different kind of count (engagement, not vote tally).
export function formatCoins(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// People read a fixed point in time ("20 Juil, 3:45 PM") far faster than a
// duration ("2j 12h") — no mental math needed to figure out whether that's
// tonight or next week. Used for both inscription deadlines and competition
// end times, wherever we'd otherwise show a countdown-style duration.
export const FR_MONTH_ABBR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
export function fmtAbsoluteDateOnly(target) {
  const d = new Date(target);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.getDate();
  const month = FR_MONTH_ABBR[d.getMonth()];
  return `${date} ${month}`;
}

// Compact duration for the card overlay chip ("2j 14h", "6h 22m") — the
// stats row below already shows the absolute deadline, so this is just a
// quick-glance urgency cue, not meant to be precise to the minute.
// Shared with fmtCountdown's parsing logic, but returns a raw timestamp for
// sorting purposes (e.g. "Se termine bientôt" section) rather than a
// display string. Mirrors CompCard's own resolvedEndDate derivation so the
// homepage's notion of "soonest" matches what each card individually shows.
function estimateEndTimestamp(comp) {
  if (comp.endsAt) return new Date(comp.endsAt).getTime();
  const str = comp.ends || "";
  let total = 0;
  const d = str.match(/(\d+)j/); if (d) total += parseInt(d[1]) * 86400;
  const h = str.match(/(\d+)h/); if (h) total += parseInt(h[1]) * 3600;
  const m = str.match(/(\d+)m/); if (m) total += parseInt(m[1]) * 60;
  return Date.now() + (total || 3600) * 1000;
}

// Shared unit table for dynamic countdowns: always shows the 3 most
// significant units for the remaining duration (e.g. "2D : 12H : 45M" close
// to a deadline, "5M : 2W : 23D" months out, "1Y : 12M : 32W" a year+ out,
// "21H : 23M : 45S" under a day) instead of a fixed d/h/m format that's
// either cluttered with zeros or too coarse depending on how far off the
// deadline is.
export function fmtCompactPrize(amount) {
  const n = Number(amount);
  if (!n || Number.isNaN(n) || n <= 0) return null;
  if (n >= 1_000_000) return `${(n % 1_000_000 === 0 ? n / 1_000_000 : (n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${(n % 1_000 === 0 ? n / 1_000 : (n / 1_000).toFixed(1))}K`;
  return `${n}`;
}

// NOTE: the old module-level findCompWithNiche(compId) — which looked up a
// competition directly in the static NICHES seed data — was removed here.
// Every id stored anywhere in the app (notifications, registeredCompIds,
// followedCompIds) is now a specific edition's id, not a seed id, so the
// lookup has to search each seed competition's editions and needs access
// to `editionsByComp` state; see findEditionWithNiche inside App().

export function hashStr(str) {
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
export function getRegistrationFee(comp) {
  return comp.fee != null ? comp.fee : 50 + (Math.abs(hashStr(comp.id)) % 5) * 25;
}

// Compact French-style formatting for coin/point totals: 1 200 -> "1,2k",
// 3 400 000 -> "3,4M". Small numbers stay exact with fr-FR thousands
// separators so the leaderboard doesn't feel abbreviated for no reason.
function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

/* ─── NEWS BAND ─────────────────────────────────────────────────────────── */

/* ─── BOTTOM TAB BAR ────────────────────────────────────────────────────── */

const TABS = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "mycomps", label: "Mes compets", icon: BadgeCheck },
  { id: "wallet", label: "Portefeuille", icon: Wallet },
  { id: "notifications", label: "Notifs", icon: Bell },
  { id: "account", label: "Compte", icon: User },
];

function BottomTabBar({ active, onChange, unreadCount, currentUser, dark }) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: dark ? "#111" : "#fff",
        borderTop: dark ? "1px solid #2a2a2e" : "1px solid #2a2a2e",
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
              color: isActive ? (dark ? "#fff" : "#111") : (dark ? "#777" : "#aaa"),
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
                    border: isActive ? (dark ? "1.5px solid #fff" : "1.5px solid #111") : "1.5px solid transparent",
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
                  border: `1.5px solid ${dark ? "#111" : "#fff"}`,
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
        borderTop: "1px solid #2a2a2e",
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
          color: "#9a9aa0",
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

/* ─── SKELETON CARD (feature 1) ─────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ flexShrink: 0, width: 272, border: "1px solid #2a2a2e", borderRadius: 18, overflow: "hidden", background: "#1c1c1f" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; }
      `}</style>
      <div className="sk" style={{ height: 132 }} />
      <div style={{ display: "flex", gap: 8, padding: "9px 12px" }}>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "60%" }} /></div>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "70%" }} /></div>
        <div style={{ flex: 1 }}><div className="sk" style={{ height: 15, marginBottom: 4 }} /><div className="sk" style={{ height: 9, width: "50%" }} /></div>
      </div>
      <div className="sk" style={{ height: 40 }} />
    </div>
  );
}

// Fills the parent circle (which sets width/height/overflow/border) with
// either the person's real photo, or — when none is on file — a flat
// initials circle built from their name. Never a stock/mock photo.
export function MyAvatar({ user, size = 34, fontSize = 13, iconSize = 14, loggedBg = "#111", guestBg = "#e0e0e0" }) {
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

export function fakeName(index) {
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
    <section style={{ marginBottom: 0, borderBottom: "2px solid #2a2a2e", paddingBottom: 8, paddingTop: 8 }}>
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
            color: "#f2f2f2",
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
            color: "#f2f2f2",
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
          <CompCard key={comp.id} comp={comp} accent={niche.accent} onOpen={onOpen} onRegister={onRegister} isRegistered={registeredCompIds?.has(comp.id)} isOwnCompetition={isCompOwner(comp, currentUser)} />
        ))}

      </div>
    </section>
  );
}

/* ─── TYPE ROW (homepage sections by type, not niche) ────────────────────
   Same rail/skeleton as NicheRow, but the header icon/label/accent are
   passed in directly and each item already carries its own originating
   niche's accent/label (set once in App(), where the items are built),
   since a single row here can mix competitions from every niche — e.g.
   "Top compétitions" or "En direct" pull from all of them at once. */

/* ─── WALLET PAGE ───────────────────────────────────────────────────────── */

// NatCash deposits are temporarily disabled — remove "moncash" from this
// list (or add "natcash" back) to change what's offered. Both the deposit
// modal and the wallet's "add your number" tabs (DepositNumbersCard in
// WalletPage.jsx) derive from this single list, so nothing else needs to
// change to re-enable it later. This does NOT affect withdrawals — those
// still use the full PAYMENT_METHODS list, including NatCash.
const ENABLED_DEPOSIT_METHOD_IDS = ["moncash"];
export const DEPOSIT_METHODS = PAYMENT_METHODS.filter((m) => ENABLED_DEPOSIT_METHOD_IDS.includes(m.id));

function DepositModal({ onClose, onDeposit, lastMethod }) {
  const method = DEPOSIT_METHODS.some((m) => m.id === lastMethod) ? lastMethod : (DEPOSIT_METHODS[0]?.id || "moncash");
  const [copied, setCopied] = useState(false);
  const phoneNumber = MOBILE_MONEY_NUMBERS[method].number;

  function handleCopy() {
    navigator.clipboard?.writeText(phoneNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onDeposit(method);
  }

  const steps = [
    "Ouvrez votre application MonCash.",
    "Choisissez « Envoyer de l'argent ».",
    "Envoyez le montant de votre choix vers le numéro ci-dessous.",
    "Votre dépôt sera crédité automatiquement dès réception.",
  ];

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
          background: "#1c1c1f",
          borderTop: "2px solid #2a2a2e",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #2a2a2e" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            Déposer des fonds
          </span>
          <button onClick={handleClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#f2f2f2", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Marche à suivre
        </div>

        <ol style={{ margin: 0, marginBottom: 18, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {steps.map((step, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#3a3a3e",
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2", lineHeight: 1.5, paddingTop: 1 }}>
                {step}
              </span>
            </li>
          ))}
        </ol>

        {/* Number to send to */}
        <div
          style={{
            border: "1px solid #2a2a2e",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a8a90", marginBottom: 4 }}>
              Numéro MonCash
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: "#f2f2f2" }}>
              {phoneNumber}
            </div>
          </div>
          <button
            onClick={handleCopy}
            aria-label="Copier le numéro"
            style={{
              flexShrink: 0, width: 38, height: 38,
              border: "1px solid #2a2a2e",
              background: copied ? "#00B894" : "#26262a",
              color: copied ? "#fff" : "#f2f2f2",
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} strokeWidth={2.5} />}
          </button>
        </div>

        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", lineHeight: 1.5, marginBottom: 16 }}>
          ⚠ Envoyez uniquement à partir du numéro MonCash enregistré sur votre compte.
        </div>

        <button
          onClick={handleClose}
          style={{
            width: "100%",
            border: "none",
            background: "#fff",
            color: "#111",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "14px 20px",
            cursor: "pointer",
          }}
        >
          J'ai envoyé le dépôt
        </button>
      </div>
    </div>
  );
}

export const WALLET_PIN = "1234"; // demo PIN

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
          background: "#1c1c1f",
          borderTop: "2px solid #2a2a2e",
          padding: 16,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #2a2a2e" }}>
          {step === "pin" && (
            <button onClick={() => { setStep("form"); setPin(""); setPinError(false); }} style={{ border: "none", background: "none", cursor: "pointer", color: "#f2f2f2", padding: 0, lineHeight: 0 }}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <span style={{ flex: 1, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {step === "form" ? "Retirer des fonds" : "Confirmer le retrait"}
          </span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#f2f2f2", padding: 4, lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {step === "form" && (
          <>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Solde disponible : {balance.toLocaleString("fr-FR")} HTG
            </div>

            <div style={{ display: "flex", alignItems: "center", border: "1px solid #2a2a2e", padding: "12px 14px", marginBottom: 12 }}>
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
                  color: "#f2f2f2",
                  minWidth: 0,
                }}
              />
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", fontWeight: 600 }}>HTG</span>
              <button
                onClick={() => setAmountStr(String(balance))}
                style={{ marginLeft: 10, border: "1px solid #2a2a2e", background: "#1c1c1f", color: "#f2f2f2", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, padding: "6px 10px", cursor: "pointer" }}
              >
                Max
              </button>
            </div>
            {amount > balance && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
                Le montant dépasse votre solde disponible.
              </div>
            )}

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
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
                      border: `1px solid ${active ? "#fff" : "#2a2a2e"}`,
                      background: active ? "#fff" : "#1c1c1f",
                      color: active ? "#111" : "#c9c9c9",
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

            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", lineHeight: 1.5, marginBottom: 16 }}>
              Le montant sera immédiatement déduit de votre solde, puis votre retrait passera en attente le temps qu'un administrateur le confirme avant l'envoi vers {methodLabel}.
            </div>

            <button
              onClick={() => canSubmit && setStep("pin")}
              disabled={!canSubmit}
              style={{
                width: "100%",
                border: "none",
                background: canSubmit ? "#fff" : "#3a3a3e",
                color: canSubmit ? "#111" : "#8a8a90",
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
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", lineHeight: 1.5, marginBottom: 20 }}>
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
                border: `1px solid ${pinError ? "#E74C3C" : "#2a2a2e"}`,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.4em",
                textAlign: "center",
                color: "#f2f2f2",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={pin.length !== 4}
              style={{
                width: "100%",
                border: "none",
                background: pin.length === 4 ? "#fff" : "#3a3a3e",
                color: pin.length === 4 ? "#111" : "#8a8a90",
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

function RegistrationModal({ comp, onClose, onRegister, showToast, currentUser, balance, onOpenBuy }) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "media" | "pin"
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Required media step: between 1 and 10 photos / short videos must be
  // picked before the user can proceed to the PIN step.
  // `pendingMediaFiles` holds browser File objects (not yet uploaded); the
  // actual upload to Supabase Storage + participant_media row insert
  // happens inside handleRegister right before the registrations row is
  // inserted — so we can roll back the upload if registration fails, and
  // never end up with a registrant whose album is empty.
  const MAX_MEDIA = 10;
  const [pendingMediaFiles, setPendingMediaFiles] = useState([]);
  const [pendingMediaError, setPendingMediaError] = useState("");

  const fee = getRegistrationFee(comp);
  const canAfford = balance >= fee;
  const hasMedia = pendingMediaFiles.length > 0;
  const isMediaFull = pendingMediaFiles.length >= MAX_MEDIA;

  function handleContinue() {
    if (!canAfford) {
      showToast("Gourdes insuffisantes pour l'inscription");
      onOpenBuy?.();
      return;
    }
    setRegisterError("");
    setStep("media");
  }

  function handlePickMedia(e) {
    const files = Array.from(e.target.files || []);
    // Reset the input so picking the same file twice still fires onChange.
    e.target.value = "";
    if (files.length === 0) return;

    // Soft cap on per-file size — 25 MB matches the typical Supabase
    // Storage default for free tier and keeps the modal snappy on slow
    // networks. Reject the whole batch on the first oversize file so the
    // user gets a clear message instead of a silent partial add.
    const MAX_BYTES = 25 * 1024 * 1024;
    const MAX_TOTAL_BYTES = 80 * 1024 * 1024; // keeps the upload bundle
                                                // reasonable on flaky 3G/4G.
    const allowed = ["image/", "video/"];

    const accepted = [];
    for (const file of files) {
      if (!allowed.some((p) => file.type.startsWith(p))) {
        setPendingMediaError("Format non supporté. Choisis une photo ou une vidéo.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setPendingMediaError(`« ${file.name} » dépasse 25 Mo.`);
        return;
      }
      accepted.push(file);
    }

    setPendingMediaFiles((prev) => {
      const roomLeft = MAX_MEDIA - prev.length;
      if (roomLeft <= 0) {
        setPendingMediaError(`Tu as déjà ${MAX_MEDIA} médias (maximum).`);
        return prev;
      }
      const next = accepted.slice(0, roomLeft).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      const newTotal = prev.reduce((s, it) => s + it.file.size, 0)
        + next.reduce((s, it) => s + it.file.size, 0);
      if (newTotal > MAX_TOTAL_BYTES) {
        // Free the preview URLs we just allocated for the rejected batch.
        next.forEach((it) => URL.revokeObjectURL(it.previewUrl));
        setPendingMediaError("L'ensemble des médias dépasse 80 Mo. Réduis la sélection.");
        return prev;
      }
      if (accepted.length > roomLeft) {
        setPendingMediaError(`Seulement ${roomLeft} média(x) ajouté(s) — limite de ${MAX_MEDIA} atteinte.`);
      } else {
        setPendingMediaError("");
      }
      return [...prev, ...next];
    });
  }

  function handleRemovePendingMedia(index) {
    setPendingMediaFiles((items) => {
      const target = items[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = items.filter((_, i) => i !== index);
      // Clearing an error when the user actively edits the selection —
      // feels more responsive than waiting for the next add.
      if (next.length > 0) setPendingMediaError("");
      return next;
    });
  }

  function handleMediaContinue() {
    if (!hasMedia) {
      setPendingMediaError(`Ajoute au moins une photo ou vidéo pour t'inscrire (max ${MAX_MEDIA}).`);
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
    const result = await onRegister(comp, fee, pendingMediaFiles);
    setIsSubmitting(false);

    if (!result?.success) {
      setRegisterError(result?.error || "Une erreur est survenue. Réessayez.");
      return;
    }

    // Free the object URLs we created for previews — they were only needed
    // for the in-modal preview and are now safe to release.
    pendingMediaFiles.forEach((it) => URL.revokeObjectURL(it.previewUrl));

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
            background: "#1c1c1f",
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
            color: "#f2f2f2", display: "block", marginBottom: 8, letterSpacing: "-0.01em",
          }}>
            Inscription confirmée !
          </span>
          <span style={{
            fontFamily: "Inter, sans-serif", fontSize: 13, color: "#9a9aa0",
            display: "block", lineHeight: 1.6,
          }}>
            Vous êtes inscrit à <strong style={{ color: "#f2f2f2" }}>{comp.title}</strong>. Tes médias de présentation ont été envoyés — ils seront visibles publiquement une fois approuvés par l'organisateur.
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
          background: "#1c1c1f",
          padding: "10px 18px 20px",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: "22px 22px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2e" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          {step === "media" && (
            <button onClick={() => setStep("form")} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          {step === "pin" && (
            <button onClick={() => { setStep("media"); setPin(""); setPinError(false); }} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              S'inscrire à {comp.title}
            </span>
            <span style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", fontWeight: 500 }}>
              {comp.edition} · {comp.registeredCount}/{comp.contestants} inscrits
            </span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#202023", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#f2f2f2", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {step === "form" && (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#26262a" }}>
              <MyAvatar user={currentUser} size={34} fontSize={13} iconSize={16} loggedBg="#6C63FF" />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#f2f2f2" }}>{currentUser.fullName}</span>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</span>
              </div>
            </div>
          )}

          {/* Receipt-style fee summary */}
          <div style={{
            borderRadius: 14,
            border: `1px solid ${canAfford ? "#2a2a2e" : "#5a2a2a"}`,
            background: canAfford ? "#202023" : "#3f2423",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600 }}>
                Frais d'inscription
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 800, color: "#f2f2f2" }}>
                {fee} <span style={{ fontSize: 13, fontWeight: 600, color: "#8a8a90" }}>gourdes</span>
              </span>
            </div>
            <div style={{ borderTop: `1px dashed ${canAfford ? "#2a2a2e" : "#6a3530"}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600 }}>
                Votre solde
              </span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: canAfford ? "#f2f2f2" : "#ff6b5e" }}>
                {balance.toLocaleString("fr-FR")} gourdes
              </span>
            </div>
          </div>

          {!canAfford && (
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", padding: "0 2px" }}>
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
            background: canAfford ? "#6C63FF" : "#3a3a3e",
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

        {step === "media" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", fontWeight: 600,
                }}>
                  Médias de présentation
                </span>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700,
                  color: isMediaFull ? "#E74C3C" : "#aaa",
                }}>
                  {pendingMediaFiles.length}/{MAX_MEDIA}
                </span>
              </div>
              <span style={{
                fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", lineHeight: 1.5, display: "block",
              }}>
                Ajoute entre 1 et {MAX_MEDIA} photos ou vidéos pour présenter ta participation — elles seront ajoutées à ton album et visibles publiquement après approbation de l'organisateur.
              </span>
            </div>

            {/* Tile grid: 3 columns, each tile is a square preview. The "+" tile
                replaces the grid when the user is at the cap, so picking more
                files is impossible without us having to disable a button. */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
              marginBottom: 12,
            }}>
              {pendingMediaFiles.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "relative", aspectRatio: "1 / 1", overflow: "hidden",
                    background: "#111", borderRadius: 10,
                  }}
                >
                  {it.file.type.startsWith("video/") ? (
                    <>
                      <video
                        src={it.previewUrl}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        muted
                        playsInline
                      />
                      {/* "Vidéo" badge so the user can tell photo from video at
                          a glance without opening the preview. */}
                      <span style={{
                        position: "absolute", left: 6, bottom: 6,
                        background: "rgba(0,0,0,0.65)", color: "#fff",
                        fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700,
                        padding: "2px 5px", borderRadius: 4, letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}>
                        Vidéo
                      </span>
                    </>
                  ) : (
                    <img
                      src={it.previewUrl}
                      alt={`Aperçu ${idx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <button
                    onClick={() => handleRemovePendingMedia(idx)}
                    type="button"
                    style={{
                      position: "absolute", top: 6, right: 6,
                      width: 24, height: 24, borderRadius: "50%",
                      border: "none", background: "rgba(0,0,0,0.6)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0,
                    }}
                    title="Retirer ce média"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {!isMediaFull && (
                <label style={{
                  position: "relative", aspectRatio: "1 / 1",
                  border: "1.5px dashed #6C63FF", background: "rgba(108,99,255,0.04)",
                  borderRadius: 10, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 4, color: "#B9A2FF",
                }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handlePickMedia}
                    style={{ display: "none" }}
                  />
                  <Plus size={20} strokeWidth={2.5} />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
                    Ajouter
                  </span>
                </label>
              )}
            </div>

            {pendingMediaError && (
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600,
                textAlign: "center", marginBottom: 8,
              }}>
                {pendingMediaError}
              </div>
            )}

            <div style={{
              fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", textAlign: "center", marginBottom: 6,
            }}>
              Formats : JPG, PNG, MP4 · max 25 Mo / fichier
            </div>

            <button
              onClick={handleMediaContinue}
              disabled={!hasMedia}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                background: hasMedia ? "#6C63FF" : "#26262a",
                color: hasMedia ? "#fff" : "#8a8a90",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.02em",
                padding: "15px 20px",
                cursor: hasMedia ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 4,
                boxShadow: hasMedia ? "0 8px 20px rgba(108,99,255,0.3)" : "none",
              }}
            >
              {hasMedia ? `Continuer (${pendingMediaFiles.length})` : "Continuer"}
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </>
        )}

        {step === "pin" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#262048", color: "#B9A2FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px",
              }}>
                <BadgeCheck size={22} strokeWidth={2.25} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#9a9aa0", lineHeight: 1.6 }}>
                Entrez votre code PIN pour confirmer le paiement de<br />
                <strong style={{ color: "#f2f2f2" }}>{fee} gourdes</strong> pour {comp.title}.
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
                border: `1.5px solid ${pinError ? "#E74C3C" : "#2a2a2e"}`,
                borderRadius: 14,
                padding: "14px 14px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.5em",
                textAlign: "center",
                color: "#f2f2f2",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
            />
            {pinError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
                Code PIN incorrect. Réessayez.
              </div>
            )}
            {registerError && (
              <div style={{ textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#ff6b5e", fontWeight: 600, marginBottom: 12 }}>
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
                background: isSubmitting ? "#3a3a3e" : pin.length === 4 ? "#6C63FF" : "#26262a",
                color: pin.length === 4 || isSubmitting ? "#fff" : "#8a8a90",
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

function MyCompetitionsPage({ registeredEntries, followedEntries, onOpen }) {
  const [activeSection, setActiveSection] = useState("inscrit");

  const entries = activeSection === "inscrit" ? registeredEntries : followedEntries;

  function CompRow({ comp, niche, badge }) {
    return (
      <div
        onClick={() => onOpen({ ...comp, accent: niche.accent, niche: niche.label })}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          border: "1px solid #2a2a2e", background: "#1c1c1f",
          padding: "12px 14px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 44, height: 44, flexShrink: 0, overflow: "hidden",
          border: `2px solid ${niche.accent}`,
          background: "#26262a", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {(comp.bannerUrl || comp.thumbnailUrl) ? (
            <img src={comp.bannerUrl || comp.thumbnailUrl} alt={comp.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <ImageIcon size={16} color="#ccc" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#f2f2f2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {comp.title}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
            {niche.label} · {comp.edition}
            {comp.phase === "registration" && (
              <span style={{ color: "#B9A2FF", fontWeight: 600 }}> · {comp.registeredCount}/{comp.contestants} inscrits</span>
            )}
          </span>
        </div>
        {badge}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #2a2a2e",
          background: "#1c1c1f",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ padding: "16px 16px 0" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            Mes compétitions
          </span>
        </div>
        {/* Section tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #2a2a2e", marginTop: 12 }}>
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
                  borderBottom: isActive ? "2px solid #fff" : "2px solid transparent",
                  padding: "10px 0",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "#8a8a90",
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
                    background: isActive ? "#fff" : "#2a2a2e",
                    color: isActive ? "#111" : "#c9c9c9",
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
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#f2f2f2", marginBottom: 8 }}>
              {activeSection === "inscrit" ? "Aucune inscription" : "Aucun suivi"}
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", lineHeight: 1.5 }}>
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
                      color: "#5ee0a8", background: "#123a2b", border: "1px solid #1e5c44",
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
                      color: "#B9A2FF", background: "#262048", border: "1px solid #3d3f",
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
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #2a2a2e",
          background: "#1c1c1f",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 16px",
        }}
      >
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
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
                  background: "#6C63FF", border: "2px solid #111",
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
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2",
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
                  style={{ border: "none", background: "none", padding: 4, cursor: "pointer", color: "#8a8a90", flexShrink: 0 }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, color: "#f2f2f2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser ? currentUser.fullName : "Non connecté"}
                </span>
                {currentUser && (
                  <button
                    onClick={startEditingName}
                    title="Modifier le nom"
                    style={{ border: "none", background: "none", padding: 2, cursor: "pointer", color: "#8a8a90", flexShrink: 0, display: "flex", alignItems: "center" }}
                  >
                    <Pencil size={14} strokeWidth={2.3} />
                  </button>
                )}
              </span>
            )}
            {currentUser ? (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#8a8a90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </span>
            ) : (
              <button
                onClick={onLoginRequest}
                style={{ border: "none", background: "none", padding: 0, marginTop: 2, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#B9A2FF", fontWeight: 700 }}
              >
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Every signed-in user can create and manage their own competitions
            from here — not just the platform organizer, who additionally
            gets the full admin view (every competition, plus withdrawals). */}
        {currentUser && (
          <button
            onClick={onOpenAdmin}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              border: "1px solid #6C63FF", background: "#262048", color: "#B9A2FF",
              padding: "14px 16px", marginBottom: 12, cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BadgeCheck size={18} strokeWidth={2.5} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
                {currentUser.isOrganizer ? "Panneau d'administration" : "Mes compétitions"}
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
            border: "1px solid #fff", background: "#fff", color: "#111",
            padding: "14px 16px", marginBottom: 24, cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={18} strokeWidth={2.5} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700 }}>
              {balance.toLocaleString("fr-FR")} crédits
            </span>
          </div>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(17,17,17,0.6)" }}>
            Gérer <ChevronRight size={11} style={{ display: "inline" }} />
          </span>
        </button>

        {/* Other account links — placeholders for future screens */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid #2a2a2e", background: "#1c1c1f" }}>
          {[
            { label: "Compétitions suivies", icon: BadgeCheck },
            { label: "Paramètres", icon: User },
            { label: "Aide & support", icon: Bell },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "13px 14px", borderBottom: "1px solid #2a2a2e",
                fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#f2f2f2",
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
function AdminPage({ currentUser, niches, seedCompetitions, onOpenComp, onToggleActive, onCreateEdition, onPublishEdition, onDeleteEdition, onBack, showToast }) {
  // The platform organizer sees every competition (plus withdrawals);
  // everyone else only ever sees — and can only manage — competitions
  // they created themselves.
  const isFullAdmin = !!currentUser?.isOrganizer;
  const [adminSection, setAdminSection] = useState("competitions"); // "competitions" | "withdrawals" | "comite"
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

  const allEntries = niches
    .flatMap((niche) => niche.competitions.map((comp) => ({ comp, niche })))
    .filter(({ comp }) => isFullAdmin || isCompOwner(comp, currentUser));

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
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <header
        style={{
          borderBottom: "1px solid #2a2a2e",
          background: "#1c1c1f",
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
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
            {isFullAdmin ? "Administration" : "Mes compétitions"}
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
            {isFullAdmin ? "Gérer toutes les compétitions" : "Créer et gérer vos compétitions"}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        {/* Section switcher — competitions management vs. pending withdrawals.
            Withdrawals are platform-organizer-only, so regular users creating
            their own competitions never see that tab at all. */}
        {isFullAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[
              { id: "competitions", label: "Compétitions" },
              { id: "withdrawals", label: "Retraits" },
              { id: "comite", label: "Comité" },
            ].map((s) => {
              const isActive = adminSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setAdminSection(s.id)}
                  style={{
                    flex: 1,
                    border: isActive ? "1px solid #111" : "1px solid #2a2a2e",
                    background: isActive ? "#111" : "#fff",
                    color: isActive ? "#fff" : "#555",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {isFullAdmin && adminSection === "withdrawals" && (
          <WithdrawalsPanel showToast={showToast} />
        )}

        {isFullAdmin && adminSection === "comite" && (
          <ComitePanel showToast={showToast} />
        )}

        {adminSection === "competitions" && (
        <>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a8a90" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une compétition…"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #2a2a2e", borderRadius: 999,
              padding: "10px 14px 10px 36px",
              fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
              background: "#1c1c1f", outline: "none",
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
                  border: isActive ? "1px solid #fff" : "1px solid #2a2a2e",
                  background: isActive ? "#fff" : "#1c1c1f",
                  borderRadius: 999,
                  padding: "8px 14px",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: isActive ? "#111" : "#c9c9c9", whiteSpace: "nowrap" }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isActive ? "#fff" : "#8a8a90",
                    background: isActive ? "#222" : "#2a2a2e",
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
            width: "100%", marginBottom: 8,
            border: "1px dashed #2a2a2e", borderRadius: 10, padding: "12px 16px",
            background: "#1c1c1f", color: "#f2f2f2",
            fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={14} /> Nouvelle édition à partir d'un modèle
        </button>

        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 8px" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90" }}>
              Aucune compétition ne correspond à « {query} »
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredEntries.map(({ comp, niche }) => {
              const thumb = comp.bannerUrl || comp.thumbnailUrl;
              const isDraft = comp.phase === "draft";
              const isDeleting = deletingId === comp.id;
              const isPublishing = publishingId === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => onOpenComp(comp, niche)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 14,
                    padding: 10, cursor: "pointer",
                    opacity: comp.active ? 1 : 0.55,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "#26262a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <ImageIcon size={18} color="#ccc" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90" }}>
                        {comp.edition}
                      </span>
                    </div>
                    {comp.phase === "registration" && comp.endsAt && (
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90" }}>
                        Fin insc. : {fmtAbsoluteDateOnly(comp.endsAt)}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "#f2f2f2" }}>
                      {(comp.registeredCount || 0).toLocaleString("fr-FR")}
                    </span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#8a8a90", textTransform: "uppercase", letterSpacing: "0.03em" }}>
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
                      background: "transparent", color: "#ff6b5e",
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
        </>
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
              background: "#1c1c1f", borderRadius: "20px 20px 0 0",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{
              padding: "16px 16px 12px", background: "#1c1c1f",
              borderBottom: "1px solid #2a2a2e",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#eaeaea" }}>
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
                <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#8a8a90" }} />
                <input
                  type="text"
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Rechercher un modèle…"
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1px solid #2a2a2e", borderRadius: 999,
                    padding: "9px 12px 9px 32px",
                    fontFamily: "Inter, sans-serif", fontSize: 13, color: "#f2f2f2",
                    background: "#1c1c1f", outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {templatesByNiche.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 8px" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90" }}>
                    Aucun modèle ne correspond à « {templateQuery} »
                  </span>
                </div>
              ) : (
                templatesByNiche.map(({ niche, items }) => (
                  <div key={niche.label}>
                    <span style={{
                      fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700,
                      color: "#8a8a90", textTransform: "uppercase", letterSpacing: "0.04em",
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
                              background: "#1c1c1f", border: "1px solid #2a2a2e", borderRadius: 14,
                              padding: 10, cursor: creatingTemplateKey ? "default" : "pointer",
                              opacity: creatingTemplateKey && !isCreating ? 0.5 : 1,
                              textAlign: "left", width: "100%", boxSizing: "border-box",
                            }}
                          >
                            <div style={{
                              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                              overflow: "hidden", background: "#26262a",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {s.comp.bannerUrl || s.comp.thumbnailUrl ? (
                                <img src={s.comp.bannerUrl || s.comp.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              ) : (
                                <ImageIcon size={16} color="#ccc" />
                              )}
                            </div>
                            <span style={{
                              flex: 1, minWidth: 0,
                              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "#eaeaea",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {s.comp.title}
                            </span>
                            {isCreating ? (
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90", flexShrink: 0 }}>…</span>
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

/* ─── ADMIN WITHDRAWALS PANEL ──────────────────────────────────────────────
   Pending withdrawals sit here until the organizer confirms (funds were
   actually sent) or rejects (funds are refunded to the user) them. Every
   confirm/reject requires the admin PIN, checked server-side in
   confirm_withdrawal/reject_withdrawal — the PIN itself is never stored or
   compared on the client. ────────────────────────────────────────────── */

// Small numeric PIN input used by both the create/change-PIN sheet and the
// per-action confirmation prompt below. Deliberately not reusing the
// user-facing WALLET_PIN input styling 1:1 so the two flows read as
// distinct in the UI (this one leans on the admin panel's palette).
function PinField({ value, onChange, autoFocus, error, placeholder = "••••" }) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoFocus={autoFocus}
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1px solid ${error ? "#E74C3C" : "#ddd"}`,
        padding: "14px 14px",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "0.4em",
        textAlign: "center",
        color: "#f2f2f2",
        outline: "none",
        boxSizing: "border-box",
        marginBottom: 10,
      }}
    />
  );
}

function AdminPinSheetShell({ title, onClose, children }) {
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

// Create the admin PIN the first time, or change it afterwards (requires
// the current PIN to change). Used both from the empty-state prompt and
// from the "Changer le code PIN" link once one already exists.
function AdminPinSetupModal({ hasExistingPin, onClose, onSaved, showToast }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = newPin.length >= 4 && newPin === confirmPin && (!hasExistingPin || currentPin.length >= 4);

  async function handleSave() {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError("");
    const { error: rpcError } = await setAdminPin({ newPin, currentPin: hasExistingPin ? currentPin : null });
    setSaving(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("invalid_pin")
          ? "Code PIN actuel incorrect."
          : rpcError.message?.includes("pin_too_short")
          ? "Le nouveau code doit contenir au moins 4 chiffres."
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    showToast && showToast(hasExistingPin ? "Code PIN mis à jour" : "Code PIN administrateur créé");
    onSaved && onSaved();
  }

  return (
    <AdminPinSheetShell title={hasExistingPin ? "Changer le code PIN" : "Créer un code PIN administrateur"} onClose={onClose}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", lineHeight: 1.5, marginBottom: 16 }}>
        {hasExistingPin
          ? "Ce code est requis pour confirmer ou rejeter un retrait. Entrez le code actuel puis le nouveau."
          : "Ce code sera requis pour confirmer ou rejeter chaque retrait en attente. Choisis 4 à 6 chiffres."}
      </div>

      {hasExistingPin && (
        <>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Code actuel
          </div>
          <PinField value={currentPin} onChange={setCurrentPin} autoFocus />
        </>
      )}

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Nouveau code
      </div>
      <PinField value={newPin} onChange={setNewPin} autoFocus={!hasExistingPin} />

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Confirmer le nouveau code
      </div>
      <PinField value={confirmPin} onChange={setConfirmPin} error={confirmPin.length > 0 && confirmPin !== newPin} />
      {confirmPin.length > 0 && confirmPin !== newPin && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 8 }}>
          Les deux codes ne correspondent pas.
        </div>
      )}
      {error && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSubmit || saving}
        style={{
          width: "100%", border: "none",
          background: canSubmit && !saving ? "#fff" : "#3a3a3e", color: canSubmit && !saving ? "#111" : "#8a8a90",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "14px 20px", cursor: canSubmit && !saving ? "pointer" : "not-allowed",
          marginTop: 8,
        }}
      >
        {saving ? "Enregistrement…" : hasExistingPin ? "Mettre à jour" : "Créer le code PIN"}
      </button>
    </AdminPinSheetShell>
  );
}

// PIN prompt shown right before confirming or rejecting a specific
// withdrawal. `action` is { txId, kind: "confirm" | "reject", amount, name }.
function WithdrawalActionPinModal({ action, onClose, onDone, showToast }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isReject = action.kind === "reject";

  async function handleSubmit() {
    if (pin.length < 4 || submitting) return;
    setSubmitting(true);
    setError("");
    const { error: rpcError } = isReject
      ? await rejectWithdrawal({ transactionId: action.txId, pin })
      : await confirmWithdrawal({ transactionId: action.txId, pin });
    setSubmitting(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("invalid_pin")
          ? "Code PIN incorrect."
          : rpcError.message?.includes("pin_not_set")
          ? "Aucun code PIN n'a encore été créé."
          : rpcError.message?.includes("not_pending")
          ? "Ce retrait a déjà été traité."
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    showToast && showToast(isReject ? "Retrait rejeté — montant remboursé" : "Retrait confirmé");
    onDone && onDone();
  }

  return (
    <AdminPinSheetShell title={isReject ? "Rejeter le retrait" : "Confirmer le retrait"} onClose={onClose}>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9", lineHeight: 1.6, marginBottom: 16 }}>
        {isReject
          ? <>Rejeter le retrait de <strong>{action.amount.toLocaleString("fr-FR")} HTG</strong> pour {action.name} ? Le montant sera immédiatement recrédité sur son solde.</>
          : <>Confirmer que <strong>{action.amount.toLocaleString("fr-FR")} HTG</strong> ont bien été envoyés à {action.name} ?</>}
      </div>

      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "#9a9aa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Code PIN administrateur
      </div>
      <PinField value={pin} onChange={(v) => { setPin(v); setError(""); }} autoFocus error={!!error} />
      {error && (
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#ff6b5e", fontWeight: 600, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={pin.length < 4 || submitting}
        style={{
          width: "100%", border: "none",
          background: pin.length >= 4 && !submitting ? (isReject ? "#e55737" : "#fff") : "#3a3a3e",
          color: pin.length >= 4 && !submitting ? (isReject ? "#fff" : "#111") : "#8a8a90",
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14,
          letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "14px 20px", cursor: pin.length >= 4 && !submitting ? "pointer" : "not-allowed",
          marginTop: 8,
        }}
      >
        {submitting ? "Traitement…" : isReject ? "Rejeter et rembourser" : "Confirmer l'envoi"}
      </button>
    </AdminPinSheetShell>
  );
}

function WithdrawalsPanel({ showToast }) {
  const [pinExists, setPinExists] = useState(null); // null = loading
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [action, setAction] = useState(null); // { txId, kind, amount, name }

  async function refresh() {
    setLoading(true);
    const [{ exists }, { withdrawals: list }] = await Promise.all([
      adminPinExists(),
      listPendingWithdrawals(),
    ]);
    setPinExists(exists);
    setWithdrawals(list);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  function destinationNumber(w) {
    if (!w.method) return null;
    const m = w.method.toLowerCase();
    if (m.includes("moncash")) return w.moncash_number;
    if (m.includes("natcash")) return w.natcash_number;
    return null;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#9a9aa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {withdrawals.length} retrait{withdrawals.length > 1 ? "s" : ""} en attente
        </span>
        {pinExists && (
          <button
            onClick={() => setShowPinSetup(true)}
            style={{ border: "none", background: "none", color: "#c9c9c9", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <Lock size={12} strokeWidth={2.5} /> Changer le code PIN
          </button>
        )}
      </div>

      {pinExists === false && (
        <div style={{ border: "1px solid #2a2a2e", background: "#3d311a", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9", lineHeight: 1.5, marginBottom: 10 }}>
            Aucun code PIN administrateur n'est encore configuré. Crée-en un pour pouvoir confirmer ou rejeter des retraits.
          </div>
          <button
            onClick={() => setShowPinSetup(true)}
            style={{
              border: "none", borderRadius: 999, background: "#fff", color: "#111",
              fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700,
              padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Lock size={13} strokeWidth={2.5} /> Créer un code PIN
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 8px", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
          Chargement…
        </div>
      ) : withdrawals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 8px", border: "1px solid #2a2a2e", background: "#1c1c1f", color: "#8a8a90", fontFamily: "Inter, sans-serif", fontSize: 13, borderRadius: 12 }}>
          Aucun retrait en attente.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {withdrawals.map((w) => {
            const dest = destinationNumber(w);
            return (
              <div key={w.id} style={{ border: "1px solid #2a2a2e", background: "#1c1c1f", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#eaeaea" }}>
                      {w.full_name || "Utilisateur"}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#8a8a90" }}>
                      {new Date(w.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: "#FF5252", flexShrink: 0 }}>
                    {Number(w.amount).toLocaleString("fr-FR")} HTG
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: "#c9c9c9", background: "#26262a", borderRadius: 999, padding: "3px 9px" }}>
                    {w.method || "—"}
                  </span>
                  {dest && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#c9c9c9" }}>
                      → {dest}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => pinExists && setAction({ txId: w.id, kind: "confirm", amount: Number(w.amount), name: w.full_name || "cet utilisateur" })}
                    disabled={!pinExists}
                    style={{
                      flex: 1, border: "none", borderRadius: 8, padding: "10px 12px",
                      background: pinExists ? "#00B894" : "#3a3a3e", color: pinExists ? "#fff" : "#8a8a90",
                      fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, cursor: pinExists ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Check size={14} strokeWidth={2.5} /> Confirmer
                  </button>
                  <button
                    onClick={() => pinExists && setAction({ txId: w.id, kind: "reject", amount: Number(w.amount), name: w.full_name || "cet utilisateur" })}
                    disabled={!pinExists}
                    style={{
                      flex: 1, border: "1px solid #2a2a2e", borderRadius: 8, padding: "10px 12px",
                      background: "#1c1c1f", color: pinExists ? "#ff6b5e" : "#8a8a90",
                      fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, cursor: pinExists ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <X size={14} strokeWidth={2.5} /> Rejeter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPinSetup && (
        <AdminPinSetupModal
          hasExistingPin={!!pinExists}
          onClose={() => setShowPinSetup(false)}
          onSaved={() => { setShowPinSetup(false); refresh(); }}
          showToast={showToast}
        />
      )}

      {action && (
        <WithdrawalActionPinModal
          action={action}
          onClose={() => setAction(null)}
          onDone={() => { setAction(null); refresh(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

const INITIAL_NOTIFS = [
  { id: "n1", type: "result",       read: false, ts: Date.now() - 1000 * 60 * 8,    icon: "🏆", title: "Résultats disponibles",     body: "Miss Élégance — la demi-finale est terminée. Découvrez le classement final.", compId: "b2" },
  { id: "n2", type: "activity",     read: false, ts: Date.now() - 1000 * 60 * 23,   icon: "🔥", title: "Concours de Beauté s'emballe", body: "6 240 votes en moins de 2 jours — la compétition est très active.", compId: "b1" },
  { id: "n3", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 61,   icon: "⚡", title: "Plus que 13 places",          body: "Top Model Open — il ne reste que 13 inscriptions disponibles.", compId: "b3" },
  { id: "n4", type: "system",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 5, icon: "💎", title: "550 crédits ajoutés",       body: "Votre achat a été confirmé. Solde actuel : 425 crédits." },
  { id: "n5", type: "activity",     read: true,  ts: Date.now() - 1000 * 60 * 60 * 9, icon: "👑", title: "Couronne envoyée",          body: "Votre cadeau a été remis à un participant de Concours de Beauté." },
  { id: "n6", type: "result",       read: true,  ts: Date.now() - 1000 * 60 * 60 * 22, icon: "🥇", title: "Miss Élégance — Top 3",     body: "Le classement de mi-parcours est disponible. 4 810 votes comptabilisés.", compId: "b2" },
  { id: "n7", type: "registration", read: true,  ts: Date.now() - 1000 * 60 * 60 * 26, icon: "📋", title: "Top Model Open ouvert", body: "Les inscriptions pour Top Model Open viennent d'ouvrir. 20 places.", compId: "b3" },
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
  result:       { bg: "#3d311a", border: "#6a5a30", dot: "#f39c12" },
  activity:     { bg: "#3f2423", border: "#6a3530", dot: "#ff6b5e" },
  registration: { bg: "#262048", border: "#3f3f5a", dot: "#B9A2FF" },
  system:       { bg: "#0f3b2e", border: "#1e5c44", dot: "#00B894" },
  action:       { bg: "#26262a", border: "#2a2a2e", dot: "#8a8a90" },
};

function NotificationsPage({ notifications, onMarkAllRead, onMarkRead, onOpen }) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#111", paddingBottom: 80 }}>
      <header style={{
        borderBottom: "1px solid #2a2a2e", background: "#1c1c1f",
        position: "sticky", top: 0, zIndex: 50,
        padding: "16px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
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
              color: "#9a9aa0", letterSpacing: "0.04em", textTransform: "uppercase",
              cursor: "pointer", padding: 0,
            }}
          >Tout lire</button>
        )}
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 8px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#f2f2f2", marginBottom: 6 }}>
              Aucune notification
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a90", lineHeight: 1.5 }}>
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
                background: notif.read ? "#1c1c1f" : colors.bg,
                border: `1px solid ${notif.read ? "#2a2a2e" : colors.border}`,
                padding: "12px 14px",
                cursor: notif.compId ? "pointer" : "default",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              {/* Icon + unread dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38,
                  background: notif.read ? "#26262a" : colors.bg,
                  border: `1px solid ${notif.read ? "#2a2a2e" : colors.border}`,
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
                    border: "2px solid #111",
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
                    color: "#eaeaea", lineHeight: 1.2,
                  }}>{notif.title}</span>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: 10, color: "#8a8a90",
                    fontWeight: 500, flexShrink: 0,
                  }}>{fmtNotifTime(notif.ts)}</span>
                </div>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: 12, color: "#c9c9c9",
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
  const [commentsSheetComp, setCommentsSheetComp] = useState(null);
  const [shareSheetState, setShareSheetState] = useState(null); // { comp, onShared }
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
            status: t.status || "completed",
            rawDate: t.created_at,
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
          let wasReconciled = false;
          setTransactions((tx) => {
            if (tx.some((existing) => existing.id === t.id)) return tx;
            // The server row for a registration/early-bird discount lands
            // here right after handleRegister already pushed an optimistic
            // local entry (same type + amount) with the contest name baked
            // into its label, and already set the authoritative post-fee
            // balance from the RPC response. wallet_transactions has no
            // edition_id column, so the server-side label never includes
            // the title — replace the pending optimistic row in place
            // (keeping its richer label) instead of appending the real row
            // as a second entry, otherwise every registration shows up
            // twice, and skip the balance delta below since it was already
            // applied.
            const pendingMatch = tx.find((existing) => existing.pending && existing.type === t.type && existing.amount === amt);
            if (pendingMatch) {
              wasReconciled = true;
              return tx.map((existing) =>
                existing === pendingMatch
                  ? { ...existing, id: t.id, pending: false }
                  : existing
              );
            }
            return [
              { id: t.id, type: t.type, label: t.label, amount: amt, status: t.status || "completed", date: "À l'instant" },
              ...tx,
            ];
          });
          if (wasReconciled) return;
          setBalance((b) => b + amt);
          if (amt > 0) {
            showToast(`+${amt.toLocaleString("fr-FR")} HTG crédités`);
            pushNotif({ type: "action", icon: "💰", title: "Dépôt reçu", body: t.label });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          // Fires when the organizer confirms/rejects one of this user's
          // pending withdrawals — flips the row's status in place so the
          // "En attente" badge in the wallet updates live, no refresh
          // needed. The balance itself (for a rejection's refund) comes
          // through as its own INSERT + wallet_balances UPDATE, handled
          // above/below.
          const t = payload.new;
          setTransactions((tx) => tx.map((existing) => (existing.id === t.id ? { ...existing, status: t.status } : existing)));
          if (t.type === "withdrawal" && t.status === "completed") {
            showToast(`Retrait de ${Math.abs(Number(t.amount)).toLocaleString("fr-FR")} HTG confirmé`);
            pushNotif({ type: "action", icon: "✅", title: "Retrait confirmé", body: t.label });
          } else if (t.type === "withdrawal" && t.status === "rejected") {
            showToast(`Retrait de ${Math.abs(Number(t.amount)).toLocaleString("fr-FR")} HTG rejeté — montant remboursé`);
            pushNotif({ type: "action", icon: "⚠️", title: "Retrait rejeté", body: t.label });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallet_balances", filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          // Authoritative: whatever the balance row says now, use it
          // directly instead of trying to derive it from a transaction
          // delta. This is what makes admin-triggered refunds/removals
          // (or any other server-side balance change not initiated by
          // this session) show up live instead of needing a refresh.
          const newBalance = Number(payload.new.balance);
          if (!Number.isNaN(newBalance)) setBalance(newBalance);
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

  // Deep link from a shared competition: the share edge function (see
  // netlify/edge-functions/share.js) redirects real visitors to
  // `/?comp=<editionId>` after showing them the link-preview page. Nothing
  // was reading that query param, so people landed on the home feed instead
  // of the competition itself — this opens it as soon as the editions have
  // loaded, then strips the param so back/forward navigation doesn't keep
  // reopening it.
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (deepLinkHandledRef.current) return;
    if (Object.keys(editionsByComp).length === 0) return; // editions not loaded yet
    const params = new URLSearchParams(window.location.search);
    const compId = params.get("comp");
    if (compId) {
      const result = findEditionWithNiche(compId);
      if (result) {
        setCompEditIntent(false);
        setSelectedComp({ ...result.comp, accent: result.niche.accent, niche: result.niche.label });
      }
      params.delete("comp");
      const rest = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
    }
    deepLinkHandledRef.current = true;
  }, [editionsByComp]);

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
            createdBy: row.created_by ?? null,
            organisateur: row.organisateur ?? null,
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
      // Whoever created THIS edition owns it — falls back to the seed's
      // organisateur (always the platform, "FNCH") for editions with no
      // owner of their own, i.e. every pre-existing competition.
      createdBy: e.createdBy ?? null,
      organisateur: e.organisateur || comp.organisateur,
      // Real count from the registrations table always wins over any
      // seeded placeholder — 0 until someone actually registers for THIS
      // edition (a new season starts back at 0, it doesn't inherit the
      // previous season's registrants).
      registeredCount: compRegCounts[e.id] ?? 0,
      // The gallery is shared across every edition of a series.
      images: compImages[comp.id] || [],
      // Falling back to the shared gallery's first photo as an implicit
      // "banner" only makes sense when there's a single edition — with
      // several editions sharing one pool, that first photo could well be
      // the one another edition's admin just tagged as *their* banner, so
      // it would visually "leak" onto every sibling edition that hasn't
      // set its own. Only offer this fallback when there's no ambiguity.
      thumbnailUrl: (editionsByComp[comp.id] || []).length <= 1
        ? (compImages[comp.id] || [])[0]?.url || null
        : null,
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
      createdBy: currentUser?.id ?? null,
      organisateur: currentUser?.isOrganizer ? PLATFORM_ORGANIZER_SIGLE : (currentUser?.fullName || "Organisateur"),
    };
    setPendingNewEdition(true);
    setCompEditIntent(true);
    setSelectedComp(editionToCard({ ...comp, accent: niche.accent, niche: niche.label }, blankEdition));
  }

  // First real save of a brand-new edition — this is an INSERT (the row
  // never existed before), always forced to phase "registration" inside
  // createEdition itself, not an update to an existing row.
  async function handleCreateEditionSave({ competitionId, title, edition, ends, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl, liveDurationSeconds }) {
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
      liveDurationSeconds,
      updatedBy: currentUser?.id,
      createdBy: currentUser?.id,
      organisateur: currentUser?.isOrganizer ? PLATFORM_ORGANIZER_SIGLE : (currentUser?.fullName || "Organisateur"),
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
    const publishedEndsAt = new Date(Date.now() + WEEK_SECONDS * 1000).toISOString();
    const { error } = await saveEditionEdit({
      editionId: comp.id,
      phase: "registration",
      active: true,
      // Auto-created drafts (from close_expired_competitions) never had a
      // deadline set, so publishing is what starts their 1-week clock.
      endsAt: publishedEndsAt,
      liveDurationSeconds: WEEK_SECONDS,
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
          e.id === comp.id ? { ...e, phase: "registration", active: true, endsAt: publishedEndsAt, liveDurationSeconds: WEEK_SECONDS } : e
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
      // Early-bird registrants already got EARLY_BIRD_DISCOUNT of their fee
      // credited back as a separate registration_refund row at signup time
      // (see register_for_competition). Refunding the full fee_paid here on
      // top of that discount would hand them fee_paid * (1 + discount) —
      // e.g. 150 back on a 100 fee — instead of making them whole. Refund
      // only what they actually still have at risk: fee_paid minus the
      // discount already paid out.
      const refundAmount = r.is_early_bird
        ? r.fee_paid * (1 - EARLY_BIRD_DISCOUNT)
        : r.fee_paid;
      const { error: refundError } = await refundRegistrationFee({
        userId: r.user_id,
        amount: refundAmount,
        competitionTitle: comp.title,
        isEarlyBird: r.is_early_bird,
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
  // back to their series' first gallery image, but only via c.thumbnailUrl,
  // which is already null whenever that series has more than one edition —
  // otherwise a photo one admin tagged as edition A's banner could silently
  // surface as edition B's homepage image too, since the gallery itself is
  // shared across every edition of a series. Nothing fake or unintentional
  // ever shows up here. Drafts never appear — publishedEditionsForComp
  // already excludes them.
  const homeBannerSlides = useMemo(() => {
    return NICHES.flatMap((niche) =>
      niche.competitions.flatMap((seed) =>
        publishedEditionsForComp(seed)
          .filter((c) => c.active !== false)
          .filter((c) => c.bannerUrl || (c.hot && c.thumbnailUrl))
          .map((c) => ({
            ...c,
            niche,
            color: niche.accent,
            image: c.bannerUrl || c.thumbnailUrl,
          }))
      )
    ).slice(0, 6);
  }, [compImages, editionsByComp, compRegCounts]);


  async function handleEditComp({ editionId, competitionId, title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl, liveDurationSeconds }) {
    // TEMP DEBUG — remove once we've confirmed the session is attached.
    const { data: debugSession } = await supabase.auth.getSession();
    console.log("[DEBUG] session email:", debugSession.session?.user?.email, "has token:", !!debugSession.session?.access_token);
    const edits = { title, edition, ends, phase, endsAt, contestants, description, prizeAmount, fee, rewardExtra, rules, bannerUrl, liveDurationSeconds };
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

  // Uploads a dedicated banner file for ONE edition (see uploadEditionBanner
  // above for why this is kept separate from the shared gallery). Nothing
  // is written to competition_editions here — CompetitionBoard just stores
  // the returned URL in its local editBannerUrl state, same as every other
  // field in the edit form, and it's only persisted once "Enregistrer" is
  // pressed (handleEditComp / handleCreateEditionSave).
  async function handleUploadBanner(editionId, file) {
    const { url, error } = await uploadEditionBanner({ editionId, file });
    if (error) {
      console.error("uploadEditionBanner error:", error);
      showToast("Échec de l'envoi de la bannière.");
      return null;
    }
    return url;
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

  const nichesByFilter = NICHES
    .map((niche) => ({
      ...niche,
      // Homepage only ever shows published editions the admin has left
      // switched on — one card per non-draft edition, zero if none exist —
      // and NEVER a terminated/completed one; once an edition closes it
      // belongs in the archive, not the homepage. The active tab is now
      // TYPE-based rather than category-based: every niche can contribute
      // to every tab, and the tab just narrows which competitions (by
      // phase/trend) make it into the flattened list below.
      competitions: niche.competitions
        .flatMap(publishedEditionsForComp)
        .filter((c) => c.active)
        // "Terminé" is the one tab that specifically wants completed
        // editions — every other tab keeps excluding them, since a closed
        // edition belongs in the archive, not the rest of the homepage.
        .filter((c) => activeFilter === "Terminé" ? c.phase === "completed" : c.phase !== "completed")
        .filter((c) => {
          if (activeFilter === "Favoris") return followedCompIds.has(c.id);
          if (activeFilter === "Live") return c.phase === "live";
          if (activeFilter === "Inscriptions") return c.phase === "registration";
          if (activeFilter === "Bientôt") return estimateEndTimestamp(c) - Date.now() <= 48 * 3600 * 1000;
          if (activeFilter === "En hausse") return c.hot;
          if (activeFilter === "Nouveautés") return c.phase === "registration";
          return true; // "Tous" and "Terminé" (already narrowed above)
        }),
    }))
    // A niche with nothing matching the active tab (or everything switched
    // off) shouldn't appear as an empty section on the homepage at all.
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

  // ── TYPE-BASED HOMEPAGE SECTIONS ────────────────────────────────────────
  // The homepage groups by type (Top, En direct, ...) rather than by niche.
  // Every visible (category-filter + search matched) competition is
  // flattened once, with its originating niche's accent/label baked
  // directly onto it, so a single row can mix competitions from every
  // niche while each card still renders in its own brand color.
  const visibleCompsFlat = useMemo(
    () => visibleNiches.flatMap((niche) =>
      niche.competitions.map((comp) => ({ ...comp, accent: niche.accent, niche: niche.label }))
    ),
    [visibleNiches]
  );

  // ── HOMEPAGE SECTIONS, DEDUPED ──────────────────────────────────────────
  // Every section used to be filtered independently, so the same edition
  // could easily land in "Top compétitions" AND "En direct" AND "Se termine
  // bientôt" at once. Instead, sections now claim competitions in priority
  // order (top to bottom, matching render order below) — once an edition
  // is placed in an earlier section it's removed from the pool for every
  // section after it, so it shows up exactly once on the page.
  const homeSections = useMemo(() => {
    const usedIds = new Set();
    const takeUnique = (list, limit = 10) => {
      const picked = [];
      for (const c of list) {
        if (usedIds.has(c.id)) continue;
        picked.push(c);
        usedIds.add(c.id);
        if (picked.length >= limit) break;
      }
      return picked;
    };

    const top = takeUnique([...visibleCompsFlat].sort((a, b) => b.votes - a.votes));
    const live = takeUnique(visibleCompsFlat.filter((c) => c.phase === "live").sort((a, b) => b.votes - a.votes));
    const registration = takeUnique(visibleCompsFlat.filter((c) => c.phase === "registration").sort((a, b) => estimateEndTimestamp(a) - estimateEndTimestamp(b)));
    const endingSoon = takeUnique(visibleCompsFlat.filter((c) => c.phase !== "completed").sort((a, b) => estimateEndTimestamp(a) - estimateEndTimestamp(b)));
    // "Rising" reuses the old EN VUE flag (comp.hot) — competitions the
    // platform has marked as gaining momentum — now as its own discovery
    // row instead of a badge stamped on every card.
    const rising = takeUnique(visibleCompsFlat.filter((c) => c.hot).sort((a, b) => b.votes - a.votes));
    // No real "createdAt" field exists in the mock data, so freshly-opened
    // registration competitions (few signups so far) stand in for "new".
    const fresh = takeUnique(visibleCompsFlat.filter((c) => c.phase === "registration").sort((a, b) => a.registeredCount - b.registeredCount));
    const followed = takeUnique(followedEntries.map(({ comp, niche }) => ({ ...comp, accent: niche.accent, niche: niche.label })));
    const registered = takeUnique(registeredEntries.map(({ comp, niche }) => ({ ...comp, accent: niche.accent, niche: niche.label })));

    // Spotlight rows per organizer — only surfaces organizers with enough
    // of a presence (3+ still-unclaimed competitions) so it doesn't create
    // a near-empty row for a one-off organizer.
    const byOrg = new Map();
    visibleCompsFlat.forEach((c) => {
      if (usedIds.has(c.id)) return;
      if (!byOrg.has(c.organisateur)) byOrg.set(c.organisateur, []);
      byOrg.get(c.organisateur).push(c);
    });
    const organizers = Array.from(byOrg.entries())
      .filter(([, comps]) => comps.length >= 3)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 2)
      .map(([organisateur, comps]) => ({
        organisateur,
        comps: takeUnique([...comps].sort((a, b) => b.votes - a.votes)),
      }));

    return { top, live, registration, endingSoon, rising, fresh, followed, registered, organizers };
  }, [visibleCompsFlat, followedEntries, registeredEntries]);

  const topComps = homeSections.top;
  const liveComps = homeSections.live;
  const registrationComps = homeSections.registration;
  const endingSoonComps = homeSections.endingSoon;
  const risingComps = homeSections.rising;
  const newComps = homeSections.fresh;
  const followedTypeItems = homeSections.followed;
  const registeredTypeItems = homeSections.registered;
  const organizerGroups = homeSections.organizers;

  // Shared open/register handlers for type rows — items already carry
  // their own accent/niche (baked in above), so unlike NicheRow's per-row
  // closure these don't need to re-attach anything.
  const handleOpenTypeComp = (comp) => { setCompEditIntent(false); setSelectedComp(comp); };
  const handleRegisterTypeComp = (comp) => requestRegistration(comp);
  const handleOpenComments = (comp) => setCommentsSheetComp(comp);
  const handleOpenShare = (comp, onShared) => setShareSheetState({ comp, onShared });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleDeposit(methodId) {
    setLastDepositMethod(methodId);
    setShowBuyModal(false);
  }

  async function handleWithdraw(amount, methodLabel) {
    if (amount > balance) {
      showToast("Solde insuffisant");
      return;
    }
    const { newBalance, error } = await withdrawFromWallet({ amount, methodLabel });
    if (error) {
      showToast(
        error.message?.includes("insufficient_balance")
          ? "Solde insuffisant"
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    // Trust the DB's balance over recomputing it locally, same as registration.
    // The balance is already debited server-side, but the withdrawal itself
    // sits "pending" until an admin confirms it from the admin panel — see
    // withdraw_from_wallet in wallet_rpc_migration.sql.
    setBalance(newBalance);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "withdrawal", label: `Retrait — ${methodLabel}`, amount: -amount, status: "pending", date: "À l'instant", pending: true },
      ...tx,
    ]);
    setShowWithdrawModal(false);
    showToast(`Retrait de ${amount.toLocaleString("fr-FR")} HTG en attente de confirmation`);
  }


  async function handleSendGift(gift, comp) {
    if (!currentUser?.id) {
      setShowAuthOverlay(true);
      return;
    }
    const price = comp?.priceHTG ?? gift.cost;
    if (balance < price) {
      showToast("Crédits insuffisants");
      return;
    }
    const recipient = comp?.recipientName;
    const label = comp ? `${gift.name} envoyé à ${recipient || "un participant"} — ${comp.title}` : `${gift.name} envoyé`;
    const { newBalance, error } = await debitWalletForGift({ amount: price, label });
    if (error) {
      showToast(
        error.message?.includes("insufficient_balance")
          ? "Crédits insuffisants"
          : "Une erreur est survenue. Réessaie."
      );
      return;
    }
    // Trust the DB's balance over recomputing it locally, same as registration.
    setBalance(newBalance);
    setTransactions((tx) => [
      { id: `t-${Date.now()}`, type: "gift_sent", label, amount: -price, date: "À l'instant" },
      ...tx,
    ]);
    if (comp) pushNotif({ type: "action", icon: gift.icon, title: `${gift.name} envoyé`, body: `Votre cadeau a été remis à ${recipient || "un participant"} de ${comp.title}.`, compId: comp.id });
    showToast(comp ? `${gift.icon} ${gift.name} → ${recipient || "participant"}` : `${gift.icon} ${gift.name} envoyé`);
  }

  async function handleRegister(comp, fee, pendingMediaFiles = []) {
    if (!currentUser?.id) {
      return { success: false, error: "Vous devez être connecté pour vous inscrire." };
    }
    if (isCompOwner(comp, currentUser)) {
      return { success: false, error: "Vous ne pouvez pas vous inscrire à votre propre compétition." };
    }
    // Hard guarantee: never let someone register without a presentation
    // media. The modal already enforces this, but defending in depth here
    // means a future call site can't accidentally skip the rule.
    if (!Array.isArray(pendingMediaFiles) || pendingMediaFiles.length === 0) {
      return { success: false, error: "Ajoute au moins une photo ou vidéo pour t'inscrire." };
    }

    // ── Step 1: upload the required media FIRST, so a failed upload never
    // produces a registrant with no album. We track every storage path +
    // inserted media row id so we can roll them back if the registration
    // insert itself fails on the next step. ────────────────────────────
    const uploadedRows = []; // { id, storagePath, publicUrl, mediaType }
    for (const item of pendingMediaFiles) {
      const file = item?.file;
      if (!file) continue;
      const ext = (file.name?.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "jpg")).toLowerCase();
      const path = `${comp.id}/${currentUser.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("participant-media")
        .upload(path, file);
      if (uploadError) {
        console.error("registration media upload error:", uploadError);
        // Best-effort cleanup of anything we already pushed before bailing.
        await rollbackRegistrationMedia(uploadedRows);
        return { success: false, error: "Échec de l'envoi du média. Réessaie." };
      }

      const { data: pub } = supabase.storage.from("participant-media").getPublicUrl(path);
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";

      const { data: inserted, error: insertError } = await supabase
        .from("participant_media")
        .insert({
          competition_id: comp.competitionId,
          edition_id: comp.id,
          uploader_id: currentUser.id,
          uploader_name: currentUser.fullName,
          media_url: pub.publicUrl,
          media_type: mediaType,
          status: "pending",
        })
        .select()
        .single();
      if (insertError || !inserted) {
        console.error("registration media insert error:", insertError);
        // Try to remove the storage object we just uploaded (silent if it
        // 404s — the bucket might have been wiped between calls).
        await supabase.storage.from("participant-media").remove([path]).catch(() => {});
        await rollbackRegistrationMedia(uploadedRows);
        return { success: false, error: "Échec de l'enregistrement du média. Réessaie." };
      }

      uploadedRows.push({ id: inserted.id, storagePath: path });
    }

    // ── Step 2: insert the registration row. The fee debit, the balance
    // check, and the early-bird tag/discount all happen server-side inside
    // this one call now (register_for_competition) — see
    // wallet_rpc_migration.sql. Nothing here writes wallet_transactions/
    // wallet_balances directly, and `balance` is set from the DB's
    // authoritative post-transaction value, not a local subtraction. ────
    const { data: registrationResult, error } = await insertRegistration({
      editionId: comp.id,
      competitionId: comp.competitionId,
      fullName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
      fee: fee || 0,
    });

    if (error) {
      // Roll back the media we just uploaded — otherwise we'd have orphan
      // rows whose uploader is not in `registrations`, which would show up
      // on the organizer's review queue and on CompetitionBoard's gallery
      // as media from a "ghost" participant.
      await rollbackRegistrationMedia(uploadedRows);
      const alreadyRegistered = error.code === "23505"; // unique(edition_id, user_id) violation
      const insufficientFunds = error.message?.includes("insufficient_balance");
      return {
        success: false,
        error: alreadyRegistered
          ? "Vous êtes déjà inscrit à cette compétition."
          : insufficientFunds
          ? "Solde insuffisant pour payer les frais d'inscription."
          : "Une erreur est survenue. Réessayez.",
      };
    }

    const {
      is_early_bird: isEarlyBird,
      early_bird_discount: discountAmount,
      new_balance: newBalance,
    } = registrationResult || {};

    // Trust the DB's balance over recomputing it locally — it already
    // reflects both the fee debit and any early-bird discount atomically.
    if (newBalance != null) setBalance(newBalance);

    // Two separate wallet lines for the registration, matching the split
    // done server-side in register_for_competition: the fee debit and the
    // early-bird discount (when it applies) are their own transactions
    // instead of being netted into one amount. Types/amounts must match
    // what the RPC inserts (registration_fee / registration_refund) so the
    // realtime reconciliation above can pair each optimistic row with its
    // real one instead of appending a duplicate.
    const newTx = [];
    if (fee > 0) {
      newTx.push({
        id: `t-${Date.now()}-fee`,
        type: "registration_fee",
        label: `Inscription — ${comp.title}`,
        amount: -fee,
        date: "À l'instant",
        pending: true,
      });
    }
    if (isEarlyBird && discountAmount > 0) {
      newTx.push({
        id: `t-${Date.now()}-discount`,
        type: "registration_refund",
        label: `Réduction early bird — ${comp.title}`,
        amount: discountAmount,
        date: "À l'instant",
        pending: true,
      });
    }
    if (newTx.length) {
      setTransactions((tx) => [...newTx, ...tx]);
    }

    setRegisteredCompIds((prev) => new Set(prev).add(comp.id));
    // Keep the App-level registration count (which CompCard reads via
    // editionToCard's registeredCount) in sync immediately — it's only
    // otherwise refreshed from the DB on mount / draft-edition deletion,
    // so without this a fresh registration wouldn't show up on the card
    // until a full reload even though CompetitionBoard (which fetches
    // registrants live) would already reflect it.
    setCompRegCounts((prev) => ({ ...prev, [comp.id]: (prev[comp.id] || 0) + 1 }));
    pushNotif({
      type: "action",
      icon: "✅",
      title: `Inscription confirmée`,
      body: isEarlyBird
        ? `Vous êtes inscrit à ${comp.title} et avez reçu la réduction early-bird. Bonne chance !`
        : `Vous êtes inscrit à ${comp.title}. Bonne chance !`,
      compId: comp.id,
    });
    showToast(isEarlyBird ? `Inscrit à ${comp.title} — réduction early-bird appliquée !` : `Inscrit à ${comp.title}!`);
    return { success: true, isEarlyBird };
  }

  // Removes every storage object + participant_media row pushed by a
  // registration that didn't end up going through. Best-effort: a failure
  // here is logged but never blocks the user-facing error path — orphan
  // media is far less bad than a stuck spinner.
  async function rollbackRegistrationMedia(rows) {
    if (!rows?.length) return;
    const storagePaths = rows.map((r) => r.storagePath).filter(Boolean);
    const rowIds = rows.map((r) => r.id).filter(Boolean);
    await Promise.all([
      storagePaths.length
        ? supabase.storage.from("participant-media").remove(storagePaths).catch((e) => console.error("rollback storage remove:", e))
        : Promise.resolve(),
      rowIds.length
        ? supabase.from("participant_media").delete().in("id", rowIds).catch((e) => console.error("rollback media delete:", e))
        : Promise.resolve(),
    ]);
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
    if (isCompOwner(comp, currentUser)) {
      showToast("Vous ne pouvez pas vous inscrire à votre propre compétition");
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

  // ── Hardware back button (Android) ────────────────────────────────────
  // In the compiled native app there's no browser chrome to fall back on —
  // without this, the back button would exit the app straight out of
  // whatever sheet/modal happens to be open. Close the top-most overlay
  // first, then fall back to the Home tab, and only actually exit once
  // there's truly nothing left to back out of. No-op on web (isNative
  // guards it, and the listener is simply never attached there).
  const backButtonStateRef = useRef(null);
  backButtonStateRef.current = {
    showAuthOverlay, showRegistrationModal, showWithdrawModal, showBuyModal,
    shareSheetState, commentsSheetComp, selectedComp, activeTab,
  };
  useEffect(() => {
    if (!isNative) return;
    const listenerPromise = CapacitorApp.addListener("backButton", () => {
      const s = backButtonStateRef.current;
      if (s.showAuthOverlay) { setShowAuthOverlay(false); return; }
      if (s.showRegistrationModal) { setShowRegistrationModal(false); setRegistrationComp(null); return; }
      if (s.showWithdrawModal) { setShowWithdrawModal(false); return; }
      if (s.showBuyModal) { setShowBuyModal(false); return; }
      if (s.shareSheetState) { setShareSheetState(null); return; }
      if (s.commentsSheetComp) { setCommentsSheetComp(null); return; }
      if (s.selectedComp) { setSelectedComp(null); setCompEditIntent(false); setPendingNewEdition(false); return; }
      if (s.activeTab !== "home") { setActiveTab("home"); return; }
      CapacitorApp.exitApp();
    });
    return () => { listenerPromise.then((handle) => handle.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #111; }
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
            border: "1px solid #2a2a2e",
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
      ) : activeTab === "admin" && currentUser ? (
        <AdminPage
          currentUser={currentUser}
          niches={allNichesWithEdits}
          seedCompetitions={seedCompetitionsList}
          onOpenComp={handleAdminOpenComp}
          onToggleActive={handleToggleCompActive}
          onCreateEdition={handleCreateDraftEdition}
          onPublishEdition={handlePublishEdition}
          onDeleteEdition={handleDeleteEdition}
          onBack={() => setActiveTab("account")}
          showToast={showToast}
        />
      ) : (
        <HomePage
          query={query}
          onQueryChange={setQuery}
          homeSearchFocused={homeSearchFocused}
          onSearchFocusChange={setHomeSearchFocused}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          homeBannerSlides={homeBannerSlides}
          bannerIndex={bannerIndex}
          onBannerIndexChange={setBannerIndex}
          visibleCompsFlat={visibleCompsFlat}
          topComps={topComps}
          liveComps={liveComps}
          registrationComps={registrationComps}
          endingSoonComps={endingSoonComps}
          risingComps={risingComps}
          newComps={newComps}
          followedTypeItems={followedTypeItems}
          registeredTypeItems={registeredTypeItems}
          organizerGroups={organizerGroups}
          registeredCompIds={registeredCompIds}
          currentUser={currentUser}
          onOpenTypeComp={handleOpenTypeComp}
          onOpenComments={handleOpenComments}
          onOpenShare={handleOpenShare}
          onRegisterTypeComp={handleRegisterTypeComp}
        />
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

      {commentsSheetComp && (
        <CommentsSheet
          comp={commentsSheetComp}
          accent={commentsSheetComp.accent}
          currentUser={currentUser}
          onRequestAuth={() => setShowAuthOverlay(true)}
          onClose={() => setCommentsSheetComp(null)}
        />
      )}

      {shareSheetState && (
        <ShareSheet
          comp={shareSheetState.comp}
          accent={shareSheetState.comp?.accent}
          onShared={shareSheetState.onShared}
          onClose={() => setShareSheetState(null)}
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

      <BottomTabBar active={activeTab} onChange={setActiveTab} unreadCount={unreadCount} currentUser={currentUser} dark />

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
          onUploadBanner={handleUploadBanner}
          startInEditMode={compEditIntent}
          isNewEdition={pendingNewEdition}
          onParticipantRemoved={(editionId) =>
            setCompRegCounts((prev) => ({ ...prev, [editionId]: Math.max(0, (prev[editionId] || 0) - 1) }))
          }
        />
      )}
    </>
  );
}