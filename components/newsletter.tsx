"use client";

import { useState } from "react";

export function Newsletter() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function subscribe(formData: FormData) {
    setStatus("sending");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: formData.get("email"), consent: formData.get("consent") === "on", source: "HOMEPAGE" }),
    });
    setStatus(response.ok ? "sent" : "error");
  }
  return (
    <section className="section">
      <div className="page-shell detail-grid">
        <div><p className="eyebrow">Newsletter</p><h2 className="section-heading">Keep the<br />signal close.</h2></div>
        <div>{status === "sent" ? <div className="empty-state"><h2>You’re on the list.</h2><p>Your subscription has been saved.</p></div> : <form className="stack" action={subscribe}><p className="section-copy">Occasional editorial, opportunities and E-MEDIA news. No automatic marketing opt-in, and one-click unsubscribe.</p><div className="field"><label htmlFor="newsletter-email">Email</label><input className="input" id="newsletter-email" name="email" type="email" autoComplete="email" required /></div><label style={{ display: "flex", gap: ".7rem", alignItems: "flex-start", color: "var(--text-secondary)", fontSize: ".82rem" }}><input name="consent" type="checkbox" required /> I explicitly agree to receive the E-MEDIA newsletter.</label>{status === "error" && <p className="error-text" role="alert">We could not save your subscription. Please try again.</p>}<button className="button button-primary" type="submit" disabled={status === "sending"}>{status === "sending" ? "Joining…" : "Join the list →"}</button></form>}</div>
      </div>
    </section>
  );
}
