import React, { useState } from "react";
import { emitGameEvent } from "../gamify/gamify";

export default function FocusAid() {
  const [stuck, setStuck] = useState(false);
  const markFocus = ()=> emitGameEvent("focus_pillar_day",1);

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Focus Aid</h3>
        <div className="flex gap-2">
          <button onClick={()=>window?.ND?.startFocus25?.()} className="rounded border px-3 py-1">Start 25</button>
          <button onClick={()=>setStuck(s=>!s)} className="rounded border px-3 py-1">Stuck?</button>
        </div>
      </div>

      {stuck && (
        <div className="rounded-xl border p-3 space-y-2">
          <div className="font-medium">Mode Shift</div>
          <div className="grid md:grid-cols-3 gap-2">
            <button onClick={()=>doShift('Move')} className="rounded px-3 py-2 bg-gray-100">Move 1 min</button>
            <button onClick={()=>doShift('Write')} className="rounded px-3 py-2 bg-gray-100">30s brain dump</button>
            <button onClick={()=>doShift('Connect')} className="rounded px-3 py-2 bg-gray-100">Ping a friend</button>
          </div>
        </div>
      )}

      <button onClick={markFocus} className="rounded bg-black text-white px-3 py-2">Mark Focus pillar today</button>
      <p className="text-xs text-gray-500">Celebrate returning, not streaks.</p>
    </div>
  );
}

function doShift(kind){
  try {
    if (kind==='Move') navigator.vibrate?.(200);
    alert(kind + " now — tiny action shifts the gear.");
  } catch {}
}
