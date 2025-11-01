/**
 * Lightweight gamification engine for NeuroDivulge.
 * - emitGameEvent(key, amount?) logs an event (Supabase) and checks unlocks.
 * - getUnlocked() returns cached unlocked achievements (local + remote sync).
 * - AchievementsPanel uses this to render badges.
 */
import { useSupabase } from "../supabase/useSupabase";

const LS_KEY = "nd.achievements.v1";

export function getLocalUnlocked() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
export function setLocalUnlocked(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(new Set(list))));
}

export async function syncUnlocked(supabase, userId) {
  if (!supabase || !userId) return getLocalUnlocked();
  const { data } = await supabase.from("user_achievements").select("achievement_id").order("unlocked_at",{ascending:false});
  const unlocked = (data||[]).map(r => r.achievement_id);
  setLocalUnlocked(unlocked);
  return unlocked;
}

export async function emitGameEvent(eventKey, amount = 1) {
  const { supabase, user } = typeof useSupabase === "function" ? useSupabase() : { supabase:null, user:null };
  const userId = user?.id;
  try {
    if (supabase && userId) {
      await supabase.from("game_events").insert({ user_id: userId, event_key: eventKey, amount });
      await checkAchievements(supabase, userId, eventKey);
    } else {
      // offline/local fallback: still update client cache when possible
      await checkAchievements(null, null, eventKey);
    }
  } catch (e) { /* silent fail to avoid shame/blocks */ }
}

// Simple unlock rules: pull thresholds from achievements table and compare to counts
async function checkAchievements(supabase, userId, eventKeyJustEmitted) {
  // Load all achievements
  let achievements = [];
  if (supabase) {
    const res = await supabase.from("achievements").select("id,condition_key,threshold");
    achievements = res.data || [];
  } else {
    // very small fallback catalog if offline
    achievements = [
      { id: "reflection_3", condition_key: "reflection_created", threshold: 3 },
      { id: "hydration_60", condition_key: "hydration_60", threshold: 1 },
    ];
  }

  // Get current unlocked list
  const unlocked = new Set(getLocalUnlocked());

  // Compute simple counters by querying events (if available) or by last emitted key
  const counts = {};
  if (supabase && userId) {
    const { data } = await supabase
      .from("game_events")
      .select("event_key, amount")
      .gte("created_at", new Date(Date.now() - 1000*60*60*24*60).toISOString()); // last 60 days
    for (const row of (data||[])) counts[row.event_key] = (counts[row.event_key]||0) + (row.amount||1);
  } else {
    // minimal local bump so one-shot achievements like hydration_60 can unlock
    counts[eventKeyJustEmitted] = (counts[eventKeyJustEmitted]||0) + 1;
  }

  // Try to unlock where threshold met and not yet unlocked
  const toUnlock = achievements
    .filter(a => (counts[a.condition_key]||0) >= a.threshold && !unlocked.has(a.id))
    .map(a => a.id);

  if (toUnlock.length === 0) return;

  // Persist
  const updated = Array.from(new Set([...unlocked, ...toUnlock]));
  setLocalUnlocked(updated);

  if (supabase && userId) {
    const rows = toUnlock.map(id => ({ user_id: userId, achievement_id: id }));
    await supabase.from("user_achievements").insert(rows).select().throwOnError?.();
  }

  // Provide a tiny celebration hook
  try {
    window?.ND?.onAchievementsUnlocked?.(toUnlock);
  } catch (_) {}
}

// Convenience for global access in dev
if (typeof window !== "undefined") {
  window.ND = window.ND || {};
  window.ND.emitGameEvent = emitGameEvent;
  window.ND.getLocalUnlocked = getLocalUnlocked;
}
