import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function fmtAgo(ts) {
  const d = new Date(ts);
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 90) return "just now";
  if (diff < 3600) return Math.round(diff/60) + "m ago";
  if (diff < 86400) return Math.round(diff/3600) + "h ago";
  return Math.round(diff/86400) + "d ago";
}
function statusColor(ts) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff <= 24*3600) return "bg-emerald-500";
  if (diff <= 72*3600) return "bg-amber-500";
  return "bg-neutral-400";
}

export default function FriendsPanel(){
  const [emails, setEmails] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("nd.friendEmails")||"[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveEmails = (arr)=> { setEmails(arr); localStorage.setItem("nd.friendEmails", JSON.stringify(arr)); };

  async function fetchRows() {
    if (!supabase || emails.length===0) { setRows([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("heartbeats")
      .select("email,last_seen,status")
      .in("email", emails);
    if (!error && data) setRows(data);
    setLoading(false);
  }

  useEffect(()=>{ fetchRows(); /* eslint-disable-next-line */ }, [JSON.stringify(emails)]);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold mb-2">Friends status (last 72h)</div>
      <div className="flex gap-2 mb-2">
        <input className="input" placeholder="friend@example.com"
          value={input} onChange={e=>setInput(e.target.value)} />
        <button className="btn" onClick={()=>{
          const v = input.trim().toLowerCase();
          if (!v) return;
          if (!emails.includes(v)) saveEmails([v, ...emails]);
          setInput("");
          fetchRows();
        }}>Add</button>
        <button className="btn-secondary" onClick={fetchRows}>{loading? "..." : "Refresh"}</button>
      </div>
      {emails.length===0 && <div className="text-sm text-neutral-500">Add emails your friends set in their app to see if they’ve been active.</div>}
      <div className="space-y-2">
        {rows.map(r=>(
          <div key={r.email} className="flex items-center justify-between rounded-lg border p-2">
            <div className="text-sm">
              <div className="font-medium">{r.email}</div>
              <div className="text-xs text-neutral-500">Last seen: {fmtAgo(r.last_seen)} | Status: {r.status || "ok"}</div>
            </div>
            <div className={"w-3 h-3 rounded-full " + statusColor(r.last_seen)} />
          </div>
        ))}
      </div>
    </div>
  );
}
