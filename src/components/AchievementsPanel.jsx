import React, { useEffect, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
import { getLocalUnlocked, syncUnlocked } from "../gamify/gamify";

export default function AchievementsPanel() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : { supabase:null, user:null });
  const [unlocked, setUnlocked] = useState(getLocalUnlocked());
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          const { data } = await supabase.from("achievements").select("id,title,description");
          setCatalog(data || []);
        }
        const u = await syncUnlocked(supabase, user?.id);
        setUnlocked(u);
      } catch {}
    })();

    // tiny confetti when new achievements come in (optional)
    window.ND = window.ND || {};
    window.ND.onAchievementsUnlocked = (ids) => {
      setUnlocked(prev => Array.from(new Set([...prev, ...ids])));
      try { if (window.confetti) window.confetti(); } catch {}
    };
  }, [supabase, user?.id]);

  const unlockedSet = new Set(unlocked);
  const sortCat = [...catalog].sort((a,b) => (unlockedSet.has(b.id) - unlockedSet.has(a.id)) || a.title.localeCompare(b.title));

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <span className="text-sm text-gray-500">{unlocked.length} unlocked</span>
      </div>
      {sortCat.length === 0 ? (
        <div className="text-sm text-gray-500">No achievements catalog yet.</div>
      ) : (
        <ul className="grid gap-2">
          {sortCat.map(a => (
            <li key={a.id} className={"rounded-xl border p-3 " + (unlockedSet.has(a.id) ? "bg-amber-50" : "bg-white opacity-70")}>
              <div className="font-medium">{a.title} {unlockedSet.has(a.id) && <span className="text-xs text-amber-600">• unlocked</span>}</div>
              {a.description && <div className="text-sm text-gray-600">{a.description}</div>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500">Celebrate returning, not streaks. Warmth over pressure.</p>
    </div>
  );
}
