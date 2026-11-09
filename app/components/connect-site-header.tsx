"use client";

import Link from "next/link";

export function ConnectSiteHeader() {
  return (
    <header className="connectSiteHeader">
      <Link href="/" className="connectSiteBrand" aria-label="Connect home">
        <span className="ctBrandMark">CT</span><span className="ctWordmark">Connect</span>
      </Link>
      <Link href="/discover" className="connectSiteSearch"><span aria-hidden="true">⌕</span> Search people and interests</Link>
      <nav aria-label="Main navigation">
        <Link href="/">Home</Link>
        <Link href="/community">Community</Link>
        <Link href="/discover">Discover</Link>
        <Link href="/friends">Friends</Link>
        <Link href="/messages">Messages</Link>
        <Link href="/groups">Groups</Link>
      </nav>
      <div className="connectSiteActions">
        <Link href="/login">Log in</Link>
        <Link href="/register" className="connectSiteJoin">Join Connect</Link>
      </div>
    </header>
  );
}
