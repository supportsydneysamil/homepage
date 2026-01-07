import type { NextPage } from 'next';

const Worship: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section className="section">
    <div className="section__header">
      <p className="pill">Worship with us</p>
      <h1>Gather every week</h1>
      <p className="muted">Come early for coffee, stay to connect. Everyone is welcome.</p>
    </div>
    <div className="info-list">
      <div className="card">
        <div className="card__eyebrow">Sunday Services</div>
        <h3>9:00 AM | 11:00 AM</h3>
        <p className="muted">Kids ministry available at both gatherings.</p>
      </div>
      <div className="card">
        <div className="card__eyebrow">Midweek Prayer</div>
        <h3>Wednesdays 7:00 PM</h3>
        <p className="muted">Seek God together with worship and prayer.</p>
      </div>
      <div className="card">
        <div className="card__eyebrow">Location</div>
        <h3>123 Main Street, Your City, ST 00000</h3>
        <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="link">
          Open in Google Maps
        </a>
      </div>
    </div>
  </section>
);

Worship.meta = {
  title: 'Worship',
  description: 'Service times and location for Community Church.',
};

export default Worship;
