import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import EmptyState from '../../components/EmptyState';
import EventGallery from '../../components/EventGallery';
import MokjangCover from '../../components/MokjangCover';
import { fetchMokjangs, useContent, type ApiMokjang } from '../../lib/contentApi';
import { useLanguage } from '../../lib/LanguageContext';
import {
  MOKJANG_PAGE_META,
  audienceLabel,
  detailMeeting,
  languageLabel,
  mokjangContactHref,
  mokjangName,
  parseMokjangSlug,
  pickText,
} from '../../lib/mokjang';
import { documentTitle, type PageMeta } from '../../lib/pageMeta';
import { isPublicHrefEnabled } from '../../lib/sectionAvailability';
import { useSiteSettings } from '../../lib/ThemeContext';

const LIST_HREF = '/mokjang#mokjang-list';

const MokjangDetailPage: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const router = useRouter();
  const { sectionAvailability } = useSiteSettings();
  const slug = parseMokjangSlug(router.query.slug);
  const { items, isLoading } = useContent<ApiMokjang>(() => fetchMokjangs({ slug }), Boolean(slug));
  const mokjang = items.find((item) => item.published);

  if (!router.isReady || isLoading) {
    return <p className="account-state">{isKo ? '불러오는 중...' : 'Loading...'}</p>;
  }

  if (!slug || !mokjang) {
    return (
      <article className="site-page mokjang-detail-page">
        <EmptyState
          title={isKo ? '목장을 찾을 수 없습니다' : 'This house church is not available'}
          description={
            isKo
              ? '주소가 바뀌었거나 아직 공개되지 않은 목장일 수 있습니다.'
              : 'The link may be out of date, or the house church is not published yet.'
          }
          href={LIST_HREF}
          linkLabel={isKo ? '목장 목록으로' : 'Back to house churches'}
        />
      </article>
    );
  }

  const name = mokjangName(mokjang, lang);
  const tagline = pickText(mokjang.taglineKo, mokjang.taglineEn, lang);
  const mission = pickText(mokjang.missionKo, mokjang.missionEn, lang);
  const story = pickText(mokjang.storyKo, mokjang.storyEn, lang);
  const gallery = mokjang.images.slice(1);
  const contactHref = mokjangContactHref(mokjang.slug);
  const contactEnabled = isPublicHrefEnabled(contactHref, sectionAvailability);
  const leaders = [
    mokjang.shepherdName ? `${isKo ? '목자' : 'Shepherd'} ${mokjang.shepherdName}` : '',
    mokjang.partnerName ? `${isKo ? '목녀·목부' : 'Co-shepherd'} ${mokjang.partnerName}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="site-page mokjang-detail-page">
      <Head>
        <title key="title">{documentTitle({ ko: mokjang.nameKo, en: name }, lang)}</title>
        <meta
          key="description"
          name="description"
          content={tagline || MOKJANG_PAGE_META.description?.[lang] || ''}
        />
      </Head>

      <Link href={LIST_HREF} className="site-text-link mokjang-detail__back">
        ← {isKo ? '목장 목록' : 'All house churches'}
      </Link>

      <MokjangCover src={mokjang.coverImage} name={name} className="mokjang-detail__cover" />

      <header className="mokjang-detail__header">
        <p className="site-kicker">{isKo ? '목장' : 'House church'}</p>
        <h1>{name}</h1>
        {tagline ? <p>{tagline}</p> : null}
      </header>

      <dl className="mokjang-detail__info">
        <div>
          <dt>{isKo ? '모임' : 'Meets'}</dt>
          <dd>{detailMeeting(mokjang, lang)}</dd>
        </div>
        <div>
          <dt>{isKo ? '대상' : 'For'}</dt>
          <dd>{audienceLabel(mokjang.audience, lang)}</dd>
        </div>
        <div>
          <dt>{isKo ? '언어' : 'Language'}</dt>
          <dd>{languageLabel(mokjang.language, lang)}</dd>
        </div>
        {mokjang.kidsWelcome ? (
          <div>
            <dt>{isKo ? '아이 동반' : 'Children'}</dt>
            <dd>{isKo ? '가능해요' : 'Welcome'}</dd>
          </div>
        ) : null}
        {mission ? (
          <div>
            <dt>{isKo ? '후원 선교지' : 'Mission partner'}</dt>
            <dd>{mission}</dd>
          </div>
        ) : null}
      </dl>

      {leaders ? (
        <p className="mokjang-detail__members">
          <small>{isKo ? '교인에게만 보여요' : 'Visible to members only'}</small>
          {leaders}
        </p>
      ) : null}

      {story ? (
        <section className="mokjang-detail__story">
          <h2>{isKo ? '목장 이야기' : 'Our story'}</h2>
          <p>{story}</p>
        </section>
      ) : null}

      {gallery.length ? (
        <EventGallery
          images={gallery}
          alt={name}
          closeLabel={isKo ? '닫기' : 'Close'}
          previousLabel={isKo ? '이전 사진' : 'Previous photo'}
          nextLabel={isKo ? '다음 사진' : 'Next photo'}
        />
      ) : null}

      <div className="mokjang-detail__cta">
        <p>{isKo ? '이 목장이 궁금하신가요?' : 'Curious about this house church?'}</p>
        {contactEnabled ? (
          <Link className="site-button site-button--primary" href={contactHref}>
            {isKo ? '이 목장 문의' : 'Ask about this house church'} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
};

MokjangDetailPage.meta = MOKJANG_PAGE_META;

export default MokjangDetailPage;
