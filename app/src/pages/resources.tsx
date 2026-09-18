import type { GetStaticProps, NextPage } from 'next';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import resourcesData from '../content/resources.json';
import { useLanguage } from '../lib/LanguageContext';
import { isPlaceholderUrl } from '../lib/presentation';

type Resource = { title: string; url: string };
type ResourcesPageProps = { resources: Resource[] };

const Resources: NextPage<ResourcesPageProps> & {
  meta?: { title?: string; description?: string };
} = ({ resources }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';
  const availableResources = resources.filter((resource) => !isPlaceholderUrl(resource.url));

  return (
    <article className="site-page resources-page">
      <PageHero
        eyebrow={isKo ? '이번 주 자료' : 'For your week'}
        title={isKo ? '필요한 자료를 한곳에서' : 'Helpful resources, all in one place'}
        description={
          isKo
            ? '주보와 신앙생활에 도움이 되는 자료를 편하게 확인하세요.'
            : 'Find weekly bulletins and practical resources to support your life of faith.'
        }
      />

      {availableResources.length ? (
        <ol className="resource-list">
          {availableResources.map((resource, index) => (
            <li key={resource.url}>
              <span>0{index + 1}</span>
              <strong>{resource.title}</strong>
              <a href={resource.url} target="_blank" rel="noreferrer">
                {isKo ? '자료 열기' : 'Open resource'} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title={isKo ? '자료를 정리하고 있습니다' : 'Resources are being prepared'}
          description={
            isKo
              ? '확인된 주보와 자료가 준비되는 대로 이곳에 추가하겠습니다.'
              : 'Verified bulletins and resources will appear here as soon as they are ready.'
          }
          href="/contact"
          linkLabel={isKo ? '자료 문의하기' : 'Ask about a resource'}
        />
      )}
    </article>
  );
};

Resources.meta = {
  title: 'Resources',
  description: 'Bulletins and helpful resources from Sydney Samil Church.',
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => ({
  props: { resources: resourcesData },
});

export default Resources;
