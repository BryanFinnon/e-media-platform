import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatBookingDuration } from "@/lib/domain/booking-schedule";
import { getCurrentIdentity, getDatabase, isAdministrator, type D1Database } from "@/lib/server/sites";

type Props = { params: Promise<{ path?: string[] }> };
type Count = { count: number };
type Booking = { id: string; reference: string; service_name: string; client_name: string; client_email: string; preferred_at: string; duration_minutes: number; client_request_email_sent_at: string | null; team_request_email_sent_at: string | null; client_confirmation_email_sent_at: string | null; status: string; brief: string; created_at: string };
type MediaAsset = { id: string; title: string; filename: string; alt_text: string; mime_type: string; size_bytes: number; created_at: string };
type PortfolioItem = { id: string; slug: string; title: string; category: string; year_label: string; summary: string; published: number; cover_media_id: string | null; cover_title: string | null; created_at: string };
type ServiceRow = { id: string; name: string; slug: string; booking_mode: string; active: number };
type Subscriber = { id: string; email: string; status: string; source: string; consent_at: string };
type Audit = { id: string; actor_email: string; action: string; entity_type: string; entity_id: string; created_at: string };

const sections = ["dashboard", "bookings", "portfolio", "media", "services", "newsletter", "audit"] as const;
const statuses = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

async function all<T>(database: D1Database, query: string) {
  return (await database.prepare(query).all<T>()).results ?? [];
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
}

async function Dashboard({ database }: { database: D1Database }) {
  const [today, enquiries, subscribers, published] = await Promise.all([
    database.prepare("SELECT count(*) AS count FROM bookings WHERE date(preferred_at) = date('now')").first<Count>(),
    database.prepare("SELECT count(*) AS count FROM bookings WHERE status IN ('NEW', 'CONTACTED')").first<Count>(),
    database.prepare("SELECT count(*) AS count FROM newsletter_subscribers WHERE status = 'SUBSCRIBED'").first<Count>(),
    database.prepare("SELECT count(*) AS count FROM portfolio_items WHERE published = 1").first<Count>(),
  ]);
  const metrics = [
    ["Bookings today", today?.count ?? 0],
    ["Pending enquiries", enquiries?.count ?? 0],
    ["Subscribers", subscribers?.count ?? 0],
    ["Published projects", published?.count ?? 0],
  ];
  return <><div className="metric-grid">{metrics.map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="notice">Live data from the production database. Use the menu to manage requests, images and portfolio entries.</p></>;
}

async function Bookings({ database }: { database: D1Database }) {
  const bookings = await all<Booking>(database, "SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100");
  if (!bookings.length) return <div className="empty-state"><h2>No booking requests yet.</h2><p>New project requests will appear here as soon as a visitor submits the booking form.</p></div>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Request</th><th>Client</th><th>Schedule</th><th>Email</th><th>Brief</th><th>Status</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.reference}</strong><small>{booking.service_name}<br />{formatDate(booking.created_at)}</small></td><td>{booking.client_name}<small><a href={`mailto:${booking.client_email}`}>{booking.client_email}</a></small></td><td>{formatDate(booking.preferred_at)}<small>{formatBookingDuration(booking.duration_minutes)}</small></td><td><small>Receipt: {booking.client_request_email_sent_at ? "sent" : "pending"}<br />Team: {booking.team_request_email_sent_at ? "sent" : "pending"}{booking.status === "CONFIRMED" && <><br />Confirmation: {booking.client_confirmation_email_sent_at ? "sent" : "pending"}</>}</small></td><td className="admin-brief">{booking.brief}</td><td><form className="admin-inline-form" method="post" action={`/api/admin/bookings/${booking.id}/status`}><select className="input input-compact" name="status" defaultValue={booking.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="button" type="submit">Save</button></form></td></tr>)}</tbody></table></div>;
}

async function Media({ database }: { database: D1Database }) {
  const assets = await all<MediaAsset>(database, "SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 100");
  return <div className="admin-grid"><form className="admin-panel stack" method="post" action="/api/admin/media" encType="multipart/form-data"><p className="eyebrow">Upload</p><h2>Add an image</h2><div className="field"><label htmlFor="media-file">Image file</label><input className="input" id="media-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required /></div><div className="field"><label htmlFor="media-title">Internal title</label><input className="input" id="media-title" name="title" maxLength={120} required /></div><div className="field"><label htmlFor="media-alt">Alternative text</label><input className="input" id="media-alt" name="altText" maxLength={240} required /></div><button className="button button-primary" type="submit">Upload image →</button><p className="help-text">JPEG, PNG, WebP or GIF. Maximum 10 MB. Write useful alternative text for accessibility.</p></form><div className="admin-panel"><p className="eyebrow">Library</p><h2>{assets.length} image{assets.length === 1 ? "" : "s"}</h2><div className="media-grid">{assets.map((asset) => <figure className="media-card" key={asset.id}><Image src={`/api/media/${asset.id}`} alt={asset.alt_text} width={800} height={600} sizes="(max-width: 900px) 100vw, 30vw" unoptimized /><figcaption><strong>{asset.title}</strong><small>{asset.filename}<br />{Math.ceil(asset.size_bytes / 1024)} KB</small></figcaption></figure>)}</div></div></div>;
}

