import React, { useMemo, useState } from "react";
import { useVillage } from "../hooks/useVillage";
import VillageModal from "./VillageModal";

export default function VillagePanel() {
  const { villages, members, posts, postCheckin, reactPost, leaveVillage, refresh } = useVillage();
  const [text, setText] = useState("");
  const [mood, setMood] = useState(3);
  const [open, setOpen] = useState(false);

  const myVillage = useMemo(()=> villages?.[0] || null, [villages]);
  const myMembers = useMemo(()=> (members||[]).filter(m=>m.village_id===myVillage?.id), [members, myVillage?.id]);
  const myPosts = useMemo(()=> (posts||[]).filter(p=>p.village_id===myVillage?.id), [posts, myVillage?.id]);

  const submit = async () => {
    if (!myVillage) return setOpen(true);
    if (!text.trim() && !mood) return;
    try { await postCheckin(myVillage.id, text.trim().slice(0,120), mood); setText(""); }
    catch (e) { alert(e.message || String(e)); }
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Micro-Village</h3>
        <div className="flex gap-2">
          {myVillage && <span className="text-sm text-gray-500">Code: <b>{myVillage.invite_code}</b></span>}
          <button onClick={()=>setOpen(true)} className="rounded border px-3 py-1">{myVillage?"Manage":"Create/Join"}</button>
        </div>
      </div>

      {!myVillage ? (
        <div className="text-sm text-gray-500">Join or create a small (max 5) support circle. Kindness only.</div>
      ) : (
        <>
          <div className="text-sm text-gray-600">Members: {myMembers.length}/5</div>

          <div className="rounded-xl border p-3 space-y-2">
            <div className="font-medium">Daily check-in</div>
            <div className="grid md:grid-cols-5 gap-2">
              <input value={text} onChange={e=>setText(e.target.value)} placeholder="10 words max" className="border rounded px-3 py-2 md:col-span-4"/>
              <div className="flex items-center gap-2 md:justify-end">
                <span className="text-sm text-gray-600">Mood</span>
                <input type="range" min="1" max="5" value={mood} onChange={e=>setMood(parseInt(e.target.value))}/>
                <button onClick={submit} className="rounded bg-black text-white px-3 py-2">Post</button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {myPosts.length===0 ? (
              <div className="text-sm text-gray-500">No posts yet—go first 🌱</div>
            ) : myPosts.map(p=>(
              <div key={p.id} className="rounded-xl border p-3">
                <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()} • Mood {p.mood ?? "–"}</div>
                {p.text && <div className="mt-1">{p.text}</div>}
                <div className="mt-2">
                  <button onClick={()=>reactPost(p.id)} className="text-sm rounded px-2 py-1 bg-gray-100">Resonate</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button onClick={refresh} className="rounded border px-3 py-1">Refresh</button>
            <button onClick={()=>leaveVillage(myVillage.id)} className="rounded border px-3 py-1">Leave</button>
          </div>
        </>
      )}

      <VillageModal open={open} onClose={()=>setOpen(false)} />
      <p className="text-xs text-gray-500">No likes, no scores; just presence and kindness.</p>
    </div>
  );
}
