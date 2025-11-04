import useMaintenanceLogs from "./useMaintenanceLogs";
import useFocusSessions from "./useFocusSessions";
import { addMinutes } from "../lib/dates";

type Chip = string;

/**
 * Conversion rule:
 * - If a cannabis (or other substance) log exists within the 60 minutes BEFORE a focus session,
 * - AND that focus session is >= 25 minutes,
 * - THEN we surface a bonus chip: "Converted dopamine → Focus ✔︎ (+1)".
 *
 * Notes:
 * - Works offline with local placeholder data.
 * - If a log lacks a timestamp (created_at), we fall back to same-day matching (assume eligible).
 */
export default function useConversionBonus(userId?: string) {
  const { logs } = useMaintenanceLogs(userId);
  const { sessions } = useFocusSessions(userId);

  const chips: Chip[] = [];

  // Guard: nothing to compute
  if (
    !Array.isArray(logs) ||
    !Array.isArray(sessions) ||
    sessions.length === 0
  ) {
    return { chips };
  }

  // Normalize sessions we can consider (>= 25 min)
  const focus = sessions
    .filter((s: any) => Number(s?.minutes) >= 25 && s?.started_at)
    .map((s: any) => ({ ...s, start: new Date(s.started_at) }))
    .filter((s: any) => !isNaN(s.start.getTime()));

  // Normalize relevant logs (cannabis / intentional use)
  const substanceLogs = logs
    .filter((l: any) =>
      ["cannabis_puffs", "cannabis", "intentional_use"].includes(l?.habit) ||
      l?.meta?.intentional === true
    )
    .map((l: any) => {
      const hasCreatedAt = !!l?.created_at;
      const created = hasCreatedAt ? new Date(l.created_at) : null;
      return {
        ...l,
        created_at_date: created && !isNaN(created.getTime()) ? created : null,
      };
    });

  const seenPairs = new Set<string>();

  for (const s of focus) {
    const windowStart = addMinutes(s.start, -60).getTime();
    const sessionDay = s.start.toISOString().slice(0, 10);

    for (const l of substanceLogs) {
      // Prefer timestamp join if available; otherwise same-day fallback.
      let eligible = false;

      if (l.created_at_date) {
        const t = l.created_at_date.getTime();
        eligible = t <= s.start.getTime() && t >= windowStart;
      } else if (l.date) {
        eligible = String(l.date) === sessionDay;
      }

      if (!eligible) continue;

      const pid = `${l.id || l.date || "L"}_${s.id || s.start.toISOString()}`;
      if (seenPairs.has(pid)) continue;
      seenPairs.add(pid);

      chips.push("Converted dopamine → Focus ✔︎ (+1)");
      // Only one chip per session is usually enough; break to avoid spam.
      break;
    }
  }

  return { chips };
}
