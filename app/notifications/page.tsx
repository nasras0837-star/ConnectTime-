"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notification = { id: string; type: string; message: string; createdAt: string; read: boolean; referenceId?: string };

function destination(type: string, referenceId?: string) {
  if (type === "dating_like" || type === "dating_match") return { href: "/dating/likes", label: "View dating activity" };
  if (type === "new_message") return { href: "/messages", label: "Open messages" };
  if (type === "group_message") return { href: referenceId ? `/groups/${encodeURIComponent(referenceId)}` : "/groups", label: "Open group chat" };
  if (type === "friend_request" || type === "friend_accepted" || type === "friend_acceptance") return { href: "/friends", label: "View friends" };
  if (type === "moderation" || type === "appeal") return { href: "/safety", label: "Open Safety Center" };
  return { href: "/account", label: "View account" };
}

function category(type: string) {
  if (type === "dating_like" || type === "dating_match") return "Dating";
  if (type === "new_message") return "Private message";
  if (type === "group_message") return "Community group chat";
  if (type === "friend_request") return "Friend request";
  if (type === "friend_accepted" || type === "friend_acceptance") return "Connection update";
  if (type === "moderation") return "Trust & Safety";
  if (type === "appeal") return "Appeal update";
  return "Account activity";
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async (silent = false) => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Notifications are unavailable.");
      setItems(data.notifications || []);
      setLastUpdated(new Date().toISOString());
      if (!silent) setError("");
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Notifications are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => load());
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const interval = window.setInterval(refreshIfVisible, 12000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [load]);

  async function markRead(item: Notification) {
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update notification.");
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, read: true } : entry));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update notification.");
    } finally {
      setBusy("");
    }
  }

  const unread = items.filter(item => !item.read).length;
  return <main className="authShell">
    <header className="plannedFeatureHeader">
      <Link className="logo ctAuthLogo" href="/"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link>
      <nav><Link href="/">Home</Link><Link href="/account">Account</Link><Link href="/friends">Friends</Link><Link href="/dating/likes">Dating</Link><Link href="/messages">Messages</Link></nav>
    </header>
    <section className="authCard notificationsCard">
      <div className="eyebrow">YOUR CONNECT UPDATES</div>
      <h1>Notifications</h1>
      <p>Dating likes, mutual matches, friend requests, connection updates, private messages, community group chat activity, and Safety Center report/appeal updates appear here. {unread} unread.</p>
      {error && <p className="message" role="alert">{error}</p>}
      {loading ? <p role="status">Loading notifications…</p> : items.length === 0 ? <p className="notificationEmpty">You’re all caught up. New activity will appear here.</p> :
        <div className="notificationList" aria-live="polite">
          {items.map(item => {
            const target = destination(item.type, item.referenceId);
            return <article className={item.read ? "notificationItem isRead" : "notificationItem"} key={item.id}>
              <span className="notificationDot" aria-hidden="true"/>
              <div className="notificationCopy">
                <strong>{item.message}</strong>
                <span>{category(item.type)}{item.createdAt ? " · " + new Date(item.createdAt).toLocaleString() : ""}</span>
                <Link href={target.href}>{target.label}</Link>
              </div>
              {!item.read && <button type="button" disabled={busy === item.id} onClick={() => void markRead(item)}>
                {busy === item.id ? "Saving…" : "Mark read"}
              </button>}
            </article>;
          })}
        </div>}
      <div className="introActions"><Link href="/friends">Manage friends</Link><Link className="introExplore" href="/discover">Discover members</Link></div>
      <p className="switch">
        <button className="friendRefresh" type="button" onClick={() => void load()}>Refresh notifications</button>
        {lastUpdated && <span> · Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
      </p>
      <p className="datingInboxFootnote">Notifications refresh automatically while this page is open. You can also refresh manually at any time.</p>
    </section>
    <footer className="plannedFeatureFooter">Connect · Your people. Your passions. Your Connect.</footer>
  </main>;
}
