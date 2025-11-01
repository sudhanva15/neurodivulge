import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const URL  = import.meta.env.VITE_SUPABASE_URL;
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientSingleton = null;
function getClient() {
  if (!clientSingleton) clientSingleton = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return clientSingleton;
}

const Ctx = createContext({ supabase: null, user: null, sessionLoading: true });

export function SupabaseProvider({ children }) {
  const supabase = useMemo(getClient, []);
  const [user, setUser] = useState(null);
  const [sessionLoading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) { setUser(session?.user ?? null); setLoading(false); }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  const value = useMemo(() => ({
    supabase,
    user,
    sessionLoading,
    // convenience helpers used by UI if you want to expose them later
    signInWithOtp: (email) => supabase.auth.signInWithOtp({ email }),
    signOut: () => supabase.auth.signOut()
  }), [supabase, user, sessionLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSupabase() {
  return useContext(Ctx);
}
