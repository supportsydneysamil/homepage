import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import '../styles/globals.css';

type PageWithMeta = AppProps['Component'] & {
  meta?: {
    title?: string;
    description?: string;
  };
};

function MyApp({ Component, pageProps }: AppProps) {
  const PageComponent = Component as PageWithMeta;
  const meta = PageComponent.meta || {};

  return (
    <Layout title={meta.title} description={meta.description}>
      <PageComponent {...pageProps} />
    </Layout>
  );
}

export default MyApp;
