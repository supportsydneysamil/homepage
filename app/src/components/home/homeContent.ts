export type Language = 'ko' | 'en';

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
