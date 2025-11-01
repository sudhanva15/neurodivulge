import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON;

export const supabase = url && anon ? createClient(url, anon) : null;

// Anonymous auth helper (so your app can read/write without email signup)
export async function ensureAnon() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;
  // Use signInAnonymously (supabase-js v2.45+). Fallback to PKCE magic link as needed.
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) console.warn(error);
    return data?.user ?? null;
  } catch (e) {
    console.warn("Anon auth not available; user will be null.", e);
    return null;
  }
}
