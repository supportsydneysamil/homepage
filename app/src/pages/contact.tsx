import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useRef, useState } from 'react';
import PageHero from '../components/PageHero';
import { useLanguage } from '../lib/LanguageContext';
import { useSiteSettings } from '../lib/ThemeContext';
import { phoneHref } from '../lib/churchInfo';
import { parseContactTopic, type ContactTopic, type PrayerShare } from '../lib/contact';
import { fetchMokjang } from '../lib/contentApi';
import { contactPrefill, mokjangName, parseMokjangSlug } from '../lib/mokjang';
import type { PageMeta } from '../lib/pageMeta';
import { localize } from '../lib/siteCopy';
import { socialLinkList } from '../lib/social';

const CONTACT_ENDPOINT = '/api/contact';

const TOPIC_OPTIONS: { id: ContactTopic; ko: string; en: string }[] = [
  { id: 'general', ko: '일반 문의', en: 'General question' },
  { id: 'community', ko: '목장 연결', en: 'Find a community' },
  { id: 'prayer', ko: '기도 요청', en: 'Prayer request' },
];

const SHARE_OPTIONS: { id: PrayerShare; ko: string; en: string }[] = [
  { id: 'staff', ko: '교역자만 보기', en: 'Pastoral staff only' },
  { id: 'team', ko: '중보기도팀과 함께 기도해도 괜찮아요', en: 'OK to share with the prayer team' },
];

const Contact: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  const { churchInfo, siteCopy } = useSiteSettings();
  const copy = siteCopy.contact;
  const socialLinks = socialLinkList(churchInfo.social);
  const messengers = (['kakao', 'instagram'] as const).flatMap((id) =>
    socialLinks.filter((link) => link.id === id)
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [topic, setTopic] = useState<ContactTopic>('general');
  const [share, setShare] = useState<PrayerShare>('staff');
  // Remounting the fields clears typed values while the topic stays in state and the status region stays mounted.
  const [formKey, setFormKey] = useState(0);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const mokjangSlug = router.isReady ? parseMokjangSlug(router.query.mokjang) : '';

  // Only an empty box is filled, so a visitor's own words are never replaced.
  useEffect(() => {
    if (!mokjangSlug) return undefined;
    let live = true;
    fetchMokjang({ slug: mokjangSlug })
      .then((mokjang) => {
        const box = messageRef.current;
        if (!live || !mokjang || !box || box.value) return;
        box.value = contactPrefill(mokjangName(mokjang, lang), lang);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [mokjangSlug, lang]);

  useEffect(() => {
    if (router.isReady) setTopic(parseContactTopic(router.query.topic));
  }, [router.isReady, router.query.topic]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitting');
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (formData.get('name') || '').toString(),
          email: (formData.get('email') || '').toString(),
          phone: (formData.get('phone') || '').toString(),
          message: (formData.get('message') || '').toString(),
          topic,
          share: topic === 'prayer' ? share : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setStatus('success');
      setFormKey((key) => key + 1);
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
          {messengers.length ? (
            <div>
              <span>{isKo ? '메시지로 문의' : 'Message us'}</span>
              {messengers.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
                  {isKo ? link.label.ko : link.label.en}
                </a>
              ))}
            </div>
          ) : null}
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
          <div key={formKey} className="contact-form__fields">
            <fieldset>
              <legend>{isKo ? '문의 종류' : 'What is this about?'}</legend>
              <div className="contact-choices">
                {TOPIC_OPTIONS.map((option) => (
                  <label className="contact-choice" key={option.id}>
                    <input
                      type="radio"
                      name="topic"
                      value={option.id}
                      checked={topic === option.id}
                      onChange={() => setTopic(option.id)}
                    />
                    {isKo ? option.ko : option.en}
                  </label>
                ))}
              </div>
            </fieldset>
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
            {topic === 'prayer' ? (
              <fieldset>
                <legend>{isKo ? '공유 범위' : 'Who may see this?'}</legend>
                <div className="contact-choices">
                  {SHARE_OPTIONS.map((option) => (
                    <label className="contact-choice" key={option.id}>
                      <input
                        type="radio"
                        name="share"
                        value={option.id}
                        checked={share === option.id}
                        onChange={() => setShare(option.id)}
                      />
                      {isKo ? option.ko : option.en}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <label>
              <span>
                {topic === 'prayer' ? (isKo ? '기도 제목' : 'Prayer request') : isKo ? '메시지' : 'Message'}
              </span>
              <textarea
                ref={messageRef}
                name="message"
                rows={6}
                required
                aria-describedby={topic === 'community' ? 'contact-message-hint' : undefined}
              />
            </label>
            {topic === 'community' ? (
              <small id="contact-message-hint" className="contact-form__hint">
                {isKo
                  ? '사는 지역, 연령대, 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요.'
                  : 'Tell us your area, age group, and which days suit you, and we will suggest a community.'}
              </small>
            ) : null}
          </div>
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
  title: { ko: '문의', en: 'Contact' },
  description: {
    ko: '첫 방문, 목장 연결, 기도 요청까지 시드니 삼일교회에 편하게 문의하세요.',
    en: 'Contact Sydney Samil Church, plan a visit, or request prayer.',
  },
};

export default Contact;
