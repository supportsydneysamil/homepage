import Link from 'next/link';
import type { NextPage } from 'next';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <>
    <section className="hero">
      <p className="pill">Welcome Home</p>
      <h1 className="hero-title">Community Church</h1>
      <p className="lead">
        A young, vibrant church gathering to worship Jesus, grow in community, and serve our city.
      </p>
      <div className="hero__actions">
        <Link href="/worship" className="button">
          Plan a Visit
        </Link>
        <Link href="/events" className="button ghost">
          Upcoming Events
        </Link>
      </div>
    </section>

    <section className="section">
      <div className="section__header">
        <p className="eyebrow">Stay connected</p>
        <h2>Gather. Grow. Go.</h2>
        <p className="muted">Messages, events, and resources to walk with you every week.</p>
      </div>
      <div className="card-grid">
        <div className="card">
          <div className="card__eyebrow">Watch</div>
          <h3>Sermons</h3>
          <p>Revisit messages and worship moments from recent Sundays.</p>
          <Link href="/sermons" className="button text">
            View Sermons
          </Link>
        </div>
        <div className="card">
          <div className="card__eyebrow">Join in</div>
          <h3>Events</h3>
          <p>Retreats, workshops, and gatherings for every life stage.</p>
          <Link href="/events" className="button text">
            See Events
          </Link>
        </div>
        <div className="card">
          <div className="card__eyebrow">Connect</div>
          <h3>Contact</h3>
          <p>We would love to meet you and help you take a next step.</p>
          <Link href="/contact" className="button text">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  </>
);

Home.meta = {
  title: 'Home',
  description: 'Welcome to Community Church online.',
};

export default Home;
