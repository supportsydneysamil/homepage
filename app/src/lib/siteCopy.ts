import { parseLocalized, type LocalizedText } from './churchInfo';

export type CopyLink = {
  title: LocalizedText;
  description: LocalizedText;
  label: LocalizedText;
  href: string;
};

export type CopyValue = {
  title: LocalizedText;
  body: LocalizedText;
};

export type SiteCopy = {
  home: {
    hero: {
      kicker: LocalizedText;
      title: LocalizedText;
      lead: LocalizedText;
      ctaVisit: LocalizedText;
      ctaDirections: LocalizedText;
      photoAlt: LocalizedText;
      thisSunday: LocalizedText;
    };
    quick: {
      worship: LocalizedText;
      firstVisit: LocalizedText;
      firstVisitHint: LocalizedText;
      findUs: LocalizedText;
    };
    pillars: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      items: CopyValue[];
    };
    weekly: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      empty: LocalizedText;
      viewDetails: LocalizedText;
    };
    visit: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      serviceTimes: LocalizedText;
      whatToExpectLabel: LocalizedText;
      whatToExpect: LocalizedText;
      childrenLabel: LocalizedText;
      children: LocalizedText;
      addressLabel: LocalizedText;
      mapsCta: LocalizedText;
    };
    nextSteps: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      items: CopyLink[];
    };
    pastor: {
      kicker: LocalizedText;
      quote: LocalizedText;
      body: LocalizedText;
      contactCta: LocalizedText;
      photoAlt: LocalizedText;
    };
  };
  about: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    values: CopyValue[];
    quoteKicker: LocalizedText;
    quote: LocalizedText;
  };
  worship: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    directions: LocalizedText;
    askVisit: LocalizedText;
    timesKicker: LocalizedText;
    timesTitle: LocalizedText;
    timesIntro: LocalizedText;
    locationTitle: LocalizedText;
  };
  contact: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    detailsKicker: LocalizedText;
    note: LocalizedText;
  };
  footer: {
    tagline: LocalizedText;
    findUs: LocalizedText;
    contact: LocalizedText;
    explore: LocalizedText;
    about: LocalizedText;
    worship: LocalizedText;
    sermons: LocalizedText;
    meetUs: LocalizedText;
  };
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const textAt = (row: Record<string, unknown> | null, key: string, fallback: LocalizedText) =>
  parseLocalized(row?.[key], fallback);

const stringAt = (row: Record<string, unknown> | null, key: string, fallback: string) => {
  const value = row?.[key];
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 200) : fallback;
};

const parseValues = (input: unknown, fallback: CopyValue[]): CopyValue[] => {
  if (!Array.isArray(input)) return fallback;
  return fallback.map((item, index) => {
    const row = asRecord(input[index]);
    return {
      title: parseLocalized(row?.title, item.title),
      body: parseLocalized(row?.body ?? row?.description, item.body),
    };
  });
};

const parseLinks = (input: unknown, fallback: CopyLink[]): CopyLink[] => {
  if (!Array.isArray(input)) return fallback;
  return fallback.map((item, index) => {
    const row = asRecord(input[index]);
    return {
      title: parseLocalized(row?.title, item.title),
      description: parseLocalized(row?.description, item.description),
      label: parseLocalized(row?.label, item.label),
      href: stringAt(row, 'href', item.href),
    };
  });
};

