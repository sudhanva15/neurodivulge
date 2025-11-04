import React, { useEffect, useMemo, useState } from "react";
import ReflectionModal from "./ReflectionModal";
import { enabled } from "../utils/FeatureGate";
import { useReflections } from "../hooks/useReflections";

/**
 * ReflectionLauncher (hardened)
 * - Gates on env flag (VITE_ENABLE_REFLECTIONS) but defaults to on
 * - Shows today's reflection preview if present
 * - Opens modal for create/edit; refreshes list after close
 * - Displays tiny sync status from useReflections (if available)
 */
export default function ReflectionLauncher() {
  // feature gate (defaults to true if flag missing)
  const reflectionsEnabled = enabled
    ? enabled("VITE_ENABLE_REFLECTIONS", true)
    : true;
  if (!reflectionsEnabled) return null;

  // hook is optional—defensive if not wired yet
  const r = typeof useReflections === "function" ? useReflections() : null;
  const saving = !!r?.saving;

  // derive today's reflection (defensive)
  const todays = useMemo(() => {
    try {
      return r?.getTodays?.() ?? null;
    } catch {
      return null;
    }
  }, [r?.getTodays, r?.version, r?.lastSyncedAt, r?.lastLocalChangeAt]);

  const [open, setOpen] = useState(false);

  // after closing modal, ask hook to refresh if present
  function handleClose() {
    setOpen(false);
    try {
      r?.refresh?.();
    } catch {}
  }

  // helpers for preview
  const preview = useMemo(() => {
    if (!todays || !todays.text) return null;
    const t = String(todays.text);
    return t.length > 120 ? t.slice(0, 120).trim() + "…" : t;
  }, [todays]);

  const statusLine = useMemo(() => {
    if (!r) return null;
    const pending = Number(r?.pendingCount || 0);
    const synced = r.lastSyncedAt
      ? new Date(r.lastSyncedAt).toLocaleTimeString()
      : null;
    if (pending > 0) return `Pending sync: ${pending}`;
    if (saving) return "Saving…";
    if (synced) return `Last synced: ${synced}`;
    return null;
  }, [r?.pendingCount, r?.lastSyncedAt, saving]);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Daily Reflection</h3>
        {todays ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Logged for today
            </span>
            <button
              onClick={() => setOpen(true)}
              disabled={saving}
              aria-expanded={open}
              className="rounded bg-white border px-3 py-2 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Edit today's reflection"
            >
              {saving ? "Saving…" : "Edit"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            disabled={saving}
            aria-expanded={open}
            className="rounded bg-black text-white px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Create today's reflection"
          >
            {saving ? "Saving…" : "Reflect"}
          </button>
        )}
      </div>

      {todays ? (
        <div className="text-sm text-gray-700">
          <div className="font-medium mb-1">Today’s note</div>
          <p className="text-gray-600">{preview ?? "(no text)"}</p>
          <div className="text-xs text-gray-500 mt-1">
            {todays.shared ? "Shared with community" : "Private"}
            {todays.created_at
              ? ` • ${new Date(todays.created_at).toLocaleTimeString()}`
              : ""}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Capture one small win. Share if you like.
        </p>
      )}

      {statusLine && <p className="text-xs text-gray-500">{statusLine}</p>}

      <ReflectionModal open={open} onClose={handleClose} />
    </div>
  );
}
