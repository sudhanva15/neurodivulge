let ready = false;

export function initPostHog() {
  try {
    const key  = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!key) return;
    // lazy import to avoid bundle bloat when not configured
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, { api_host: host, capture_pageview: true });
      window.ndTrack = (e, p={}) => posthog.capture(e, p);
      ready = true;
    });
  } catch {}
}

export function track(e, props={}) {
  try {
    if (window.ndTrack) window.ndTrack(e, props);
  } catch {}
}

export function isAnalyticsReady(){ return ready; }
