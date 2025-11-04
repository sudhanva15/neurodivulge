import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";

/**
 * useReflections (hybrid: local-first with Supabase sync)
 *
 * Exposes:
 *  - mine, community
 *  - createReflection({ mood, note, tags, shared })
 *  - updateReflection(id, { mood?, note?, tags?, shared? })
 *  - toggleShare(id, shared)
 *  - getTodays()
 *  - refresh()   // refetch mine + community; also attempts to flush pending
 *  - pendingCount, lastSyncedAt, lastLocalChangeAt, version
 */
export function useReflections() {
  // ——— Supabase context (support both shapes: {supabase} or {client}) ———
  const ctx =
    typeof useSupabase === "function"
      ? useSupabase()
      : { supabase: null, client: null, user: null };
  const sb = ctx?.supabase?.from
    ? ctx.supabase
    : ctx?.client?.from
    ? ctx.client
    : null;
  if (!sb) {
    // helps detect misconfigured env quickly (no spam; only once on hook mount)
    try {
      console.warn(
        "[useReflections] Supabase client unavailable; operating local-only."
      );
    } catch {}
  }
  const user = ctx?.user || null;

  // ——— Local state ———
  const [mine, setMine] = useState([]); // my reflections (from DB or local)
  const [community, setCommunity] = useState([]); // public reflections (DB)
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [lastLocalChangeAt, setLastLocalChangeAt] = useState(null);
  const version = 1;
  const flushingRef = useRef(false);

  // ——— Local cache helpers ———
  const LS_KEY = "nd.reflections.v1";
  // normalize tags from either string "a, b" or array ["a","b"]
  const sanitizeTags = (t) => {
    try {
      if (typeof t === "string") {
        return t
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (Array.isArray(t)) {
        return t
          .map((s) => (typeof s === "string" ? s.trim() : String(s)))
          .filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  };
  const readLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);
  const writeLocal = useCallback((arr) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(arr));
      setLastLocalChangeAt(new Date().toISOString());
    } catch {}
  }, []);

  // normalize record shape and provide a text alias for consumers that expect `text`
  const normalize = (r) => ({
    id: r.id,
    mood: r.mood ?? 3,
    note: r.note ?? r.text ?? "",
    text: r.note ?? r.text ?? "",
    tags: sanitizeTags(r.tags),
    shared: !!r.shared,
    created_at:
      r.created_at || r.inserted_at || r.updated_at || new Date().toISOString(),
    updated_at: r.updated_at || r.created_at || null,
    pending: !!r.pending,
    op: r.op || null,
  });

  // ——— DB fetchers ———
  const fetchMine = useCallback(async () => {
    // If not signed in, fall back to local cache only
    if (!sb || !user?.id) {
      const local = readLocal().map(normalize).sort(byDateDesc);
      setMine(local);
      setPendingCount(local.filter((x) => x.pending).length);
      return;
    }
    try {
      const { data, error } = await sb
        .from("reflections")
        .select("id,mood,note,tags,shared,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data || []).map(normalize);
      setMine(rows);
      setPendingCount(0);
    } catch {
      // fallback to local cache if DB fails
      const local = readLocal().map(normalize).sort(byDateDesc);
      setMine(local);
      setPendingCount(local.filter((x) => x.pending).length);
    }
  }, [sb, user?.id, readLocal]);

  const fetchCommunity = useCallback(async () => {
    if (!sb) {
      setCommunity([]);
      return;
    }
    try {
      const { data, error } = await sb
        .from("community_reflections")
        .select("anon_id,mood,note,tags,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setCommunity(
        (data || []).map((r) => ({
          anon_id: r.anon_id,
          mood: r.mood ?? 3,
          note: r.note ?? "",
          text: r.note ?? "",
          tags: Array.isArray(r.tags) ? r.tags : [],
          created_at: r.created_at,
        }))
      );
    } catch {
      setCommunity([]);
    }
  }, [sb]);

  // ——— Flush pending local reflections to DB ———
  const flushPending = useCallback(async () => {
    if (flushingRef.current) return;
    if (!sb || !user?.id) return;
    const local = readLocal();
    const pending = local.filter((r) => r?.pending);
    if (pending.length === 0) return;
    flushingRef.current = true;
    try {
      for (const r of pending) {
        if (r.op === "create") {
          const payload = {
            user_id: user.id,
            mood: r.mood,
            note: r.note ?? r.text ?? "",
            tags: r.tags || [],
            shared: !!r.shared,
          };
          const { data, error } = await sb
            .from("reflections")
            .insert(payload)
            .select("id,created_at,updated_at")
            .single();
          if (!error && data) {
            // replace local pending record with DB id
            r.id = data.id;
            r.pending = false;
            r.op = null;
            r.created_at = data.created_at || r.created_at;
            r.updated_at =
              data.updated_at || data.created_at || r.updated_at || null;
            // community mirror on share
            if (r.shared) {
              try {
                const anon_id = (user?.id || "anon").slice(0, 12);
                await sb.from("community_reflections").insert({
                  anon_id,
                  mood: r.mood,
                  note: r.note ?? r.text ?? "",
                  tags: r.tags || [],
                });
              } catch {}
            }
          }
        } else if (r.op === "update" && r.id) {
          const payload = {
            mood: r.mood,
            note: r.note ?? r.text ?? "",
            tags: r.tags || [],
            shared: !!r.shared,
          };
          await sb.from("reflections").update(payload).eq("id", r.id);
          r.pending = false;
          r.op = null;
          r.updated_at = new Date().toISOString();
        }
      }
      writeLocal(local);
      setLastSyncedAt(new Date().toISOString());
    } catch {
      // keep pending; will retry later
    } finally {
      flushingRef.current = false;
    }
  }, [sb, user?.id, readLocal, writeLocal]);

  // ——— Public API: create / update / toggleShare ———
  const createReflection = useCallback(
    async ({ mood, note, tags = [], shared = false }) => {
      const rec = normalize({
        id: null,
        mood: Number(mood ?? 3),
        note: String(note ?? ""),
        tags: sanitizeTags(tags),
        shared: !!shared,
        created_at: new Date().toISOString(),
        pending: !sb || !user?.id, // pending if offline/not signed in
        op: !sb || !user?.id ? "create" : null,
      });

      // optimistic local append
      const local = readLocal();
      local.unshift(rec);
      writeLocal(local);
      setMine((m) => [rec, ...m]);
      setPendingCount((c) => c + (rec.pending ? 1 : 0));

      // push to DB if possible
      if (sb && user?.id) {
        try {
          const payload = {
            user_id: user.id,
            mood: rec.mood,
            note: rec.note,
            tags: rec.tags,
            shared: rec.shared,
          };
          const { data, error } = await sb
            .from("reflections")
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          // replace optimistic record with DB row
          const updated = {
            ...rec,
            ...normalize(data),
            pending: false,
            op: null,
          };
          // if shared, mirror into community table (best effort, no PII)
          if (updated.shared) {
            try {
              const anon_id = (user?.id || "anon").slice(0, 12);
              await sb.from("community_reflections").insert({
                anon_id,
                mood: updated.mood,
                note: updated.note,
                tags: updated.tags,
              });
            } catch {}
          }
          const arr = readLocal();
          const idx = arr.findIndex((x) => x === rec);
          if (idx >= 0) arr[idx] = updated;
          writeLocal(arr);
          setMine((m) => [updated, ...m.filter((x) => x !== rec)]);
          setPendingCount((c) => Math.max(0, c - 1));
          setLastSyncedAt(new Date().toISOString());
          return updated;
        } catch (e) {
          // leave as pending
          return rec;
        }
      }
      return rec;
    },
    [sb, user?.id, readLocal, writeLocal]
  );

  const updateReflection = useCallback(
    async (id, { mood, note, tags, shared }) => {
      // apply to local (optimistic)
      const arr = readLocal();
      const idx = arr.findIndex((r) => r.id === id || (!r.id && r.pending));
      if (idx >= 0) {
        arr[idx] = normalize({
          ...arr[idx],
          mood: typeof mood === "number" ? mood : arr[idx].mood,
          note: typeof note === "string" ? note : arr[idx].note,
          tags:
            typeof tags !== "undefined" ? sanitizeTags(tags) : arr[idx].tags,
          shared: typeof shared === "boolean" ? shared : arr[idx].shared,
          updated_at: new Date().toISOString(),
          pending: !sb || !user?.id ? true : arr[idx].pending,
          op: !sb || !user?.id ? "update" : arr[idx].op,
        });
        writeLocal(arr);
        setMine((m) => {
          const j = m.findIndex((r) => r.id === id || (!r.id && r.pending));
          if (j >= 0) {
            const copy = m.slice();
            copy[j] = arr[idx];
            return copy;
          }
          return m;
        });
      }
      // push to DB if possible
      if (sb && user?.id && id) {
        try {
          const payload = {};
          if (typeof mood === "number") payload.mood = mood;
          if (typeof note === "string") payload.note = note;
          if (typeof tags !== "undefined") payload.tags = sanitizeTags(tags);
          if (typeof shared === "boolean") payload.shared = shared;
          const { error } = await sb
            .from("reflections")
            .update(payload)
            .eq("id", id);
          if (error) throw error;
          setLastSyncedAt(new Date().toISOString());
        } catch {
          // keep local pending flag; will flush later
        }
      }
    },
    [sb, user?.id, readLocal, writeLocal]
  );

  const toggleShare = useCallback(
    async (id, shared) => {
      const on = !!shared;
      await updateReflection(id, { shared: on });
      if (on && sb) {
        try {
          // find the reflection data (from memory or local) to mirror
          const localList = readLocal().map(normalize);
          const mem = (mine || []).find((r) => r.id === id);
          const src = mem || localList.find((r) => r.id === id) || null;
          if (src) {
            const anon_id = (user?.id || "anon").slice(0, 12);
            await sb.from("community_reflections").insert({
              anon_id,
              mood: src.mood,
              note: src.note ?? "",
              tags: src.tags || [],
            });
          }
        } catch {}
      }
      fetchCommunity();
    },
    [updateReflection, fetchCommunity, sb, user?.id, mine, readLocal]
  );

  // ——— Derived helpers ———
  const getTodays = useCallback(() => {
    const d = new Date().toISOString().slice(0, 10);
    const list = mine || [];
    const row = list.find(
      (r) => String((r.created_at || "").slice(0, 10)) === d
    );
    return row ? normalize(row) : null;
  }, [mine]);

  const refresh = useCallback(async () => {
    // attempt to flush pending first
    await flushPending();
    await Promise.all([fetchMine(), fetchCommunity()]);
  }, [flushPending, fetchMine, fetchCommunity]);

  // ——— Initial load ———
  useEffect(() => {
    // show local quickly
    const local = readLocal().map(normalize).sort(byDateDesc);
    setMine(local);
    setPendingCount(local.filter((x) => x.pending).length);
    // then try DB and community
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    mine,
    community,
    createReflection,
    updateReflection,
    toggleShare,
    getTodays,
    refresh,
    pendingCount,
    lastSyncedAt,
    lastLocalChangeAt,
    version,
  };
}

// ——— utils ———
function byDateDesc(a, b) {
  const ta = Date.parse(a.created_at || a.updated_at || 0) || 0;
  const tb = Date.parse(b.created_at || b.updated_at || 0) || 0;
  return tb - ta;
}
