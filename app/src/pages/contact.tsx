import type { NextPage } from 'next';
import { FormEvent, useState } from 'react';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { phoneHref } from '../lib/churchInfo';
import { localize } from '../lib/siteCopy';

const CONTACT_ENDPOINT = '/api/contact';

const Contact: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const { churchInfo, siteCopy } = useSiteSettings();
  const copy = siteCopy.contact;
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (formData.get('name') || '').toString(),
          email: (formData.get('email') || '').toString(),
          phone: (formData.get('phone') || '').toString(),
          message: (formData.get('message') || '').toString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <article className="site-page contact-page">
      <PageHero
        eyebrow={localize(copy.eyebrow, lang)}
        title={localize(copy.title, lang)}
        description={localize(copy.description, lang)}
      />

      <section className="contact-layout">
        <aside className="contact-intro">
          <p className="site-kicker">{localize(copy.detailsKicker, lang)}</p>
          <div>
            <span>{isKo ? '전화' : 'Phone'}</span>
            <a href={phoneHref(churchInfo.phone)}>{churchInfo.phone}</a>
          </div>
          <div>
            <span>{isKo ? '이메일' : 'Email'}</span>
            <a href={`mailto:${churchInfo.email}`}>{churchInfo.email}</a>
          </div>
          <div>
            <span>{isKo ? '주소' : 'Address'}</span>
            <p>
              {churchInfo.addressLine1}
              <br />
              {churchInfo.addressLine2}
            </p>
          </div>
          <p className="contact-intro__note">{localize(copy.note, lang)}</p>
        </aside>

        <form className="site-form contact-form" onSubmit={handleSubmit}>
          <label>
            <span>{isKo ? '이름' : 'Name'}</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label>
            <span>{isKo ? '이메일' : 'Email'}</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            <span>{isKo ? '연락처 (선택)' : 'Phone (optional)'}</span>
            <input type="tel" name="phone" autoComplete="tel" />
          </label>
          <label>
            <span>{isKo ? '메시지' : 'Message'}</span>
            <textarea name="message" rows={6} required />
          </label>
          <button className="site-button site-button--primary" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? (isKo ? '보내는 중…' : 'Sending…') : (isKo ? '메시지 보내기' : 'Send message')}
            <span aria-hidden="true">→</span>
          </button>
          <div className="form-status" aria-live="polite">
            {status === 'success' ? (
              <p className="success-text">{isKo ? '메시지를 보냈습니다. 곧 연락드리겠습니다.' : 'Message sent. We will be in touch soon.'}</p>
            ) : null}
            {status === 'error' ? (
              <p className="error-text" role="alert">{isKo ? '전송에 실패했습니다. 다시 시도해 주세요.' : 'Something went wrong. Please try again.'}</p>
            ) : null}
          </div>
        </form>
      </section>
    </article>
  );
};

Contact.meta = {
  title: 'Contact',
  description: 'Contact Sydney Samil Church, plan a visit, or request prayer.',
};

export default Contact;
