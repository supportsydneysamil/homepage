import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import ChurchPillars from '../components/home/ChurchPillars';
import HomeHero from '../components/home/HomeHero';
import NextSteps from '../components/home/NextSteps';
import PastorFeature from '../components/home/PastorFeature';
import QuickInfo from '../components/home/QuickInfo';
import VisitOverview from '../components/home/VisitOverview';
import WeeklyHighlights from '../components/home/WeeklyHighlights';
import OpenApplications from '../components/home/OpenApplications';
import WelcomeBand from '../components/home/WelcomeBand';
import type { WeeklyItem } from '../components/home/homeContent';
import { fetchApplications, fetchEvents, fetchResources, fetchSermons, type ApiApplication } from '../lib/contentApi';
import { todayStamp } from '../lib/events';
import { useLanguage } from '../lib/LanguageContext';
import { HOME_DESCRIPTION, type PageMeta } from '../lib/pageMeta';
import { churchJsonLd, serializeJsonLd } from '../lib/structuredData';
import { useSiteSettings } from '../lib/ThemeContext';
import { homeDataRequests } from '../lib/sectionAvailability';
import {
  filterWeeklyItemsByAvailability,
  weeklyItemsFromContent,
} from '../lib/weeklyHighlights';

const Home: NextPage & { meta?: PageMeta } = () => {
  const { lang } = useLanguage();
  const { churchInfo, logoImageUrl, sectionAvailability, isLoading } = useSiteSettings();
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const requests = homeDataRequests(sectionAvailability, isLoading);

  useEffect(() => {
    let cancelled = false;
    setItems((current) => filterWeeklyItemsByAvailability(current, sectionAvailability));
    if (!requests.applications) setApplications([]);
    if (!requests.events && !requests.sermons && !requests.resources && !requests.applications) {
      return () => {
        cancelled = true;
      };
    }
    const load = async () => {
      const [events, sermons, resources, forms] = await Promise.all([
        requests.events ? fetchEvents().catch(() => []) : [],
        requests.sermons ? fetchSermons().catch(() => []) : [],
        requests.resources ? fetchResources().catch(() => []) : [],
        requests.applications ? fetchApplications().catch(() => []) : [],
      ]);
      if (!cancelled) {
        setItems(weeklyItemsFromContent({ events, sermons, resources, today: todayStamp() }));
        setApplications(forms);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [requests.applications, requests.events, requests.resources, requests.sermons]);

  return (
    <div className="home-page">
      <Head>
        <script
          key="church-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(churchJsonLd(churchInfo, logoImageUrl)) }}
        />
      </Head>
      <HomeHero lang={lang} />
      <QuickInfo lang={lang} />
      <VisitOverview lang={lang} />
      <WelcomeBand lang={lang} />
      <WeeklyHighlights items={items} lang={lang} />
      <OpenApplications items={applications} lang={lang} />
      <ChurchPillars lang={lang} />
      <NextSteps lang={lang} />
      <PastorFeature lang={lang} />
    </div>
  );
};

Home.meta = {
  description: HOME_DESCRIPTION,
};

export default Home;
