import {ProjectCarousel} from '@/components/project-carousel';
import {homepageProof} from '@/lib/server/homepage-proof';
import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/button-link";
import { Newsletter } from "@/components/newsletter";
import { hubItems, portfolio } from "@/lib/content";
import { getPublishedPortfolio } from "@/lib/server/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const proof=await homepageProof();
  const databasePortfolio = await getPublishedPortfolio();
  const work = databasePortfolio.length
    ? databasePortfolio.map((project) => ({ ...project, year: project.yearLabel, tone: "ember" }))
    : portfolio.map((project) => ({ ...project, id: project.slug, coverMediaId: null, coverAltText: null }));
  return (
    <>
      <section className="hero grid-backdrop grain" aria-labelledby="hero-title">
        <div className="hero-orb" aria-hidden />
        <div className="page-shell hero-inner">
          <div><p className="location">London&nbsp;&nbsp;/&nbsp;&nbsp;UK</p><p className="eyebrow">Creative & digital agency · London</p><h1 className="hero-title" id="hero-title">Fast <span>content</span><em>delivery.</em></h1></div>
          <div className="hero-bottom"><div><p className="hero-copy">E-MEDIA is a London-based creative and digital agency. We create photography, video, films and live broadcasts, and build websites, applications and AI-powered workflows for businesses, associations and individuals.</p><div className="hero-actions"><ButtonLink href="/services">Explore our services →</ButtonLink><ButtonLink href="/book" primary>Book a project →</ButtonLink></div></div><a className="scroll-cue" href="#work" aria-label="Continue to featured work">↓</a></div>
        </div>
      </section>

      <section className="section" id="work">
        <div className="page-shell"><div className="section-head"><div><p className="eyebrow eyebrow-slash">Selected work</p><h2 className="section-heading">Our work.<br />Your next idea.</h2></div><p className="section-copy">Explore our photography, film and digital projects. Swipe or scroll horizontally to browse.</p></div>
          <ProjectCarousel>{work.map((project) => <Link className="project-card" href={`/work/${project.slug}`} key={project.slug}><div className={`project-visual ${project.tone}`}>{project.coverMediaId && <Image src={`/api/media/${project.coverMediaId}`} alt={project.coverAltText || project.title} width={1600} height={1000} sizes="(max-width: 900px) 100vw, 65vw" unoptimized />}</div><div className="project-meta"><div><h3 className="project-title">{project.title}</h3><p className="project-kicker">{project.category} · {project.year}</p></div><span className="arrow" aria-hidden>↗</span></div></Link>)}</ProjectCarousel>
          <div style={{ marginTop: "3rem" }}><ButtonLink href="/work">View all work <span aria-hidden>→</span></ButtonLink></div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="page-shell"><div className="section-head services-intro"><div><p className="eyebrow eyebrow-slash">What we do</p><h2 className="section-heading">Creative.<br />Digital.<br />Connected.</h2></div><p className="section-copy">One place for the content you need and the technology behind it. We help you communicate your story, capture important moments and turn your ideas into useful digital experiences.</p></div>
          <div className="practice-grid">{[
            {number:'01',title:'Photo, video & live',copy:'Portraits, events, campaigns, films, interviews, podcasts, livestreaming and post-production.',href:'/services/photography'},
            {number:'02',title:'Web, apps & AI',copy:'Websites, e-commerce, mobile applications, business systems and practical AI workflow automation.',href:'/services/web-development'},
            {number:'03',title:'Brand & content',copy:'Graphic design, brand identity, social content, content planning and community management.',href:'/services/graphic-design'}
          ].map(item=><article className="practice" key={item.number}><span className="section-number">{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p><Link href={item.href} className="button button-quiet">Explore →</Link></article>)}</div>
          <div className="hero-actions"><ButtonLink href="/services">See all services & guide prices →</ButtonLink></div>
        </div>
      </section>
      {/* Keep both reserved sections visible until approved content is available. */}
      <section className="section" id="collaborations"><div className="page-shell"><p className="eyebrow">Clients & partners</p><h2 className="section-heading">Built together.</h2>{proof.brands.length===0&&<div className="proof-placeholder"><p className="eyebrow">Partnerships</p><h3>Let’s create together.</h3><p>Client and partner logos will be featured here soon.</p><Link className="button button-quiet" href="/book">Work with E-MEDIA →</Link></div>}<div className="brand-strip">{proof.brands.map(brand=><div className="collaboration-brand" key={brand.id}>{brand.logo_media_id?<Image unoptimized src={`/api/media/${brand.logo_media_id}`} alt={brand.name} width={200} height={100}/>:<strong>{brand.name}</strong>}<small>{brand.relationship}</small></div>)}</div></div></section>
      <section className="section" id="client-feedback"><div className="page-shell"><p className="eyebrow">Client feedback</p><h2 className="section-heading">In their words.</h2>{proof.reviews.length===0&&<div className="proof-placeholder"><p className="eyebrow">Reviews & ratings</p><h3>Your experience matters.</h3><p>Client feedback and star ratings will appear here as reviews are published.</p></div>}<div className="review-grid">{proof.reviews.map(review=><figure className="client-review" key={review.id}><p className="review-stars" aria-label={`${review.stars} out of 5 stars`}><span aria-hidden>{'★'.repeat(review.stars)}{'☆'.repeat(5-review.stars)}</span></p><blockquote>{review.quote}</blockquote><figcaption><strong>{review.name}</strong>{review.company&&<small>{review.company}</small>}</figcaption></figure>)}</div></div></section>

      <section className="section hub">
        <div className="page-shell"><div className="section-head"><div><p className="eyebrow eyebrow-slash">E-MEDIA Hub</p><h2 className="section-heading">London,<br />unmuted.</h2></div><p className="section-copy">Culture, useful opportunities and community—made with young London, not simply aimed at it. All development content is labelled until editors publish.</p></div>
          <div className="hub-grid">{hubItems.map((item) => <Link className="hub-card" href={item.href} key={item.type}><div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}><span className="hub-card-type">{item.type}</span>{item.state && <span className="state">{item.state}</span>}</div><div><h3 className="hub-card-title">{item.title}</h3><p className="hub-card-kicker">{item.eyebrow}</p></div><span aria-hidden>Read / watch ↗</span></Link>)}</div>
        </div>
      </section>

      <section className="section cta-section grid-backdrop"><div className="page-shell" style={{ position: "relative" }}><p className="eyebrow">Have something in mind?</p><h2 className="cta-title">Start your<br /><span>next project.</span></h2><div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}><ButtonLink href="/book" primary>Start a project <span aria-hidden>→</span></ButtonLink><ButtonLink href="/media">Explore E-MEDIA <span aria-hidden>→</span></ButtonLink></div></div></section>
      <Newsletter />
    </>
  );
}
