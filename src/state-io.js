export function exportState(keys) {
  const out = {};
  keys.forEach(k => { try { out[k] = JSON.parse(localStorage.getItem(k) || "null"); } catch {} });
  const blob = new Blob([JSON.stringify(out,null,2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "neurodivulge-backup.json"; a.click();
  URL.revokeObjectURL(url);
}
export function importState(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.entries(data).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      cb && cb(true);
    } catch { cb && cb(false); }
  };
  reader.readAsText(file);
}
