"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/button-link";

const links = [
  ["Work", "/work"],
  ["Services", "/services"],
  ["The Hub", "/media"],
  ["About", "/about"],
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      <header className="site-header">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="header-action"><ButtonLink href="/book" primary>Start a project <span aria-hidden>→</span></ButtonLink></div>
        <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
          <span aria-hidden>{open ? "×" : "≡"}</span><span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </header>
      {open && (
        <nav className="mobile-panel" id="mobile-menu" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link href="/book" onClick={() => setOpen(false)}>Start a project <span aria-hidden>→</span></Link>
          <Link href="/account" onClick={() => setOpen(false)}>Account</Link>
        </nav>
      )}
    </>
  );
}
