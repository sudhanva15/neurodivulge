import React from "react";
export default function PresetRow({ title, desc, onApply }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <div className="font-medium">{title}</div>
        {desc ? <div className="text-sm opacity-70">{desc}</div> : null}
      </div>
      <button className="px-3 py-1 rounded-lg bg-black text-white" onClick={onApply}>Apply</button>
    </div>
  );
}
