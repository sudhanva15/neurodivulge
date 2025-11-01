import { useEffect, useRef, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
const LS_SETTINGS_KEY = "nd.settings.v1";

export function useHeartbeat() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : { supabase: null, user: null });
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
          minutes: Math.min(5, Math.max(1, Number(s.heartbeatMinutes || 5)))
        });
        setFriends(Array.isArray(s.friends) ? s.friends : []);
      }
    } catch {}
  }, []);

  // upsert my heartbeat periodically
  useEffect(() => {
    if (!supabase || !user?.id || !me.email) return;
    const send = async () => {
      await supabase.from("heartbeats").upsert({
        user_id: user.id,
        email: me.email,
        status: me.status,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    };
    send();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(send, me.minutes * 60 * 1000);
    return () => clearInterval(timerRef.current);
  }, [supabase, user?.id, me.email, me.status, me.minutes]);

  // fetch friends
  const refresh = async () => {
    if (!supabase || (friends||[]).length === 0) { setFriendStatuses([]); return; }
    const lower = friends.map(e => e.toLowerCase());
    const { data, error } = await supabase
      .from("heartbeat_lookup")
      .select("email_key,status,updated_at");
    if (error) return;
    const now = Date.now();
    const map = new Map();
    for (const row of data) {
      if (!lower.includes(row.email_key)) continue;
      const ageMin = (now - new Date(row.updated_at).getTime()) / 60000;
      map.set(row.email_key, {
        email: row.email_key,
        status: row.status,
        updated_at: row.updated_at,
        active: ageMin <= 10
      });
    }
    setFriendStatuses(lower.map(e => map.get(e) || { email: e, status: "unknown", updated_at: null, active: false }));
  };

  return { friendStatuses, refresh, me, friends };
}
