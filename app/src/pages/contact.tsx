import type { NextPage } from 'next';

const Contact: NextPage & { meta?: { title?: string; description?: string } } = () => (
  <section className="section">
    <div className="section__header">
      <p className="pill">Say hello</p>
      <h1>Contact Us</h1>
      <p className="muted">Ask a question, request prayer, or plan a visit. We&apos;re listening.</p>
    </div>
    <form className="form card" onSubmit={(event) => event.preventDefault()}>
      <label className="form__field">
        <span>Name</span>
        <input type="text" name="name" placeholder="Your name" required />
      </label>
      <label className="form__field">
        <span>Email</span>
        <input type="email" name="email" placeholder="you@example.com" required />
      </label>
      <label className="form__field">
        <span>Message</span>
        <textarea name="message" rows={5} placeholder="How can we help?" required />
      </label>
      <button type="submit" className="button">Send Message</button>
    </form>
  </section>
);

Contact.meta = {
  title: 'Contact',
  description: 'Get in touch with Community Church.',
};

export default Contact;
