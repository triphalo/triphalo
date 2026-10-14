import ResonanceExperience from "@/components/resonance-experience";
import { LOCKED_COPY as copy } from "@/lib/locked-copy";
import "./resonance.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: diagonal ? "rotate(-135deg)" : undefined }}><path d="M12 4v15m-6-6 6 6 6-6" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
export default function Home() {
  return <ResonanceExperience>
    <main id="main" className="r-main" tabIndex={-1}>
      <section id="opening" className="r-chapter r-opening" aria-labelledby="opening-title" tabIndex={-1}>
        <div className="r-opening-heading">
          <p className="r-eyebrow r-descriptor">{copy.descriptor}</p>
          <h1 id="opening-title">Intelligence<br />in service of<br /><em>human experience.</em></h1>
        </div>
        <div className="r-opening-foot"><p>{copy.introduction}</p><a href="#belief" className="r-explore" aria-label="Explore our perspective"><Arrow /></a></div>
      </section>
      <section id="belief" className="r-chapter r-belief" aria-labelledby="belief-title" tabIndex={-1}>
        <div className="r-chapter-copy">
          <div className="r-section-label"><span>01</span><span>Belief</span><span className="r-label-line" /></div>
          <h2 id="belief-title">The future should<br />feel <em>more human.</em></h2>
          <div className="r-body-copy">{copy.belief.paragraphs.map((p, i) => <p key={p} className={i === 0 ? "r-lead" : undefined}>{p}</p>)}</div>
          <a href="#work" className="r-next"><span>The work</span><Arrow /></a>
        </div>
      </section>
      <section id="work" className="r-chapter r-work" aria-labelledby="work-title" tabIndex={-1}>
        <div className="r-chapter-copy">
          <div className="r-section-label"><span>02</span><span>Work</span><span className="r-label-line" /></div>
          <h2 id="work-title">From ambition<br />to <em>working systems.</em></h2>
          <div className="r-body-copy">{copy.work.paragraphs.map((p, i) => <p key={p} className={i === 0 ? "r-lead" : undefined}>{p}</p>)}</div>
          <a href="#contact" className="r-next"><span>Have something in mind?</span><Arrow /></a>
        </div>
      </section>
      <section id="contact" className="r-chapter r-contact" aria-labelledby="contact-title" tabIndex={-1}>
        <div className="r-contact-inner">
          <div className="r-section-label"><span>03</span><span>Contact</span></div>
          <h2 id="contact-title">Have something<br /><em>in mind?</em></h2>
          <a className="r-email" href={copy.contact.href}><span>{copy.contact.address}</span><Arrow diagonal /></a>
        </div>
        <footer className="r-footer"><span>TripHalo</span><a href="#opening">Back to the beginning <span aria-hidden="true">↑</span></a></footer>
      </section>
    </main>
  </ResonanceExperience>;
}
