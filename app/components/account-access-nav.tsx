"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountAccessNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register" || pathname === "/signup") return null;

  return (
    <nav className="ctAccountAccess" aria-label="Account access">
      <Link className="ctAccountAccessLogin" href="/login">Log in</Link>
      <Link className="ctAccountAccessRegister" href="/register">Register Now</Link>
    </nav>
  );
}
