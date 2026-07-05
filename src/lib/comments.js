import { supabase } from "./supabaseClient";

// ── Required schema (run once in Supabase SQL editor) ──────────────────────
//
// create table comments (
//   id uuid primary key default gen_random_uuid(),
//   competition_id text not null,
//   parent_id uuid references comments(id) on delete cascade,
//   user_id uuid not null,
//   full_name text not null,
//   text text not null,
//   created_at timestamptz not null default now()
// );
// create index comments_competition_id_idx on comments (competition_id);
// create index comments_parent_id_idx on comments (parent_id);
// alter table comments enable row level security;
// create policy "comments are readable by everyone" on comments for select using (true);
// create policy "authenticated users can insert their own comments" on comments
//   for insert with check (auth.uid() = user_id);
//
// ─────────────────────────────────────────────────────────────────────────

// Fetch every comment (top-level + replies) for a competition and nest
// replies under their parent, newest top-level comment first.
export async function fetchComments(competitionId) {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("competition_id", competitionId)
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

// Insert a new top-level comment or reply (pass parentId to reply).
export async function insertComment({ competitionId, userId, fullName, text, parentId = null }) {
  return supabase
    .from("comments")
    .insert({
      competition_id: competitionId,
      user_id: userId,
      full_name: fullName,
      text,
      parent_id: parentId,
    })
    .select()
    .single();
}
