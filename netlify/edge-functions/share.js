/* Netlify Edge Function mounted at /share (see netlify.toml). Two jobs:
   1. When a link-preview crawler (WhatsApp, Telegram, Facebook, Twitter/X,
      Discord, Slack, LinkedIn, Google...) requests this URL, respond with a
      small HTML document carrying Open Graph / Twitter Card tags built from
      the competition's real title/banner, so the shared link
      renders a proper preview card instead of a blank one.
   2. For everyone else (a real visitor tapping the link), redirect straight
      into the app at `/?comp=
<editionId>`, which src/App.tsx's deep-link
      effect picks up and opens.

   Runs in Deno, not the browser/Vite build — it can't import from src/, so
   the label-building helpers below are intentionally duplicated from
   src/lib/share.js rather than shared. */

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY");

const CRAWLER_UA_PATTERN =
  /facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|Googlebot|bingbot|Pinterest|redditbot|Applebot|Yeti|Iframely|SkypeUriPreview|vkShare|W3C_Validator/i;

function isCrawler(request) {
  const ua = request.headers.get("user-agent") || "";
  return CRAWLER_UA_PATTERN.test(ua);
}

// Mirrors buildCompLabel/buildShareText in src/lib/share.js.
function extractSeasonNumber(edition) {
  if (!edition) return null;
  const match = String(edition).match(/(\d+)/);
  return match ? match[1] : null;
}

function buildTitle(row) {
  const season = extractSeasonNumber(row.edition);
  const code = season && row.contestants != null ? `S${season}Q${row.contestants}` : null;
  if (code) return `${row.title} — ${code}`;
  return row.edition ? `${row.title} — ${row.edition}` : row.title;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Truncates the description to a sensible length for a link-preview card —
// mirrors truncateDescription in src/lib/share.js.
function truncateDescription(description, maxLength = 200) {
  const trimmed = description?.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;
  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

async function fetchEdition(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const url =
    `${SUPABASE_URL}/rest/v1/competition_editions` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&select=id,title,edition,description,banner_url,contestants` +
    `&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

function previewHtml({ title, description, image, canonicalUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const descriptionTag = description
    ? `
    <meta property="og:description" content="${safeDescription}" />
    <meta name="twitter:description" content="${safeDescription}" />`
    : "";
  const imageTag = image
    ? `
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="fr">
        <head>
            <meta charset="UTF-8" />
            <title>${safeTitle}</title>
            <meta property="og:type" content="website" />
            <meta property="og:title" content="${safeTitle}" />
            <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
            <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
            <meta name="twitter:title" content="${safeTitle}" />
  ${descriptionTag}
  ${imageTag}
  
            <meta http-equiv="refresh" content="0; url=${escapeHtml(canonicalUrl)}" />
        </head>
        <body>
            <p>Redirection vers 
                <a href="${escapeHtml(canonicalUrl)}">${safeTitle}</a>…
            </p>
        </body>
    </html>`;
}

export default async (request) => {
  const url = new URL(request.url);
  const compId = url.searchParams.get("comp");
  const appUrl = new URL("/", url.origin);
  if (compId) appUrl.searchParams.set("comp", compId);

  // No id, or DB lookup fails/misses: just send the visitor into the app
  // rather than showing a broken preview page.
  if (!compId) {
    return Response.redirect(appUrl.toString(), 302);
  }

  const row = compId ? await fetchEdition(compId) : null;

  if (!row) {
    return Response.redirect(appUrl.toString(), 302);
  }

  if (isCrawler(request)) {
    const html = previewHtml({
      title: buildTitle(row),
      description: truncateDescription(row.description),
      image: row.banner_url,
      canonicalUrl: appUrl.toString(),
    });
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return Response.redirect(appUrl.toString(), 302);
};