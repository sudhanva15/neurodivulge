export type RitualPreset = { id: string; title: string; desc?: string };
const presets: RitualPreset[] = [
  { id: "sun", title: "3 Surya Namaskar + 12 calm breaths + 5-min mantra" },
  { id: "walk", title: "5-min sunlight walk + water" },
];
export default presets;