async function Portfolio({ database }: { database: D1Database }) {
  const [items, assets] = await Promise.all([
    all<PortfolioItem>(database, "SELECT p.*, m.title AS cover_title FROM portfolio_items p LEFT JOIN media_assets m ON m.id = p.cover_media_id ORDER BY p.sort_order, p.created_at DESC"),
    all<MediaAsset>(database, "SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 100"),
  ]);
  return <div className="admin-grid"><form className="admin-panel stack" method="post" action="/api/admin/portfolio"><p className="eyebrow">Portfolio</p><h2>Create a project</h2><div className="field"><label htmlFor="project-title">Title</label><input className="input" id="project-title" name="title" maxLength={120} required /></div><div className="form-grid"><div className="field"><label htmlFor="project-category">Category</label><input className="input" id="project-category" name="category" maxLength={80} required /></div><div className="field"><label htmlFor="project-year">Year</label><input className="input" id="project-year" name="yearLabel" maxLength={40} required /></div></div><div className="field"><label htmlFor="project-summary">Summary</label><textarea className="input" id="project-summary" name="summary" maxLength={600} required /></div><div className="field"><label htmlFor="project-cover">Cover image</label><select className="input" id="project-cover" name="coverMediaId"><option value="">No image yet</option>{assets.map((asset) => <option value={asset.id} key={asset.id}>{asset.title}</option>)}</select></div><label className="check-row"><input name="published" type="checkbox" /> Publish immediately</label><button className="button button-primary" type="submit">Create project →</button></form><div className="admin-panel"><p className="eyebrow">Current work</p><h2>{items.length} project{items.length === 1 ? "" : "s"}</h2><div className="admin-list">{items.map((item) => <article key={item.id}><div><strong>{item.title}</strong><small>{item.category} · {item.year_label}<br />{item.cover_title || "No cover image"}</small></div><form method="post" action={`/api/admin/portfolio/${item.id}/publish`}><input type="hidden" name="published" value={item.published ? "0" : "1"} /><button className="button" type="submit">{item.published ? "Unpublish" : "Publish"}</button></form></article>)}</div></div></div>;
}

async function Services({ database }: { database: D1Database }) {
  const services = await all<ServiceRow>(database, "SELECT * FROM services ORDER BY name");
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Service</th><th>Slug</th><th>Booking mode</th><th>State</th></tr></thead><tbody>{services.map((service) => <tr key={service.id}><td>{service.name}</td><td>{service.slug}</td><td>{service.booking_mode}</td><td><span className="tag">{service.active ? "ACTIVE" : "INACTIVE"}</span></td></tr>)}</tbody></table></div>;
}

async function NewsletterSubscribers({ database }: { database: D1Database }) {
  const subscribers = await all<Subscriber>(database, "SELECT * FROM newsletter_subscribers ORDER BY consent_at DESC LIMIT 250");
  if (!subscribers.length) return <div className="empty-state"><h2>No subscribers yet.</h2><p>Consented newsletter sign-ups will appear here.</p></div>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Status</th><th>Source</th><th>Consent date</th></tr></thead><tbody>{subscribers.map((subscriber) => <tr key={subscriber.id}><td>{subscriber.email}</td><td>{subscriber.status}</td><td>{subscriber.source}</td><td>{formatDate(subscriber.consent_at)}</td></tr>)}</tbody></table></div>;
}

async function AuditLog({ database }: { database: D1Database }) {
  const entries = await all<Audit>(database, "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 150");
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Record</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{formatDate(entry.created_at)}</td><td>{entry.actor_email}</td><td>{entry.action}</td><td>{entry.entity_type}<small>{entry.entity_id}</small></td></tr>)}</tbody></table></div>;
}

export default async function AdminPage({ params }: Props) {
  const path = (await params).path ?? [];
  const route = (path[0] ?? "dashboard") as (typeof sections)[number];
  if (!sections.includes(route)) notFound();
  const identity = await getCurrentIdentity();
  if (!identity) redirect(`/auth/login?return_to=${encodeURIComponent(`/admin${route === "dashboard" ? "" : `/${route}`}`)}`);
  if (!(await isAdministrator(identity))) {
    return <section className="page-shell"><div className="auth-card"><p className="eyebrow">Access denied</p><h1>Staff only.</h1><p className="notice">The signed-in account is not on the E-MEDIA administrator allowlist.</p><a className="button" href="/signout-with-chatgpt?return_to=/auth/login">Use another account</a></div></section>;
  }

  let database: D1Database;
  try {
    database = await getDatabase();
  } catch {
    return <section className="page-shell"><div className="auth-card"><p className="eyebrow">Administration</p><h1>Database unavailable.</h1><p className="notice">The database binding is still being initialized. Refresh after the deployment completes.</p></div></section>;
  }

  const title = route.replaceAll("-", " ");
  return <div className="dashboard-layout"><aside className="sidebar"><p className="sidebar-label">E-MEDIA operations</p><nav className="sidebar-nav" aria-label="Administration">{sections.map((item) => <Link href={item === "dashboard" ? "/admin" : `/admin/${item}`} key={item}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav></aside><section className="dashboard-main"><div className="dashboard-head"><div><p className="eyebrow">Administration</p><h1 className="dashboard-title">{title}</h1></div><div className="admin-user"><span className="tag">ADMIN</span><small>{identity.fullName || identity.email}</small><a href="/signout-with-chatgpt?return_to=/">Sign out</a></div></div>{route === "dashboard" && <Dashboard database={database} />}{route === "bookings" && <Bookings database={database} />}{route === "media" && <Media database={database} />}{route === "portfolio" && <Portfolio database={database} />}{route === "services" && <Services database={database} />}{route === "newsletter" && <NewsletterSubscribers database={database} />}{route === "audit" && <AuditLog database={database} />}</section></div>;
}
