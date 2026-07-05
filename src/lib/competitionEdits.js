import { supabase } from "./supabaseClient";

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// create table competition_edits (
//   competition_id text primary key,
//   title text,
//   edition text,
//   ends text,
//   banner_url text,
//   description text,
//   prize_amount numeric,
//   reward_extra text,
//   rules jsonb,
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
// If competition_edits already exists without the newer columns, run instead:
//
// alter table competition_edits
//   add column if not exists description text,
//   add column if not exists prize_amount numeric,
//   add column if not exists reward_extra text,
//   add column if not exists rules jsonb;
//
// -- Storage bucket for banner/thumbnail uploads --
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
// ─────────────────────────────────────────────────────────────────────────
// Competitions themselves are still static seed data in App.jsx (there's no
// "competitions" table yet). This table stores just the fields an organizer
// has overridden for a given competition id; the app merges these on top of
// the seed data wherever a competition is displayed or opened.

// Returns a map of { [competitionId]: { title, edition, ends, bannerUrl,
// description, prizeAmount, rewardExtra, rules } }
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
      bannerUrl: row.banner_url,
      description: row.description,
      prizeAmount: row.prize_amount,
      rewardExtra: row.reward_extra,
      rules: row.rules || [],
    };
  });
  return map;
}

// Create or update the override row for a competition (owner-only via RLS).
export async function saveCompetitionEdit({
  competitionId,
  title,
  edition,
  ends,
  bannerUrl,
  description,
  prizeAmount,
  rewardExtra,
  rules,
  updatedBy,
}) {
  return supabase
    .from("competition_edits")
    .upsert(
      {
        competition_id: competitionId,
        title,
        edition,
        ends,
        banner_url: bannerUrl,
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
}

// Upload a new banner/thumbnail image for a competition and return its
// public URL. Overwrites any previous file for the same competition.
export async function uploadCompetitionImage({ competitionId, file }) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${competitionId}/banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("competition-images")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from("competition-images").getPublicUrl(path);
  // Cache-bust so the new image shows immediately even if the browser
  // cached the old file at the same path.
  const url = `${data.publicUrl}?t=${Date.now()}`;
  return { url, error: null };
}
