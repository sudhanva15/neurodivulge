import React, { useMemo, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
import { emitGameEvent } from "../gamify/gamify";

const DEFAULT_STEPS = [
  { title: "Snana — Shower", seconds: 60 },
  { title: "Pranayama — 12 breaths", seconds: 45 },
  { title: "Mantra/Reading — 1 verse", seconds: 60 },
  { title: "Surya/Yoga — 3–5 min", seconds: 180 },
];

export default function RitualGuide() {
  const { supabase, user } = (typeof useSupabase === "function" ? useSupabase() : {supabase:null,user:null});
  const [i, setI] = useState(-1); // -1 = idle
  const [steps] = useState(DEFAULT_STEPS);
  const playing = i >= 0 && i < steps.length;
  const total = useMemo(()=>steps.reduce((s,x)=>s+x.seconds,0),[steps]);

  React.useEffect(()=>{
    if (!playing) return;
    const t = setTimeout(()=>{
      if (i < steps.length-1) setI(i+1);
      else finish();
    }, steps[i].seconds*1000);
    speak(steps[i].title);
    return ()=>clearTimeout(t);
    // eslint-disable-next-line
  },[i, playing]);

  function start(){ setI(0); }
  async function finish(){
    setI(-1);
    try {
      if (supabase && user?.id) {
        await supabase.from("ritual_logs").insert({
          user_id: user.id,
          steps,
          duration_sec: total
        });
      }
      emitGameEvent("ritual_done",1);
    } catch {}
  }

  function speak(text){
    try { window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text)); } catch {}
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Morning Ritual</h3>
        {playing ? (
          <button onClick={finish} className="rounded px-3 py-2 border">Stop</button>
        ) : (
          <button onClick={start} className="rounded bg-black text-white px-3 py-2">Play guide</button>
        )}
      </div>
      {!playing && <p className="text-sm text-gray-600">Gentle sequence to start your day.</p>}
      {playing && (
        <div className="rounded-xl border p-3">
          <div className="text-sm text-gray-500">Step {i+1}/{steps.length}</div>
          <div className="text-lg font-medium">{steps[i].title}</div>
          <div className="text-sm text-gray-500">Auto-advances…</div>
        </div>
      )}
      <ul className="text-sm text-gray-700 list-disc pl-5">
        {steps.map((s,idx)=><li key={idx}>{s.title} — ~{s.seconds}s</li>)}
      </ul>
    </div>
  );
}

{/* Injected by patch: Morning Ritual guide (fallback placement) */}
<RitualGuide />
