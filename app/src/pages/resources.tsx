import type { GetStaticProps, NextPage } from 'next';
import resourcesData from '../content/resources.json';
import { useLanguage } from '../lib/LanguageContext';

type Resource = {
  title: string;
  url: string;
};

type ResourcesPageProps = {
  resources: Resource[];
};

const Resources: NextPage<ResourcesPageProps> & { meta?: { title?: string; description?: string } } = ({ resources }) => {
  const { lang } = useLanguage();
  const isKo = lang === 'ko';

  return (
    <section className="section">
      <div className="section__header">
        <p className="pill">{isKo ? '이번 주 자료' : 'Tools for your week'}</p>
        <h1>{isKo ? '자료실' : 'Resources'}</h1>
        <p className="muted">
          {isKo ? '가이드, 주보, 유용한 링크를 다운로드하세요.' : 'Download guides, bulletins, and helpful links.'}
        </p>
      </div>
      <ul className="link-list">
        {resources.map((resource) => (
          <li key={resource.url} className="card card--inline">
            <a href={resource.url} target="_blank" rel="noreferrer" className="link">
              {resource.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

Resources.meta = {
  title: 'Resources',
  description: 'Helpful resources and downloads.',
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  return {
    props: {
      resources: resourcesData,
    },
  };
};

export default Resources;
