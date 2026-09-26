import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
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
import { weeklyItemsFromContent } from '../lib/weeklyHighlights';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [applications, setApplications] = useState<ApiApplication[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [events, sermons, resources, forms] = await Promise.all([
        fetchEvents().catch(() => []),
        fetchSermons().catch(() => []),
        fetchResources().catch(() => []),
        fetchApplications().catch(() => []),
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
  }, []);

  return (
    <div className="home-page">
      <HomeHero lang={lang} />
      <QuickInfo lang={lang} />
      <ChurchPillars lang={lang} />
      <WeeklyHighlights items={items} lang={lang} />
      <OpenApplications items={applications} lang={lang} />
      <VisitOverview lang={lang} />
      <WelcomeBand lang={lang} />
      <NextSteps lang={lang} />
      <PastorFeature lang={lang} />
    </div>
  );
};

Home.meta = {
  title: 'Sydney Samil Church',
  description:
    'Worship, community, and faith for everyday life at Sydney Samil Church.',
};

export default Home;
