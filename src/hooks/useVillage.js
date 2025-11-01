import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";

export function useVillage() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : { supabase:null, user:null });
  const [villages, setVillages] = useState([]);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);

  const fetchVillages = useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { data: mem } = await supabase.from("village_members").select("village_id, role, joined_at").eq("user_id", user.id);
    setMembers(mem||[]);
    if (!mem || mem.length === 0) { setVillages([]); setPosts([]); return; }
    const ids = mem.map(m => m.village_id);
    const { data: v } = await supabase.from("villages").select("id,name,invite_code,created_at").in("id", ids);
    setVillages(v||[]);
    const { data: p } = await supabase.from("village_posts").select("id,village_id,user_id,text,mood,created_at").in("village_id", ids).order("created_at",{ascending:false}).limit(100);
    setPosts(p||[]);
  }, [supabase, user?.id]);

  const createVillage = useCallback(async (name) => {
    const { data, error } = await (supabase?.rpc("create_village", { v_name: name }) || {});
    if (error) throw error;
    await fetchVillages();
    return data;
  }, [supabase, fetchVillages]);

  const joinVillage = useCallback(async (code) => {
    const { data, error } = await (supabase?.rpc("join_village", { v_code: code }) || {});
    if (error) throw error;
    await fetchVillages();
    return data;
  }, [supabase, fetchVillages]);

  const leaveVillage = useCallback(async (id) => {
    const { error } = await (supabase?.rpc("leave_village", { v_id: id }) || {});
    if (error) throw error;
    await fetchVillages();
  }, [supabase, fetchVillages]);

  const postCheckin = useCallback(async (villageId, text, mood) => {
    const { data, error } = await (supabase?.rpc("post_checkin", { v_id: villageId, p_text: text, p_mood: mood ?? null }) || {});
    if (error) throw error;
    await fetchVillages();
    return data;
  }, [supabase, fetchVillages]);

  const reactPost = useCallback(async (postId) => {
    const { error } = await (supabase?.rpc("react_post", { p_id: postId }) || {});
    if (error) throw error;
    await fetchVillages();
  }, [supabase, fetchVillages]);

  useEffect(() => { fetchVillages(); }, [fetchVillages]);

  return { villages, members, posts, createVillage, joinVillage, leaveVillage, postCheckin, reactPost, refresh: fetchVillages };
}
