import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <header className="page-shell page-hero">
      <div><p className="eyebrow eyebrow-slash">{eyebrow}</p><h1 className="page-title">{title}</h1></div>
      <div className="page-intro">{children}</div>
    </header>
  );
}
