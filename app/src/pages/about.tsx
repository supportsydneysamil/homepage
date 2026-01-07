import type { NextPage } from 'next';

const About: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section className="section">
    <div className="section__header">
      <p className="pill">Who we are</p>
      <h1>About Our Church</h1>
      <p className="muted">
        A multi-generational church with a heart for worship, discipleship, and serving Sydney.
      </p>
    </div>
    <div className="card-grid three-col">
      <div className="card">
        <div className="card__eyebrow">Our story</div>
        <p>
          We began as a small gathering and have grown into a vibrant family following Jesus
          together. Every week we welcome new friends into the story God is writing here.
        </p>
      </div>
      <div className="card">
        <div className="card__eyebrow">Vision</div>
        <p>To be a Christ-centered community that shines hope locally and globally.</p>
      </div>
      <div className="card">
        <div className="card__eyebrow">Mission</div>
        <p>To make disciples, cultivate authentic relationships, and live out the gospel daily.</p>
      </div>
    </div>
  </section>
);

About.meta = {
  title: 'About',
  description: 'Learn about our church vision and mission.',
};

export default About;
