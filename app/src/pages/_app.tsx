import type { AppProps } from 'next/app';
import Layout from '../components/Layout';
import { LanguageProvider } from '../lib/LanguageContext';
import type { PageMeta } from '../lib/pageMeta';
import { ThemeProvider } from '../lib/ThemeContext';
import '../styles/globals.css';

type PageWithMeta = AppProps['Component'] & {
  meta?: PageMeta;
};

function MyApp({ Component, pageProps }: AppProps) {
  const PageComponent = Component as PageWithMeta;

  return (
    <LanguageProvider>
      <ThemeProvider>
        <Layout meta={PageComponent.meta}>
          <PageComponent {...pageProps} />
        </Layout>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default MyApp;
