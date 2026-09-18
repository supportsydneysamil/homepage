import type { NextPage } from 'next';
import ChurchPillars from '../components/home/ChurchPillars';
import HomeHero from '../components/home/HomeHero';
import PastorFeature from '../components/home/PastorFeature';
import QuickInfo from '../components/home/QuickInfo';
import VisitOverview from '../components/home/VisitOverview';
import WeeklyHighlights from '../components/home/WeeklyHighlights';
import type { WeeklyItem } from '../components/home/homeContent';
import weeklyData from '../content/weekly.json';
import { useLanguage } from '../lib/LanguageContext';

const Home: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const { lang } = useLanguage();
  const items = weeklyData.items as WeeklyItem[];

  return (
    <div className="home-page">
      <HomeHero lang={lang} />
      <QuickInfo lang={lang} />
      <ChurchPillars lang={lang} />
      <WeeklyHighlights items={items} lang={lang} />
      <VisitOverview lang={lang} />
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
