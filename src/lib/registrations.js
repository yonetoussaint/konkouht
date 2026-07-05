import { supabase } from "./supabaseClient";

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
