import type { GetStaticProps, NextPage } from 'next';
import ChurchPillars from '../components/home/ChurchPillars';
import HomeHero from '../components/home/HomeHero';
import NextSteps from '../components/home/NextSteps';
import PastorFeature from '../components/home/PastorFeature';
import QuickInfo from '../components/home/QuickInfo';
import VisitOverview from '../components/home/VisitOverview';
import WeeklyHighlights from '../components/home/WeeklyHighlights';
import type { WeeklyItem } from '../components/home/homeContent';
import weeklyData from '../content/weekly.json';
import { useLanguage } from '../lib/LanguageContext';

type HomeProps = {
  generatedAt: string;
};

const Home: NextPage<HomeProps> & { meta?: { title?: string; description?: string } } = ({
  generatedAt,
}) => {
  const { lang } = useLanguage();
  const items = weeklyData.items as WeeklyItem[];

  return (
    <div className="home-page">
      <HomeHero lang={lang} />
      <QuickInfo lang={lang} />
      <ChurchPillars lang={lang} />
      <WeeklyHighlights items={items} lang={lang} now={new Date(generatedAt)} />
      <VisitOverview lang={lang} />
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

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: {
    generatedAt: new Date().toISOString(),
  },
});

export default Home;
