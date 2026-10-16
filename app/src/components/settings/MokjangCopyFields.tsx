import type { SiteCopy } from '../../lib/siteCopy';
import BilingualField from './BilingualField';
import { CopySection, FieldGroup } from './SiteCopyEditorParts';

type MokjangCopy = SiteCopy['mokjang'];

const replaceAt = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((item, current) => (current === index ? { ...item, ...patch } : item));

const itemLabel = (prefix: string, index: number) => `${prefix} ${String(index + 1).padStart(2, '0')}`;

const MokjangCopyFields = ({
  value,
  onChange,
  isKo,
}: {
  value: MokjangCopy;
  onChange: (next: MokjangCopy) => void;
  isKo: boolean;
}) => {
  const setSection = <K extends keyof MokjangCopy>(key: K, patch: Partial<MokjangCopy[K]>) =>
    onChange({ ...value, [key]: { ...value[key], ...patch } });

  const primary = isKo ? '주요 문구' : 'Primary copy';
  const supporting = isKo ? '버튼과 보조 문구' : 'Buttons and supporting copy';
  const kicker = isKo ? '작은 제목' : 'Kicker';
  const title = isKo ? '제목' : 'Title';
  const body = isKo ? '본문' : 'Body';

  return (
    <>
      <CopySection title={isKo ? '첫 화면' : 'Hero'} count={5} open>
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.hero.title"
            label={isKo ? '큰 제목' : 'Headline'}
            value={value.hero.title}
            onChange={(next) => setSection('hero', { title: next })}
            hint={isKo ? '줄을 바꾸면 페이지에서도 줄이 바뀝니다.' : 'Line breaks show on the page.'}
            multiline
          />
          <BilingualField
            fieldPath="mokjang.hero.lead"
            label={isKo ? '소개 문장' : 'Lead'}
            value={value.hero.lead}
            onChange={(next) => setSection('hero', { lead: next })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="mokjang.hero.kicker"
            label={isKo ? '페이지 작은 제목' : 'Page eyebrow'}
            value={value.hero.kicker}
            onChange={(next) => setSection('hero', { kicker: next })}
          />
          <BilingualField
            fieldPath="mokjang.hero.ctaConnect"
            label={isKo ? '연결 요청 버튼' : 'Connect button'}
            value={value.hero.ctaConnect}
            onChange={(next) => setSection('hero', { ctaConnect: next })}
          />
          <BilingualField
            fieldPath="mokjang.hero.ctaBrowse"
            label={isKo ? '둘러보기 버튼' : 'Browse button'}
            value={value.hero.ctaBrowse}
            onChange={(next) => setSection('hero', { ctaBrowse: next })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '목장의 한 저녁' : 'An evening together'}
        description={isKo ? '모임 순서를 네 단계로 보여 줍니다' : 'Four steps of a gathering'}
        count={2 + value.evening.steps.length * 3}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.evening.title"
            label={title}
            value={value.evening.title}
            onChange={(next) => setSection('evening', { title: next })}
          />
          <BilingualField
            fieldPath="mokjang.evening.kicker"
            label={kicker}
            value={value.evening.kicker}
            onChange={(next) => setSection('evening', { kicker: next })}
          />
        </FieldGroup>
        {value.evening.steps.map((step, index) => (
          <article className="settings-item" key={`mokjang-step-${index}`}>
            <div className="settings-item__head">
              <span className="settings-item__index">{itemLabel(isKo ? '순서' : 'Step', index)}</span>
            </div>
            <BilingualField
              fieldPath="mokjang.evening.steps[].time"
              label={isKo ? '시간' : 'Time'}
              value={step.time}
              onChange={(next) => setSection('evening', { steps: replaceAt(value.evening.steps, index, { time: next }) })}
            />
            <BilingualField
              fieldPath="mokjang.evening.steps[].title"
              label={title}
              value={step.title}
              onChange={(next) => setSection('evening', { steps: replaceAt(value.evening.steps, index, { title: next }) })}
            />
            <BilingualField
              fieldPath="mokjang.evening.steps[].body"
              label={body}
              value={step.body}
              onChange={(next) => setSection('evening', { steps: replaceAt(value.evening.steps, index, { body: next }) })}
              multiline
            />
          </article>
        ))}
      </CopySection>

      <CopySection title={isKo ? '환영 안내' : 'Welcome note'} count={3}>
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.welcome.title"
            label={title}
            value={value.welcome.title}
            onChange={(next) => setSection('welcome', { title: next })}
          />
          <BilingualField
            fieldPath="mokjang.welcome.body"
            label={body}
            value={value.welcome.body}
            onChange={(next) => setSection('welcome', { body: next })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="mokjang.welcome.kicker"
            label={kicker}
            value={value.welcome.kicker}
            onChange={(next) => setSection('welcome', { kicker: next })}
          />
        </FieldGroup>
      </CopySection>

      <CopySection title={isKo ? '목장 목록' : 'House church list'} count={4}>
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.list.title"
            label={title}
            value={value.list.title}
            onChange={(next) => setSection('list', { title: next })}
          />
          <BilingualField
            fieldPath="mokjang.list.intro"
            label={isKo ? '안내 문장' : 'Intro'}
            value={value.list.intro}
            onChange={(next) => setSection('list', { intro: next })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="mokjang.list.kicker"
            label={kicker}
            value={value.list.kicker}
            onChange={(next) => setSection('list', { kicker: next })}
          />
          <BilingualField
            fieldPath="mokjang.list.empty"
            label={isKo ? '목장이 없을 때 문구' : 'Empty message'}
            value={value.list.empty}
            onChange={(next) => setSection('list', { empty: next })}
            multiline
          />
        </FieldGroup>
      </CopySection>

      <CopySection
        title={isKo ? '자주 묻는 질문' : 'Common questions'}
        description={isKo ? '질문을 비워 두면 그 칸은 페이지에 나오지 않습니다.' : 'Clear a question to hide it.'}
        count={1 + value.faq.items.length * 2}
      >
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="mokjang.faq.kicker"
            label={isKo ? '섹션 제목' : 'Section title'}
            value={value.faq.kicker}
            onChange={(next) => setSection('faq', { kicker: next })}
          />
        </FieldGroup>
        {value.faq.items.map((item, index) => (
          <article className="settings-item" key={`mokjang-faq-${index}`}>
            <div className="settings-item__head">
              <span className="settings-item__index">{itemLabel(isKo ? '질문' : 'Question', index)}</span>
            </div>
            <BilingualField
              fieldPath="mokjang.faq.items[].question"
              label={isKo ? '질문' : 'Question'}
              value={item.question}
              onChange={(next) => setSection('faq', { items: replaceAt(value.faq.items, index, { question: next }) })}
            />
            <BilingualField
              fieldPath="mokjang.faq.items[].answer"
              label={isKo ? '답' : 'Answer'}
              value={item.answer}
              onChange={(next) => setSection('faq', { items: replaceAt(value.faq.items, index, { answer: next }) })}
              multiline
            />
          </article>
        ))}
      </CopySection>

      <CopySection
        title={isKo ? '삶공부' : 'Life classes'}
        description={
          isKo
            ? '이름을 비워 두면 그 카드는 나오지 않습니다. 생명의 삶 시간이 바뀌면 교회 정보의 모임 안내도 함께 고쳐 주세요.'
            : 'Clear a name to hide that card. When the Life Bible study time changes, update the church info gatherings too.'
        }
        count={2 + value.study.items.length * 2}
      >
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.study.title"
            label={title}
            value={value.study.title}
            onChange={(next) => setSection('study', { title: next })}
          />
          <BilingualField
            fieldPath="mokjang.study.kicker"
            label={kicker}
            value={value.study.kicker}
            onChange={(next) => setSection('study', { kicker: next })}
          />
        </FieldGroup>
        {value.study.items.map((item, index) => (
          <article className="settings-item" key={`mokjang-study-${index}`}>
            <div className="settings-item__head">
              <span className="settings-item__index">{itemLabel(isKo ? '카드' : 'Card', index)}</span>
            </div>
            <BilingualField
              fieldPath="mokjang.study.items[].title"
              label={isKo ? '이름' : 'Name'}
              value={item.title}
              onChange={(next) => setSection('study', { items: replaceAt(value.study.items, index, { title: next }) })}
            />
            <BilingualField
              fieldPath="mokjang.study.items[].body"
              label={isKo ? '설명' : 'Description'}
              value={item.body}
              onChange={(next) => setSection('study', { items: replaceAt(value.study.items, index, { body: next }) })}
              multiline
            />
          </article>
        ))}
      </CopySection>

      <CopySection title={isKo ? '연결 요청' : 'Connection request'} count={4}>
        <FieldGroup title={primary}>
          <BilingualField
            fieldPath="mokjang.cta.title"
            label={title}
            value={value.cta.title}
            onChange={(next) => setSection('cta', { title: next })}
          />
          <BilingualField
            fieldPath="mokjang.cta.body"
            label={body}
            value={value.cta.body}
            onChange={(next) => setSection('cta', { body: next })}
            multiline
          />
        </FieldGroup>
        <FieldGroup title={supporting}>
          <BilingualField
            fieldPath="mokjang.cta.kicker"
            label={kicker}
            value={value.cta.kicker}
            onChange={(next) => setSection('cta', { kicker: next })}
          />
          <BilingualField
            fieldPath="mokjang.cta.button"
            label={isKo ? '버튼' : 'Button'}
            value={value.cta.button}
            onChange={(next) => setSection('cta', { button: next })}
          />
        </FieldGroup>
      </CopySection>
    </>
  );
};

export default MokjangCopyFields;
