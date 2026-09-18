import Head from 'next/head';
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import ScrollActivity from './ScrollActivity';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ children, title, description }: LayoutProps) => {
  const pageTitle =
    !title || title === 'Sydney Samil Church'
      ? 'Sydney Samil Church'
      : `${title} | Sydney Samil Church`;
  const pageDescription =
    description || 'Worship, community, and faith for everyday life in Sydney.';
  const { themeId } = useTheme();
  const { lang } = useLanguage();

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <div className={`layout theme-${themeId}`} lang={lang}>
        <ScrollActivity />
        <Header />
        <main className="content">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
