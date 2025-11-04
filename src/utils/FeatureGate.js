export function enabled(flag, fallback = false) {
  const v = import.meta.env[flag];
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}
