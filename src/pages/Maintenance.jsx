import React from "react";
import HabitsGrid from "../components/HabitsGrid";
import HabitCounter from "../components/HabitCounter";
import useMaintenanceLogs from "../hooks/useMaintenanceLogs";

export default function Maintenance() {
  const userId = ""; // TODO: wire to your auth/profile context
  const { add, countToday, countThisWeek } = useMaintenanceLogs(userId);
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;

  const DAILY = [
    {
      id: "meals",
      label: "Meals today",
      target: 3,
      hint: "Tap when you finish a meal",
      buttonLabel: "I ate a meal",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
    },
    {
      id: "sleep_hours",
      label: "Sleep hours",
      target: 7,
      hint: "Enter last night's total",
      scope: "day",
      mode: "entry",
      unit: "hours",
    },
    {
      id: "nap_minutes",
      label: "Nap minutes",
      target: 30,
      hint: "Add 30 per short nap",
      scope: "day",
      mode: "counter",
      step: 30,
      cap: null,
      buttonLabel: "+30 min nap",
    },
    {
      id: "move",
      label: "Move / Play",
      target: 1,
      hint: "Any movement counts",
      buttonLabel: "I moved",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
    },
    {
      id: "tidy",
      label: "Tidy space",
      target: 1,
      hint: "2‑min reset counts",
      buttonLabel: "Tidy done",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
    },
    {
      id: "gratitude",
      label: "Gratitude note",
      target: 1,
      hint: "One line is enough",
      buttonLabel: "Wrote 1 line",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
    },
    {
      id: "kindness",
      label: "Kind act",
      target: 1,
      hint: "Smile or tiny kindness",
      buttonLabel: "I was kind",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
    },
    {
      id: "cannabis_puffs",
      label: "Puffs today",
      target: 10,
      hint: "Track intentional use",
      scope: "day",
      mode: "counter",
      step: 1,
      cap: null,
      buttonLabel: "+1 puff",
    },
  ];

  const WEEKLY = [
    {
      id: "badminton",
      label: "Badminton this week",
      target: 1,
      hint: "Play with friends",
      buttonLabel: "Game done",
      scope: "week",
    },
    {
      id: "call_mom",
      label: "Call family",
      target: 1,
      hint: "Connection + sunlight walk",
      buttonLabel: "Called family",
      scope: "week",
    },
    {
      id: "friend_checkin",
      label: "Friend check-in",
      target: 1,
      hint: "Text or voice note counts",
      buttonLabel: "Checked in",
      scope: "week",
    },
  ];

  function valueFor(h) {
    return h.scope === "week" ? countThisWeek(h.id) : countToday(h.id);
  }

  function inc(h) {
    const amount = typeof h.step === "number" ? h.step : 1;
    add({
      date: today,
      habit: h.id,
      unit: h.id.includes("minutes")
        ? "minutes"
        : h.id.includes("hours")
        ? "hours"
        : "count",
      amount,
    });
  }

  function addValue(h, n) {
    add({ date: today, habit: h.id, unit: h.unit || "count", amount: n });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Maintenance</h1>

      <h2 className="text-sm uppercase tracking-wide opacity-60 mt-4 mb-2">
        Daily grounding
      </h2>
      <HabitsGrid>
        {DAILY.map((h) => {
          const isEntry = h.mode === "entry";
          return (
            <HabitCounter
              key={h.id}
              label={h.label}
              hint={h.hint}
              value={valueFor(h)}
              target={h.target}
              mode={h.mode}
              step={h.step}
              unit={h.unit}
              cap={h.cap}
              {...(!isEntry ? { onInc: () => inc(h), buttonLabel: h.buttonLabel } : {})}
              {...(isEntry ? { onAddValue: (n) => addValue(h, n) } : {})}
            />
          );
        })}
      </HabitsGrid>

      <h2 className="text-sm uppercase tracking-wide opacity-60 mt-6 mb-2">
        Connection & weekly anchors
      </h2>
      <HabitsGrid>
        {WEEKLY.map((h) => (
          <HabitCounter
            key={h.id}
            label={h.label}
            hint={h.hint}
            value={valueFor(h)}
            target={h.target}
            mode="counter"
            cap={h.cap}
            onInc={() => inc(h)}
            buttonLabel={h.buttonLabel}
          />
        ))}
      </HabitsGrid>

      <p className="text-xs opacity-60 mt-4">
        Tip: extra taps above the target are fine — chase momentum, not
        perfection.
      </p>
    </div>
  );
}
