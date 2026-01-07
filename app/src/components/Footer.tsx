const Footer = () => (
  <footer className="footer">
    <div>
      <p className="muted">Community Church</p>
      <p className="muted">&copy; {new Date().getFullYear()} All rights reserved.</p>
    </div>
    <div className="footer__cta">
      <p className="muted">We would love to meet you this weekend.</p>
      <a className="button ghost" href="/contact">
        Plan a Visit
      </a>
    </div>
  </footer>
);

export default Footer;
