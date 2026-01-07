import type { NextPage } from 'next';
import { useLanguage } from '../lib/LanguageContext';

const Contact: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '문의하기' : 'Say hello'}</p>
        <h1>{isKo ? '연락 주세요' : 'Contact Us'}</h1>
        <p className="muted">
          {isKo ? '질문, 기도 요청, 방문 예약 모두 환영합니다.' : 'Ask a question, request prayer, or plan a visit. We’re listening.'}
        </p>
      </div>
      <form className="form card" onSubmit={(event) => event.preventDefault()}>
        <label className="form__field">
          <span>{isKo ? '이름' : 'Name'}</span>
          <input type="text" name="name" placeholder={isKo ? '이름을 입력하세요' : 'Your name'} required />
        </label>
        <label className="form__field">
          <span>{isKo ? '이메일' : 'Email'}</span>
          <input type="email" name="email" placeholder={isKo ? 'you@example.com' : 'you@example.com'} required />
        </label>
        <label className="form__field">
          <span>{isKo ? '메시지' : 'Message'}</span>
          <textarea name="message" rows={5} placeholder={isKo ? '어떻게 도와드릴까요?' : 'How can we help?'} required />
        </label>
        <button type="submit" className="button">{isKo ? '보내기' : 'Send Message'}</button>
      </form>
    </section>
  );
};

Contact.meta = {
  title: 'Contact',
  description: 'Get in touch with Community Church.',
};

export default Contact;
