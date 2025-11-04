import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.warn(
    "[Supabase] Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  );
}

let clientSingleton = null;
function getClient() {
  if (!URL || !KEY) return null;
  if (!clientSingleton)
    clientSingleton = createClient(URL, KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  return clientSingleton;
}

const Ctx = createContext({
  supabase: null,
  user: null,
  isAuthed: false,
  sessionLoading: true,
});

export function SupabaseProvider({ children }) {
  const supabase = useMemo(getClient, []);
  const [user, setUser] = useState(null);
  const [sessionLoading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      user,
      isAuthed: !!user,
      sessionLoading,
      // convenience helpers used by UI
      signInWithOtp: (email) =>
        supabase
          ? supabase.auth.signInWithOtp({ email })
          : Promise.reject(new Error("Supabase not configured")),
      signOut: () => (supabase ? supabase.auth.signOut() : Promise.resolve()),
      signInWithGoogle: (redirectTo) =>
        supabase
          ? supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo:
                  redirectTo ||
                  (typeof window !== "undefined"
                    ? window.location.origin
                    : undefined),
              },
            })
          : Promise.reject(new Error("Supabase not configured")),
      getAccessToken: async () => {
        if (!supabase) return null;
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token || null;
      },
    }),
    [supabase, user, sessionLoading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSupabase() {
  return useContext(Ctx);
}

// Optional: direct client accessor for non-React modules
export const getSupabaseClient = getClient; // preferred alias
export const supabaseClient = getClient; // legacy alias, kept for BC
