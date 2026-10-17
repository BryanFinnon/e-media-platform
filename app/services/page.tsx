import {fromPrice} from '@/lib/domain/quotes';
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { serviceGroups, services } from "@/lib/content";

export const metadata: Metadata = { title: "Services", description: "Creative production, digital technology, brand and content services from E-MEDIA." };

export default function ServicesPage() {
  return (
    <><PageHero eyebrow="Services" title={<>Creative<br />capability.</>}><p>From first thought to final frame, we build identities, campaigns, productions and digital experiences designed to make an impact.</p></PageHero>
      <div className="page-shell">{serviceGroups.map((group) => <section className="service-group" key={group}><p className="eyebrow">{group}</p><h2 className="service-group-title">{group}</h2><div className="capability-list">{services.filter((service) => service.group === group).map((service) => <Link className="capability-row" href={`/services/${service.slug}`} key={service.slug}><span className="section-number">{service.index}</span><span className="capability-name">{service.name}</span><span className="capability-copy">{service.summary}<br /><strong>{fromPrice(service.slug)}</strong></span><span className="round-arrow" aria-hidden>↗</span></Link>)}</div></section>)}</div>
    </>
  );
}
