import Link from 'next/link';
import type { NextPage } from 'next';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <>
    <section className="hero hero--art">
      <div className="hero__bg">
        <img src="https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1400&q=80" alt="Church gathering" />
        <div className="hero__gradient" />
      </div>
      <div className="hero__content">
        <p className="pill">Welcome Home</p>
        <h1 className="hero-title">A church for the city</h1>
        <p className="lead">
          Modern worship, authentic community, and a bold mission to love Sydney. Join us as we lift
          up Jesus and serve our neighbors with creativity and compassion.
        </p>
        <div className="hero__actions">
          <Link href="/worship" className="button">
            Plan a Visit
          </Link>
          <Link href="/events" className="button ghost">
            See What&apos;s On
          </Link>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <span className="stat__number">2</span>
            <span className="stat__label">Sunday gatherings</span>
          </div>
          <div className="stat">
            <span className="stat__number">20+</span>
            <span className="stat__label">Serving teams</span>
          </div>
          <div className="stat">
            <span className="stat__number">50+</span>
            <span className="stat__label">Small groups</span>
          </div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="section__header">
        <p className="eyebrow">What we&apos;re about</p>
        <h2>Worship. Formation. Mission.</h2>
        <p className="muted">Designed for a new generation that loves Jesus and our city.</p>
      </div>
      <div className="card-grid feature-grid">
        <div className="card feature-card">
          <div className="feature-icon">✦</div>
          <h3>Creative worship</h3>
          <p>Modern music, ancient prayers, and space to encounter God.</p>
          <Link href="/worship" className="button text">
            Service times
          </Link>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">➜</div>
          <h3>Events that gather</h3>
          <p>Retreats, conversations, and city outreach that move you forward.</p>
          <Link href="/events" className="button text">
            Explore events
          </Link>
        </div>
        <div className="card feature-card">
          <div className="feature-icon">☉</div>
          <h3>Sermons on demand</h3>
          <p>Watch the latest messages anywhere, anytime.</p>
          <Link href="/sermons" className="button text">
            Watch sermons
          </Link>
        </div>
      </div>
    </section>

    <section className="section section--split">
      <div className="section__header">
        <p className="eyebrow">Stay in the flow</p>
        <h2>Resources for your week</h2>
        <p className="muted">Bulletins, guides, and videos to keep you encouraged.</p>
        <div className="section__actions">
          <Link href="/resources" className="button">
            Browse Resources
          </Link>
          <Link href="/contact" className="button ghost">
            Talk to a pastor
          </Link>
        </div>
      </div>
      <div className="glass-card">
        <h3 className="muted">This week</h3>
        <ul className="highlight-list">
          <li>
            <span className="dot" />
            <span>Christmas Service — Dec 25</span>
          </li>
          <li>
            <span className="dot" />
            <span>New sermon: Faith and Life</span>
          </li>
          <li>
            <span className="dot" />
            <span>Download the weekly bulletin</span>
          </li>
        </ul>
      </div>
    </section>
  </>
);

Home.meta = {
  title: 'Home',
  description: 'Welcome to Community Church online.',
};

export default Home;
