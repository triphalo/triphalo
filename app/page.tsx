import HaloScene from "@/components/halo-scene";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={diagonal ? "arrow diagonal" : "arrow"}
    >
      <path
        d="M4 12h15M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Mark() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="brand-mark"
      aria-hidden="true"
    >
      <path
        d="M24.7 7.3a12.3 12.3 0 1 0 0 17.4"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M23 10.3a8.1 8.1 0 1 0 0 11.4"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="27.6" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}
export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <a href="#" aria-label="TripHalo home" className="brand">
          <Mark />
          <span>TripHalo</span>
        </a>
        <span className="header-descriptor">
          Independent technology
          <br />
          &amp; experience studio
        </span>
        <a className="header-contact" href="mailto:hello@triphalo.com">
          Let’s talk <Arrow diagonal />
        </a>
      </header>
      <main id="main">
        <section
          id="opening"
          className="opening"
          aria-labelledby="opening-title"
        >
          <div className="opening-copy">
            <p className="eyebrow mobile-descriptor">
              Independent technology &amp; experience studio
            </p>
            <h1 id="opening-title">
              Intelligence
              <br />
              in service of
              <br />
              <em>human</em>
              <br />
              <em>experience.</em>
            </h1>
          </div>
          <div className="visual-stage">
            <HaloScene />
          </div>
          <div className="opening-base">
            <p>
              We build intelligent systems.
              <br />
              And help deliver human-led experiences.
            </p>
            <a className="explore-link" href="#possibility">
              <span>A little more about us</span>
              <span className="circle-arrow">
                <Arrow />
              </span>
            </a>
          </div>
          <span className="opening-index" aria-hidden="true">
            INTELLIGENCE / EXPERIENCE
          </span>
        </section>
        <section
          id="possibility"
          className="possibility section-pad"
          aria-labelledby="possibility-title"
        >
          <div className="section-heading">
            <span className="eyebrow">01 / A point of view</span>
            <span className="small-mark" aria-hidden="true">
              ✳
            </span>
          </div>
          <h2 id="possibility-title">
            The future should
            <br />
            feel <em>more human.</em>
          </h2>
          <div className="possibility-body">
            <p className="lead">
              AI can take on much of the work that keeps a business busy. Its
              greater promise is what that makes possible.
            </p>
            <div className="possibility-detail">
              <p>
                More attention for guests. The capacity to develop an idea
                that’s been waiting for years. A team able to act on what it
                knows.
              </p>
              <p>
                We build towards that future, with people responsible for the
                decisions that matter.
              </p>
            </div>
          </div>
          <div className="possibility-note">
            <span className="status-dot" aria-hidden="true" />
            Technology creates the space. People give it meaning.
          </div>
        </section>
        <section
          id="practice"
          className="practice section-pad"
          aria-labelledby="practice-title"
        >
          <div className="section-heading">
            <span className="eyebrow">02 / The work</span>
            <span className="eyebrow">From idea to implementation</span>
          </div>
          <div className="practice-intro">
            <h2 id="practice-title">
              From ambition
              <br />
              to <em>working systems.</em>
            </h2>
            <p>
              We work from the first question through to implementation,
              building new capabilities and helping teams put them to use.
            </p>
          </div>
          <div className="practice-rows">
            <div className="practice-row">
              <span className="row-number" aria-hidden="true">
                01
              </span>
              <h3>Intelligent systems</h3>
              <div>
                <p>
                  Bespoke software, AI workflows and automation. Consultancy and
                  hands-on development, shaped around the way a business works.
                </p>
                <span className="capability-label">
                  Conceive. Build. Implement.
                </span>
              </div>
            </div>
            <div className="practice-row">
              <span className="row-number" aria-hidden="true">
                02
              </span>
              <h3>Human-led experiences</h3>
              <div>
                <p>
                  Travel operations, destination management and experience
                  delivery. The systems behind a business, and the time people
                  spend together.
                </p>
                <span className="capability-label">
                  Connect. Organise. Deliver.
                </span>
              </div>
            </div>
          </div>
          <p className="practice-footnote">
            A particular interest in tour operators, attractions and
            experience-led businesses.
            <br className="desktop-break" /> An ambition that reaches beyond any
            one sector.
          </p>
        </section>
        <section
          id="contact"
          className="contact section-pad"
          aria-labelledby="contact-title"
        >
          <div className="contact-top">
            <span className="eyebrow">03 / Start a conversation</span>
            <Mark />
          </div>
          <h2 id="contact-title">
            Have something
            <br />
            <em>in mind?</em>
          </h2>
          <a className="email-link" href="mailto:hello@triphalo.com">
            <span>hello@triphalo.com</span>
            <Arrow diagonal />
          </a>
          <footer className="site-footer">
            <a className="footer-brand" href="#">
              TripHalo
            </a>
            <p>Independent technology &amp; experience studio.</p>
            <a href="#opening" className="back-top">
              Back to top <Arrow />
            </a>
          </footer>
        </section>
      </main>
    </>
  );
}
