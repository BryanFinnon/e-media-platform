import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentIdentity, isAdministrator } from "@/lib/server/sites";

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ return_to?: string; message?: string }>;
};

export const metadata: Metadata = { title: "Account access" };

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default async function AuthPage({ params, searchParams }: Props) {
  const route = (await params).path?.[0] ?? "login";
  if (!['login', 'signup', 'forgot-password', 'reset-password'].includes(route)) notFound();
  const query = await searchParams;
  const identity = await getCurrentIdentity();
  const admin = await isAdministrator(identity);
  const returnTo = safeReturnTo(query.return_to);

  return (
    <section className="page-shell">
      <div className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h1>{identity ? "You’re signed in" : "Welcome back"}</h1>
        {query.message && <p className="notice">{query.message}</p>}
        {identity ? (
          <div className="stack">
            <p className="notice">Signed in as <strong>{identity.fullName || identity.email}</strong>.</p>
            <Link className="button button-primary" href={admin ? "/admin" : returnTo}>
              {admin ? "Open administration" : "Open your account"} →
            </Link>
            <Link className="button" href="/signout-with-chatgpt?return_to=/">Sign out</Link>
          </div>
        ) : (
          <div className="stack">
            <p className="notice">E-MEDIA uses Sign in with ChatGPT. Your email address is used only to identify your account and protect private records.</p>
            <a className="button button-primary" href={`/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`}>
              Sign in with ChatGPT →
            </a>
            <Link className="button" href="/">Back to the site</Link>
          </div>
        )}
      </div>
    </section>
  );
}
