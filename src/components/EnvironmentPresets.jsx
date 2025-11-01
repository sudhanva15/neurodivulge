import React, { useEffect, useState } from "react";

const LS_KEY = "nd.env.preset.v1";
const PRESETS = {
  calm:   { bg:"#f8fafc", fg:"#0f172a", accent:"#64748b", blur:"0px" },
  deep:   { bg:"#0b1220", fg:"#e5e7eb", accent:"#94a3b8", blur:"0px" },
  night:  { bg:"#0a0a0a", fg:"#fafafa", accent:"#a3a3a3", blur:"1px" },
};

export default function EnvironmentPresets() {
  const [preset, setPreset] = useState("calm");

  useEffect(()=>{
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) apply(JSON.parse(saved));
      else apply(PRESETS.calm);
    } catch { apply(PRESETS.calm); }
  }, []);

  function apply(p) {
    document.documentElement.style.setProperty("--nd-bg", p.bg);
    document.documentElement.style.setProperty("--nd-fg", p.fg);
    document.documentElement.style.setProperty("--nd-accent", p.accent);
    document.documentElement.style.setProperty("--nd-blur", p.blur);
  }

  function choose(key) {
    const p = PRESETS[key] || PRESETS.calm;
    apply(p);
    localStorage.setItem(LS_KEY, JSON.stringify(p));
    setPreset(key);
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Environment</h3>
      </div>
      <div className="flex gap-2">
        <PresetButton label="Calm"  active={preset==='calm'}  onClick={()=>choose('calm')} />
        <PresetButton label="Deep Flow" active={preset==='deep'} onClick={()=>choose('deep')} />
        <PresetButton label="Night Focus" active={preset==='night'} onClick={()=>choose('night')} />
      </div>
      <p className="text-xs text-gray-500">Soft visual presets to reduce noise and support focus.</p>
    </div>
  );
}

function PresetButton({ label, active, onClick }) {
  return <button onClick={onClick} className={"rounded px-3 py-2 border " + (active ? "bg-gray-100" : "")}>{label}</button>;
}
