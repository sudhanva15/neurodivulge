import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";

/**
 * useCloudSync
 * - Creates a daily snapshot of local app data into Supabase `states` table
 * - Upsert key: (user_id, day)
 * - Safe no-ops when user not signed in
 * - Debounced/guarded to avoid double syncs
 */
export function useCloudSync() {
  const ctx =
    typeof useSupabase === "function"
      ? useSupabase()
      : { client: null, user: null };
  const client = ctx?.supabase?.from
    ? ctx.supabase
    : ctx?.client?.from
    ? ctx.client
    : null;
  const user = ctx?.user || null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const gateRef = useRef({ syncing: false });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const lastRunRef = useRef(0);

  const buildSnapshot = useCallback(() => {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k.startsWith("nd.") ||
          k.startsWith("nd:") ||
          k.startsWith("neurodivulge:")
        ) {
          try {
            data[k] = parseMaybeJSON(localStorage.getItem(k));
          } catch {}
        }
      }
    } catch {}
    safeAttach(data, "nd.survey", getLS("nd.survey"));
    safeAttach(data, "nd.pillars", getLS("nd.pillars"));
    safeAttach(data, "nd.rituals", getLS("nd.rituals"));
    return {
      app: "neurodivulge",
      version: 1,
      captured_at: new Date().toISOString(),
      data,
    };
  }, []);

  const syncNow = useCallback(async () => {
    const now = Date.now();
    // Soft rate-limit: avoid double syncs within 20s
    if (now - lastRunRef.current < 20_000) return;
    lastRunRef.current = now;
    if (gateRef.current.syncing) return;
    if (!client || !user?.id) {
      setError("Sign in to sync");
      return;
    }
    gateRef.current.syncing = true;
    setBusy(true);
    setError(null);
    try {
      const snapshot = buildSnapshot();
      const payload = {
        user_id: user.id,
        day: today,
        data: snapshot,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await client
        .from("states")
        .upsert(payload, { onConflict: "user_id,day" });
      if (upsertError) throw upsertError;
      lastRunRef.current = Date.now();
      setLastSyncedAt(payload.updated_at);
      try {
        localStorage.setItem("nd.lastSyncDay", today);
        localStorage.setItem("nd.lastSyncAt", payload.updated_at);
      } catch {}
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
      gateRef.current.syncing = false;
    }
  }, [client, user?.id, today, buildSnapshot]);

  useEffect(() => {
    let t;
    try {
      const lastDay = localStorage.getItem("nd.lastSyncDay");
      if (lastDay !== today) {
        t = setTimeout(() => {
          syncNow().catch(() => {});
        }, 1500);
      } else {
        const ts = localStorage.getItem("nd.lastSyncAt");
        if (ts) setLastSyncedAt(ts);
      }
    } catch {}
    return () => t && clearTimeout(t);
  }, [today, syncNow]);

  const configOk = useMemo(() => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      return Boolean(url && anon);
    } catch {
      return false;
    }
  }, []);

  return {
    syncNow,
    lastSyncedAt,
    busy,
    error,
    user,
    supabase: ctx?.supabase ?? ctx?.client ?? null,
    configOk,
  };
}

// helpers
function parseMaybeJSON(raw) {
  try {
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return raw;
  }
}
function getLS(k) {
  try {
    return parseMaybeJSON(localStorage.getItem(k));
  } catch {
    return null;
  }
}
function safeAttach(obj, key, val) {
  if (typeof val !== "undefined" && val !== null) obj[key] = val;
}

/** ----------------------------------------------------------------
 *  UI PANEL
 * ----------------------------------------------------------------*/
export default function CloudSyncCard() {
  const { syncNow, lastSyncedAt, busy, error, user, supabase, configOk } =
    useCloudSync();

  const signIn = useCallback(async () => {
    try {
      if (!configOk) {
        alert(
          "Supabase config missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local"
        );
        return;
      }
      if (!supabase?.auth?.signInWithOAuth) {
        alert("Supabase client not ready.");
        return;
      }
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || String(e));
    }
  }, [supabase, configOk]);

  const signOut = useCallback(async () => {
    try {
      await supabase?.auth?.signOut?.();
    } catch {}
  }, [supabase]);

  useEffect(() => {
    if (!supabase?.auth?.onAuthStateChange) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Give Supabase a moment to settle, then sync.
        setTimeout(() => {
          syncNow().catch(() => {});
        }, 800);
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [supabase, syncNow]);

  const pill = (text) => (
    <span className="inline-flex items-center rounded-xl border px-2 py-1 text-xs text-neutral-700 bg-white">
      {text}
    </span>
  );

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">Cloud Sync</h3>
        <div className="flex items-center gap-2">
          {user?.id ? (
            <>
              {pill(`Signed in${user?.email ? `: ${user.email}` : ""}`)}
              <button className="btn-secondary" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              {pill("Signed out")}
              <button className="btn" onClick={signIn}>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </div>

      {!configOk && (
        <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-xs">
          Supabase keys are not configured. Sign-in and cloud sync will be
          disabled.
        </div>
      )}

      <p className="text-sm text-neutral-600">
        Saves a daily snapshot of your settings and progress to your account.
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          className="btn"
          disabled={busy || !user?.id || !configOk}
          onClick={syncNow}
        >
          {busy ? "Syncing…" : "Sync now"}
        </button>
        {lastSyncedAt && (
          <span className="text-xs text-neutral-500">
            Last sync: {lastSyncedAt}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-600">Sync failed: {error}</span>
        )}
      </div>
    </div>
  );
}
