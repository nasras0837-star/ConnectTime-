"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const primaryLinks = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/discover", label: "Discover", icon: "⌕" },
  { href: "/community", label: "Community", icon: "◉" },
  { href: "/messages", label: "Messages", icon: "✉" },
];

const exploreLinks = [
  { href: "/friends", label: "Friends", icon: "♧" },
  { href: "/dating", label: "Dating", icon: "♡" },
  { href: "/groups", label: "Groups", icon: "▦" },
  { href: "/marketplace", label: "Marketplace", icon: "▣" },
  { href: "/events", label: "Events", icon: "✦" },
  { href: "/meetings", label: "Meetings", icon: "◉" },
  { href: "/news", label: "News", icon: "▤" },
  { href: "/radio", label: "Music & Radio", icon: "♪" },
  { href: "/free-tv", label: "Video & TV", icon: "▷" },
  { href: "/profile", label: "My profile", icon: "◎" },
  { href: "/account/settings", label: "Account settings", icon: "⚙" },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileQuickNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const hiddenOnAuth = ["/login", "/register", "/signup", "/verification"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const exploreActive = exploreLinks.some((item) => isCurrentPath(pathname, item.href));

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);


  if (hiddenOnAuth) return null;

  return (
    <nav className="ctMobileDock" aria-label="Main mobile navigation">
      {primaryLinks.map((item) => {
        const active = isCurrentPath(pathname, item.href);
        return (
          <Link
            className={`ctMobileDockLink${active ? " isActive" : ""}`}
            href={item.href}
            key={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span className="ctMobileDockIcon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        className={`ctMobileDockLink ctMobileMoreButton${exploreActive || menuOpen ? " isActive" : ""}`}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="ct-mobile-explore-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="ctMobileDockIcon" aria-hidden="true">•••</span>
        <span>More</span>
      </button>

      {menuOpen && (
        <>
          <button
            className="ctMobileMenuBackdrop"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <section
            className="ctMobileMoreMenu"
            id="ct-mobile-explore-menu"
            aria-label="Explore Connect"
          >
            <div className="ctMobileMoreHeading">
              <div>
                <strong>Explore Connect</strong>
                <small>All your favorite spaces, in one place</small>
              </div>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
            </div>
            <div className="ctMobileMoreGrid">
              {exploreLinks.map((item) => {
                const active = isCurrentPath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ctMobileMoreLink${active ? " isActive" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </nav>
  );
}
