import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { portfolio as samplePortfolio } from "@/lib/content";
import { getPublishedPortfolio } from "@/lib/server/portfolio";

export const metadata: Metadata = { title: "Work", description: "Selected E-MEDIA creative and digital work." };
export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const databaseItems = await getPublishedPortfolio();
  const items = databaseItems.length
    ? databaseItems.map((item) => ({ ...item, year: item.yearLabel, tone: "ember" }))
    : samplePortfolio.map((item) => ({ ...item, id: item.slug, coverMediaId: null, coverAltText: null }));
  return <><PageHero eyebrow="Selected work" title="Made to be felt."><p>Creative, digital and editorial work shaped around the outcome—not a house style.</p></PageHero><section className="section"><div className="page-shell"><div className="work-grid">{items.map((project) => <Link className="project-card" href={`/work/${project.slug}`} key={project.id}><div className={`project-visual ${project.tone}`}>{project.coverMediaId && <Image src={`/api/media/${project.coverMediaId}`} alt={project.coverAltText || project.title} width={1600} height={1000} sizes="(max-width: 900px) 100vw, 65vw" unoptimized />}</div><div className="project-meta"><div><h2 className="project-title">{project.title}</h2><p className="project-kicker">{project.category} · {project.year}</p></div><span className="arrow" aria-hidden>↗</span></div></Link>)}</div></div></section></>;
}
