import { parseLocalized, type LocalizedText } from './churchInfo';
import { isMicrosoftFormUrl } from './applications';

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

export type CopyStep = {
  time: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
};

export type CopyQuestion = {
  question: LocalizedText;
  answer: LocalizedText;
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
      sermons: LocalizedText;
      sermonsHint: LocalizedText;
      events: LocalizedText;
      eventsHint: LocalizedText;
      resources: LocalizedText;
      resourcesHint: LocalizedText;
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
    applications: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      applyLabel: LocalizedText;
      viewAll: LocalizedText;
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
    welcome: {
      enabled: boolean;
      formUrl: string;
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      buttonLabel: LocalizedText;
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
  mokjang: {
    hero: {
      kicker: LocalizedText;
      title: LocalizedText;
      lead: LocalizedText;
      ctaConnect: LocalizedText;
      ctaBrowse: LocalizedText;
    };
    evening: {
      kicker: LocalizedText;
      title: LocalizedText;
      steps: CopyStep[];
    };
    welcome: {
      kicker: LocalizedText;
      title: LocalizedText;
      body: LocalizedText;
    };
    list: {
      kicker: LocalizedText;
      title: LocalizedText;
      intro: LocalizedText;
      empty: LocalizedText;
    };
    faq: {
      kicker: LocalizedText;
      items: CopyQuestion[];
    };
    study: {
      kicker: LocalizedText;
      title: LocalizedText;
      items: CopyValue[];
    };
    cta: {
      kicker: LocalizedText;
      title: LocalizedText;
      body: LocalizedText;
      button: LocalizedText;
    };
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
    mokjang: LocalizedText;
    sermons: LocalizedText;
    meetUs: LocalizedText;
  };
};

export type WelcomeCopy = SiteCopy['home']['welcome'];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const textAt = (row: Record<string, unknown> | null, key: string, fallback: LocalizedText) =>
  parseLocalized(row?.[key], fallback);

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
  const rows = input.map(asRecord);
  return fallback.map((item) => {
    const row = rows.find((candidate) => candidate?.href === item.href) ?? null;
    return {
      title: parseLocalized(row?.title, item.title),
      description: parseLocalized(row?.description, item.description),
      label: parseLocalized(row?.label, item.label),
      href: item.href,
    };
  });
};

// Unlike parseLocalized, an empty saved string stays empty so an editor can
// clear an optional item to hide it.
const parseOptionalLocalized = (value: unknown, fallback: LocalizedText): LocalizedText => {
  const row = asRecord(value);
  if (!row) return fallback;
  const keep = (input: unknown, base: string) => (typeof input === 'string' ? input.trim().slice(0, 400) : base);
  return { ko: keep(row.ko, fallback.ko), en: keep(row.en, fallback.en) };
};

const parseSteps = (input: unknown, fallback: CopyStep[]): CopyStep[] => {
  const rows = Array.isArray(input) ? input : [];
  return fallback.map((item, index) => {
    const row = asRecord(rows[index]);
    return {
      time: textAt(row, 'time', item.time),
      title: textAt(row, 'title', item.title),
      body: textAt(row, 'body', item.body),
    };
  });
};

const parseQuestions = (input: unknown, fallback: CopyQuestion[]): CopyQuestion[] => {
  const rows = Array.isArray(input) ? input : [];
  return fallback.map((item, index) => {
    const row = asRecord(rows[index]);
    return {
      question: parseOptionalLocalized(row?.question, item.question),
      answer: parseOptionalLocalized(row?.answer, item.answer),
    };
  });
};

const parseOptionalValues = (input: unknown, fallback: CopyValue[]): CopyValue[] => {
  const rows = Array.isArray(input) ? input : [];
  return fallback.map((item, index) => {
    const row = asRecord(rows[index]);
    return {
      title: parseOptionalLocalized(row?.title, item.title),
      body: parseOptionalLocalized(row?.body, item.body),
    };
  });
};

