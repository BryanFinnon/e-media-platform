import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/button-link";
import { Newsletter } from "@/components/newsletter";
import { hubItems, portfolio, services } from "@/lib/content";
import { getPublishedPortfolio } from "@/lib/server/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const databasePortfolio = await getPublishedPortfolio();
  const work = databasePortfolio.length
    ? databasePortfolio.slice(0, 3).map((project) => ({ ...project, year: project.yearLabel, tone: "ember" }))
    : portfolio.map((project) => ({ ...project, id: project.slug, coverMediaId: null, coverAltText: null }));
  return (
    <>
      <section className="hero grid-backdrop grain" aria-labelledby="hero-title">
        <div className="hero-orb" aria-hidden />
        <div className="page-shell hero-inner">
          <div><p className="location">London&nbsp;&nbsp;/&nbsp;&nbsp;UK</p><p className="eyebrow">Independent creative studio + media platform</p><h1 className="hero-title" id="hero-title">We make <span>ideas <em>move.</em></span></h1></div>
          <div className="hero-bottom"><p className="hero-copy">E-MEDIA connects bold creative work, technology and youth culture with the people, stories and opportunities shaping London next.</p><a className="scroll-cue" href="#work" aria-label="Continue to featured work">↓</a></div>
        </div>
      </section>

      <section className="section" id="work">
        <div className="page-shell"><div className="section-head"><div><p className="eyebrow eyebrow-slash">Selected work</p><h2 className="section-heading">Made to<br />be felt.</h2></div><p className="section-copy">Creative, digital and editorial work shaped around the outcome—not a house style. Development entries are visibly labelled until E-MEDIA publishes real project details.</p></div>
          <div className="work-grid">{work.map((project) => <Link className="project-card" href={`/work/${project.slug}`} key={project.slug}><div className={`project-visual ${project.tone}`}>{project.coverMediaId && <Image src={`/api/media/${project.coverMediaId}`} alt={project.coverAltText || project.title} width={1600} height={1000} sizes="(max-width: 900px) 100vw, 65vw" unoptimized />}</div><div className="project-meta"><div><h3 className="project-title">{project.title}</h3><p className="project-kicker">{project.category} · {project.year}</p></div><span className="arrow" aria-hidden>↗</span></div></Link>)}</div>
          <div style={{ marginTop: "3rem" }}><ButtonLink href="/work">View all work <span aria-hidden>→</span></ButtonLink></div>
        </div>
      </section>

      <section className="section">
        <div className="page-shell"><div className="section-head"><div><p className="eyebrow eyebrow-slash">Capabilities</p><h2 className="section-heading">One team.<br />More range.</h2></div><p className="section-copy">Three connected practices move from the first thought to the final frame—and into the systems that keep the work useful.</p></div>
          <div className="capability-list">{services.slice(0, 6).map((service) => <Link className="capability-row" href={`/services/${service.slug}`} key={service.slug}><span className="section-number">{service.index}</span><span className="capability-name">{service.name}</span><span className="capability-copy">{service.summary}</span><span className="round-arrow" aria-hidden>↗</span></Link>)}</div>
          <div style={{ marginTop: "3rem" }}><ButtonLink href="/services">Explore all services <span aria-hidden>→</span></ButtonLink></div>
        </div>
      </section>

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