export const DEFAULT_SITE_COPY: SiteCopy = {
  home: {
    hero: {
      kicker: { ko: 'Sydney · Community · Faith', en: 'Sydney · Community · Faith' },
      title: { ko: '처음 오셔도,\n편안한 교회', en: 'A place to belong,\na faith to live' },
      lead: {
        ko: '함께 예배하고, 삶을 나누며, 믿음 안에서 자라는 시드니 삼일교회입니다.',
        en: 'Sydney Samil Church is a community where we worship, share life, and grow in faith together.',
      },
      ctaVisit: { ko: '방문 안내 보기', en: 'Plan your visit' },
      ctaDirections: { ko: '오시는 길', en: 'Get directions' },
      photoAlt: {
        ko: '푸른 하늘과 잔디가 보이는 시드니 삼일교회 외관',
        en: 'Sydney Samil Church building beneath a blue sky',
      },
      thisSunday: { ko: '이번 주일', en: 'This Sunday' },
    },
    quick: {
      worship: { ko: '주일 예배', en: 'Sunday worship' },
      firstVisit: { ko: '처음 방문', en: 'First time here' },
      firstVisitHint: { ko: '미리 알아두면 좋은 안내', en: 'Everything you need to know' },
      findUs: { ko: '오시는 길', en: 'Find us' },
    },
    pillars: {
      kicker: { ko: '우리가 꿈꾸는 교회', en: 'The church we hope to be' },
      title: { ko: '믿음이 삶이 되는 공동체', en: 'A community where faith becomes life' },
      intro: {
        ko: '주일의 예배가 평일의 삶으로 이어지고, 모든 세대가 함께 자라기를 소망합니다.',
        en: 'We long for Sunday worship to shape everyday life and for every generation to grow together.',
      },
      items: [
        {
          title: { ko: '삶이 이어지는 예배', en: 'Worship for real life' },
          body: {
            ko: '말씀과 찬양을 통해 일상의 자리에서 살아갈 믿음을 함께 세웁니다.',
            en: 'Through Scripture and worship, we build a faith that carries into everyday life.',
          },
        },
        {
          title: { ko: '가족 같은 공동체', en: 'Community like family' },
          body: {
            ko: '가정교회 목장 안에서 서로의 삶을 나누고 함께 성장합니다.',
            en: 'In home-church communities, we share life and grow together.',
          },
        },
        {
          title: { ko: '다음 세대를 위한 믿음', en: 'Faith for the next generation' },
          body: {
            ko: '자녀들이 복음 안에서 건강하게 자라도록 가정과 교회가 함께합니다.',
            en: 'Church and families partner so children can flourish in the gospel.',
          },
        },
      ],
    },
    weekly: {
      kicker: { ko: '이번 주 삼일', en: 'This week at Samil' },
      title: { ko: '이번 주, 함께해요', en: 'Come be part of this week' },
      intro: {
        ko: '지금 필요한 소식만 간결하게 모았습니다.',
        en: 'A simple view of what is happening in our community.',
      },
      empty: {
        ko: '새로운 주간 소식을 준비하고 있습니다.',
        en: 'Fresh weekly updates are on the way.',
      },
      viewDetails: { ko: '자세히 보기', en: 'View details' },
    },
    visit: {
      kicker: { ko: '처음 방문 안내', en: 'Your first Sunday' },
      title: { ko: '부담 없이 오세요', en: 'Come just as you are' },
      intro: {
        ko: '처음 방문하는 마음을 알기에, 꼭 필요한 정보만 미리 알려드립니다.',
        en: 'We know a first visit can feel unfamiliar, so here is everything you need before you arrive.',
      },
      serviceTimes: { ko: '예배 시간', en: 'Service times' },
      whatToExpectLabel: { ko: '예배 분위기', en: 'What to expect' },
      whatToExpect: {
        ko: '약 75–90분, 편안한 복장, 찬양과 말씀 중심',
        en: '75–90 minutes, relaxed dress, worship and a Bible-centred message',
      },
      childrenLabel: { ko: '어린이와 언어', en: 'Children and language' },
      children: {
        ko: '9시 30분 어린이 예배 · 한국어 중심, 영어 안내 가능',
        en: 'Kids worship at 9:30 · Korean service with English welcome support',
      },
      addressLabel: { ko: '주소', en: 'Address' },
      mapsCta: { ko: 'Google Maps로 길찾기', en: 'Open in Google Maps' },
    },
    nextSteps: {
      kicker: { ko: '다음 걸음', en: 'Your next step' },
      title: { ko: '어디서부터 시작할까요?', en: 'Where would you like to begin?' },
      intro: {
        ko: '궁금한 점이나 도움이 필요한 부분을 알려주세요. 편안하게 연결해 드리겠습니다.',
        en: 'Tell us what you need or what you are curious about. We would love to help you connect.',
      },
      items: [
        {
          title: { ko: '처음 방문하시나요?', en: 'Planning your first visit?' },
          description: {
            ko: '예배와 주차, 어린이 안내를 편하게 물어보세요.',
            en: 'Ask us anything about services, parking, or children’s ministry.',
          },
          label: { ko: '방문 문의', en: 'Plan a visit' },
          href: '/contact?topic=visit',
        },
        {
          title: { ko: '목장과 연결되고 싶나요?', en: 'Looking for community?' },
          description: {
            ko: '삶을 나누며 함께 성장할 수 있는 공동체를 안내해 드립니다.',
            en: 'We will help you find a community where you can share life and grow.',
          },
          label: { ko: '연결 요청', en: 'Get connected' },
          href: '/contact?topic=community',
        },
        {
          title: { ko: '함께 기도할까요?', en: 'Can we pray with you?' },
          description: {
            ko: '마음에 품고 있는 기도 제목을 안전하게 나눠 주세요.',
            en: 'Share what is on your heart and let our church pray with you.',
          },
          label: { ko: '기도 요청', en: 'Request prayer' },
          href: '/contact?topic=prayer',
        },
      ],
    },
    pastor: {
      kicker: { ko: '담임목사 소개', en: 'Meet our pastor' },
      quote: {
        ko: '모든 성도가 삶의 자리에서 사역자로 서고, 다음 세대가 아름다운 믿음을 이어가도록 함께 걷겠습니다.',
        en: 'We want every believer to serve where they live and the next generation to inherit a living, beautiful faith.',
      },
      body: {
        ko: '가정교회 목장 사역을 통해 영혼을 구원하고 제자를 세우며, 가정과 시드니 지역사회를 섬기고 있습니다.',
        en: 'Through home-church ministry, we make disciples, strengthen families, and serve the wider Sydney community.',
      },
      contactCta: { ko: '교회에 문의하기', en: 'Contact the church' },
      photoAlt: { ko: '기도하는 안상헌 담임목사', en: 'Lead Pastor Sangheon Ahn praying' },
    },
  },
  about: {
    eyebrow: { ko: '우리는 누구인가', en: 'Who we are' },
    title: { ko: '함께 믿고, 함께 자라는 교회', en: 'A church growing in faith, together' },
    description: {
      ko: '예배와 가정교회, 다음 세대를 세우는 일로 시드니를 섬기는 공동체입니다.',
      en: 'We serve Sydney through worship, home-church community, and faith for the next generation.',
    },
    values: [
      {
        title: { ko: '우리의 이야기', en: 'Our story' },
        body: {
          ko: '작은 모임에서 시작해 예수님을 함께 따르는 다세대 공동체로 성장했습니다.',
          en: 'We began as a small gathering and grew into a multi-generational community following Jesus together.',
        },
      },
      {
        title: { ko: '우리의 비전', en: 'Our vision' },
        body: {
          ko: '그리스도를 중심으로 시드니와 열방에 복음의 소망을 비추는 공동체를 꿈꿉니다.',
          en: 'We envision a Christ-centred community shining gospel hope across Sydney and beyond.',
        },
      },
      {
        title: { ko: '우리의 사명', en: 'Our mission' },
        body: {
          ko: '영혼을 구원하고 제자를 세우며, 진실한 관계 속에서 복음을 일상으로 살아냅니다.',
          en: 'We make disciples, nurture authentic relationships, and live the gospel in everyday life.',
        },
      },
    ],
    quoteKicker: { ko: '우리의 고백', en: 'Our heartbeat' },
    quote: {
      ko: '주일의 예배가 평일의 삶으로 이어지고, 모든 성도가 삶의 자리에서 사역자로 서기를 소망합니다.',
      en: 'We long for Sunday worship to shape everyday life and for every believer to serve where they live.',
    },
  },
  worship: {
    eyebrow: { ko: '예배 안내', en: 'Worship with us' },
    title: { ko: '이번 주일, 함께 예배해요', en: 'There is a place for you this Sunday' },
    description: {
      ko: '말씀과 찬양 안에서 하나님을 만나고, 따뜻한 공동체와 새로운 한 주를 시작하세요.',
      en: 'Encounter God through Scripture and worship, and begin a new week with a welcoming community.',
    },
    directions: { ko: '길찾기', en: 'Get directions' },
    askVisit: { ko: '방문 문의', en: 'Ask about your visit' },
    timesKicker: { ko: '주일 예배', en: 'Sunday gatherings' },
    timesTitle: { ko: '두 번의 예배, 하나의 공동체', en: 'Two services, one community' },
    timesIntro: { ko: '편안한 복장으로 부담 없이 오세요.', en: 'Come as you are. You will be warmly welcomed.' },
    locationTitle: { ko: '오시는 곳', en: 'Where we meet' },
  },
  contact: {
    eyebrow: { ko: '연락하기', en: 'Start a conversation' },
    title: { ko: '무엇이든 편하게 물어보세요', en: 'We would love to hear from you' },
    description: {
      ko: '첫 방문, 목장 연결, 기도 요청까지 필요한 내용을 남겨주시면 정성껏 답변드리겠습니다.',
      en: 'Whether you are planning a visit, looking for community, or requesting prayer, we are here to help.',
    },
    detailsKicker: { ko: '직접 연락하기', en: 'Contact details' },
    note: {
      ko: '남겨주신 내용을 확인한 뒤 연락드리겠습니다.',
      en: 'We will review your message and get back to you.',
    },
  },
  footer: {
    tagline: { ko: '믿음이 삶이 되는 공동체', en: 'A community where faith becomes life' },
    findUs: { ko: '찾아오시는 길', en: 'Find us' },
    contact: { ko: '연락처', en: 'Contact' },
    explore: { ko: '둘러보기', en: 'Explore' },
    about: { ko: '교회 소개', en: 'About' },
    worship: { ko: '예배 안내', en: 'Worship' },
    sermons: { ko: '설교', en: 'Sermons' },
    meetUs: { ko: '이번 주일에 만나요', en: 'Meet us this Sunday' },
  },
};

