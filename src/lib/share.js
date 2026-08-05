/* Share link goes through /share, which netlify.toml proxies to the "share"
   edge function, so apps like WhatsApp, Messenger, and Telegram can crawl
   it and render the banner, title, and description as a link preview —
   without exposing the raw supabase.co function URL. The function then
   redirects real visitors straight into the app. */
const SHARE_FN_URL = "https://konkouht.netlify.app/share";

/* Shortens the above via a Supabase edge function (server-side, so we don't
   hit CORS calling is.gd directly from the browser). Used by ShareSheet's
   fallback UI, which has time to wait for it before the user picks an
   option — the direct-share path below intentionally skips it (see
   shareCompetitionNatively). */
export const SHORTEN_FN_URL = "https://wkfzhcszhgewkvwukzes.supabase.co/functions/v1/shorten";

export function buildShareUrl(comp) {
  return `${SHARE_FN_URL}?comp=${encodeURIComponent(comp.id)}`;
}

/* Calls the shortener directly (no cache, no dedupe) and returns the short
   URL or null. Used by createEdition() in App.tsx to shorten ONCE, at
   creation time, and persist the result to competition_editions.short_url
   — so every reader (including the creator's own next render) gets the
   short link straight off the row, with no per-client, per-mount fetch
   race. Exported separately from prefetchShortUrl below because this one
   is meant to run exactly once per edition, server-truth style, not
   speculatively on every mount. */
export async function shortenEditionUrl(editionId) {
  if (!editionId) return null;
  try {
    const res = await fetch(`${SHORTEN_FN_URL}?comp=${encodeURIComponent(editionId)}`);
    const data = await res.json();
    return data?.url || null;
  } catch {
    return null;
  }
}

/* In-memory cache of short URLs, keyed by comp id. This is now only a
   fallback path for editions that don't have a short_url column value yet
   (created before this migration, or the one-shot shortenEditionUrl() call
   at creation time failed) — normal reads get the short link straight off
   comp.shortUrl (see buildBestShareUrl), which is already on the row by
   the time it's ever loaded, so there's nothing to race. Kept as a Map so
   multiple call sites (CompCard, CompetitionBoard, ShareSheet) still share
   one fetch instead of each hitting the shorten function separately. */
const shortUrlCache = new Map();
const inflightShortUrl = new Map();

export function getCachedShortUrl(comp) {
  return comp ? shortUrlCache.get(comp.id) || null : null;
}

/* Backfill path only — call sites should guard this on `!comp.shortUrl` so
   it's a no-op for the normal case where the row already carries its short
   link. Safe to call repeatedly regardless; dedupes per comp id and never
   throws. Returns the promise in case a caller wants to await it (ShareSheet
   does, for its own fallback fetch/UI). */
export function prefetchShortUrl(comp) {
  if (!comp?.id || shortUrlCache.has(comp.id)) return Promise.resolve(getCachedShortUrl(comp));
  if (inflightShortUrl.has(comp.id)) return inflightShortUrl.get(comp.id);

  const request = shortenEditionUrl(comp.id)
    .then((url) => {
      if (url) shortUrlCache.set(comp.id, url);
      return url;
    })
    .finally(() => inflightShortUrl.delete(comp.id));

  inflightShortUrl.set(comp.id, request);
  return request;
}

/* Best URL available right now, with no fetch on the critical path: the
   row's own short_url (persisted server-side at creation time) first,
   then the in-memory backfill cache for older/failed rows, then the long
   link as last resort. */
function buildBestShareUrl(comp) {
  return comp.shortUrl || getCachedShortUrl(comp) || buildShareUrl(comp);
}

/* Deliberately empty. Title and description are carried entirely by the
   og:title/og:description meta tags served by netlify/edge-functions/share.js
   — platforms that unfurl links (WhatsApp, Messenger, Telegram, SMS/iMessage
   previews, etc.) build their own preview card from those tags, so raw
   title/description text in the share payload would just duplicate it.
   Kept as a function (rather than deleting call sites) so callers have a
   single place to reintroduce text if that ever changes. */
export function buildShareText() {
  return "";
}

export function canShareNatively() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/* Fires the OS-native share sheet (iOS/Android/desktop browsers that
   support it) directly from a tap, with no custom UI in between.
   Deliberately synchronous up to the navigator.share() call — no awaited
   work before it — because some browsers (notably iOS Safari) only allow
   navigator.share() while the click's "user activation" is still live;
   an await in front of it can cause it to silently no-op. That's why this
   never *fetches* the shortener here — it uses comp.shortUrl, which is
   already sitting on the row (persisted server-side at creation time, see
   shortenEditionUrl in App.tsx's createEdition), falling back to the
   backfill cache and then the long link only for rows that predate that
   column or failed to shorten at creation time.
   Returns true if the native sheet was triggered, false if the platform
   doesn't support the Web Share API (caller should fall back to the
   custom ShareSheet in that case). Cancelling the native sheet rejects
   the promise; we treat that as "not shared" and swallow it rather than
   surfacing an error.

   Only `url` is passed to navigator.share() — no title/text — so the
   receiving platform unfurls its own preview card from the og:title/
   og:description tags (see netlify/edge-functions/share.js) instead of
   showing raw text alongside it. */
export function shareCompetitionNatively(comp, onShared) {
  if (!canShareNatively()) return false;
  const url = buildBestShareUrl(comp);
  navigator
    .share({ url })
    .then(() => onShared?.(comp))
    .catch(() => {});
  return true;
}