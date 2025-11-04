import React from "react";
export default function TargetsInlineForm({ targets={}, onSave }){
  const [local,setLocal]=React.useState(targets);
  return (
    <form className="flex flex-wrap gap-3 items-end" onSubmit={(e)=>{e.preventDefault(); onSave?.(local);}}>
      {Object.entries(local).map(([k,v])=>(
        <label key={k} className="text-sm">
          <div className="opacity-70">{k}</div>
          <input className="border rounded px-2 py-1" type="number" value={v as number} onChange={(e)=>setLocal({...local,[k]:Number(e.target.value)})}/>
        </label>
      ))}
      <button className="px-3 py-1 rounded bg-black text-white" type="submit">Save</button>
    </form>
  );
}
