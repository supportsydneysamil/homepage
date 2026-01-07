import type { GetStaticProps, NextPage } from 'next';
import resourcesData from '../content/resources.json';

type Resource = {
  title: string;
  url: string;
};

type ResourcesPageProps = {
  resources: Resource[];
};

const Resources: NextPage<ResourcesPageProps> & { meta?: { title?: string; description?: string } } = ({ resources }) => (
  <section className="section">
    <div className="section__header">
      <p className="pill">Tools for your week</p>
      <h1>Resources</h1>
      <p className="muted">Download guides, bulletins, and helpful links.</p>
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