const parseHero = (input: unknown, fallback: SiteCopy['home']['hero']) => {
  const row = asRecord(input);
  return {
    kicker: textAt(row, 'kicker', fallback.kicker),
    title: textAt(row, 'title', fallback.title),
    lead: textAt(row, 'lead', fallback.lead),
    ctaVisit: textAt(row, 'ctaVisit', fallback.ctaVisit),
    ctaDirections: textAt(row, 'ctaDirections', fallback.ctaDirections),
    photoAlt: textAt(row, 'photoAlt', fallback.photoAlt),
    thisSunday: textAt(row, 'thisSunday', fallback.thisSunday),
  };
};

export const parseSiteCopy = (input: unknown): SiteCopy => {
  const row = asRecord(input);
  if (!row) return DEFAULT_SITE_COPY;
  const home = asRecord(row.home);
  const about = asRecord(row.about);
  const worship = asRecord(row.worship);
  const contact = asRecord(row.contact);
  const footer = asRecord(row.footer);
  const homePillars = asRecord(home?.pillars);
  const homeWeekly = asRecord(home?.weekly);
  const homeVisit = asRecord(home?.visit);
  const homeNext = asRecord(home?.nextSteps);
  const homeQuick = asRecord(home?.quick);
  const homePastor = asRecord(home?.pastor);

  return {
    home: {
      hero: parseHero(home?.hero, DEFAULT_SITE_COPY.home.hero),
      quick: {
        worship: textAt(homeQuick, 'worship', DEFAULT_SITE_COPY.home.quick.worship),
        firstVisit: textAt(homeQuick, 'firstVisit', DEFAULT_SITE_COPY.home.quick.firstVisit),
        firstVisitHint: textAt(homeQuick, 'firstVisitHint', DEFAULT_SITE_COPY.home.quick.firstVisitHint),
        findUs: textAt(homeQuick, 'findUs', DEFAULT_SITE_COPY.home.quick.findUs),
      },
      pillars: {
        kicker: textAt(homePillars, 'kicker', DEFAULT_SITE_COPY.home.pillars.kicker),
        title: textAt(homePillars, 'title', DEFAULT_SITE_COPY.home.pillars.title),
        intro: textAt(homePillars, 'intro', DEFAULT_SITE_COPY.home.pillars.intro),
        items: parseValues(homePillars?.items, DEFAULT_SITE_COPY.home.pillars.items),
      },
      weekly: {
        kicker: textAt(homeWeekly, 'kicker', DEFAULT_SITE_COPY.home.weekly.kicker),
        title: textAt(homeWeekly, 'title', DEFAULT_SITE_COPY.home.weekly.title),
        intro: textAt(homeWeekly, 'intro', DEFAULT_SITE_COPY.home.weekly.intro),
        empty: textAt(homeWeekly, 'empty', DEFAULT_SITE_COPY.home.weekly.empty),
        viewDetails: textAt(homeWeekly, 'viewDetails', DEFAULT_SITE_COPY.home.weekly.viewDetails),
      },
      visit: {
        kicker: textAt(homeVisit, 'kicker', DEFAULT_SITE_COPY.home.visit.kicker),
        title: textAt(homeVisit, 'title', DEFAULT_SITE_COPY.home.visit.title),
        intro: textAt(homeVisit, 'intro', DEFAULT_SITE_COPY.home.visit.intro),
        serviceTimes: textAt(homeVisit, 'serviceTimes', DEFAULT_SITE_COPY.home.visit.serviceTimes),
        whatToExpectLabel: textAt(homeVisit, 'whatToExpectLabel', DEFAULT_SITE_COPY.home.visit.whatToExpectLabel),
        whatToExpect: textAt(homeVisit, 'whatToExpect', DEFAULT_SITE_COPY.home.visit.whatToExpect),
        childrenLabel: textAt(homeVisit, 'childrenLabel', DEFAULT_SITE_COPY.home.visit.childrenLabel),
        children: textAt(homeVisit, 'children', DEFAULT_SITE_COPY.home.visit.children),
        addressLabel: textAt(homeVisit, 'addressLabel', DEFAULT_SITE_COPY.home.visit.addressLabel),
        mapsCta: textAt(homeVisit, 'mapsCta', DEFAULT_SITE_COPY.home.visit.mapsCta),
      },
      nextSteps: {
        kicker: textAt(homeNext, 'kicker', DEFAULT_SITE_COPY.home.nextSteps.kicker),
        title: textAt(homeNext, 'title', DEFAULT_SITE_COPY.home.nextSteps.title),
        intro: textAt(homeNext, 'intro', DEFAULT_SITE_COPY.home.nextSteps.intro),
        items: parseLinks(homeNext?.items, DEFAULT_SITE_COPY.home.nextSteps.items),
      },
      pastor: {
        kicker: textAt(homePastor, 'kicker', DEFAULT_SITE_COPY.home.pastor.kicker),
        quote: textAt(homePastor, 'quote', DEFAULT_SITE_COPY.home.pastor.quote),
        body: textAt(homePastor, 'body', DEFAULT_SITE_COPY.home.pastor.body),
        contactCta: textAt(homePastor, 'contactCta', DEFAULT_SITE_COPY.home.pastor.contactCta),
        photoAlt: textAt(homePastor, 'photoAlt', DEFAULT_SITE_COPY.home.pastor.photoAlt),
      },
    },
    about: {
      eyebrow: textAt(about, 'eyebrow', DEFAULT_SITE_COPY.about.eyebrow),
      title: textAt(about, 'title', DEFAULT_SITE_COPY.about.title),
      description: textAt(about, 'description', DEFAULT_SITE_COPY.about.description),
      values: parseValues(about?.values, DEFAULT_SITE_COPY.about.values),
      quoteKicker: textAt(about, 'quoteKicker', DEFAULT_SITE_COPY.about.quoteKicker),
      quote: textAt(about, 'quote', DEFAULT_SITE_COPY.about.quote),
    },
    worship: {
      eyebrow: textAt(worship, 'eyebrow', DEFAULT_SITE_COPY.worship.eyebrow),
      title: textAt(worship, 'title', DEFAULT_SITE_COPY.worship.title),
      description: textAt(worship, 'description', DEFAULT_SITE_COPY.worship.description),
      directions: textAt(worship, 'directions', DEFAULT_SITE_COPY.worship.directions),
      askVisit: textAt(worship, 'askVisit', DEFAULT_SITE_COPY.worship.askVisit),
      timesKicker: textAt(worship, 'timesKicker', DEFAULT_SITE_COPY.worship.timesKicker),
      timesTitle: textAt(worship, 'timesTitle', DEFAULT_SITE_COPY.worship.timesTitle),
      timesIntro: textAt(worship, 'timesIntro', DEFAULT_SITE_COPY.worship.timesIntro),
      locationTitle: textAt(worship, 'locationTitle', DEFAULT_SITE_COPY.worship.locationTitle),
    },
    contact: {
      eyebrow: textAt(contact, 'eyebrow', DEFAULT_SITE_COPY.contact.eyebrow),
      title: textAt(contact, 'title', DEFAULT_SITE_COPY.contact.title),
      description: textAt(contact, 'description', DEFAULT_SITE_COPY.contact.description),
      detailsKicker: textAt(contact, 'detailsKicker', DEFAULT_SITE_COPY.contact.detailsKicker),
      note: textAt(contact, 'note', DEFAULT_SITE_COPY.contact.note),
    },
    footer: {
      tagline: textAt(footer, 'tagline', DEFAULT_SITE_COPY.footer.tagline),
      findUs: textAt(footer, 'findUs', DEFAULT_SITE_COPY.footer.findUs),
      contact: textAt(footer, 'contact', DEFAULT_SITE_COPY.footer.contact),
      explore: textAt(footer, 'explore', DEFAULT_SITE_COPY.footer.explore),
      about: textAt(footer, 'about', DEFAULT_SITE_COPY.footer.about),
      worship: textAt(footer, 'worship', DEFAULT_SITE_COPY.footer.worship),
      sermons: textAt(footer, 'sermons', DEFAULT_SITE_COPY.footer.sermons),
      meetUs: textAt(footer, 'meetUs', DEFAULT_SITE_COPY.footer.meetUs),
    },
  };
};

export const localize = (text: LocalizedText, lang: 'ko' | 'en') => text[lang];
