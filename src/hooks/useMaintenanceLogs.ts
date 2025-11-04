import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";

export type Log = {
  id?: string;
  date: string;
  habit: string;
  unit: string;
  amount: number;
  meta?: any;
  created_at?: string;
  user_id?: string;
};

const LS_KEY = "maint_logs_v1";
function readLS(): any[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLS(rows: any[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {}
}

function isoDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(d = new Date(), weekStartsOnMonday = true) {
  const day = d.getDay(); // 0=Sun
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : 1 - day) : -day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfWeek(d = new Date(), weekStartsOnMonday = true) {
  const start = startOfWeek(d, weekStartsOnMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  return end;
}

export default function useMaintenanceLogs(userId?: string) {
  const { supabase, user } = (
    typeof useSupabase === "function"
      ? useSupabase()
      : { supabase: null, user: null }
  ) as any;
  const effectiveUserId = userId || user?.id;
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const todayStr = isoDate(new Date());
  const weekStart = isoDate(startOfWeek(new Date(), true));
  const weekEnd = isoDate(endOfWeek(new Date(), true));

  // fetch this week's logs on mount / user change
  useEffect(() => {
    let cancelled = false;
    async function fetchWeek() {
      if (!supabase || !effectiveUserId) {
        const all = readLS();
        const ranged = all.filter(
          (l: any) => l.date >= weekStart && l.date < weekEnd
        );
        setLogs(ranged);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(undefined);
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("user_id", effectiveUserId)
        .gte("date", weekStart)
        .lt("date", weekEnd)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message || String(error));
        setLoading(false);
        return;
      }
      setLogs(Array.isArray(data) ? (data as Log[]) : []);
      setLoading(false);
    }
    fetchWeek();
    return () => {
      cancelled = true;
    };
  }, [supabase, effectiveUserId, weekStart, weekEnd]);

  async function add(log: Log) {
    const base: Log = {
      date: log.date || todayStr,
      habit: log.habit,
      unit: log.unit,
      amount: Number(log.amount ?? 1),
      meta: log.meta ?? {},
      user_id: effectiveUserId || null,
    };
    const temp: Log = {
      ...base,
      id: crypto?.randomUUID?.() || `tmp_${Math.random().toString(36).slice(2)}`,
      created_at: new Date().toISOString(),
    };
    if (import.meta?.env?.MODE !== "production")
      console.debug("[maint:add]", log);
    setLogs((prev) => [...prev, temp]);

    if (!supabase || !effectiveUserId) {
      const all = readLS();
      all.push(temp);
      writeLS(all);
      return temp;
    }
    const { data, error } = await supabase
      .from("maintenance_logs")
      .insert([{ ...base, user_id: effectiveUserId }])
      .select()
      .single();

    if (error) {
      // revert optimistic insert on error
      setLogs((prev) => prev.filter((l) => l.id !== temp.id));
      setError(error.message || String(error));
      throw error;
    }

    // replace temp with real row
    setLogs((prev) => prev.map((l) => (l.id === temp.id ? (data as Log) : l)));
    return data as Log;
  }

  function countToday(habitId: string) {
    return logs
      .filter((l) => l.habit === habitId && l.date === todayStr)
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  function countThisWeek(habitId: string) {
    return logs
      .filter(
        (l) => l.habit === habitId && l.date >= weekStart && l.date < weekEnd
      )
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  return {
    logs,
    loading,
    error,
    add,
    countToday,
    countThisWeek,
    refetch: async () => {
      // simple refetch helper
      if (!supabase || !effectiveUserId) return;
      const { data } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("user_id", effectiveUserId)
        .gte("date", weekStart)
        .lt("date", weekEnd)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });
      setLogs(Array.isArray(data) ? (data as Log[]) : []);
    },
  };
}