const parseMokjangCopy = (input: unknown, fallback: SiteCopy['mokjang']): SiteCopy['mokjang'] => {
  const row = asRecord(input);
  const hero = asRecord(row?.hero);
  const evening = asRecord(row?.evening);
  const welcome = asRecord(row?.welcome);
  const list = asRecord(row?.list);
  const faq = asRecord(row?.faq);
  const study = asRecord(row?.study);
  const cta = asRecord(row?.cta);
  return {
    hero: {
      kicker: textAt(hero, 'kicker', fallback.hero.kicker),
      title: textAt(hero, 'title', fallback.hero.title),
      lead: textAt(hero, 'lead', fallback.hero.lead),
      ctaConnect: textAt(hero, 'ctaConnect', fallback.hero.ctaConnect),
      ctaBrowse: textAt(hero, 'ctaBrowse', fallback.hero.ctaBrowse),
    },
    evening: {
      kicker: textAt(evening, 'kicker', fallback.evening.kicker),
      title: textAt(evening, 'title', fallback.evening.title),
      steps: parseSteps(evening?.steps, fallback.evening.steps),
    },
    welcome: {
      kicker: textAt(welcome, 'kicker', fallback.welcome.kicker),
      title: textAt(welcome, 'title', fallback.welcome.title),
      body: textAt(welcome, 'body', fallback.welcome.body),
    },
    list: {
      kicker: textAt(list, 'kicker', fallback.list.kicker),
      title: textAt(list, 'title', fallback.list.title),
      intro: textAt(list, 'intro', fallback.list.intro),
      empty: textAt(list, 'empty', fallback.list.empty),
    },
    faq: {
      kicker: textAt(faq, 'kicker', fallback.faq.kicker),
      items: parseQuestions(faq?.items, fallback.faq.items),
    },
    study: {
      kicker: textAt(study, 'kicker', fallback.study.kicker),
      title: textAt(study, 'title', fallback.study.title),
      items: parseOptionalValues(study?.items, fallback.study.items),
    },
    cta: {
      kicker: textAt(cta, 'kicker', fallback.cta.kicker),
      title: textAt(cta, 'title', fallback.cta.title),
      body: textAt(cta, 'body', fallback.cta.body),
      button: textAt(cta, 'button', fallback.cta.button),
    },
  };
};

export const visibleQuestions = (items: CopyQuestion[]) => items.filter((item) => item.question.ko.trim());

export const visibleStudies = (items: CopyValue[]) => items.filter((item) => item.title.ko.trim());

