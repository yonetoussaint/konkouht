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
import PageHeader from "./components/PageHeader";
import ComitePanel from "./ComitePanel";
import HomePage from "./HomePage";
import AuthOverlay from "./AuthOverlay";
import RegistrationModal from "./RegistrationModal";
import AdminPage from "./AdminPage";
import NotificationsPage, { INITIAL_NOTIFS } from "./components/NotificationsPage";

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
    