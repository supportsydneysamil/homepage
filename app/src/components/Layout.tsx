import Head from 'next/head';
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollActivity from './ScrollActivity';
import { useLanguage } from '../lib/LanguageContext';
import {
  SHARE_IMAGE,
  SITE_NAME,
  documentTitle,
  openGraphLocales,
  pageDescription,
  type PageMeta,
} from '../lib/pageMeta';
import { useTheme } from '../lib/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  meta?: PageMeta;
}

const Layout = ({ children, meta }: LayoutProps) => {
  const { activeThemeId } = useTheme();
  const { lang } = useLanguage();
  const title = documentTitle(meta?.title, lang);
  const description = pageDescription(meta?.description, lang);
  const locales = openGraphLocales(lang);

  return (
    <>
      <Head>
        <title key="title">{title}</title>
        <meta key="description" name="description" content={description} />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:site_name" property="og:site_name" content={`${SITE_NAME.ko} ${SITE_NAME.en}`} />
        <meta key="og:title" property="og:title" content={title} />
        <meta key="og:description" property="og:description" content={description} />
        <meta key="og:image" property="og:image" content={SHARE_IMAGE.url} />
        <meta key="og:image:width" property="og:image:width" content={String(SHARE_IMAGE.width)} />
        <meta key="og:image:height" property="og:image:height" content={String(SHARE_IMAGE.height)} />
        <meta key="og:image:alt" property="og:image:alt" content={SHARE_IMAGE.alt[lang]} />
        <meta key="og:locale" property="og:locale" content={locales.locale} />
        <meta key="og:locale:alternate" property="og:locale:alternate" content={locales.alternate} />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      </Head>
      <div className={`layout theme-${activeThemeId}`} lang={lang}>
        <ScrollActivity />
        <Header />
        <main className="content">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
