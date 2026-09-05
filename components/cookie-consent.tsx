"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

type Consent = "necessary" | "all";

export function CookieConsent() {
  const [dismissed, setDismissed] = useState(false);
  const consent = useSyncExternalStore(() => () => undefined, () => window.localStorage.getItem("emedia-cookie-consent") ?? "", () => "server");
  const save = (value: Consent) => { window.localStorage.setItem("emedia-cookie-consent", value); setDismissed(true); };
  if (dismissed || consent) return null;
  return (
    <aside className="cookie-banner" aria-label="Cookie preferences">
      <p>We use necessary storage to remember essential preferences. Analytics and marketing stay off unless you choose to allow them. You can revisit this choice on the Cookies page.</p>
      <div className="cookie-actions">
        <button className="button button-primary" onClick={() => save("all")}>Allow all</button>
        <button className="button" onClick={() => save("necessary")}>Necessary only</button>
        <Link className="button button-quiet" href="/cookies">Review settings</Link>
      </div>
    </aside>
  );
}
