import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReflections } from "../hooks/useReflections";
import { enabled } from "../utils/FeatureGate";
import PH from "../analytics/posthog"; // optional; safe if not initialized

export default function ReflectionModal({ open, onClose }) {
  const r = typeof useReflections === "function" ? useReflections() : null;

  // prefill from today's reflection if present
  const todays = useMemo(() => {
    try {
      return r?.getTodays?.() ?? null;
    } catch {
      return null;
    }
  }, [r?.getTodays, r?.version, r?.lastLocalChangeAt]);

  const [id, setId] = useState(null);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  // Seed state when opening or when today's reflection changes
  useEffect(() => {
    if (!open) return;
    if (todays) {
      setId(todays.id ?? null);
      setMood(Number(todays.mood ?? 3));
      setNote(String(todays.text ?? todays.note ?? ""));
      setTags(Array.isArray(todays.tags) ? todays.tags : []);
      setTagsInput(Array.isArray(todays.tags) ? todays.tags.join(", ") : "");
      setShared(Boolean(todays.shared));
    } else {
      setId(null);
      setMood(3);
      setNote("");
      setTags([]);
      setTagsInput("");
      setShared(false);
    }
    setError(null);
  }, [open, todays?.id]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Helpers
  const parsedTags = (str) =>
    String(str || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8); // cap at 8 tags

  const canSave = useMemo(() => {
    if (saving) return false;
    if (shared && !note.trim()) return false; // require note if sharing
    return true;
  }, [saving, shared, note]);

  const initialSnapshot = useMemo(() => {
    return {
      mood: Number(todays?.mood ?? 3),
      note: String(todays?.text ?? todays?.note ?? ""),
      tags: Array.isArray(todays?.tags) ? todays.tags : [],
      shared: Boolean(todays?.shared),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todays?.id]);

  const isSameArray = (a = [], b = []) =>
    a.length === b.length && a.every((x, i) => x === b[i]);

  const isDirty = useMemo(() => {
    return (
      mood !== initialSnapshot.mood ||
      note !== initialSnapshot.note ||
      !isSameArray(parsedTags(tagsInput), initialSnapshot.tags) ||
      shared !== initialSnapshot.shared
    );
  }, [mood, note, tagsInput, shared, initialSnapshot]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSave) return;

    // If editing and nothing changed, just close quietly
    if (id && !isDirty) {
      onClose?.();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const finalTags = parsedTags(tagsInput);
      const payload = { mood, note, tags: finalTags, shared };
      setTags(finalTags);
      let res;
      if (id && typeof r?.updateReflection === "function") {
        res = await r.updateReflection(id, payload);
      } else if (typeof r?.createReflection === "function") {
        res = await r.createReflection(payload);
        if (res?.id) setId(res.id);
      } else {
        throw new Error("Reflections API unavailable");
      }
      if (enabled?.("VITE_ENABLE_ANALYTICS")) {
        try {
          PH?.track?.("reflection_saved", {
            shared,
            mood,
            chars: note.length,
            tags: finalTags.length,
            mode: id ? "update" : "create",
          });
        } catch {}
      }
      onClose?.();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  // Save with Cmd/Ctrl + Enter anywhere in the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // submit depends on state; we intentionally don't list it to avoid re-binding every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canSave, id, mood, note, tagsInput, shared]);

  if (!open) return null;

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <form
        ref={formRef}
        onSubmit={submit}
        onClick={stop}
        className="bg-white w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">
            {id ? "Edit today’s reflection" : "How did your mind move today?"}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <label className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-24">Mood</span>
          <input
            type="range"
            min="1"
            max="5"
            value={mood}
            onChange={(e) => setMood(parseInt(e.target.value))}
            className="flex-1"
            aria-label="Mood 1 to 5"
          />
          <span className="text-sm">{mood}/5</span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">
            One small thing that went well
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && canSave) {
                e.preventDefault();
                submit();
              }
            }}
            rows={4}
            className="border rounded px-3 py-2"
            placeholder="Write a sentence or two…"
          />
          <span className="text-xs text-gray-400 mt-1">
            {note.length} chars
          </span>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">
            Tags (comma separated, max 8)
          </span>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const finals = parsedTags(e.currentTarget.value);
                setTags(finals);
                setTagsInput(finals.join(", "));
              }
            }}
            onBlur={(e) => setTags(parsedTags(e.target.value))}
            className="border rounded px-3 py-2"
            placeholder="focus, sleep, workout"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2 py-1 rounded-full border bg-gray-50"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          <span className="text-sm">Share anonymously to Community Stream</span>
        </label>

        {error && <div className="text-sm text-red-600">Error: {error}</div>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          >
            {saving
              ? "Saving…"
              : id
              ? isDirty
                ? "Save changes"
                : "Close"
              : "Save"}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Shared posts show only an anonymous ID, mood, note, tags, and time.
        </p>
      </form>
    </div>
  );
}
