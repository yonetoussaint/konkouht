/**
 * Netlify Function: log-errors
 * Receives browser-side logs from the client-side logger and stores them in Netlify Blobs.
 * Mounted at /.netlify/functions/log-errors
 */

// In-memory fallback if Blobs aren't available
const inMemoryLogs = []

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const logEntry = await req.json()

    // Add IP and other context
    const enriched = {
      ...logEntry,
      ip: context.ip,
      geo: context.geo,
      headers: {
        "user-agent": req.headers.get("user-agent"),
        "accept-language": req.headers.get("accept-language"),
      },
    }

    // Try to store in Netlify Blobs
    try {
      // @ts-ignore - Netlify Blobs API
      const { blobs } = await import("netlify")
      const store = blobs.getStore("browser-logs")
      const key = `logs/${logEntry.timestamp.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2)}.json`
      await store.set(key, JSON.stringify(enriched))
    } catch (blobError) {
      // Fallback to in-memory if Blobs not available
      inMemoryLogs.push(enriched)
      // Keep only last 1000 entries in memory
      if (inMemoryLogs.length > 1000) {
        inMemoryLogs.shift()
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to log" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}