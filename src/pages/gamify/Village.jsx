import React, { useEffect, useState } from "react";
import CopyButton from "../../components/CopyButton";
import shortid from "../../lib/shortid";

export default function Village() {
  const [invite, setInvite] = useState("");
  const [villageName, setVillageName] = useState("");
  const [members, setMembers] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedInvite = localStorage.getItem("village_invite") || "";
    const savedName = localStorage.getItem("village_name") || "";
    const savedMembers = JSON.parse(
      localStorage.getItem("village_members") || "[]"
    );
    setInvite(savedInvite);
    setVillageName(savedName);
    setMembers(savedMembers);
  }, []);

  function createVillage() {
    const newCode = shortid(6);
    const name =
      prompt("Name your village:", villageName || "My Village") || "My Village";
    setInvite(newCode);
    setVillageName(name);
    const self = { id: shortid(4), name: "You", role: "Founder" };
    const newMembers = [self];
    setMembers(newMembers);
    localStorage.setItem("village_invite", newCode);
    localStorage.setItem("village_name", name);
    localStorage.setItem("village_members", JSON.stringify(newMembers));
  }

  function resetVillage() {
    if (confirm("Delete this village and start a new one?")) {
      localStorage.removeItem("village_invite");
      localStorage.removeItem("village_name");
      localStorage.removeItem("village_members");
      setInvite("");
      setVillageName("");
      setMembers([]);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Village</h1>
      {invite ? (
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium text-lg">{villageName}</div>
            <div className="text-sm opacity-70">Invite code: {invite}</div>
            <div className="flex gap-2 mt-2">
              <CopyButton text={invite} />
              <button
                className="px-3 py-2 rounded bg-black text-white"
                onClick={resetVillage}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="font-medium mb-2">Members</div>
            {members.length > 0 ? (
              <ul className="text-sm space-y-1">
                {members.map((m) => (
                  <li key={m.id}>
                    {m.name}{" "}
                    <span className="opacity-60 text-xs">({m.role})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="opacity-60 text-sm">No members yet</div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-6 text-center">
          <p className="opacity-70 mb-4">
            Create your own village to track accountability and support.
          </p>
          <button
            className="px-4 py-2 rounded bg-black text-white"
            onClick={createVillage}
          >
            Create Village
          </button>
        </div>
      )}
    </div>
  );
}
