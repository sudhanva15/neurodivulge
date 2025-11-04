import React, { useMemo, useState } from "react";
import { useSupabase } from "../supabase/useSupabase";
import { emitGameEvent } from "../gamify/gamify";
import presets from "../data/ritualPresets";
import PresetRow from "./PresetRow";
import { useToast } from "./ui/Toast";

const DEFAULT_STEPS = [
  { title: "Snana — Shower", seconds: 60 },
  { title: "Pranayama — 12 breaths", seconds: 45 },
  { title: "Mantra/Reading — 1 verse", seconds: 60 },
  { title: "Surya/Yoga — 3–5 min", seconds: 180 },
];

export default function RitualGuide() {
  const { supabase, user } =
    typeof useSupabase === "function"
      ? useSupabase()
      : { supabase: null, user: null };
  const { show, ToastHost } = useToast();
  const [i, setI] = useState(-1); // -1 = idle
  const [steps] = useState(DEFAULT_STEPS);
  const playing = i >= 0 && i < steps.length;
  const total = useMemo(
    () => steps.reduce((s, x) => s + x.seconds, 0),
    [steps]
  );

  React.useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (i < steps.length - 1) setI(i + 1);
      else finish();
    }, steps[i].seconds * 1000);
    speak(steps[i].title);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [i, playing]);

  function start() {
    setI(0);
  }
  async function finish() {
    setI(-1);
    try {
      if (supabase && user?.id) {
        await supabase.from("ritual_logs").insert({
          user_id: user.id,
          steps,
          duration_sec: total,
        });
      }
      emitGameEvent("ritual_done", 1);
    } catch {}
  }

  function applyPreset(preset) {
    // For now we just record a quick ritual log with the preset title; can expand later.
    try {
      if (supabase && user?.id) {
        supabase.from("ritual_logs").insert({
          user_id: user.id,
          steps: [{ title: preset.title, seconds: 0 }],
          duration_sec: 0,
          preset_id: preset.id,
        });
      }
    } catch {}
    show(`Applied: ${preset.title}`);
  }

  function speak(text) {
    try {
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
    } catch {}
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Morning Ritual</h3>
        {playing ? (
          <button onClick={finish} className="rounded px-3 py-2 border">
            Stop
          </button>
        ) : (
          <button
            onClick={start}
            className="rounded bg-black text-white px-3 py-2"
          >
            Play guide
          </button>
        )}
      </div>
      {!playing && (
        <p className="text-sm text-gray-600">
          Gentle sequence to start your day.
        </p>
      )}
      {playing && (
        <div className="rounded-xl border p-3">
          <div className="text-sm text-gray-500">
            Step {i + 1}/{steps.length}
          </div>
          <div className="text-lg font-medium">{steps[i].title}</div>
          <div className="text-sm text-gray-500">Auto-advances…</div>
        </div>
      )}
      <ul className="text-sm text-gray-700 list-disc pl-5">
        {steps.map((s, idx) => (
          <li key={idx}>
            {s.title} — ~{s.seconds}s
          </li>
        ))}
      </ul>
      {!playing && (
        <div className="mt-3 border-t pt-2">
          <div className="text-sm font-medium mb-1">Quick presets</div>
          {presets.map((p) => (
            <PresetRow
              key={p.id}
              title={p.title}
              desc={p.desc}
              onApply={() => applyPreset(p)}
            />
          ))}
        </div>
      )}
      <ToastHost />
    </div>
  );
}
