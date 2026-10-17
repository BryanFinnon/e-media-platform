import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatBookingDuration } from "@/lib/domain/booking-schedule";
import { getCurrentIdentity, getDatabase } from "@/lib/server/sites";

type Props = { params: Promise<{ path?: string[] }> };
type Booking = {
  id: string;
  reference: string;
  service_name: string;
  preferred_at: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  snapshot_json:string|null;deposit_paid:number|null;balance_paid:number|null;gallery_ready:number|null;
};

const items = ["overview", "bookings", "settings"];
export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: Props) {
  const path = (await params).path ?? [];
  const route = path[0] ?? "overview";
  const identity = await getCurrentIdentity();
  if (!identity) redirect(`/auth/login?return_to=${encodeURIComponent(`/account/${route}`)}`);

  let bookings: Booking[] = [];
  try {
    const result = await (await getDatabase())
      .prepare(
        `SELECT b.*,q.snapshot_json,q.deposit_paid,q.balance_paid,q.gallery_ready FROM bookings b LEFT JOIN booking_quotes q ON q.booking_id=b.id WHERE ${identity.accountId ? "b.client_account_id = ?" : "b.client_account_id IS NULL AND lower(b.client_email) = ?"} ORDER BY b.created_at DESC LIMIT 50`,
      )
      .bind(identity.accountId ?? identity.email)
      .all<Booking>();
    bookings = result.results ?? [];
  } catch {
    // The account remains usable while a new database deployment initializes.
  }

  const title = route[0].toUpperCase() + route.slice(1);
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <p className="sidebar-label">Your account</p>
        <nav className="sidebar-nav" aria-label="Account">
          {items.map((item) => <Link href={item === "overview" ? "/account" : `/account/${item}`} key={item}>{item[0].toUpperCase() + item.slice(1)}</Link>)}
        </nav>
      </aside>
      <section className="dashboard-main">
        <div className="dashboard-head">
          <div><p className="eyebrow">Client portal</p><h1 className="dashboard-title">{title}</h1></div>
          <form action="/api/auth/logout" method="post"><button className="button">Sign out</button></form>
        </div>
        {route === "bookings" || route === "overview" ? (
          bookings.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Reference</th><th>Service</th><th>Preferred time</th><th>Status</th></tr></thead>
                <tbody>{bookings.map((booking) => <tr key={booking.id}><td><Link href={`/account/projects/${booking.id}`}>{booking.reference} →</Link></td><td>{booking.service_name}</td><td>{new Date(booking.preferred_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}<small>{formatBookingDuration(booking.duration_minutes)}</small></td><td><span className="tag">{booking.status==='CANCELLED'?'Cancelled / declined':booking.balance_paid?'Paid in full':booking.gallery_ready?'Gallery ready · balance due':booking.deposit_paid?'Confirmed':booking.snapshot_json?'Quote ready · deposit due':'Review pending'}</span></td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><h2>No project requests yet.</h2><p>Requests sent with {identity.email} will appear here.</p><Link className="button button-primary" href="/book">Start a project →</Link></div>
          )
        ) : (
          <div className="empty-state"><h2>Account details</h2><p>Signed in as {identity.fullName || identity.email}. Contact E-MEDIA if you need to update or remove account data.</p>{identity.phone&&<p>Phone: {identity.phone}</p>}{identity.address&&<p>Address: {identity.address}</p>}</div>
        )}
      </section>
    </div>
  );
}
