import { emitGameEvent } from "../gamify/gamify";
import React from "react";
import { useReflections } from "../hooks/useReflections";

export default function CommunityStream() {
  const { community, refreshCommunity } = useReflections();

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Community Stream</h3>
        <button onClick={refreshCommunity} className="rounded bg-gray-100 px-3 py-1">Refresh</button>
      </div>

      {community.length === 0 ? (
        <div className="text-sm text-gray-500">No shared reflections yet. Be the first 🌱</div>
      ) : (
        <ul className="space-y-3">
          {community.map((r, i) => (
            <li key={i} className="rounded-xl border p-3">
              <div className="text-sm text-gray-500">
                <b>Anon {r.anon_id}</b> • {new Date(r.created_at).toLocaleString()} • Mood {r.mood}/5
              </div>
              {r.note && <p className="mt-1">{r.note}</p>}
              {Array.isArray(r.tags) && r.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.tags.map((t, j) => <span key={j} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{t}</span>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">Kindness only. No likes, only resonance.</p>
    </div>
  );
}
