import VillagePanel from "../components/VillagePanel";
import EnvironmentPresets from "../components/EnvironmentPresets";
import "../styles/env-presets.css";
import CloudSyncCard from "../components/CloudSyncCard";
import FocusAid from "../components/FocusAid";
import React, { useEffect, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
import { emitGameEvent } from "../gamify/gamify";

const SUBS = ["cannabis","alcohol","nicotine","caffeine"];

export default function MindfulUseCard() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : {supabase:null,user:null});
  const [rows, setRows] = useState([]);
  const [substance, setSubstance] = useState("cannabis");
  const [pre, setPre] = useState("");
  const [post, setPost] = useState("");
  const [focus, setFocus] = useState(0);
  const [mood, setMood] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchRows = async () => {
    if (!supabase || !user?.id) return;
    const since = new Date(Date.now()-1000*60*60*24*7).toISOString();
    const { data } = await supabase.from("mindful_use")
      .select("substance,pre_intent,post_reflect,effect_focus,effect_mood,created_at")
      .gte("created_at", since).order("created_at",{ascending:false});
    setRows(data||[]);
  };
  useEffect(()=>{fetchRows();},[supabase,user?.id]);

  const log = async () => {
    if (!supabase || !user?.id) return alert("Sign in first");
    setSaving(true);
    await supabase.from("mindful_use").insert({
      user_id:user.id, substance, pre_intent:pre, post_reflect:post,
      effect_focus:focus, effect_mood:mood
    });
    setPre(""); setPost(""); setFocus(0); setMood(0);
    fetchRows();
    emitGameEvent("mindful_use",1);
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mindful Use</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Substance</span>
          <select value={substance} onChange={e=>setSubstance(e.target.value)} className="border rounded px-3 py-2">
            {SUBS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Pre-intent</span>
          <input value={pre} onChange={e=>setPre(e.target.value)} placeholder="why/when/how much" className="border rounded px-3 py-2"/>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Post reflection</span>
          <input value={post} onChange={e=>setPost(e.target.value)} placeholder="how did it go?" className="border rounded px-3 py-2"/>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-24">Focus</span>
            <input type="range" min="-2" max="2" value={focus} onChange={e=>setFocus(parseInt(e.target.value))} className="flex-1"/>
            <span className="text-sm">{focus}</span>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-24">Mood</span>
            <input type="range" min="-2" max="2" value={mood} onChange={e=>setMood(parseInt(e.target.value))} className="flex-1"/>
            <span className="text-sm">{mood}</span>
          </label>
        </div>
      </div>

      <button onClick={log} disabled={saving} className="rounded bg-black text-white px-3 py-2">
        {saving ? "Saving…" : "Log entry"}
      </button>

      <div className="pt-2">
        <div className="text-sm font-medium mb-1">Last 7 days</div>
        <ul className="space-y-2 max-h-48 overflow-auto">
          {(rows||[]).map((r,i)=>(
            <li key={i} className="text-sm border rounded p-2">
              <b>{r.substance}</b> • {new Date(r.created_at).toLocaleString()} • focus {r.effect_focus}, mood {r.effect_mood}
              {r.pre_intent && <> • pre: {r.pre_intent}</>}
              {r.post_reflect && <> • post: {r.post_reflect}</>}
            </li>
          ))}
          {(!rows || rows.length===0) && <li className="text-sm text-gray-500">No entries yet.</li>}
        </ul>
      </div>
    </div>
  );
}

{/* Injected by patch: Focus micro-check-ins (fallback placement) */}
<FocusAid />

{/* Injected by patch: Cloud Sync (fallback placement) */}
<CloudSyncCard />

{/* Injected by patch: Environment presets (fallback placement) */}
<EnvironmentPresets />

{/* Injected by patch: Micro-Village (fallback placement) */}
<VillagePanel />
