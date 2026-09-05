import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { hubItems } from "@/lib/content";

type Props = { params: Promise<{ path?: string[] }> };
const sections: Record<string, { eyebrow: string; title: string; copy: string }> = {
  latest: { eyebrow: "Latest", title: "Newsroom.", copy: "Original stories and useful context. Sample editorial is always labelled until an editor publishes verified work." },
  watch: { eyebrow: "Watch", title: "Stories in motion.", copy: "Shows, interviews, films and culture. External embeds and Mux playback activate when editors provide real media." },
  live: { eyebrow: "Live", title: "Off air. For now.", copy: "Scheduled broadcasts will appear here with accessible playback, reminders and archive links." },
  opportunities: { eyebrow: "Opportunities", title: "Open doors.", copy: "Jobs, grants, castings and creative calls, created and checked by the E-MEDIA editorial team." },
  events: { eyebrow: "What’s on", title: "Meet the city.", copy: "A London-focused events guide ready for editor-supplied listings. No events have been fabricated." },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> { const key = (await params).path?.[0]; return { title: key ? sections[key]?.eyebrow ?? "Media" : "The Hub" }; }
export default async function MediaPage({ params }: Props) {
  const path = (await params).path ?? [];
  if (path.length > 1) notFound();
  if (!path.length) return <><PageHero eyebrow="E-MEDIA Hub" title={<>London,<br />unmuted.</>}><p>A connected platform for journalism, moving image, broadcasts, opportunities and community.</p></PageHero><section className="section hub"><div className="page-shell hub-grid">{hubItems.map((item) => <Link className="hub-card" href={item.href} key={item.type}><span className="hub-card-type">{item.type}</span><h2 className="hub-card-title">{item.title}</h2><span>{item.eyebrow} ↗</span></Link>)}</div></section></>;
  const section = sections[path[0]]; if (!section) notFound();
  return <><PageHero eyebrow={section.eyebrow} title={section.title}><p>{section.copy}</p></PageHero><section className="section"><div className="page-shell"><div className="empty-state"><h2>Ready for editorial publishing</h2><p>This section is enabled, but contains no live records. Editors can create, review, schedule and publish content from Admin.</p><Link className="button" href="/media">Explore the Hub →</Link></div></div></section></>;
}
