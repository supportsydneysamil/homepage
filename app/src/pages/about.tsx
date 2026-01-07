import type { NextPage } from 'next';

const About: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section>
    <h1>About Our Church</h1>
    <p>
      We are a welcoming community seeking to love God and serve our neighbors. Our church has a
      long history of gathering people across generations to worship, learn, and care for one
      another.
    </p>
    <h2>Vision</h2>
    <p>To be a Christ-centered community that shines hope locally and globally.</p>
    <h2>Mission</h2>
    <p>To make disciples, cultivate authentic relationships, and live out the gospel daily.</p>
  </section>
);

About.meta = {
  title: 'About',
  description: 'Learn about our church vision and mission.',
};

export default About;
