"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/button-link";

const links = [
  ["Work", "/work"],
  ["Services", "/services"],
  ["The Hub", "/media"],
  ["About", "/about"],
] as const;

export function HeaderClient({ user }: { user: { name: string; email: string } | null }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const firstName = user?.name.trim().split(/\s+/)[0] || "there";
  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U";
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (event: PointerEvent) => { if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setAccountOpen(false); avatarRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [accountOpen]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      <header className="site-header">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className={`header-action${user ? " is-signed-in" : ""}`}>
          {user ? <div className="user-navigation" ref={accountRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false); }}>
            <button ref={avatarRef} className="user-trigger" type="button" aria-label={`Open account for ${user.name}`} aria-expanded={accountOpen} aria-controls="user-account-panel" onClick={() => setAccountOpen(value => !value)}><span className="header-greeting">Hi, {firstName}</span><span className="user-avatar" aria-hidden>{initials}</span></button>
            {accountOpen && <div className="user-account-panel" id="user-account-panel">
              <p className="user-summary"><strong>{user.name}</strong><span>{user.email}</span></p>
              <nav aria-label="Your account" onClick={() => setAccountOpen(false)}><Link href="/account">My projects</Link><Link href="/account/profile">Profile</Link><Link href="/account/settings">Settings</Link></nav>
              <form action="/api/auth/logout" method="post"><button type="submit">Log out ↗</button></form>
            </div>}
          </div> : <div className="header-account"><Link href="/auth/login">Log in</Link><Link href="/auth/signup">Sign up</Link></div>}
          <ButtonLink href="/book" primary>Start a project <span aria-hidden>→</span></ButtonLink>
        </div>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
          <span aria-hidden>{open ? "×" : "≡"}</span><span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </header>
      {open && (
        <nav className="mobile-panel" id="mobile-menu" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/book" onClick={() => setOpen(false)}>Start a project <span aria-hidden>→</span></Link>
          {user ? <><Link href="/account" onClick={() => setOpen(false)}>My projects</Link><Link href="/account/profile" onClick={() => setOpen(false)}>Profile</Link><Link href="/account/settings" onClick={() => setOpen(false)}>Settings</Link><form action="/api/auth/logout" method="post"><button className="button" type="submit">Log out</button></form></> : <><Link href="/auth/login" onClick={() => setOpen(false)}>Log in</Link><Link href="/auth/signup" onClick={() => setOpen(false)}>Sign up</Link></>}
        </nav>
      )}
    </>
  );
}
