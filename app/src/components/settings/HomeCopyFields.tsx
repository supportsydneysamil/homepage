import type { SiteCopy } from '../../lib/siteCopy';
import { DEFAULT_IMAGE_PRESENTATION } from '../../lib/imagePresentation';
import { DEFAULT_HERO_IMAGE, DEFAULT_PASTOR_IMAGE } from '../../lib/siteSettings';
import BilingualField from './BilingualField';
import { CopySection, FieldGroup } from './SiteCopyEditorParts';
import SitePhotoField, { type PhotoSlot } from './SitePhotoField';

type HomeCopy = SiteCopy['home'];

const replaceAt = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((item, current) => (current === index ? { ...item, ...patch } : item));

const HomeCopyFields = ({
  value,
  onChange,
  isKo,
  heroPhoto,
  pastorPhoto,
}: {
  value: HomeCopy;
  onChange: (next: HomeCopy) => void;
  isKo: boolean;
  heroPhoto: PhotoSlot;
  pastorPhoto: PhotoSlot;
}) => {
  const setSection = <K extends keyof HomeCopy>(key: K, patch: Partial<HomeCopy[K]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  const primary = isKo ? '주요 문구' : 'Primary copy';
  const supporting = isKo ? '버튼과 보조 문구' : 'Buttons and supporting copy';
  const accessibility = isKo ? '접근성 문구' : 'Accessibility copy';
  const choosePhoto = isKo ? '사진 선택' : 'Choose Photo';
  const restorePhoto = isKo ? '기본 사진으로 되돌리기' : 'Restore Default';

  return (
    <>
      <CopySection
        title={isKo ? '첫 화면' : 'Hero'}
        description={isKo ? '방문자가 가장 먼저 보는 제목과 행동 버튼' : 'The first headline and actions visitors see'}
        count={7}
        open
      >
        <SitePhotoField
          label={isKo ? '첫 화면 사진' : 'Hero photo'}
          hint={isKo ? '가로형 4:3 이상 권장' : 'Landscape, 4:3 or wider recommended'}
          usage={isKo ? '홈 첫 화면에 표시됩니다' : 'Shown in the homepage hero'}
          alt={isKo ? '교회 히어로 사진' : 'Church hero photo'}
          fallback={DEFAULT_HERO_IMAGE}
          variant="hero"
          chooseLabel={choosePhoto}
          resetLabel={restorePhoto}
          isKo={isKo}
          defaultComposition={DEFAULT_IMAGE_PRESENTATION.hero}
          slot={heroPhoto}
        />
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.hero.title"
            label={isKo ? '큰 제목' : 'Headline'}
            hint={isKo ? '줄바꿈이 그대로 반영됩니다' : 'Line breaks are kept'}
            value={value.hero.title}
            onChange={(title) => setSection('hero', { title })}
            multiline
          />
          <BilingualField
            fieldPath="home.hero.lead"
            label={isKo ? '소개 문장' : 'Lead'}
            value={value.hero.lead}
            onChange={(lead) => setSection('hero', { lead })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.hero.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.hero.kicker}
            onChange={(kicker) => setSection('hero', { kicker })}
          />
          <BilingualField
            fieldPath="home.hero.thisSunday"
            label={isKo ? '이번 주일 라벨' : 'This Sunday label'}
            value={value.hero.thisSunday}
            onChange={(thisSunday) => setSection('hero', { thisSunday })}
          />
          <BilingualField
            fieldPath="home.hero.ctaVisit"
            label={isKo ? '방문 버튼' : 'Visit button'}
            value={value.hero.ctaVisit}
            onChange={(ctaVisit) => setSection('hero', { ctaVisit })}
          />
          <BilingualField
            fieldPath="home.hero.ctaDirections"
            label={isKo ? '길찾기 버튼' : 'Directions button'}
            value={value.hero.ctaDirections}
            onChange={(ctaDirections) => setSection('hero', { ctaDirections })}
          />
        </FieldGroup>
        <FieldGroup title={accessibility}>
          <BilingualField
            fieldPath="home.hero.photoAlt"
            label={isKo ? '대표 사진 설명' : 'Hero image description'}
            hint={
              isKo
                ? '화면 읽기 사용자를 위해 사진의 내용을 설명합니다'
                : 'Describes the image for screen-reader users'
            }
            value={value.hero.photoAlt}
            onChange={(photoAlt) => setSection('hero', { photoAlt })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '빠른 안내' : 'Quick information'}
        description={isKo ? '첫 화면 아래의 예배·방문·위치 카드' : 'Worship, visit, and location cards below the hero'}
        count={4}
      >
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.quick.worship"
            label={isKo ? '예배 안내' : 'Worship'}
            value={value.quick.worship}
            onChange={(worship) => setSection('quick', { worship })}
          />
          <BilingualField
            fieldPath="home.quick.firstVisit"
            label={isKo ? '처음 방문' : 'First visit'}
            value={value.quick.firstVisit}
            onChange={(firstVisit) => setSection('quick', { firstVisit })}
          />
          <BilingualField
            fieldPath="home.quick.firstVisitHint"
            label={isKo ? '처음 방문 보조 문구' : 'First visit hint'}
            value={value.quick.firstVisitHint}
            onChange={(firstVisitHint) => setSection('quick', { firstVisitHint })}
          />
          <BilingualField
            fieldPath="home.quick.findUs"
            label={isKo ? '위치 안내' : 'Find us'}
            value={value.quick.findUs}
            onChange={(findUs) => setSection('quick', { findUs })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '교회의 세 기둥' : 'Church pillars'}
        description={isKo ? '교회의 핵심 가치 세 가지' : 'The church’s three core values'}
        count={3 + value.pillars.items.length * 2}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.pillars.title"
            label={isKo ? '섹션 제목' : 'Section title'}
            value={value.pillars.title}
            onChange={(title) => setSection('pillars', { title })}
          />
          <BilingualField
            fieldPath="home.pillars.intro"
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={value.pillars.intro}
            onChange={(intro) => setSection('pillars', { intro })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.pillars.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.pillars.kicker}
            onChange={(kicker) => setSection('pillars', { kicker })}
          />
        </FieldGroup>
        <div className="settings-items">
          {value.pillars.items.map((item, index) => (
            <article className="settings-item" key={`pillar-${index}`}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '기둥' : 'Pillar'} {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <BilingualField
                fieldPath="home.pillars.items[].title"
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) =>
                  setSection('pillars', { items: replaceAt(value.pillars.items, index, { title }) })
                }
              />
              <BilingualField
                fieldPath="home.pillars.items[].body"
                label={isKo ? '설명' : 'Description'}
                value={item.body}
                onChange={(body) =>
                  setSection('pillars', { items: replaceAt(value.pillars.items, index, { body }) })
                }
                multiline
              />
            </article>
          ))}
        </div>
      </CopySection>

      <CopySection
        title={isKo ? '이번 주 소식' : 'Weekly highlights'}
        description={isKo ? '이벤트·설교·자료 카드 위의 안내 문구' : 'Copy around event, sermon, and resource cards'}
        count={5}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.weekly.title"
            label={isKo ? '섹션 제목' : 'Section title'}
            value={value.weekly.title}
            onChange={(title) => setSection('weekly', { title })}
          />
          <BilingualField
            fieldPath="home.weekly.intro"
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={value.weekly.intro}
            onChange={(intro) => setSection('weekly', { intro })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.weekly.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.weekly.kicker}
            onChange={(kicker) => setSection('weekly', { kicker })}
          />
          <BilingualField
            fieldPath="home.weekly.empty"
            label={isKo ? '소식이 없을 때' : 'Empty state'}
            value={value.weekly.empty}
            onChange={(empty) => setSection('weekly', { empty })}
          />
          <BilingualField
            fieldPath="home.weekly.viewDetails"
            label={isKo ? '자세히 보기 버튼' : 'View details button'}
            value={value.weekly.viewDetails}
            onChange={(viewDetails) => setSection('weekly', { viewDetails })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '처음 방문 안내' : 'First visit'}
        description={isKo ? '예배 분위기, 어린이, 위치 안내' : 'Service atmosphere, children, and location'}
        count={10}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.visit.title"
            label={isKo ? '섹션 제목' : 'Section title'}
            value={value.visit.title}
            onChange={(title) => setSection('visit', { title })}
          />
          <BilingualField
            fieldPath="home.visit.intro"
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={value.visit.intro}
            onChange={(intro) => setSection('visit', { intro })}
            multiline
          />
          <BilingualField
            fieldPath="home.visit.whatToExpect"
            label={isKo ? '예배 분위기' : 'What to expect'}
            value={value.visit.whatToExpect}
            onChange={(whatToExpect) => setSection('visit', { whatToExpect })}
            multiline
          />
          <BilingualField
            fieldPath="home.visit.children"
            label={isKo ? '어린이와 언어' : 'Children and language'}
            value={value.visit.children}
            onChange={(children) => setSection('visit', { children })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.visit.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.visit.kicker}
            onChange={(kicker) => setSection('visit', { kicker })}
          />
          <BilingualField
            fieldPath="home.visit.serviceTimes"
            label={isKo ? '예배 시간 라벨' : 'Service times label'}
            value={value.visit.serviceTimes}
            onChange={(serviceTimes) => setSection('visit', { serviceTimes })}
          />
          <BilingualField
            fieldPath="home.visit.whatToExpectLabel"
            label={isKo ? '예배 분위기 라벨' : 'What to expect label'}
            value={value.visit.whatToExpectLabel}
            onChange={(whatToExpectLabel) => setSection('visit', { whatToExpectLabel })}
          />
          <BilingualField
            fieldPath="home.visit.childrenLabel"
            label={isKo ? '어린이 안내 라벨' : 'Children label'}
            value={value.visit.childrenLabel}
            onChange={(childrenLabel) => setSection('visit', { childrenLabel })}
          />
          <BilingualField
            fieldPath="home.visit.addressLabel"
            label={isKo ? '주소 라벨' : 'Address label'}
            value={value.visit.addressLabel}
            onChange={(addressLabel) => setSection('visit', { addressLabel })}
          />
          <BilingualField
            fieldPath="home.visit.mapsCta"
            label={isKo ? '지도 버튼' : 'Map button'}
            value={value.visit.mapsCta}
            onChange={(mapsCta) => setSection('visit', { mapsCta })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '다음 걸음' : 'Next steps'}
        description={isKo ? '방문자가 선택할 수 있는 연결 카드' : 'Link cards that guide visitors forward'}
        count={3 + value.nextSteps.items.length * 3}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.nextSteps.title"
            label={isKo ? '섹션 제목' : 'Section title'}
            value={value.nextSteps.title}
            onChange={(title) => setSection('nextSteps', { title })}
          />
          <BilingualField
            fieldPath="home.nextSteps.intro"
            label={isKo ? '섹션 소개' : 'Section intro'}
            value={value.nextSteps.intro}
            onChange={(intro) => setSection('nextSteps', { intro })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.nextSteps.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.nextSteps.kicker}
            onChange={(kicker) => setSection('nextSteps', { kicker })}
          />
        </FieldGroup>
        <div className="settings-items">
          {value.nextSteps.items.map((item, index) => (
            <article className="settings-item" key={item.href}>
              <div className="settings-item__head">
                <span className="settings-item__index">
                  {isKo ? '카드' : 'Card'} {String(index + 1).padStart(2, '0')}
                </span>
                <span className="settings-item__note">{item.href}</span>
              </div>
              <BilingualField
                fieldPath="home.nextSteps.items[].title"
                label={isKo ? '제목' : 'Title'}
                value={item.title}
                onChange={(title) =>
                  setSection('nextSteps', { items: replaceAt(value.nextSteps.items, index, { title }) })
                }
              />
              <BilingualField
                fieldPath="home.nextSteps.items[].description"
                label={isKo ? '설명' : 'Description'}
                value={item.description}
                onChange={(description) =>
                  setSection('nextSteps', {
                    items: replaceAt(value.nextSteps.items, index, { description }),
                  })
                }
                multiline
              />
              <BilingualField
                fieldPath="home.nextSteps.items[].label"
                label={isKo ? '버튼 문구' : 'Button label'}
                value={item.label}
                onChange={(label) =>
                  setSection('nextSteps', { items: replaceAt(value.nextSteps.items, index, { label }) })
                }
              />
            </article>
          ))}
        </div>
      </CopySection>

      <CopySection
        title={isKo ? '담임목사 소개' : 'Pastor feature'}
        description={isKo ? '홈 하단의 담임목사 인사말' : 'The lead pastor message near the end of Home'}
        count={5}
      >
        <SitePhotoField
          label={isKo ? '담임목사 사진' : 'Pastor photo'}
          hint={isKo ? '세로형 4:5 권장' : 'Portrait, about 4:5 recommended'}
          usage={isKo ? '홈 담임목사 소개에 표시됩니다' : 'Shown in the homepage pastor feature'}
          alt={isKo ? '담임목사 사진' : 'Pastor photo'}
          fallback={DEFAULT_PASTOR_IMAGE}
          variant="pastor"
          chooseLabel={choosePhoto}
          resetLabel={restorePhoto}
          isKo={isKo}
          defaultComposition={DEFAULT_IMAGE_PRESENTATION.pastor}
          slot={pastorPhoto}
        />
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="home.pastor.quote"
            label={isKo ? '인용문' : 'Quote'}
            value={value.pastor.quote}
            onChange={(quote) => setSection('pastor', { quote })}
            multiline
          />
          <BilingualField
            fieldPath="home.pastor.body"
            label={isKo ? '본문' : 'Body'}
            value={value.pastor.body}
            onChange={(body) => setSection('pastor', { body })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="home.pastor.kicker"
            label={isKo ? '작은 제목' : 'Kicker'}
            value={value.pastor.kicker}
            onChange={(kicker) => setSection('pastor', { kicker })}
          />
          <BilingualField
            fieldPath="home.pastor.contactCta"
            label={isKo ? '문의 버튼' : 'Contact button'}
            value={value.pastor.contactCta}
            onChange={(contactCta) => setSection('pastor', { contactCta })}
          />
        </FieldGroup>
        <FieldGroup title={accessibility}>
          <BilingualField
            fieldPath="home.pastor.photoAlt"
            label={isKo ? '담임목사 사진 설명' : 'Pastor image description'}
            hint={
              isKo
                ? '화면 읽기 사용자를 위해 사진의 내용을 설명합니다'
                : 'Describes the image for screen-reader users'
            }
            value={value.pastor.photoAlt}
            onChange={(photoAlt) => setSection('pastor', { photoAlt })}
          />
        </FieldGroup>
      </CopySection>
    </>
  );
};

export default HomeCopyFields;
