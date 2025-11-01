let posthog;
function init() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  if (!key) return;
  import("posthog-js").then(({ default: PH }) => {
    posthog = PH;
    posthog.init(key, { api_host: host, capture_pageview: true, autocapture: true });
  }).catch(()=>{});
}
export function track(event, props = {}) {
  if (posthog && posthog.capture) { posthog.capture(event, props); }
  else { console.log("[analytics]", event, props); }
}
init();
