/**
 * Logger utility for sending browser/runtime logs to Netlify Function
 * Usage: import { initBrowserLogger } from './logger'
 * initBrowserLogger() - call once at app startup
 */

const ENDPOINT = "/.netlify/functions/log-errors"

// Track original console methods
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error

let isInitialized = false

/**
 * Initialize browser-side logging capture
 * Sends all console activity to the Netlify Function
 */
export function initBrowserLogger() {
  if (isInitialized) return
  isInitialized = true

  // Override console.log
  console.log = function (...args) {
    sendLog("log", args)
    originalLog.apply(console, args)
  }

  // Override console.warn
  console.warn = function (...args) {
    sendLog("warn", args)
    originalWarn.apply(console, args)
  }

  // Override console.error
  console.error = function (...args) {
    sendLog("error", args)
    originalError.apply(console, args)
  }

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    sendLog("unhandledrejection", [event.reason.message || "Unknown error"])
    // Prevent console spam
    event.preventDefault()
  })

  // Handle uncaught errors (last resort)
  window.addEventListener("error", (event) => {
    sendLog("error", [`${event.message} ${event.filename || ""}:${event.lineno || ""}`])
    // Allow default browser error handling
  })
}

/**
 * Send a log entry to the Netlify Function
 * @param {string} level - "log", "warn", "error", "unhandledrejection"
 * @param {Array} args - Console arguments to send
 */
async function sendLog(level, args) {
  try {
    // Skip if no endpoint or offline
    if (!window.navigator.onLine) return

    const logEntry = {
      level,
      message: args.map((a) => String(a)).join(" "),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
      // Don't wait for response to avoid blocking UI
      keepalive: true,
    }).catch(() => {
      // Silently fail - don't break the app if logging fails
    })
  } catch (e) {
    // Logging failure should not break the app
    console.error("Logger failed:", e)
  }
}

export default { initBrowserLogger, sendLog }