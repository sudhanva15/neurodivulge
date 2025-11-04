import React from "react";
import { useToast } from "./ui/Toast";

const STORAGE_KEY = "profile_form_v1";

export default function ProfileForm() {
  const { show, ToastHost } = useToast();
  const defaultTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  })();

  const [form, setForm] = React.useState({
    name: "",
    timezone: defaultTz,
    gender: "",
    diet: "",
  });

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      show("Profile saved");
    } catch (e) {
      show("Couldn't save locally");
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="block text-sm">
        <div className="opacity-70">Name</div>
        <input
          className="border rounded px-3 py-2 w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name or alias"
        />
      </label>

      <label className="block text-sm">
        <div className="opacity-70">Time zone</div>
        <input
          className="border rounded px-3 py-2 w-full"
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          placeholder="e.g., America/Chicago"
        />
      </label>

      <label className="block text-sm">
        <div className="opacity-70">Gender (optional)</div>
        <select
          className="border rounded px-3 py-2 w-full"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        >
          <option value="">—</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
          <option value="prefer_not">Prefer not to say</option>
        </select>
      </label>

      <label className="block text-sm">
        <div className="opacity-70">Diet preference (optional)</div>
        <select
          className="border rounded px-3 py-2 w-full"
          value={form.diet}
          onChange={(e) => setForm({ ...form, diet: e.target.value })}
        >
          <option value="">—</option>
          <option value="omnivore">Omnivore</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="vegan">Vegan</option>
          <option value="pescatarian">Pescatarian</option>
          <option value="gluten_free">Gluten-free</option>
          <option value="dairy_free">Dairy-free</option>
        </select>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="px-3 py-2 rounded bg-black text-white">
          Save
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded border"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
              show("Cleared");
              setForm({ name: "", timezone: defaultTz, gender: "", diet: "" });
            } catch {}
          }}
        >
          Clear
        </button>
      </div>

      <ToastHost />
    </form>
  );
}
