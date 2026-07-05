import { supabase } from "./supabaseClient";

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// create table competition_edits (
//   competition_id text primary key,
//   title text,
//   edition text,
//   ends text,
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
// ─────────────────────────────────────────────────────────────────────────
// Competitions themselves are still static seed data in App.jsx (there's no
// "competitions" table yet). This table stores just the fields an organizer
// has overridden for a given competition id; the app merges these on top of
// the seed data wherever a competition is displayed or opened.

// Returns a map of { [competitionId]: { title, edition, ends } }
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
    };
  });
  return map;
}

// Create or update the override row for a competition (owner-only via RLS).
export async function saveCompetitionEdit({ competitionId, title, edition, ends, updatedBy }) {
  return supabase
    .from("competition_edits")
    .upsert(
      {
        competition_id: competitionId,
        title,
        edition,
        ends,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "competition_id" }
    )
    .select()
    .single();
}
