import React, { useState } from "react";
import { useReflections } from "../hooks/useReflections";

export default function ReflectionModal({ open, onClose }) {
  const { createReflection } = useReflections();
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (saving) return;
    setSaving(true);
    try {
      await createReflection({ mood, note, tags, shared });
      onClose?.();
      setMood(3); setNote(""); setTags([]); setShared(false);
    } catch (err) {
      alert("Failed to save reflection: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-4">
        <div className="text-lg font-semibold">How did your mind move today?</div>

        <label className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-24">Mood</span>
          <input type="range" min="1" max="5" value={mood} onChange={e=>setMood(parseInt(e.target.value))} className="flex-1"/>
          <span className="text-sm">{mood}/5</span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">One small thing that went well</span>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} className="border rounded px-3 py-2"/>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Tags (comma separated)</span>
          <input value={tags.join(", ")} onChange={e=>setTags(e.target.value.split(",").map(t=>t.trim()).filter(Boolean))} className="border rounded px-3 py-2"/>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={shared} onChange={e=>setShared(e.target.checked)} />
          <span className="text-sm">Share anonymously to Community Stream</span>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-black text-white">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Shared posts show only an anonymous id, mood, note, tags, and time.
        </p>
      </form>
    </div>
  );
}
