import React, { useEffect, useState } from "react";

export default function ForceRefreshCard() {
  const [hasSW, setHasSW] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      setHasSW(true);
      if (reg.waiting) setWaiting(true);
      reg.addEventListener?.("updatefound", () => {
        if (reg.installing) {
          reg.installing.addEventListener("statechange", () => {
            setWaiting(reg.waiting != null);
          });
        }
      });
    });
  }, []);

  const hardRefresh = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      location.reload(true);
    } catch (e) {
      alert("Could not clear SW/caches: " + e.message);
    }
  };

  const applyUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.waiting) {
      reg.waiting.postMessage?.({ type: "SKIP_WAITING" });
      await new Promise(r => setTimeout(r, 200));
      location.reload();
    } else {
      await reg?.update?.();
      alert("No update waiting. Try Hard refresh.");
    }
  };

  if (!hasSW) return null;

  return (
    <div className="rounded-2xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">App update</h3>
        {waiting && <span className="text-xs px-2 py-1 rounded bg-yellow-100">Update ready</span>}
      </div>
      <div className="text-sm text-gray-600">
        If the app looks outdated, use the options below.
      </div>
      <div className="flex gap-2">
        <button onClick={applyUpdate} className="rounded bg-black text-white px-3 py-2">Apply update</button>
        <button onClick={hardRefresh} className="rounded border px-3 py-2">Hard refresh</button>
      </div>
      <p className="text-xs text-gray-500">
        This clears the service worker & caches for a fresh load.
      </p>
    </div>
  );
}
