# NeuroDivulge — V2 System Overview

## 1) User walkthrough
1. **Rituals**: Inline “Quick presets”; applying logs a lightweight ritual and shows a toast.
2. **Maintenance**: Habits Grid with +1 counters (Meals 3/day, Badminton weekly, Puffs with “intentional” in meta).
3. **Gamify → Village**: Create a local village (name + invite code), copy code, see members (local-only for V2).
4. **Momentum**: 7-day pillars (Focus, Maintenance, Joy, Regulation) + progress bar; shows **“Converted dopamine → Focus ✔︎ (+1)”** chips when eligible.
5. **Profile**: Name, timezone, gender, diet; saves to localStorage.

## 2) Data & persistence
- **LocalStorage**: 
  - `profile_form_v1`
  - `village_invite`, `village_name`, `village_members`
- **In-memory (V2 demo)**: Maintenance logs via `useMaintenanceLogs` (auto-uses Supabase later when migrations exist).

## 3) Analytics & logic
- **Momentum**: Tracks 4 pillars/day; progress = `completion/4`.
- **Conversion bonus** (`useConversionBonus`):
  - If a substance/intentional log occurs ≤60 min **before** a ≥25m focus session → emit chip “Converted dopamine → Focus ✔︎ (+1)”.
  - Offline-friendly: falls back to same-day match if timestamps aren’t available.

## 4) Tabs & key files
- **App shell**: `src/App.jsx` (tabs, mounts pages, shows Bonuses in Momentum)
- **Rituals**: `src/components/RitualGuide.jsx`, `src/data/ritualPresets.ts`
- **Maintenance**: `src/pages/Maintenance.jsx`, `src/components/HabitsGrid.jsx`, `src/components/HabitCounter.jsx`, `src/hooks/useMaintenanceLogs.ts`
- **Gamify/Village**: `src/pages/gamify/Village.jsx`
- **Momentum**: `src/hooks/useConversionBonus.ts` (rendered in App.jsx)
- **Profile**: `src/pages/Profile.jsx`, `src/components/ProfileForm.jsx` (uses `src/components/ui/Toast.tsx`)

## 5) Known V2 limits
- Maintenance logs not persisted until DB migrations are applied.
- Village is local-only; no multi-user sync yet.
- Lazy-Cook static; dynamic rotation arrives in V3.

## 6) V2 configuration
No environment changes required. Everything runs offline with localStorage; Supabase hooks no-op gracefully until migrations exist.

## 7) V3+ pointers (out of V2 scope)
- **Ritual gating**: Only show Rituals if “habits enabled”; otherwise show “Start a habit” CTA linking to habit-building micro-exercises.
- **Village+**: Roles, multiple villages per user, simple challenges/quests, real invite/join via Supabase.
- **Lazy-Cook v3**: Diet-aware rotating suggestions + Recipe Book.
- **Widgets/lockscreen**: Android (Home/Lock screen widgets); iOS (Lock Screen widgets via WidgetKit—interactive limits apply).

