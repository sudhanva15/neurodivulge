import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHeartbeat } from "../hooks/useHeartbeat";

/**
 * FriendsPanel
 * - Reads friend statuses via useHeartbeat()
 * - Auto-refreshes on an interval (default 120s, override with VITE_FRIENDS_REFRESH_MS)
 * - Safe manual refresh with simple loading state
 */
export default function FriendsPanel() {
  const { friendStatuses, refresh } = useHeartbeat() || {};
  const list = Array.isArray(friendStatuses) ? friendStatuses : [];

  const REFRESH_MS = useMemo(() => {
    const v = Number(import.meta?.env?.VITE_FRIENDS_REFRESH_MS || 120000);
    return Number.isFinite(v) && v >= 15000 ? v : 120000; // clamp to sane minimum
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef(null);

  const safeRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.resolve(
        typeof refresh === "function" ? refresh() : undefined
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // auto-refresh on mount and on interval
  useEffect(() => {
    safeRefresh().catch(() => {});
    timerRef.current = setInterval(() => {
      safeRefresh().catch(() => {});
    }, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [REFRESH_MS]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Friends</h3>
        <button
          onClick={safeRefresh}
          className="rounded border px-3 py-1 bg-white hover:bg-gray-50 disabled:opacity-60"
          disabled={isRefreshing}
          aria-busy={isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-sm text-gray-500">
          Add friends’ emails in <b>Settings</b> to see their status.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((f, idx) => (
            <li
              key={f.email || idx}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Dot active={!!f.active} status={f.status} />
                <span className="font-medium">{f.email || "unknown"}</span>
              </div>
              <span className="text-sm text-gray-500">
                {String(f.status || "unknown").toUpperCase()}
                {f.updated_at
                  ? ` • ${new Date(f.updated_at).toLocaleTimeString()}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500">
        “Active” = seen in the last 10 minutes. Use compassion-only nudges.
      </p>
    </div>
  );
}

function Dot({ active, status }) {
  const color = active
    ? status === "sos"
      ? "#ef4444"
      : status === "low"
      ? "#f59e0b"
      : "#22c55e"
    : "#9ca3af";
  return (
    <span
      style={{ background: color }}
      className="inline-block w-3 h-3 rounded-full"
    />
  );
}
