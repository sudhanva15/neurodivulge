import React, { useEffect, useMemo, useRef, useState } from "react";
import { exportState, importState } from "../state-io";
import { useSupabase } from "../supabase/useSupabase";

const LS_SETTINGS_KEY = "nd.settings.v1";
const DEFAULTS = {
  email: "",
  heartbeatStatus: "ok", // ok | low | sos
  heartbeatMinutes: 5, // 1–5
  sfx: true,
  allowResearch: false,
  friends: [],
};

const clampMinutes = (v) => Math.min(5, Math.max(1, Number(v || 5)));
const nowISO = () => new Date().toISOString();
// Feature gate: Calendar preview (enable with VITE_FEAT_CALENDAR=1)
const CALENDAR_FEAT = (import.meta?.env?.VITE_FEAT_CALENDAR ?? "0") === "1";

export default function SettingsCard() {
  // Call the hook once and reuse its values to avoid double-invocation.
  const sb = useSupabase();
  const { user } = sb || {};
  const supabase = sb;
  const timerRef = useRef(null);
  const [hb, setHb] = useState({ last: null, state: "idle", error: null }); // idle|syncing|ok|error
  const [settings, setSettings] = useState(DEFAULTS);
  const validHeartbeat = useMemo(
    () => clampMinutes(settings.heartbeatMinutes),
    [settings.heartbeatMinutes]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      if (user?.email && !settings.email) {
        setSettings((s) => ({ ...s, email: user.email }));
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  async function onExport() {
    const blob = await exportState();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurodivulge-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    await importState(text);
    alert("Import complete. Reloading…");
    location.reload();
  }

  function addFriend(email) {
    const clean = String(email || "")
      .trim()
      .toLowerCase();
    if (!clean || !clean.includes("@")) return;
    update(
      "friends",
      Array.from(new Set([...(settings.friends || []), clean]))
    );
  }
  function removeFriend(email) {
    update(
      "friends",
      (settings.friends || []).filter((e) => e !== email)
    );
  }

  async function sendHeartbeat(reason = "manual") {
    if (!supabase || !supabase.client || !user) {
      setHb({
        last: hb.last,
        state: "idle",
        error: user ? null : "Sign in to enable heartbeat",
      });
      return;
    }
    const payload = {
      user_id: user.id,
      email: settings.email || user.email || null,
      status: settings.heartbeatStatus || "ok",
    };
    try {
      setHb((p) => ({ ...p, state: "syncing", error: null }));
      const { error } = await supabase.client
        .from("heartbeats")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setHb({ last: nowISO(), state: "ok", error: null });
    } catch (e) {
      setHb({ last: hb.last, state: "error", error: e?.message || String(e) });
    }
  }

  // Manage heartbeat interval
  useEffect(() => {
    // clear previous timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // start only if signed-in user present
    if (user && validHeartbeat >= 1) {
      // immediate ping on change
      sendHeartbeat("init").catch(() => {});
      timerRef.current = setInterval(
        () => sendHeartbeat("interval"),
        validHeartbeat * 60 * 1000
      );
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, validHeartbeat, settings.email, settings.heartbeatStatus]);

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <h3 className="text-lg font-semibold">Settings</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">My heartbeat email</span>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@domain.com"
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">My status</span>
          <select
            value={settings.heartbeatStatus}
            onChange={(e) => update("heartbeatStatus", e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="ok">OK</option>
            <option value="low">Low</option>
            <option value="sos">SOS</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.sfx}
            onChange={(e) => update("sfx", e.target.checked)}
          />
          <span className="text-sm">Enable sounds</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.allowResearch}
            onChange={(e) => update("allowResearch", e.target.checked)}
          />
          <span className="text-sm">
            Contribute anonymized data to research
          </span>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Heartbeat interval (min)
          </span>
          <input
            type="number"
            min="1"
            max="5"
            value={settings.heartbeatMinutes}
            onChange={(e) => update("heartbeatMinutes", e.target.value)}
            className="border rounded px-3 py-1 w-20"
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-600">Friends (for heartbeat)</div>
        <FriendAdder onAdd={addFriend} />
        <div className="flex flex-wrap gap-2">
          {(settings.friends || []).map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
            >
              {e}
              <button
                onClick={() => removeFriend(e)}
                className="text-gray-500 hover:text-black"
              >
                ×
              </button>
            </span>
          ))}
          {(!settings.friends || settings.friends.length === 0) && (
            <span className="text-sm text-gray-500">
              Add emails in Settings to see status in Friends.
            </span>
          )}
        </div>
      </div>

      {/* ——— Integrations — Calendar (preview, gated) ——— */}
      {CALENDAR_FEAT && (
        <div className="rounded-2xl border p-3 space-y-2">
          <div className="text-sm text-gray-600">Calendar (preview)</div>
          <button
            type="button"
            onClick={() =>
              alert("Google Calendar connect coming soon — safe placeholder.")
            }
            className="rounded border px-3 py-2"
          >
            Connect Google Calendar (coming soon)
          </button>
          <div className="text-xs text-gray-500">
            This is a placeholder; no calendar data is accessed yet.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onExport}
          className="rounded bg-black text-white px-3 py-2"
        >
          Export data
        </button>
        <label className="rounded border px-3 py-2 cursor-pointer">
          Import data
          <input
            type="file"
            accept="application/json"
            onChange={onImport}
            className="hidden"
          />
        </label>
        <button
          onClick={() => sendHeartbeat("manual")}
          className="rounded border px-3 py-2"
          disabled={!user || hb.state === "syncing"}
          title={!user ? "Sign in to enable heartbeat" : "Send heartbeat"}
        >
          {hb.state === "syncing" ? "Syncing…" : "Sync heartbeat"}
        </button>
        {hb.last && (
          <span className="text-xs text-gray-500">
            Last: {new Date(hb.last).toLocaleTimeString()}
          </span>
        )}
        {hb.state === "error" && (
          <span className="text-xs text-red-600">Error: {hb.error}</span>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Signed in as: {user?.email ?? "guest"} • Settings saved locally •
        Heartbeat:{" "}
        {user ? (hb.state === "ok" ? "OK" : hb.state) : "disabled (sign in)"}
      </div>
    </div>
  );
}

function FriendAdder({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input
        type="email"
        placeholder="friend@domain.com"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="border rounded px-3 py-2 flex-1"
      />
      <button
        onClick={() => {
          onAdd(v);
          setV("");
        }}
        className="rounded bg-gray-200 px-3"
      >
        Add
      </button>
    </div>
  );
}
