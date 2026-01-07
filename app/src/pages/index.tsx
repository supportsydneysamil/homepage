import Link from 'next/link';
import type { NextPage } from 'next';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section>
    <h1 className="hero-title">Community Church</h1>
    <p className="lead">Welcome to our community of faith. We gather, worship, and grow together.</p>
    <div className="card-grid">
      <div className="card">
        <h3>Sermons</h3>
        <p>Watch and revisit recent messages from our pastors.</p>
        <Link href="/sermons" className="button">View Sermons</Link>
      </div>
      <div className="card">
        <h3>Events</h3>
        <p>Join upcoming gatherings and special services.</p>
        <Link href="/events" className="button">See Events</Link>
      </div>
      <div className="card">
        <h3>Contact</h3>
        <p>We would love to connect and hear from you.</p>
        <Link href="/contact" className="button">Contact Us</Link>
      </div>
    </div>
  </section>
);

Home.meta = {
  title: 'Home',
  description: 'Welcome to Community Church online.',
};

export default Home;
