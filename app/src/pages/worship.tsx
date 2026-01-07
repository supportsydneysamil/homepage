import type { NextPage } from 'next';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section>
    <h1>Worship Gatherings</h1>
    <div className="info-list">
      <div>
        <h3>Sunday Services</h3>
        <p>9:00 AM | 11:00 AM</p>
      </div>
      <div>
        <h3>Midweek Prayer</h3>
        <p>Wednesdays at 7:00 PM</p>
      </div>
      <div>
        <h3>Address</h3>
        <p>123 Main Street, Your City, ST 00000</p>
        <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="link">View on Google Maps</a>
      </div>
    </div>
  </section>
);

Worship.meta = {
  title: 'Worship',
  description: 'Service times and location for Community Church.',
};

export default Worship;
