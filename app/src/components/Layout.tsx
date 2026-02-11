import Head from 'next/head';
import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../lib/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ children, title, description }: LayoutProps) => {
  const pageTitle = title ? `${title} | Community Church` : 'Community Church';
  const pageDescription = description || 'Welcome to our church community website.';
  const { themeId } = useTheme();

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Head>
      <div className={`layout theme-${themeId}`}>
        <Header />
        <main className="content">{children}</main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
