import { supabase } from "./supabaseClient";

const TABLE = "competition_edits";

/**
 * Returns { [competitionId]: { title, edition, ends, description,
 * prizeAmount, rewardExtra, rules } } for every competition that has
 * owner-submitted edits.
 */
export async function fetchCompetitionEdits() {
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) {
    console.error("fetchCompetitionEdits error:", error);
    return {};
  }

  const grouped = {};
  for (const row of data) {
    grouped[row.competition_id] = {
      title: row.title,
      edition: row.edition,
      ends: row.ends,
      description: row.description,
      prizeAmount: row.prize_amount,
      rewardExtra: row.reward_extra,
      rules: row.rules || [],
    };
  }
  return grouped;
}

/**
 * Upserts the owner's edits for a competition. `prizeAmount` should be a
 * number or null; `rules` should be an array of strings.
 */
export async function saveCompetitionEdit({
  competitionId,
  title,
  edition,
  ends,
  description,
  prizeAmount,
  rewardExtra,
  rules,
  updatedBy,
}) {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        competition_id: competitionId,
        title,
        edition,
        ends,
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

  if (error) {
    console.error("saveCompetitionEdit error:", error);
    return { data: null, error };
  }
  return { data, error: null };
}