export const DEFAULT_SITE_COPY: SiteCopy = {
  home: {
    hero: {
      kicker: { ko: 'Sydney · Community · Faith', en: 'Sydney · Community · Faith' },
      title: { ko: '처음 오셔도,\n편안한 교회', en: 'A place to belong,\na faith to live' },
      lead: {
        ko: '함께 예배하고, 삶을 나누며, 믿음 안에서 자라는 시드니 삼일교회입니다.',
        en: 'Sydney Samil Church is a community where we worship, share life, and grow in faith together.',
      },
      ctaVisit: { ko: '처음 방문 안내', en: 'Plan your first visit' },
      ctaDirections: { ko: '오시는 길', en: 'Get directions' },
      photoAlt: {
        ko: '푸른 하늘과 잔디가 보이는 시드니 삼일교회 외관',
        en: 'Sydney Samil Church building beneath a blue sky',
      },
      thisSunday: { ko: '이번 주일', en: 'This Sunday' },
    },
    quick: {
      sermons: { ko: '설교 다시 듣기', en: 'Sermons' },
      sermonsHint: { ko: '지난 주일 말씀', en: 'Catch up on Sunday' },
      events: { ko: '행사와 소식', en: 'Events and news' },
      eventsHint: { ko: '이번 달 일정', en: 'What is on this month' },
      resources: { ko: '자료 · 신청', en: 'Resources and forms' },
      resourcesHint: { ko: '주보와 신청서', en: 'Bulletins and sign-ups' },
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
    applications: {
      kicker: { ko: '지금 신청', en: 'Open now' },
      title: { ko: '접수가 열린 신청', en: 'Applications open now' },
      intro: {
        ko: '아래에서 바로 작성하거나, 다른 신청도 함께 살펴보세요.',
        en: 'Start one of these forms, or browse every open application.',
      },
      applyLabel: { ko: '신청하기', en: 'Apply' },
      viewAll: { ko: '모든 신청 보기', en: 'See all applications' },
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
    welcome: {
      enabled: false,
      formUrl: '',
      kicker: { ko: '새가족', en: 'New here' },
      title: { ko: '새가족으로 연결해 드릴게요', en: 'Let us help you get connected' },
      intro: {
        ko: '이름과 연락처만 남겨 주시면 담당자가 목장과 교회 생활을 편하게 안내해 드립니다. 나머지는 알려 주셔도 좋고, 넘어가셔도 괜찮습니다.',
        en: 'Leave your name and a way to reach you, and we will help you find your place in church life. Everything else is optional.',
      },
      buttonLabel: { ko: '새가족 등록하기', en: 'Register' },
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
          title: { ko: '목장과 연결되고 싶나요?', en: 'Looking for community?' },
          description: {
            ko: '목장이 어떤 곳인지 살펴보고, 가까운 목장을 찾아보세요.',
            en: 'See what a house church is like and find one near you.',
          },
          label: { ko: '목장 알아보기', en: 'Explore house churches' },
          href: '/mokjang',
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
        {
          title: { ko: '궁금한 점이 있나요?', en: 'Have a question?' },
          description: {
            ko: '예배와 주차, 어린이, 신앙에 대해 무엇이든 편하게 물어보세요.',
            en: 'Ask us anything about services, parking, children, or faith.',
          },
          label: { ko: '교회에 문의', en: 'Contact us' },
          href: '/contact',
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
  mokjang: {
    hero: {
      kicker: { ko: 'House Church · 목장', en: 'House Church' },
      title: { ko: '한 주에 한 번,\n집에서 만나는 작은 교회', en: 'A small church\nthat meets at home' },
      lead: {
        ko: '6~12명이 가정에 모여 밥을 먹고, 한 주의 삶을 나누고, 서로를 위해 기도합니다. 시드니 삼일교회는 목장으로 이루어진 가정교회입니다.',
        en: 'Each week, six to twelve people gather in a home to share a meal, talk about their week, and pray for one another. Sydney Samil Church is a house church made up of these gatherings.',
      },
      ctaConnect: { ko: '목장 연결 요청', en: 'Ask to join a house church' },
      ctaBrowse: { ko: '목장 둘러보기', en: 'Browse house churches' },
    },
    evening: {
      kicker: { ko: '목장의 한 저녁', en: 'An evening together' },
      title: { ko: '이렇게 모여요', en: 'What a gathering looks like' },
      steps: [
        {
          time: { ko: '7:00', en: '7:00' },
          title: { ko: '함께 식사', en: 'Dinner together' },
          body: { ko: '돌아가며 준비하는 집밥', en: 'A home-cooked meal, with hosts taking turns' },
        },
        {
          time: { ko: '8:00', en: '8:00' },
          title: { ko: '삶 나눔', en: 'Sharing life' },
          body: {
            ko: '한 주 동안 감사했던 일과 힘들었던 일',
            en: 'What we were thankful for and what was hard this week',
          },
        },
        {
          time: { ko: '8:40', en: '8:40' },
          title: { ko: '짧은 말씀', en: 'A short Bible time' },
          body: { ko: '주일 설교를 함께 되새기기', en: 'Reflecting on Sunday’s message together' },
        },
        {
          time: { ko: '9:00', en: '9:00' },
          title: { ko: '서로를 위한 기도', en: 'Praying for each other' },
          body: { ko: '기도 제목을 나누고 함께 기도', en: 'Sharing prayer requests and praying together' },
        },
      ],
    },
    welcome: {
      kicker: { ko: '누구나 환영해요', en: 'Everyone is welcome' },
      title: {
        ko: '아직 신앙이 없어도, 교회가 처음이어도 괜찮아요.',
        en: 'You do not need to have faith figured out, or to have been to church before.',
      },
      body: {
        ko: '목장은 평가받지 않고 있는 모습 그대로 환영받는 밥상 공동체입니다. 아직 예수님을 모르는 분도 많이 함께하고 계세요.',
        en: 'A house church is a table where you are welcomed as you are, without judgement. Many people who are still exploring faith are part of one.',
      },
    },
    list: {
      kicker: { ko: '우리 목장들', en: 'Our house churches' },
      title: { ko: '가까운 목장을 둘러보세요', en: 'Find one near you' },
      intro: {
        ko: '목장을 누르면 모임 시간, 대상, 사용 언어를 자세히 볼 수 있어요.',
        en: 'Select a house church to see when it meets, who it is for, and its language.',
      },
      empty: {
        ko: '목장 소개를 준비하고 있어요. 연결 요청을 남겨 주시면 안내해 드릴게요.',
        en: 'House church profiles are on the way. Leave a request and we will connect you.',
      },
    },
    faq: {
      kicker: { ko: '자주 묻는 질문', en: 'Common questions' },
      items: [
        {
          question: { ko: '음식을 가져가야 하나요?', en: 'Do I need to bring food?' },
          answer: {
            ko: '처음에는 빈손으로 오셔도 됩니다. 식사는 목장 식구들이 돌아가며 준비해요.',
            en: 'Not on your first visit. Members take turns preparing the meal.',
          },
        },
        {
          question: { ko: '아이와 함께 가도 되나요?', en: 'Can I bring my children?' },
          answer: {
            ko: '네. 아이와 함께 오기 좋은 목장은 목장 정보에 표시해 두었어요.',
            en: 'Yes. House churches that suit families with children are marked in their details.',
          },
        },
        {
          question: { ko: '믿지 않는데 가도 될까요?', en: 'Can I come if I am not a Christian?' },
          answer: {
            ko: '물론입니다. 신앙을 알아 가는 중인 분들도 함께하고, 아무것도 강요하지 않아요.',
            en: 'Of course. People who are still exploring faith are part of our house churches, and nothing is forced on anyone.',
          },
        },
        {
          question: { ko: '목장은 어떻게 정해지나요?', en: 'How is a house church chosen for me?' },
          answer: {
            ko: '연결 요청을 남겨 주시면 사는 지역과 편한 요일, 가족 상황을 듣고 맞는 목장을 안내해 드려요. 몇 번 참석해 보고 정하셔도 괜찮아요.',
            en: 'Leave a request and we will ask about your area, the days that suit you, and your family, then suggest one. You are welcome to visit a few times before deciding.',
          },
        },
        {
          question: { ko: '꼭 매주 가야 하나요?', en: 'Do I have to go every week?' },
          answer: {
            ko: '목장은 매주 모이지만, 형편에 맞게 오시면 됩니다.',
            en: 'House churches meet weekly, but come as your schedule allows.',
          },
        },
      ],
    },
    study: {
      kicker: { ko: '삶공부', en: 'Life classes' },
      title: { ko: '목장과 함께 배우는 삶공부', en: 'Growing through life classes' },
      items: [
        {
          title: { ko: '생명의 삶', en: 'Life Bible study' },
          body: {
            ko: '주일 오후 2:30 · 신앙의 기초를 배우는 첫 과정',
            en: 'Sunday 2:30 PM · The first course on the foundations of faith',
          },
        },
        {
          title: { ko: '그 밖의 삶공부', en: 'More life classes' },
          body: {
            ko: '학기마다 열려요. 일정은 행사와 소식에서 안내합니다.',
            en: 'New classes open each term. Watch Events for dates.',
          },
        },
      ],
    },
    cta: {
      kicker: { ko: '연결 요청', en: 'Get connected' },
      title: { ko: '어느 목장이 맞을지 모르겠다면', en: 'Not sure which one fits?' },
      body: {
        ko: '사는 지역과 편한 요일을 알려 주시면 맞는 목장을 안내해 드려요.',
        en: 'Tell us your area and which days suit you, and we will suggest a house church.',
      },
      button: { ko: '연결 요청 남기기', en: 'Ask to be connected' },
    },
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
    mokjang: { ko: '목장', en: 'House Church' },
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

export const isWelcomeFormUrl = (value: string) => value.length <= 500 && isMicrosoftFormUrl(value);

const parseWelcome = (input: unknown, fallback: WelcomeCopy): WelcomeCopy => {
  const row = asRecord(input);
  const formUrl = typeof row?.formUrl === 'string' ? row.formUrl.trim() : '';
  return {
    enabled: row?.enabled === true,
    formUrl: isWelcomeFormUrl(formUrl) ? formUrl : '',
    kicker: textAt(row, 'kicker', fallback.kicker),
    title: textAt(row, 'title', fallback.title),
    intro: textAt(row, 'intro', fallback.intro),
    buttonLabel: textAt(row, 'buttonLabel', fallback.buttonLabel),
  };
};

export const welcomeFormUrl = (welcome: WelcomeCopy) => {
  const formUrl = welcome.formUrl.trim();
  return welcome.enabled && isWelcomeFormUrl(formUrl) ? formUrl : null;
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
  const homeApplications = asRecord(home?.applications);
  const homeVisit = asRecord(home?.visit);
  const homeNext = asRecord(home?.nextSteps);
  const homeQuick = asRecord(home?.quick);
  const homePastor = asRecord(home?.pastor);

  return {
    home: {
      hero: parseHero(home?.hero, DEFAULT_SITE_COPY.home.hero),
      quick: {
        sermons: textAt(homeQuick, 'sermons', DEFAULT_SITE_COPY.home.quick.sermons),
        sermonsHint: textAt(homeQuick, 'sermonsHint', DEFAULT_SITE_COPY.home.quick.sermonsHint),
        events: textAt(homeQuick, 'events', DEFAULT_SITE_COPY.home.quick.events),
        eventsHint: textAt(homeQuick, 'eventsHint', DEFAULT_SITE_COPY.home.quick.eventsHint),
        resources: textAt(homeQuick, 'resources', DEFAULT_SITE_COPY.home.quick.resources),
        resourcesHint: textAt(homeQuick, 'resourcesHint', DEFAULT_SITE_COPY.home.quick.resourcesHint),
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
      applications: {
        kicker: textAt(homeApplications, 'kicker', DEFAULT_SITE_COPY.home.applications.kicker),
        title: textAt(homeApplications, 'title', DEFAULT_SITE_COPY.home.applications.title),
        intro: textAt(homeApplications, 'intro', DEFAULT_SITE_COPY.home.applications.intro),
        applyLabel: textAt(homeApplications, 'applyLabel', DEFAULT_SITE_COPY.home.applications.applyLabel),
        viewAll: textAt(homeApplications, 'viewAll', DEFAULT_SITE_COPY.home.applications.viewAll),
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
      welcome: parseWelcome(home?.welcome, DEFAULT_SITE_COPY.home.welcome),
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
    mokjang: parseMokjangCopy(row.mokjang, DEFAULT_SITE_COPY.mokjang),
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
      mokjang: textAt(footer, 'mokjang', DEFAULT_SITE_COPY.footer.mokjang),
      sermons: textAt(footer, 'sermons', DEFAULT_SITE_COPY.footer.sermons),
      meetUs: textAt(footer, 'meetUs', DEFAULT_SITE_COPY.footer.meetUs),
    },
  };
};

export const localize = (text: LocalizedText, lang: 'ko' | 'en') => text[lang];

export const localizeOr = (text: LocalizedText, lang: 'ko' | 'en') => text[lang].trim() || text.ko;
