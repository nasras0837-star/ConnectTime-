"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const primary = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/discover", label: "Discover", icon: "⌕" },
  { href: "/community", label: "Community", icon: "◉" },
  { href: "/messages", label: "Messages", icon: "✉" },
];

const moreLinks = [
  { href: "/friends", label: "Friends", icon: "♧" },
  { href: "/dating", label: "Dating", icon: "♡" },
  { href: "/groups", label: "Groups", icon: "▦" },
  { href: "/marketplace", label: "Marketplace", icon: "🛍" },
  { href: "/events", label: "Events", icon: "✦" },
  { href: "/news", label: "News", icon: "▤" },
  { href: "/radio", label: "Music & Radio", icon: "♪" },
  { href: "/free-tv", label: "Video & TV", icon: "▷" },
  { href: "/profile", label: "My profile", icon: "◎" },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function MobileQuickNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreLinks.some((item) => isCurrent(pathname, item.href));

  return (
    <nav className="ctMobileDock" aria-label="Mobile quick navigation">
      {primary.map((item) => (
        <Link
          className={`ctMobileDockLink${isCurrent(pathname, item.href) ? " isActive" : ""}`}
          href={item.href}
          key={item.href}
          aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
          onClick={() => setMoreOpen(false)}
        >
          <span className="ctMobileDockIcon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        className={`ctMobileDockLink ctMobileMoreButton${moreActive || moreOpen ? " isActive" : ""}`}
        type="button"
        aria-expanded={moreOpen}
        aria-controls="ct-mobile-more-menu"
        onClick={() => setMoreOpen((open) => !open)}
      >
        <span className="ctMobileDockIcon" aria-hidden="true">•••</span>
        <span>More</span>
      </button>

      {moreOpen && (
        <>
          <button className="ctMobileMenuBackdrop" type="button" aria-label="Close navigation menu" onClick={() => setMoreOpen(false)} />
          <section className="ctMobileMoreMenu" id="ct-mobile-more-menu" aria-label="More Connect sections">
            <div className="ctMobileMoreHeading">
              <div><strong>Explore Connect</strong><small>More ways to connect and discover</small></div>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu">×</button>
            </div>
            <div className="ctMobileMoreGrid">
              {moreLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ctMobileMoreLink${isCurrent(pathname, item.href) ? " isActive" : ""}`}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  onClick={() => setMoreOpen(false)}
                >
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </nav>
  );
}
