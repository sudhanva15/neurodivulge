import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
import { exportState } from "../state-io"; // you already have this

export function useCloudSync() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : { supabase:null, user:null });
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const syncNow = useCallback(async () => {
    if (!supabase || !user?.id || busy) return;
    setBusy(true); setError(null);
    try {
      const blob = await exportState();
      const text = await blob.text();
      const data = JSON.parse(text);
      const today = new Date().toISOString().slice(0,10);
      const { error: err } = await supabase.from("states").upsert({
        user_id: user.id,
        snapshot_date: today,
        data
      }, { onConflict: "user_id,snapshot_date" });
      if (err) throw err;
      setLastSyncedAt(new Date().toISOString());
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [supabase, user?.id, busy]);

  // auto once per day on load
  useEffect(() => { syncNow(); }, [syncNow]);

  return { syncNow, lastSyncedAt, busy, error };
}
