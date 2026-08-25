// ─── Registration Data Layer ──────────────────────────────────────────────
// Extracted from App.tsx - registrations, refunds, and early-bird rules

import { supabase } from "./supabaseClient";

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

// Early-bird rule: the first N registrants (by created_at) on an edition
// get half their registration fee refunded instantly, straight to their
// wallet, as soon as they register. Everyone after them pays full price
// and their fee goes to the prize pool as usual.
// NOTE: the actual early-bird tagging/discount logic now runs inside
// register_for_competition (see wallet_rpc_migration.sql), not here. These
// two constants are kept only for any UI copy that references them (e.g.
// "first 3 spots") — if you change one, change both places.
export const EARLY_BIRD_LIMIT = 3;
export const EARLY_BIRD_DISCOUNT = 0.5;

// Registration + fee debit + early-bird tagging/discount all happen inside
// one atomic DB transaction (register_for_competition, see
// wallet_rpc_migration.sql) — the client never writes wallet_transactions/
// wallet_balances directly for a registration, and never passes a userId:
// the function always debits auth.uid(), so a client can't pay as someone
// else. This is also where the real balance is checked; there's no local
// "is balance high enough" client check that can go stale or race.
export async function insertRegistration({ editionId, competitionId, fullName, avatarUrl, fee }) {
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