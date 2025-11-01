import React, { useState } from "react";
import { useVillage } from "../hooks/useVillage";

export default function VillageModal({ open, onClose }) {
  const { createVillage, joinVillage } = useVillage();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  if (!open) return null;

  const doCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await createVillage(name.trim()); onClose?.(); }
    catch (e) { alert(e.message || String(e)); }
    finally { setSaving(false); }
  };

  const doJoin = async () => {
    if (!code.trim()) return;
    setSaving(true);
    try { await joinVillage(code.trim()); onClose?.(); }
    catch (e) { alert(e.message || String(e)); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-4">
        <div className="text-lg font-semibold">Micro-Village</div>

        <div className="rounded-xl border p-3 space-y-2">
          <div className="font-medium">Create</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Village name" className="border rounded px-3 py-2 w-full"/>
          <button onClick={doCreate} disabled={saving} className="rounded bg-black text-white px-3 py-2">{saving?"Creating…":"Create"}</button>
        </div>

        <div className="rounded-xl border p-3 space-y-2">
          <div className="font-medium">Join via code</div>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="6-char invite code" className="border rounded px-3 py-2 w-full"/>
          <button onClick={doJoin} disabled={saving} className="rounded border px-3 py-2">{saving?"Joining…":"Join"}</button>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="rounded px-3 py-2 border">Close</button>
        </div>
      </div>
    </div>
  );
}
