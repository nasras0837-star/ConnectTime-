"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function DashboardNotificationSummary() {
  const [count, setCount] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error("Notifications unavailable");
        if (active) setCount(Number(data.unreadCount || 0));
      })
      .catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, []);
  return <Link href="/notifications" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "17px 20px", border: "1px solid #dfe6f6", borderRadius: 14, background: "linear-gradient(100deg,#f3f6ff,#fff)", textDecoration: "none", color: "inherit", margin: "18px 0" }}>
    <span><strong style={{ display: "block" }}>🔔 Notifications</strong><small style={{ color: "#66718a" }}>{available ? count === null ? "Checking your activity…" : count ? `${count} unread update${count === 1 ? "" : "s"}` : "You're all caught up" : "Activity updates are not available right now"}</small></span>
    <span style={{ borderRadius: 999, background: count ? "#3157d5" : "#e8edfa", color: count ? "white" : "#405078", minWidth: 32, height: 32, display: "grid", placeItems: "center", fontWeight: 800 }}>{count === null || !available ? "→" : count}</span>
  </Link>;
}
