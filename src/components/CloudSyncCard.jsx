import React from "react";
import { useCloudSync } from "../hooks/useCloudSync";

export default function CloudSyncCard() {
  const { syncNow, lastSyncedAt, busy, error } = useCloudSync();
  return (
    <div className="rounded-2xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cloud Sync</h3>
        <button onClick={syncNow} disabled={busy} className="rounded bg-black text-white px-3 py-2">
          {busy ? "Syncing…" : "Sync now"}
        </button>
      </div>
      <div className="text-sm text-gray-600">
        Daily snapshot of your local data to your account.
      </div>
      {lastSyncedAt && <div className="text-xs text-gray-500">Last synced: {new Date(lastSyncedAt).toLocaleString()}</div>}
      {error && <div className="text-xs text-red-600">Error: {error}</div>}
    </div>
  );
}
