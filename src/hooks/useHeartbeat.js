import { useEffect, useRef, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
const LS_SETTINGS_KEY = "nd.settings.v1";

// helpers
const clampMinutes = (v) => Math.min(5, Math.max(1, Number(v || 5)));
const getClient = (sb) => (sb?.from ? sb : sb?.client?.from ? sb.client : null);

export function useHeartbeat() {
  const ctx =
    typeof useSupabase === "function"
      ? useSupabase()
      : { client: null, user: null };
  const client = getClient(ctx?.supabase || ctx?.client) || null;
  const user = ctx?.user || null;
  const [friends, setFriends] = useState([]);
  const [me, setMe] = useState({ email: "", status: "ok", minutes: 5 });
  const [friendStatuses, setFriendStatuses] = useState([]);
  const timerRef = useRef(null);

  // load local settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setMe({
          email: s.email || "",
          status: s.heartbeatStatus || "ok",
          minutes: clampMinutes(s.heartbeatMinutes),
        });
        setFriends(Array.isArray(s.friends) ? s.friends : []);
      }
    } catch {}
  }, []);

  // seed email from signed-in user if empty
  useEffect(() => {
    try {
      if (user?.email && !me.email) {
        setMe((m) => ({ ...m, email: user.email }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // upsert my heartbeat periodically
  useEffect(() => {
    if (!client || !user?.id || !me.email) return;
    let stopped = false;

    const send = async () => {
      try {
        await client.from("heartbeats").upsert(
          {
            user_id: user.id,
            email: me.email,
            status: me.status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (_) {
        /* silent; UI can show manual sync errors elsewhere */
      }
    };

    // fire immediately, then on interval
    send();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!stopped) send();
    }, clampMinutes(me.minutes) * 60 * 1000);

    return () => {
      stopped = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [client, user?.id, me.email, me.status, me.minutes]);

  // fetch friends
  const refresh = async () => {
    const list = Array.isArray(friends) ? friends : [];
    if (!client || list.length === 0) {
      setFriendStatuses([]);
      return;
    }
    const lower = list
      .map((e) => String(e || "").toLowerCase())
      .filter(Boolean);
    if (lower.length === 0) {
      setFriendStatuses([]);
      return;
    }
    const now = Date.now();

    // Try the lookup view first for speed; fall back to heartbeats table.
    let rows = null;
    try {
      const { data, error } = await client
        .from("heartbeat_lookup")
        .select("email_key,status,updated_at")
        .in("email_key", lower);
      if (error) throw error;
      rows = data || [];
    } catch {
      // fallback
      const { data } = await client
        .from("heartbeats")
        .select("email,status,updated_at");
      rows = (data || [])
        .filter((r) => lower.includes(String(r.email || "").toLowerCase()))
        .map((r) => ({
          email_key: String(r.email || "").toLowerCase(),
          status: r.status,
          updated_at: r.updated_at,
        }));
    }

    const map = new Map();
    for (const row of rows) {
      const key = String(row.email_key || "").toLowerCase();
      const updated = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      const ageMin = updated ? (now - updated) / 60000 : Infinity;
      map.set(key, {
        email: key,
        status: row.status || "unknown",
        updated_at: row.updated_at || null,
        active: ageMin <= 10,
      });
    }
    setFriendStatuses(
      lower.map(
        (e) =>
          map.get(e) || {
            email: e,
            status: "unknown",
            updated_at: null,
            active: false,
          }
      )
    );
  };

  return { friendStatuses, refresh, me, friends };
}
