import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";

export function useReflections() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : { supabase: null, user: null });
  const [mine, setMine] = useState([]);
  const [community, setCommunity] = useState([]);

  const fetchMine = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data, error } = await supabase
      .from("reflections")
      .select("id,mood,note,tags,shared,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setMine(data);
  }, [supabase, user?.id]);

  const fetchCommunity = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("community_reflections")
      .select("anon_id,mood,note,tags,created_at")
      .limit(50);
    if (!error && data) setCommunity(data);
  }, [supabase]);

  const createReflection = useCallback(async ({ mood, note, tags = [], shared = false }) => {
    if (!supabase || !user?.id) throw new Error("Not signed in");
    const payload = { user_id: user.id, mood, note, tags, shared };
    const { data, error } = await supabase.from("reflections").insert(payload).select().single();
    if (error) throw error;
    fetchMine();
    if (shared) fetchCommunity();
    return data;
  }, [supabase, user?.id, fetchMine, fetchCommunity]);

  const toggleShare = useCallback(async (id, shared) => {
    if (!supabase) return;
    await supabase.from("reflections").update({ shared }).eq("id", id);
    fetchMine();
    fetchCommunity();
  }, [supabase, fetchMine, fetchCommunity]);

  useEffect(() => { fetchMine(); fetchCommunity(); }, [fetchMine, fetchCommunity]);

  return { mine, community, createReflection, toggleShare, refreshMine: fetchMine, refreshCommunity: fetchCommunity };
}
