import { useEffect, useState } from "react";
import { supabase, ensureAnon } from "./supabaseClient";

export function useHeartbeat({ email, status = "ok", intervalMs = 5 * 60 * 1000 }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const u = await ensureAnon();
      setUser(u);
      if (!u) return;
      // initial upsert
      await supabase.from("heartbeats").upsert({ user_id: u.id, email, status, last_seen: new Date().toISOString() });
      const id = setInterval(async () => {
        await supabase.from("heartbeats").upsert({ user_id: u.id, email, status, last_seen: new Date().toISOString() });
      }, intervalMs);
      return () => clearInterval(id);
    })();
  }, [email, status, intervalMs]);

  return user;
}
