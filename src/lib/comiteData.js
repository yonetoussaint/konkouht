// ─── Comité (profit-sharing committee) Data Layer ─────────────────────────
// Every read/write here goes through a SECURITY DEFINER RPC that re-checks
// the caller is the platform organizer server-side — see
// sql/comite_migration.sql for the table + function definitions. The
// client never inserts into comite_members / comite_distributions
// directly, same pattern as the wallet + withdrawal RPCs in walletData.js.

import { supabase } from "./supabaseClient";

export async function listComiteMembers() {
  const { data, error } = await supabase.rpc("list_comite_members");
  if (error) return { members: [], error };
  return { members: data || [], error: null };
}

export async function searchUsersForComite(query) {
  const { data, error } = await supabase.rpc("search_users_for_comite", { p_query: query });
  if (error) return { users: [], error };
  return { users: data || [], error: null };
}

export async function upsertComiteMember({ userId, percentage }) {
  const { error } = await supabase.rpc("upsert_comite_member", {
    p_user_id: userId,
    p_percentage: percentage,
  });
  return { error };
}

export async function removeComiteMember(userId) {
  const { error } = await supabase.rpc("remove_comite_member", { p_user_id: userId });
  return { error };
}

export async function repatriateComiteProfit({ amount, note }) {
  const { data, error } = await supabase.rpc("repatriate_comite_profit", {
    p_amount: amount,
    p_note: note || null,
  });
  if (error) return { shares: [], error };
  return { shares: data || [], error: null };
}

export async function listComiteDistributions() {
  const { data, error } = await supabase.rpc("list_comite_distributions");
  if (error) return { distributions: [], error };
  return { distributions: data || [], error: null };
}