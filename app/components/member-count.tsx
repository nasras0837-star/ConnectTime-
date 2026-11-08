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

  return <div className="ctHomeMemberCount" aria-live="polite">
    <span className="ctHomeMemberCountIcon" aria-hidden="true">👥</span>
    <span><strong>{count === null ? (unavailable ? "—" : "…") : count.toLocaleString()}</strong><small>{unavailable ? "Member count unavailable" : "Registered members"}</small></span>
  </div>;
}
