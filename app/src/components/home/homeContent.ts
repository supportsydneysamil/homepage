export type Language = 'ko' | 'en';

export type LocalizedText = {
  en: string;
  ko: string;
};

export type WeeklyItem = {
  id: string;
  type: 'event' | 'sermon' | 'bulletin';
  titleEn: string;
  titleKo: string;
  summaryEn: string;
  summaryKo: string;
  date: string;
  url: string;
  expiresAt: string;
};

export type HomeLink = {
  title: LocalizedText;
  description: LocalizedText;
  href: string;
  label: LocalizedText;
};

export const localize = (text: LocalizedText, lang: Language) => text[lang];

export const getVisibleWeeklyItems = (items: WeeklyItem[], now: Date) => ({
  active: items
    .filter((item) => new Date(`${item.expiresAt}T23:59:59`).getTime() >= now.getTime())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3),
  past: items
    .filter((item) => new Date(`${item.expiresAt}T23:59:59`).getTime() < now.getTime())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3),
});

export const HOME_PILLARS: Array<{
  number: string;
  title: LocalizedText;
  description: LocalizedText;
}> = [
  {
    number: '01',
    title: { ko: '삶이 이어지는 예배', en: 'Worship for real life' },
    description: {
      ko: '말씀과 찬양을 통해 일상의 자리에서 살아갈 믿음을 함께 세웁니다.',
      en: 'Through Scripture and worship, we build a faith that carries into everyday life.',
    },
  },
  {
    number: '02',
    title: { ko: '가족 같은 공동체', en: 'Community like family' },
    description: {
      ko: '가정교회 목장 안에서 서로의 삶을 나누고 함께 성장합니다.',
      en: 'In home-church communities, we share life and grow together.',
    },
  },
  {
    number: '03',
    title: { ko: '다음 세대를 위한 믿음', en: 'Faith for the next generation' },
    description: {
      ko: '자녀들이 복음 안에서 건강하게 자라도록 가정과 교회가 함께합니다.',
      en: 'Church and families partner so children can flourish in the gospel.',
    },
  },
];

export const NEXT_STEPS: HomeLink[] = [
  {
    title: { ko: '처음 방문하시나요?', en: 'Planning your first visit?' },
    description: {
      ko: '예배와 주차, 어린이 안내를 편하게 물어보세요.',
      en: 'Ask us anything about services, parking, or children’s ministry.',
    },
    href: '/contact?topic=visit',
    label: { ko: '방문 문의', en: 'Plan a visit' },
  },
  {
    title: { ko: '목장과 연결되고 싶나요?', en: 'Looking for community?' },
    description: {
      ko: '삶을 나누며 함께 성장할 수 있는 공동체를 안내해 드립니다.',
      en: 'We will help you find a community where you can share life and grow.',
    },
    href: '/contact?topic=community',
    label: { ko: '연결 요청', en: 'Get connected' },
  },
  {
    title: { ko: '함께 기도할까요?', en: 'Can we pray with you?' },
    description: {
      ko: '마음에 품고 있는 기도 제목을 안전하게 나눠 주세요.',
      en: 'Share what is on your heart and let our church pray with you.',
    },
    href: '/contact?topic=prayer',
    label: { ko: '기도 요청', en: 'Request prayer' },
  },
];
