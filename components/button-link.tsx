import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({ href, children, primary = false, quiet = false }: { href: string; children: ReactNode; primary?: boolean; quiet?: boolean }) {
  const tone = primary ? " button-primary" : quiet ? " button-quiet" : "";
  return <Link className={`button${tone}`} href={href}>{children}</Link>;
}
