"use client";

import { useEffect, useState } from "react";

export function MemberCount() {
  const [count, setCount] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/public/member-count", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Count unavailable");
        return response.json() as Promise<{ count?: number }>;
      })
      .then(data => {
        if (active && typeof data.count === "number" && Number.isFinite(data.count)) setCount(data.count);
        else if (active) setUnavailable(true);
      })
      .catch(() => { if (active) setUnavailable(true); });
    return () => { active = false; };
  }, []);

  return <div className="ctHomeMemberCount" aria-live="polite" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 22px",border:"1px solid #e8def6",borderRadius:18,background:"linear-gradient(120deg,#fff,#f4efff)",boxShadow:"0 10px 26px #49317812"}}>
    <span className="ctHomeMemberCountIcon" aria-hidden="true" style={{fontSize:25}}>👥</span>
    <span style={{display:"grid",gap:2}}><strong style={{fontSize:25,lineHeight:1.1,color:"#6530b8"}}>{count === null ? (unavailable ? "—" : "…") : count.toLocaleString()}</strong><small style={{fontSize:11,color:"#77718d"}}>{unavailable ? "Member count unavailable" : "Registered members"}</small></span>
  </div>;
}
