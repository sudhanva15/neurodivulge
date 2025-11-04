import { enabled } from "../utils/FeatureGate";

let ready = false;
let posthogRef = null;

/**
 * Initialize PostHog safely:
 * - Only when VITE_ENABLE_ANALYTICS === "true"
 * - No-ops when key is missing
 * - Lazy-loads posthog-js to avoid bundle bloat
 */
export function initPostHog() {
  try {
    if (!enabled("VITE_ENABLE_ANALYTICS")) return;

    const key = import.meta.env?.VITE_POSTHOG_KEY;
    const host =
      import.meta.env?.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!key) {
      console.warn("[PostHog] Key not found; skipping init");
      return;
    }
    if (ready) return;

    return import("posthog-js")
      .then(({ default: posthog }) => {
        posthogRef = posthog;
        posthog.init(key, {
          api_host: host,
          capture_pageview: true,
          capture_pageleave: true,
        });
        // lightweight global for ad-hoc events if needed
        window.ndTrack = (e, p = {}) => posthog.capture(e, p);
        ready = true;
        console.info("[PostHog] initialized →", host);
      })
      .catch(() => {});
  } catch {
    // swallow to avoid breaking app initialization
  }
}

export function track(e, props = {}) {
  try {
    if (ready && posthogRef) {
      posthogRef.capture(e, props);
    } else if (
      typeof window !== "undefined" &&
      typeof window.ndTrack === "function"
    ) {
      window.ndTrack(e, props);
    }
  } catch {
    // no-op
  }
}

export function isAnalyticsReady() {
  return ready;
}

// Provide a small default export for convenience/tests
export default { initPostHog, track, isAnalyticsReady };
