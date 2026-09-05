import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button-link";
import { PageHero } from "@/components/page-hero";
import { getProject } from "@/lib/content";
import { getPublishedPortfolioItem } from "@/lib/server/portfolio";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

async function getItem(slug: string) {
  const databaseItem = await getPublishedPortfolioItem(slug);
  if (databaseItem) return { ...databaseItem, year: databaseItem.yearLabel };
  const sample = getProject(slug);
  return sample ? { ...sample, coverMediaId: null, coverAltText: null } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).slug);
  return item ? { title: item.title, description: item.summary } : {};
}

export default async function WorkDetailPage({ params }: Props) {
  const item = await getItem((await params).slug);
  if (!item) notFound();
  return <><PageHero eyebrow={`${item.category} · ${item.year}`} title={item.title}><p>{item.summary}</p></PageHero><section className="section"><div className="page-shell">{item.coverMediaId ? <div className="work-detail-image"><Image src={`/api/media/${item.coverMediaId}`} alt={item.coverAltText || item.title} width={1600} height={900} sizes="100vw" unoptimized /></div> : <div className="project-visual ember" aria-hidden />}<div className="detail-grid" style={{ marginTop: "3rem" }}><p className="eyebrow">Project overview</p><div><p className="detail-copy">{item.summary}</p><ButtonLink href="/book" primary>Start a project →</ButtonLink></div></div></div></section></>;
}
