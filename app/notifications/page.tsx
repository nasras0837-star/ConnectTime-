"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Notification = { id: string; type: string; message: string; createdAt: string; read: boolean };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notifications are unavailable.");
      setItems(data.notifications || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Notifications are unavailable."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Notifications are unavailable."); if (!cancelled) setItems(data.notifications || []); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Notifications are unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function markRead(item: Notification) {
    setBusy(item.id); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: item.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update notification.");
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, read: true } : entry));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update notification."); }
    finally { setBusy(""); }
  }

  const unread = items.filter(item => !item.read).length;
  return <main className="authShell"><header className="plannedFeatureHeader"><Link className="logo ctAuthLogo" href="/"><img src="/connecttime-logo.png" alt="ConnectTime" width={180} height={117} className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/account">Account</Link><Link href="/friends">Friends</Link></nav></header>
    <section className="authCard notificationsCard"><div className="eyebrow">YOUR CONNECTTIME UPDATES</div><h1>Notifications</h1><p>Friend requests and connection updates appear here. {unread} unread.</p>
      {error && <p className="message" role="alert">{error}</p>}
      {loading ? <p role="status">Loading notifications…</p> : items.length === 0 ? <p className="notificationEmpty">You’re all caught up. New friend activity will appear here.</p> : <div className="notificationList">{items.map(item => <article className={item.read ? "notificationItem isRead" : "notificationItem"} key={item.id}><span className="notificationDot" aria-hidden="true"/><div className="notificationCopy"><strong>{item.message}</strong><span>{item.type === "friend_request" ? "Friend request" : item.type === "friend_accepted" ? "Connection update" : "Account activity"}{item.createdAt ? " · " + new Date(item.createdAt).toLocaleString() : ""}</span></div>{!item.read && <button disabled={busy === item.id} onClick={() => void markRead(item)}>{busy === item.id ? "Saving…" : "Mark read"}</button>}</article>)}</div>}
      <div className="introActions"><Link href="/friends">Manage friends</Link><Link className="introExplore" href="/discover">Discover members</Link></div><p className="switch"><button className="friendRefresh" onClick={() => void load()}>Refresh notifications</button></p>
    </section><footer className="plannedFeatureFooter">ConnectTime · Your people. Your passions. Your ConnectTime.</footer>
  </main>;
}
