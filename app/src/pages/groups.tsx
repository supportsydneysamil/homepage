import type { NextPage } from 'next';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { getLoginUrl, useSwaAuth } from '../lib/swaAuth';

type GroupPerson = {
  nameEn: string;
  nameKo: string;
  roleEn: string;
  roleKo: string;
};

type GroupAnnouncement = {
  date: string;
  titleEn: string;
  titleKo: string;
  descriptionEn: string;
  descriptionKo: string;
};

type GroupResource = {
  titleEn: string;
  titleKo: string;
  url: string;
};

type GroupPhoto = {
  src: string;
  altEn: string;
  altKo: string;
};

type Group = {
  slug: string;
  nameEn: string;
  nameKo: string;
  introEn: string;
  introKo: string;
  leaders: GroupPerson[];
  members: string[];
  announcements: GroupAnnouncement[];
  resources: GroupResource[];
  photos: GroupPhoto[];
};

type UploadedPhoto = {
  name: string;
  url: string;
};

type UploadedResource = {
  name: string;
  size: number;
  url: string;
};

const GROUPS: Group[] = [
  {
    slug: 'worship-team',
    nameEn: 'Worship Team',
    nameKo: '워십팀',
    introEn:
      'The Worship Team leads Sunday gatherings with prayerful preparation and contemporary praise, helping the church respond to God together.',
    introKo:
      '워십팀은 기도와 준비로 주일 예배를 섬기며, 현대적인 찬양과 예배 인도로 공동체가 함께 하나님께 반응하도록 돕습니다.',
    leaders: [
      { nameEn: 'Daniel Kim', nameKo: '김다니엘', roleEn: 'Worship Director', roleKo: '워십 디렉터' },
      { nameEn: 'Grace Lee', nameKo: '이은혜', roleEn: 'Vocal Lead', roleKo: '보컬 리드' },
    ],
    members: ['Guitar', 'Keys', 'Drums', 'Bass', 'Vocal Team'],
    announcements: [
      {
        date: '2026-02-22',
        titleEn: 'Monthly rehearsal',
        titleKo: '월간 리허설',
        descriptionEn: 'Full-team rehearsal after 2nd service in the main hall.',
        descriptionKo: '2부 예배 후 본당에서 전체 팀 리허설이 진행됩니다.',
      },
      {
        date: '2026-03-01',
        titleEn: 'New members orientation',
        titleKo: '신규 팀원 오리엔테이션',
        descriptionEn: 'Orientation for new volunteers joining vocals and instruments.',
        descriptionKo: '보컬/악기 사역 신규 팀원을 위한 오리엔테이션입니다.',
      },
    ],
    resources: [
      { titleEn: 'Weekly setlist (PDF)', titleKo: '주간 셋리스트 (PDF)', url: 'https://example.com/worship-setlist.pdf' },
      { titleEn: 'Chord chart pack', titleKo: '코드 차트 모음', url: 'https://example.com/worship-chords.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Worship team playing instruments',
        altKo: '악기로 예배를 섬기는 워십팀',
      },
      {
        src: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Church band rehearsal',
        altKo: '교회 밴드 리허설 모습',
      },
    ],
  },
  {
    slug: 'media-team',
    nameEn: 'Media Team',
    nameKo: '미디어팀',
    introEn:
      'The Media Team supports worship and events through livestream, projection, and content design so everyone can engage clearly onsite and online.',
    introKo:
      '미디어팀은 라이브스트림, 자막/프로젝션, 콘텐츠 디자인으로 예배와 행사를 섬기며 현장과 온라인 모두가 명확하게 참여하도록 돕습니다.',
    leaders: [
      { nameEn: 'Samuel Park', nameKo: '박사무엘', roleEn: 'Media Lead', roleKo: '미디어 리드' },
      { nameEn: 'Eunji Choi', nameKo: '최은지', roleEn: 'Livestream Coordinator', roleKo: '라이브스트림 코디네이터' },
    ],
    members: ['Camera Operators', 'Switcher Team', 'Subtitle Team', 'Design Volunteers'],
    announcements: [
      {
        date: '2026-02-16',
        titleEn: 'Sunday camera schedule',
        titleKo: '주일 카메라 스케줄',
        descriptionEn: 'March rotation sheet has been uploaded to resources.',
        descriptionKo: '3월 로테이션 스케줄이 자료실에 업로드되었습니다.',
      },
    ],
    resources: [
      { titleEn: 'Projection template (PPTX)', titleKo: '예배 자막 템플릿 (PPTX)', url: 'https://example.com/media-template.pptx' },
      { titleEn: 'Livestream checklist', titleKo: '라이브스트림 체크리스트', url: 'https://example.com/livestream-checklist.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Camera setup for church service',
        altKo: '예배 촬영 카메라 세팅',
      },
      {
        src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Team planning media workflow',
        altKo: '미디어 워크플로를 회의하는 팀',
      },
    ],
  },
  {
    slug: 'youth',
    nameEn: 'Youth',
    nameKo: '청소년부',
    introEn:
      'Youth ministry helps students grow in identity, faith, and friendships through worship nights, mentoring, and practical discipleship.',
    introKo:
      '청소년부는 예배와 멘토링, 실제적인 제자훈련을 통해 다음 세대가 정체성과 믿음, 관계 안에서 건강하게 자라도록 돕습니다.',
    leaders: [
      { nameEn: 'Hannah Jeon', nameKo: '전한나', roleEn: 'Youth Pastor', roleKo: '청소년 담당 사역자' },
      { nameEn: 'Joshua Lim', nameKo: '임여호수아', roleEn: 'Mentor Lead', roleKo: '멘토링 리드' },
    ],
    members: ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'],
    announcements: [
      {
        date: '2026-03-08',
        titleEn: 'Youth prayer night',
        titleKo: '청소년 기도회',
        descriptionEn: 'Friday 7:30 PM in the youth room. Friends welcome.',
        descriptionKo: '금요일 오후 7:30, 유스룸에서 진행됩니다. 친구 초대 환영.',
      },
    ],
    resources: [
      { titleEn: 'Youth curriculum (Term 1)', titleKo: '청소년부 교재 (1학기)', url: 'https://example.com/youth-curriculum.pdf' },
      { titleEn: 'Parent update letter', titleKo: '학부모 안내문', url: 'https://example.com/youth-parent-letter.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Youth small group discussion',
        altKo: '청소년 소그룹 나눔',
      },
      {
        src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Youth community gathering',
        altKo: '청소년 공동체 모임',
      },
    ],
  },
  {
    slug: 'young-adults',
    nameEn: 'Young Adults',
    nameKo: '청년부',
    introEn:
      'Young Adults gathers university students and young professionals to grow spiritually, build healthy community, and serve the city together.',
    introKo:
      '청년부는 대학생과 청년 직장인이 함께 모여 영적으로 성장하고 건강한 공동체를 세우며 도시를 섬기도록 돕습니다.',
    leaders: [
      { nameEn: 'Peter Kwon', nameKo: '권베드로', roleEn: 'Young Adults Leader', roleKo: '청년부 리더' },
      { nameEn: 'Esther Moon', nameKo: '문에스더', roleEn: 'Community Lead', roleKo: '공동체 리드' },
    ],
    members: ['College Students', 'Young Professionals', 'Newcomers Team'],
    announcements: [
      {
        date: '2026-02-28',
        titleEn: 'City outreach day',
        titleKo: '도시 아웃리치 데이',
        descriptionEn: 'Saturday afternoon outreach and dinner fellowship.',
        descriptionKo: '토요일 오후 아웃리치 후 저녁 교제 시간이 있습니다.',
      },
    ],
    resources: [
      { titleEn: 'Discipleship journal', titleKo: '제자훈련 저널', url: 'https://example.com/youngadults-journal.pdf' },
      { titleEn: 'Weekly prayer points', titleKo: '주간 기도제목', url: 'https://example.com/youngadults-prayer.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Young adults fellowship',
        altKo: '청년부 교제 모임',
      },
      {
        src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Young adults serving together',
        altKo: '함께 섬기는 청년부',
      },
    ],
  },
  {
    slug: 'womens-group',
    nameEn: "Women's Group",
    nameKo: '여성 모임',
    introEn:
      "Women's Group encourages women of all ages through Bible study, prayer partnerships, and practical support for everyday life.",
    introKo:
      '여성 모임은 말씀 공부와 기도 동역, 삶의 실제적인 돌봄을 통해 모든 세대의 여성이 함께 성장하도록 돕습니다.',
    leaders: [
      { nameEn: 'Sarah Yoo', nameKo: '유사라', roleEn: "Women's Group Lead", roleKo: '여성 모임 리드' },
      { nameEn: 'Mina Jang', nameKo: '장미나', roleEn: 'Care Coordinator', roleKo: '돌봄 코디네이터' },
    ],
    members: ['Mothers', 'Career Women', 'Mentoring Team'],
    announcements: [
      {
        date: '2026-03-12',
        titleEn: 'Morning Bible circle',
        titleKo: '아침 성경모임',
        descriptionEn: 'Thursday 10:00 AM at the fellowship hall.',
        descriptionKo: '목요일 오전 10시, 친교실에서 진행됩니다.',
      },
    ],
    resources: [
      { titleEn: 'Study notes: Psalms', titleKo: '시편 성경공부 노트', url: 'https://example.com/women-psalms-notes.pdf' },
      { titleEn: 'Prayer partner guide', titleKo: '기도 동역 가이드', url: 'https://example.com/women-prayer-guide.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1469571486292-b53601020aa9?auto=format&fit=crop&w=1200&q=80',
        altEn: "Women's bible study table",
        altKo: '여성 성경공부 모임',
      },
      {
        src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Group prayer and fellowship',
        altKo: '함께 기도하고 교제하는 모임',
      },
    ],
  },
  {
    slug: 'prayer-groups',
    nameEn: 'Prayer Groups',
    nameKo: '기도 모임',
    introEn:
      'Prayer Groups intercede weekly for families, mission, and the city. Anyone can join to pray and receive encouragement.',
    introKo:
      '기도 모임은 가정과 선교, 도시를 위해 주중에 함께 중보하며 누구나 참여해 기도와 격려를 나눌 수 있습니다.',
    leaders: [
      { nameEn: 'Paul Shin', nameKo: '신바울', roleEn: 'Prayer Lead', roleKo: '기도팀 리드' },
      { nameEn: 'Joyce Han', nameKo: '한조이스', roleEn: 'Intercession Coordinator', roleKo: '중보 코디네이터' },
    ],
    members: ['Early Morning Team', 'Parents Prayer Team', 'Mission Intercessors'],
    announcements: [
      {
        date: '2026-02-19',
        titleEn: 'Night prayer online',
        titleKo: '온라인 야간 기도회',
        descriptionEn: 'Wednesday 8:00 PM Zoom link is updated in resources.',
        descriptionKo: '수요일 저녁 8시, Zoom 링크가 자료실에 업데이트되었습니다.',
      },
    ],
    resources: [
      { titleEn: 'Weekly prayer sheet', titleKo: '주간 기도제목', url: 'https://example.com/prayer-weekly-sheet.pdf' },
      { titleEn: 'Mission prayer map', titleKo: '선교 기도맵', url: 'https://example.com/prayer-mission-map.pdf' },
    ],
    photos: [
      {
        src: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80',
        altEn: 'Prayer meeting in sanctuary',
        altKo: '본당 기도 모임',
      },
      {
        src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
        altEn: 'People praying together',
        altKo: '함께 기도하는 공동체',
      },
    ],
  },
];

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const GroupsPage: NextPage & { meta?: { title?: string; description?: string } } = () => {
  const fallbackGroup = GROUPS[0];
  const { lang } = useLanguage();
  const { isAuthenticated, isLoading } = useSwaAuth();
  const isKo = lang === 'ko';
  const [selectedSlug, setSelectedSlug] = useState(fallbackGroup?.slug || '');
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, UploadedPhoto[]>>({});
  const [uploadedResources, setUploadedResources] = useState<Record<string, UploadedResource[]>>({});
  const [uploadNotice, setUploadNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const objectUrlRef = useRef<string[]>([]);

  const labels = {
    pageTag: isKo ? '사역 그룹' : 'Ministry Groups',
    title: isKo ? '그룹 안내' : 'Groups',
    subtitle: isKo
      ? '각 팀을 서브 메뉴에서 선택해 소개, 리더/멤버, 공지, 자료, 사진을 확인하세요.'
      : 'Use the group submenu to explore introductions, leaders, announcements, resources, and photos.',
    submenuTitle: isKo ? '그룹 메뉴' : 'Group Menu',
    introTitle: isKo ? '소개' : 'Introduction',
    peopleTitle: isKo ? '리더 및 멤버' : 'Leaders & members',
    leaderLabel: isKo ? '리더' : 'Leaders',
    memberLabel: isKo ? '멤버' : 'Members',
    announcementsTitle: isKo ? '공지사항' : 'Announcements',
    resourcesTitle: isKo ? '자료' : 'Resources',
    photosTitle: isKo ? '사진' : 'Photos',
    uploadTitle: isKo ? '새 자료 업로드' : 'Upload new items',
    uploadSubtitle: isKo
      ? '로그인한 사용자만 새 사진/자료를 업로드할 수 있습니다.'
      : 'Only authenticated users can upload new photos and files.',
    checkingAuth: isKo ? '로그인 상태 확인 중...' : 'Checking login status...',
    loginRequired: isKo ? '업로드는 로그인 후 가능합니다.' : 'Please sign in to upload.',
    loginButton: isKo ? '로그인' : 'Login',
    uploadPhotos: isKo ? '사진 업로드' : 'Upload photos',
    uploadFiles: isKo ? '자료 업로드' : 'Upload files',
    uploadDone: isKo ? '업로드가 추가되었습니다.' : 'Upload added successfully.',
    onlyImages: isKo ? '사진 업로드는 이미지 파일만 가능합니다.' : 'Photo upload accepts image files only.',
    emptyAnnouncements: isKo ? '등록된 공지가 없습니다.' : 'No announcements yet.',
    emptyResources: isKo ? '등록된 자료가 없습니다.' : 'No resources yet.',
    emptyPhotos: isKo ? '등록된 사진이 없습니다.' : 'No photos yet.',
    download: isKo ? '다운로드' : 'Download',
    uploadHint: isKo ? '업로드된 파일은 현재 브라우저 세션에서만 유지됩니다.' : 'Uploaded files are kept in this browser session only.',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hashSlug = window.location.hash.replace('#', '');
    if (GROUPS.some((group) => group.slug === hashSlug)) {
      setSelectedSlug(hashSlug);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedSlug) return;
    const nextHash = `#${selectedSlug}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [selectedSlug]);

  useEffect(() => {
    return () => {
      objectUrlRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlRef.current = [];
    };
  }, []);

  if (!fallbackGroup) {
    return null;
  }

  const selectedGroup = useMemo(
    () => GROUPS.find((group) => group.slug === selectedSlug) || fallbackGroup,
    [fallbackGroup, selectedSlug]
  );

  const selectedUploadedPhotos = uploadedPhotos[selectedGroup.slug] || [];
  const selectedUploadedResources = uploadedResources[selectedGroup.slug] || [];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(isKo ? 'ko-KR' : 'en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const createObjectUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlRef.current.push(url);
    return url;
  };

  const handlePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setUploadNotice({ kind: 'error', message: labels.loginRequired });
      event.target.value = '';
      return;
    }

    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      setUploadNotice({ kind: 'error', message: labels.onlyImages });
    }
    if (!imageFiles.length) {
      event.target.value = '';
      return;
    }

    const items = imageFiles.map((file) => ({ name: file.name, url: createObjectUrl(file) }));
    setUploadedPhotos((prev) => ({
      ...prev,
      [selectedGroup.slug]: [...(prev[selectedGroup.slug] || []), ...items],
    }));
    setUploadNotice({ kind: 'success', message: labels.uploadDone });
    event.target.value = '';
  };

  const handleResourceUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setUploadNotice({ kind: 'error', message: labels.loginRequired });
      event.target.value = '';
      return;
    }

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const items = files.map((file) => ({
      name: file.name,
      size: file.size,
      url: createObjectUrl(file),
    }));
    setUploadedResources((prev) => ({
      ...prev,
      [selectedGroup.slug]: [...(prev[selectedGroup.slug] || []), ...items],
    }));
    setUploadNotice({ kind: 'success', message: labels.uploadDone });
    event.target.value = '';
  };

  const photoItems = [
    ...selectedGroup.photos.map((photo) => ({
      src: photo.src,
      alt: isKo ? photo.altKo : photo.altEn,
    })),
    ...selectedUploadedPhotos.map((photo) => ({
      src: photo.url,
      alt: photo.name,
    })),
  ];

  const resourceItems = [
    ...selectedGroup.resources.map((resource) => ({
      title: isKo ? resource.titleKo : resource.titleEn,
      url: resource.url,
      uploaded: false,
      size: 0,
    })),
    ...selectedUploadedResources.map((resource) => ({
      title: resource.name,
      url: resource.url,
      uploaded: true,
      size: resource.size,
    })),
  ];

  return (
    <section className="section groups-page">
      <div className="section__header">
        <p className="pill">{labels.pageTag}</p>
        <h1>{labels.title}</h1>
        <p className="muted">{labels.subtitle}</p>
      </div>

      <div className="groups-layout">
        <aside className="card groups-submenu" aria-label={labels.submenuTitle}>
          <h2>{labels.submenuTitle}</h2>
          <div className="groups-submenu__list">
            {GROUPS.map((group) => {
              const active = group.slug === selectedGroup.slug;
              return (
                <button
                  key={group.slug}
                  type="button"
                  className={`groups-submenu__button ${active ? 'groups-submenu__button--active' : ''}`}
                  onClick={() => {
                    setSelectedSlug(group.slug);
                    setUploadNotice(null);
                  }}
                >
                  {isKo ? group.nameKo : group.nameEn}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="groups-main">
          <article className="card">
            <p className="card__eyebrow">{labels.introTitle}</p>
            <h2>{isKo ? selectedGroup.nameKo : selectedGroup.nameEn}</h2>
            <p>{isKo ? selectedGroup.introKo : selectedGroup.introEn}</p>
          </article>

          <article className="card">
            <p className="card__eyebrow">{labels.peopleTitle}</p>
            <div className="groups-people">
              <div>
                <h3>{labels.leaderLabel}</h3>
                <ul className="groups-people-list">
                  {selectedGroup.leaders.map((leader) => (
                    <li key={`${leader.nameEn}-${leader.roleEn}`}>
                      <strong>{isKo ? leader.nameKo : leader.nameEn}</strong>
                      <span className="muted"> {isKo ? leader.roleKo : leader.roleEn}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{labels.memberLabel}</h3>
                <div className="groups-member-tags">
                  {selectedGroup.members.map((member) => (
                    <span key={member} className="badge">
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="card">
            <p className="card__eyebrow">{labels.announcementsTitle}</p>
            {selectedGroup.announcements.length ? (
              <ul className="groups-announcement-list">
                {selectedGroup.announcements.map((item) => (
                  <li key={`${item.date}-${item.titleEn}`}>
                    <p className="muted">{formatDate(item.date)}</p>
                    <h3>{isKo ? item.titleKo : item.titleEn}</h3>
                    <p>{isKo ? item.descriptionKo : item.descriptionEn}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{labels.emptyAnnouncements}</p>
            )}
          </article>

          <article className="card">
            <p className="card__eyebrow">{labels.resourcesTitle}</p>
            {resourceItems.length ? (
              <ul className="link-list">
                {resourceItems.map((resource) => (
                  <li key={`${resource.title}-${resource.url}`} className="card card--inline groups-resource-item">
                    <div>
                      <a
                        href={resource.url}
                        target={resource.uploaded ? undefined : '_blank'}
                        rel={resource.uploaded ? undefined : 'noreferrer'}
                        className="link"
                        download={resource.uploaded ? resource.title : undefined}
                      >
                        {resource.title}
                      </a>
                      {resource.uploaded ? (
                        <p className="muted groups-resource-meta">{formatFileSize(resource.size)}</p>
                      ) : null}
                    </div>
                    <a
                      href={resource.url}
                      target={resource.uploaded ? undefined : '_blank'}
                      rel={resource.uploaded ? undefined : 'noreferrer'}
                      className="button ghost"
                      download={resource.uploaded ? resource.title : undefined}
                    >
                      {labels.download}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{labels.emptyResources}</p>
            )}
          </article>

          <article className="card">
            <p className="card__eyebrow">{labels.photosTitle}</p>
            {photoItems.length ? (
              <div className="gallery">
                {photoItems.map((photo) => (
                  <div key={`${photo.src}-${photo.alt}`} className="gallery__item">
                    <img src={photo.src} alt={photo.alt} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">{labels.emptyPhotos}</p>
            )}
          </article>

          <article className="card groups-upload-card">
            <p className="card__eyebrow">{labels.uploadTitle}</p>
            <h3>{labels.uploadTitle}</h3>
            <p className="muted">{labels.uploadSubtitle}</p>
            {isLoading ? <p className="muted">{labels.checkingAuth}</p> : null}

            {!isLoading && !isAuthenticated ? (
              <button type="button" className="button" onClick={() => (window.location.href = getLoginUrl())}>
                {labels.loginButton}
              </button>
            ) : null}

            {!isLoading && isAuthenticated ? (
              <div className="groups-upload-actions">
                <label className="button ghost">
                  {labels.uploadPhotos}
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} hidden />
                </label>
                <label className="button ghost">
                  {labels.uploadFiles}
                  <input type="file" multiple onChange={handleResourceUpload} hidden />
                </label>
              </div>
            ) : null}

            {uploadNotice ? (
              <p className={uploadNotice.kind === 'success' ? 'success-text' : 'error-text'}>{uploadNotice.message}</p>
            ) : null}
            <p className="muted">{labels.uploadHint}</p>
          </article>
        </div>
      </div>
    </section>
  );
};

GroupsPage.meta = {
  title: 'Groups',
  description: 'Meet our teams and ministry groups.',
};

export default GroupsPage;
