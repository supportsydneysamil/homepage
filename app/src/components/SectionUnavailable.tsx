import Head from 'next/head';
import EmptyState from './EmptyState';
import { useLanguage } from '../lib/LanguageContext';

const SectionUnavailable = () => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <article className="site-page">
      <Head>
        <meta key="robots" name="robots" content="noindex,nofollow" />
      </Head>
      <EmptyState
        title={isKo ? '현재 이용할 수 없는 페이지입니다' : 'This page is currently unavailable'}
        description={
          isKo
            ? '이 페이지는 지금 공개되어 있지 않습니다. 홈에서 다른 소식을 확인해 주세요.'
            : 'This page is not public right now. Visit Home to explore other updates.'
        }
        href="/"
        linkLabel={isKo ? '홈으로' : 'Go Home'}
      />
    </article>
  );
};

export default SectionUnavailable;
