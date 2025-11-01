import React from "react";
import { useHeartbeat } from "../hooks/useHeartbeat";

export default function FriendsPanel() {
  const { friendStatuses, refresh } = useHeartbeat();
  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Friends</h3>
        <button onClick={refresh} className="rounded bg-gray-100 px-3 py-1">Refresh</button>
      </div>
      {friendStatuses.length === 0 ? (
        <div className="text-sm text-gray-500">Add friends’ emails in <b>Settings</b> to see their status.</div>
      ) : (
        <ul className="space-y-2">
          {friendStatuses.map(f => (
            <li key={f.email} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dot active={f.active} status={f.status} />
                <span className="font-medium">{f.email}</span>
              </div>
              <span className="text-sm text-gray-500">
                {String(f.status || "unknown").toUpperCase()}
                {f.updated_at ? ` • ${new Date(f.updated_at).toLocaleTimeString()}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">“Active” = seen in the last 10 minutes. Use compassion-only nudges.</p>
    </div>
  );
}

function Dot({ active, status }) {
  const color = active ? (status === "sos" ? "#ef4444" : status === "low" ? "#f59e0b" : "#22c55e") : "#9ca3af";
  return <span style={{ background: color }} className="inline-block w-3 h-3 rounded-full" />;
}
