import type { NextPage } from 'next';
import { FormEvent, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

const CONTACT_ENDPOINT = '/api/contact';

const Contact: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: (formData.get('name') || '').toString(),
      email: (formData.get('email') || '').toString(),
      message: (formData.get('message') || '').toString(),
    };

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit');
      }

      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '문의하기' : 'Say hello'}</p>
        <h1>{isKo ? '연락 주세요' : 'Contact Us'}</h1>
        <p className="muted">
          {isKo ? '질문, 기도 요청, 방문 예약 모두 환영합니다.' : 'Ask a question, request prayer, or plan a visit. We’re listening.'}
        </p>
      </div>
      <form className="form card" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>{isKo ? '이름' : 'Name'}</span>
          <input type="text" name="name" placeholder={isKo ? '이름을 입력하세요' : 'Your name'} required />
        </label>
        <label className="form__field">
          <span>{isKo ? '이메일' : 'Email'}</span>
          <input type="email" name="email" placeholder="you@example.com" required />
        </label>
        <label className="form__field">
          <span>{isKo ? '메시지' : 'Message'}</span>
          <textarea name="message" rows={5} placeholder={isKo ? '어떻게 도와드릴까요?' : 'How can we help?'} required />
        </label>
        <button type="submit" className="button" disabled={status === 'submitting'}>
          {status === 'submitting' ? (isKo ? '보내는 중...' : 'Sending...') : isKo ? '보내기' : 'Send Message'}
        </button>
        {status === 'success' && (
          <p className="success-text">{isKo ? '메시지를 보냈습니다. 곧 연락드리겠습니다.' : 'Message sent. We will be in touch soon.'}</p>
        )}
        {status === 'error' && (
          <p className="error-text">{isKo ? '전송에 실패했습니다. 다시 시도해주세요.' : 'Something went wrong. Please try again.'}</p>
        )}
      </form>
    </section>
  );
};

Contact.meta = {
  title: 'Contact',
  description: 'Get in touch with Community Church.',
};

export default Contact;
