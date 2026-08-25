// ─── Competition Data Layer ───────────────────────────────────────────────
// Extracted from App.tsx - handles all competition edition CRUD operations

import { supabase } from "./supabaseClient";
import { shortenEditionUrl } from "./share";

const BUCKET = "competition-images";
const IMAGES_TABLE = "competition_images";
const EDITIONS_TABLE = "competition_editions";

export { BUCKET, IMAGES_TABLE, EDITIONS_TABLE };

export const WEEK_SECONDS = 7 * 24 * 60 * 60;

// ─── Schema mapper ───────────────────────────────────────────────────────
// Maps a raw DB row to the camelCase shape used throughout the app.
// This exact shape is also what the "competition-editions-global" realtime
// subscription builds by hand from payload.new — keep both in sync.
export function mapEditionRow(row) {
  return {
    id: row.id,
    competitionId: row.competition_id,
    title: row.title,
    edition: row.edition,
    ends: row.ends,
    endsAt: row.ends_at,
    registrationStartsAt: row.registration_starts_at,
    liveStartsAt: row.live_starts_at,
    liveEndsAt: row.live_ends_at,
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
    createdBy: row.created_by ?? null,
    organisateur: row.organisateur ?? null,
  };
}

// ─── Competition Editions ─────────────────────────────────────────────────

// Creates a brand-new edition for a seed competition, in one shot, with
// every field the admin already filled in on the create form.
export async function createEdition({
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
  registrationStartsAt,
  liveStartsAt,
  liveEndsAt,
  updatedBy,
  createdBy,
  organisateur,
  shortUrl,
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
      registration_starts_at: registrationStartsAt,
      live_starts_at: liveStartsAt,
      live_ends_at: liveEndsAt,
      active: true,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
      created_by: createdBy,
      organisateur,
    })
    .select()
    .single();

  if (error) {
    console.error("createEdition error:", error);
    return { data: null, error };
  }

  // Shorten ONCE, right here at creation time, and persist it to the row.
  const short = shortUrl || (await shortenEditionUrl(data.id));
  if (short) {
    const { data: updated, error: shortenError } = await supabase
      .from(EDITIONS_TABLE)
      .update({ short_url: short })
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
// Returns { [competitionId]: [editionObj, ...] } — every edition (drafts
// included) of every seed competition, grouped by seed id.
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
  liveDurationSeconds,
  registrationStartsAt,
  liveStartsAt,
  liveEndsAt,
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
  if (endsAt !== undefined) patch.ends_at = endsAt;
  if (liveDurationSeconds !== undefined) patch.live_duration_seconds = liveDurationSeconds;
  if (registrationStartsAt !== undefined) patch.registration_starts_at = registrationStartsAt;
  if (liveStartsAt !== undefined) patch.live_starts_at = liveStartsAt;
  if (liveEndsAt !== undefined) patch.live_ends_at = liveEndsAt;

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
// Downsizes and re-encodes an image before upload so banners stay
// link-preview-friendly (WhatsApp/Facebook crawlers are unreliable above a
// couple hundred KB). Falls back to the original file if compression fails
// or doesn't actually save space — never blocks an upload on this.
//
// Reads dimensions via a plain <img> first, then asks createImageBitmap to
// decode straight to the target size via resizeWidth/resizeHeight.
//
// Returns a plain { body, name, type } object rather than a File — the
// Android WebView Capacitor runs in doesn't reliably support `new File(...)`
// even though Blob works fine, so we upload the Blob directly.
export async function compressImageFile(file, { maxDimension = 1280, quality = 0.8 } = {}) {
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

// Upload a new banner/thumbnail image for a competition and return its
// public URL. Overwrites any previous file for the same competition.
export async function uploadCompetitionImage({ competitionId, file }) {
  const img = await compressImageFile(file);
  const ext = img.name.split(".").pop() || "jpg";
  const path = `${competitionId}/banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, img.body, { upsert: true, cacheControl: "3600", contentType: img.type });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, error: null };
}

// ─── competition_images (gallery) ────────────────────────────────────────

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

// Deletes an edition outright (owner-only via RLS). Called after
// handleDeleteEdition below has already refunded registrants and cleaned
// up dependent rows (comments/gifts/registrations/media), so this works
// for a draft OR a published/completed edition.
export async function deleteDraftEdition(editionId) {
  const { error } = await supabase.from(EDITIONS_TABLE).delete().eq("id", editionId);
  return { error };
}

// ─── Ownership ────────────────────────────────────────────────────────────

// FNCH ("Fédération Nationale des Concours d'Haïti") is the platform's own
// organizing body — every competition on the app is run under this sigle,
// and this account is auto-recognized as its verified organizer.
export const PLATFORM_ORGANIZER_EMAIL = "yonetoussaint25@gmail.com";
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