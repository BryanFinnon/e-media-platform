import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button-link";
import { PageHero } from "@/components/page-hero";
import { getService, services } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const service = getService((await params).slug); return service ? { title: service.name, description: service.summary } : {}; }

export default async function ServiceDetailPage({ params }: Props) {
  const service = getService((await params).slug); if (!service) notFound();
  return <><PageHero eyebrow={service.group} title={service.name}>{service.description}</PageHero><section className="section"><div className="page-shell detail-grid"><div><p className="eyebrow">Built around the brief</p><div className="tag-list">{service.useCases.map((item) => <span className="tag" key={item}>{item}</span>)}</div></div><div><p className="detail-copy">Every engagement begins with the intended outcome, audience and constraints. Scope, availability and commercial terms are confirmed before work starts.</p><p className="notice">Pricing has not been supplied for this service. E-MEDIA will prepare a tailored quote after reviewing the brief.</p><ol className="process">{service.process.map((step, index) => <li key={step}><span className="section-number">0{index + 1}</span><span>{step}</span></li>)}</ol><div style={{ marginTop: "2rem" }}><ButtonLink href={`/book?service=${service.slug}`} primary>Request a quote <span aria-hidden>→</span></ButtonLink></div></div></div></section></>;
}
