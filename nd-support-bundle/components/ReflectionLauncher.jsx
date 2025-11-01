import React, { useState } from "react";
import ReflectionModal from "./ReflectionModal";

export default function ReflectionLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Daily Reflection</h3>
        <button onClick={()=>setOpen(true)} className="rounded bg-black text-white px-3 py-2">Reflect</button>
      </div>
      <p className="text-sm text-gray-600">Capture one small win. Share if you like.</p>
      <ReflectionModal open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
