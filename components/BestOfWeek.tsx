"use client";

export default function BestOfWeek() {
  return (
    <section className="botw" id="journal" data-theme="light">
      <header className="botw__head">
        <h2 className="botw__title">
          Best of the week <span className="botw__title-link">See all posts →</span>
        </h2>
      </header>

      <div className="botw__grid">
        <a className="botw__feature" href="#">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80&auto=format&fit=crop"
            alt="Featured article"
            loading="lazy"
          />
          <span className="botw__date">Sep 06, 2022</span>
          <span className="botw__cat">Travel</span>
          <div className="botw__overlay">
            <h3>Get to your dream destinations with Travel Pro</h3>
          </div>
          <span className="botw__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>

        <div className="botw__side">
          <div className="botw__ad">
            <div className="botw__ad-top">
              <span className="botw__ad-tag">• ADS</span>
              <span className="botw__ad-plus" aria-hidden="true">+</span>
            </div>
            <span className="botw__ad-kicker">Become a Broadcast Member</span>
            <h4>Real talk in a corporate world</h4>
            <a className="botw__ad-link" href="#">Learn more</a>
          </div>

          <a className="botw__pick" href="#">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=800&q=80&auto=format&fit=crop"
              alt="Editor picks"
              loading="lazy"
            />
            <span className="botw__badge">24</span>
            <span className="botw__pill">See all picks →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
