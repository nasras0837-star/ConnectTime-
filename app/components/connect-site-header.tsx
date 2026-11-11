"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/friends", label: "Friends" },
  { href: "/messages", label: "Messages" },
  { href: "/community", label: "Community" },
];

const more = [
  { href: "/groups", label: "Groups" },
  { href: "/dating", label: "Dating" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/free-tv", label: "Video & TV" },
  { href: "/radio", label: "Music & Radio" },
  { href: "/meetings", label: "Meetings" },
  { href: "/profile", label: "My profile" },
  { href: "/account", label: "Account" },
];

function activePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function ConnectSiteHeader() {
  const pathname = usePathname();
  const moreActive = more.some(item => activePath(pathname, item.href));
  return (
    <header className="connectSiteHeader connectUnifiedHeader">
      <Link href="/" className="connectSiteBrand" aria-label="Connect home">
        <span className="ctBrandMark">CT</span><span className="ctWordmark">Connect</span>
      </Link>
      <Link href="/discover" className="connectSiteSearch"><span aria-hidden="true">⌕</span><span>Find people or interests</span></Link>
      <nav aria-label="Main navigation" className="connectUnifiedPrimary">
        {primary.map(item => <Link key={item.href} href={item.href} aria-current={activePath(pathname, item.href) ? "page" : undefined} className={activePath(pathname, item.href) ? "isCurrent" : ""}>{item.label}</Link>)}
        <details className={moreActive ? "connectUnifiedMore isCurrent" : "connectUnifiedMore"}>
          <summary aria-label="More features">More <span aria-hidden="true">⌄</span></summary>
          <div className="connectUnifiedMoreMenu">
            {more.map(item => <Link key={item.href} href={item.href} aria-current={activePath(pathname, item.href) ? "page" : undefined}>{item.label}</Link>)}
          </div>
        </details>
      </nav>
      <div className="connectSiteActions">
        <Link href="/login">Log in</Link>
        <Link href="/register" className="connectSiteJoin">Join Connect</Link>
      </div>
    </header>
  );
}
