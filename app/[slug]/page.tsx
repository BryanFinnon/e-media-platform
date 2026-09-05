import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";

const pages = {
  about: { eyebrow: "About E-MEDIA", title: "Studio, system, signal.", copy: "E-MEDIA connects premium creative production and practical technology with an independent youth media platform rooted in London." },
  contact: { eyebrow: "Contact", title: "Let’s talk.", copy: "Use the project form for a detailed brief. Business contact details and social links are controlled from Site Settings and will appear here once supplied." },
  search: { eyebrow: "Search", title: "Find the signal.", copy: "Unified search is ready to index published services, portfolio, articles, video, opportunities, events and community discussions from the E-MEDIA database." },
  privacy: { eyebrow: "Legal · Review required", title: "Privacy.", copy: "This placeholder explains the intended data boundaries but is not legal advice or an approved E-MEDIA privacy policy. It requires review before launch." },
  cookies: { eyebrow: "Preferences", title: "Cookies.", copy: "Necessary storage supports security and preferences. Optional analytics and marketing require consent and remain disabled until configured." },
  terms: { eyebrow: "Legal · Review required", title: "Terms.", copy: "These terms are intentionally not fabricated. E-MEDIA must provide and obtain review of its commercial and platform terms before production launch." },
  "community-rules": { eyebrow: "Community", title: "Rules for the room.", copy: "Be constructive, protect privacy, reject harassment and report unsafe behaviour. Final policy and age requirements need E-MEDIA legal review." },
} as const;

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const page = pages[(await params).slug as keyof typeof pages]; return page ? { title: page.eyebrow, description: page.copy } : {}; }
export default async function InfoPage({ params }: Props) { const slug = (await params).slug; const page = pages[slug as keyof typeof pages]; if (!page) notFound(); return <><PageHero eyebrow={page.eyebrow} title={page.title}><p>{page.copy}</p></PageHero><section className="section"><div className="page-shell detail-grid">{slug === "about" ? <><div><Image src="/e-media-source-logo.jpeg" alt="Original supplied E-MEDIA logo with the line Fast Content Delivery" width={1178} height={1162} /></div><div><p className="eyebrow">Two identities. One brand.</p><p className="detail-copy">E-MEDIA Studio drives commercial creative and technology work. E-MEDIA Hub creates space for stories, shows, opportunities and community. The shared visual language keeps both parts recognisably connected.</p></div></> : <><p className="eyebrow">E-MEDIA · London / UK</p><div><p className="detail-copy">{page.copy}</p>{slug === "contact" && <Link className="button button-primary" href="/book">Start a project →</Link>}</div></>}</div></section></>; }
