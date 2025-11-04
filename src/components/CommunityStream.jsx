import React, { useMemo, useState } from "react";
import { useReflections } from "../hooks/useReflections";
import { enabled } from "../utils/FeatureGate";

export default function CommunityStream() {
  // allow gating, default on
  const gated =
    typeof enabled === "function"
      ? enabled("VITE_ENABLE_COMMUNITY", true)
      : true;
  if (!gated) return null;

  const { community = [], refresh } =
    (typeof useReflections === "function" ? useReflections() : {}) || {};
  const [busy, setBusy] = useState(false);

  const hasItems = useMemo(
    () => Array.isArray(community) && community.length > 0,
    [community]
  );

  async function doRefresh() {
    try {
      setBusy(true);
      if (typeof refresh === "function") {
        await Promise.resolve(refresh());
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Community Stream</h3>
        <button
          onClick={doRefresh}
          className="rounded bg-gray-100 px-3 py-1 disabled:opacity-60"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!hasItems ? (
        <div className="text-sm text-gray-500">
          No shared reflections yet. Be the first 🌱
        </div>
      ) : (
        <ul className="space-y-3">
          {community.map((r, i) => (
            <li key={r.created_at || i} className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">
                <b>Anon {r.anon_id ?? "—"}</b> •{" "}
                {r.created_at ? new Date(r.created_at).toLocaleString() : "—"} •
                Mood {Number(r.mood ?? 3)}/5
              </div>
              {r.note && <p className="mt-1">{r.note}</p>}
              {Array.isArray(r.tags) && r.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.tags.map((t, j) => (
                    <span
                      key={`${i}-${j}`}
                      className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        Kindness only. No likes, only resonance.
      </p>
    </div>
  );
}
