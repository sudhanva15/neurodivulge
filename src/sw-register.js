/**
 * Robust service worker bootstrap (top-level export).
 * - Registers only when VITE_ENABLE_SW === "true"
 * - If disabled, proactively unregisters existing SWs and clears caches (once)
 * - Respects VITE_SW_PATH (default "/sw.js")
 * - Skips localhost unless VITE_SW_ALLOW_DEV === "true"
 */

const ENABLED = import.meta.env.VITE_ENABLE_SW === "true";
const SW_PATH = import.meta.env.VITE_SW_PATH || "/sw.js";
const ALLOW_DEV = import.meta.env.VITE_SW_ALLOW_DEV === "true";
const IS_LOCAL =
  typeof location !== "undefined" &&
  /^(localhost|127\.0\.0\.1|::1)$/.test(location.hostname);

async function unregisterAll() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
    if (typeof caches !== "undefined" && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch (_) {}
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  if (IS_LOCAL && !ALLOW_DEV) return; // avoid accidental dev SW
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (
              sw.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              sw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (window.__ND_SW_RELOADED__) return;
          window.__ND_SW_RELOADED__ = true;
          setTimeout(() => location.reload(), 60);
        });
      })
      .catch(() => {});
  });
}

// Side effects (top level): clean or register
if (!ENABLED) {
  // fire-and-forget cleanup; don't block
  unregisterAll();
} else {
  registerSW();
}

// Export a small API for diagnostics/tests
const api = { registerSW, unregisterAll, enabled: ENABLED, swPath: SW_PATH };
export default api;
