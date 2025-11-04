import React from "react";

/**
 * HabitCounter
 * Props:
 *  - label, value, target, hint
 *  - mode: "counter" | "entry" (default "counter")
 *  - step, unit, cap
 *  - buttonLabel
 *  - onInc (counter)
 *  - onAddValue (entry)
 */
export default function HabitCounter({
  label,
  value = 0,
  target = 1,
  hint,
  mode = "counter",
  step = 1,
  cap,
  unit,
  buttonLabel,
  onInc,
  onAddValue,
}){
  const [entry, setEntry] = React.useState("");

  function submitEntry(e){
    e.preventDefault();
    if (mode !== "entry" || !onAddValue) return;
    const n = Number((entry || "").trim());
    if (!isFinite(n) || n <= 0) return;
    onAddValue(n);
    setEntry("");
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm opacity-70">{label}</div>
      {hint ? <div className="text-xs opacity-60 mt-0.5">{hint}</div> : null}

      <div className="text-2xl font-semibold my-2">{value}</div>
      <div className="text-xs opacity-60 -mt-2 mb-2">
        {typeof target === "number" ? `Target: ${target}` : ""}
        {cap == null ? (typeof target === "number" ? " (uncapped)" : "Uncapped") : ""}
      </div>

      {mode === "entry" ? (
        <form className="flex items-center gap-2" onSubmit={submitEntry}>
          <input
            inputMode="decimal"
            className="border rounded px-2 py-1 w-24"
            placeholder="0"
            value={entry}
            onChange={(e)=>setEntry(e.target.value)}
          />
          {unit ? <span className="text-sm opacity-60">{unit}</span> : null}
          <button type="submit" className="px-3 py-1 rounded-lg bg-black text-white">Add</button>
        </form>
      ) : (
        <button
          type="button"
          className="px-3 py-1 rounded-lg bg-black text-white"
          onClick={onInc}
        >
          {buttonLabel || `+${step}`}
        </button>
      )}
    </div>
  );
}
