import React from "react";
export default function CopyButton({ text="" }){
  return (
    <button
      className="px-3 py-2 rounded border"
      onClick={async()=>{ if(!text) return; try{ await navigator.clipboard.writeText(text);}catch(e){ console.warn(e);} }}>
      Copy
    </button>
  );
}
