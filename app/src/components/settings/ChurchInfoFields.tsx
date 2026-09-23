import type { ReactNode } from 'react';
import {
  MAX_GATHERINGS,
  MAX_SERVICES,
  type ChurchGathering,
  type ChurchInfo,
  type ChurchService,
} from '../../lib/churchInfo';
import BilingualField from './BilingualField';
import SettingsPanel from './SettingsPanel';
import TextField from './TextField';

// Ids double as React keys, so a new row must not reuse one left by a removed row.
const nextId = (prefix: string, items: { id: string }[]) => {
  const used = new Set(items.map((item) => item.id));
  let count = items.length + 1;
  while (used.has(`${prefix}-${count}`)) count += 1;
  return `${prefix}-${count}`;
};

const emptyService = (items: ChurchService[]): ChurchService => ({
  id: nextId('service', items),
  time: '',
  period: 'AM',
  label: { ko: '', en: '' },
  note: { ko: '', en: '' },
});

const emptyGathering = (items: ChurchGathering[]): ChurchGathering => ({
  id: nextId('gathering', items),
  badge: '',
  title: { ko: '', en: '' },
  detail: { ko: '', en: '' },
});

const replaceAt = <T,>(items: T[], index: number, patch: Partial<T>) =>
  items.map((item, i) => (i === index ? { ...item, ...patch } : item));

const ItemCard = ({
  index,
  removeLabel,
  onRemove,
  children,
}: {
  index: string;
  removeLabel: string;
  onRemove: () => void;
  children: ReactNode;
}) => (
  <article className="settings-item">
    <div className="settings-item__head">
      <span className="settings-item__index">{index}</span>
      <button type="button" className="settings-item__remove" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
    {children}
  </article>
);

const ChurchInfoFields = ({
  value,
  onChange,
  isKo,
}: {
  value: ChurchInfo;
  onChange: (next: ChurchInfo) => void;
  isKo: boolean;
}) => {
  const update = (patch: Partial<ChurchInfo>) => onChange({ ...value, ...patch });
  const updateService = (index: number, patch: Partial<ChurchService>) =>
    update({ services: replaceAt(value.services, index, patch) });
  const updateGathering = (index: number, patch: Partial<ChurchGathering>) =>
    update({ gatherings: replaceAt(value.gatherings, index, patch) });

  const remove = isKo ? '삭제' : 'Remove';

  return (
    <div className="settings-panels">
      <SettingsPanel
        title={isKo ? '교회 이름' : 'Church name'}
        hint={isKo ? '헤더, 푸터, 지도 라벨에 쓰입니다.' : 'Used in the header, footer, and map label.'}
      >
        <div className="settings-grid">
          <TextField
            label={isKo ? '한글 교회명' : 'Church name (KO)'}
            value={value.churchNameKo}
            onChange={(churchNameKo) => update({ churchNameKo })}
          />
          <TextField
            label={isKo ? '영문 교회명' : 'Church name (EN)'}
            value={value.churchNameEn}
            onChange={(churchNameEn) => update({ churchNameEn })}
          />
          <TextField
            label={isKo ? '헤더 브랜드' : 'Header brand'}
            value={value.brandTitle}
            onChange={(brandTitle) => update({ brandTitle })}
            hint={isKo ? '로고 옆 짧은 표기' : 'Short mark beside the logo'}
          />
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={isKo ? '담임목사' : 'Lead pastor'}
        hint={isKo ? '홈 담임목사 소개에 표시됩니다.' : 'Shown in the homepage pastor section.'}
      >
        <div className="settings-grid">
          <TextField
            label={isKo ? '한글 이름' : 'Name (KO)'}
            value={value.pastorNameKo}
            onChange={(pastorNameKo) => update({ pastorNameKo })}
          />
          <TextField
            label={isKo ? '영문 이름' : 'Name (EN)'}
            value={value.pastorNameEn}
            onChange={(pastorNameEn) => update({ pastorNameEn })}
          />
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={isKo ? '연락처' : 'Contact'}
        hint={
          isKo
            ? '홈, 문의, 푸터에 함께 반영됩니다. 문의 메일 수신함은 따로 설정합니다.'
            : 'Appears on Home, Contact, and the footer. The inbox that receives messages is configured separately.'
        }
      >
        <div className="settings-grid">
          <TextField
            label={isKo ? '전화' : 'Phone'}
            value={value.phone}
            onChange={(phone) => update({ phone })}
            placeholder="0433 576 500"
          />
          <TextField
            label={isKo ? '이메일' : 'Email'}
            value={value.email}
            onChange={(email) => update({ email })}
            placeholder="info@sydneysamil.org"
          />
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={isKo ? '위치' : 'Location'}
        hint={isKo ? '주소와 지도, 길찾기 링크를 함께 만듭니다.' : 'Drives the address, map, and directions link.'}
      >
        <div className="settings-grid">
          <TextField
            label={isKo ? '주소 1줄' : 'Address line 1'}
            value={value.addressLine1}
            onChange={(addressLine1) => update({ addressLine1 })}
            full
          />
          <TextField
            label={isKo ? '주소 2줄' : 'Address line 2'}
            value={value.addressLine2}
            onChange={(addressLine2) => update({ addressLine2 })}
          />
          <TextField
            label={isKo ? '지역 표기' : 'Suburb'}
            value={value.suburb}
            onChange={(suburb) => update({ suburb })}
            hint={isKo ? '카드에 짧게 보이는 지역명' : 'Short area name shown on cards'}
          />
          <TextField
            label={isKo ? '지도 검색어' : 'Maps search'}
            value={value.mapsQuery}
            onChange={(mapsQuery) => update({ mapsQuery })}
            hint={
              isKo
                ? 'Google 지도에서 교회를 정확히 찾는 검색어'
                : 'The phrase that finds the church on Google Maps'
            }
            full
          />
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={isKo ? '주일 예배' : 'Sunday services'}
        hint={
          isKo
            ? `홈과 예배 페이지에 같이 반영됩니다. 최대 ${MAX_SERVICES}개.`
            : `Shown on Home and Worship. Up to ${MAX_SERVICES}.`
        }
      >
        <div className="settings-items">
          {value.services.map((service, index) => (
            <ItemCard
              key={service.id}
              index={`${isKo ? '예배' : 'Service'} ${String(index + 1).padStart(2, '0')}`}
              removeLabel={remove}
              onRemove={() => update({ services: value.services.filter((_, i) => i !== index) })}
            >
              <div className="settings-grid">
                <TextField
                  label={isKo ? '시간' : 'Time'}
                  value={service.time}
                  onChange={(time) => updateService(index, { time })}
                  placeholder="9:30"
                />
                <TextField
                  label={isKo ? '오전 / 오후' : 'Period'}
                  value={service.period}
                  onChange={(period) => updateService(index, { period })}
                  placeholder="AM"
                />
              </div>
              <BilingualField
                label={isKo ? '예배 이름' : 'Service name'}
                value={service.label}
                onChange={(label) => updateService(index, { label })}
              />
              <BilingualField
                label={isKo ? '안내' : 'Note'}
                value={service.note}
                onChange={(note) => updateService(index, { note })}
              />
            </ItemCard>
          ))}
          {value.services.length < MAX_SERVICES ? (
            <button
              type="button"
              className="settings-add"
              onClick={() => update({ services: [...value.services, emptyService(value.services)] })}
            >
              + {isKo ? '예배 시간 추가' : 'Add a service'}
            </button>
          ) : null}
        </div>
      </SettingsPanel>

      <SettingsPanel
        title={isKo ? '그 외 모임' : 'Other gatherings'}
        hint={
          isKo
            ? `예배 페이지 아래쪽 카드로 표시됩니다. 최대 ${MAX_GATHERINGS}개.`
            : `Shown as cards near the bottom of Worship. Up to ${MAX_GATHERINGS}.`
        }
      >
        <div className="settings-items">
          {value.gatherings.map((gathering, index) => (
            <ItemCard
              key={gathering.id}
              index={`${isKo ? '모임' : 'Gathering'} ${String(index + 1).padStart(2, '0')}`}
              removeLabel={remove}
              onRemove={() => update({ gatherings: value.gatherings.filter((_, i) => i !== index) })}
            >
              <div className="settings-grid">
                <TextField
                  label={isKo ? '배지' : 'Badge'}
                  value={gathering.badge}
                  onChange={(badge) => updateGathering(index, { badge })}
                  hint={isKo ? '카드 모서리의 짧은 글자' : 'Short mark on the card'}
                  placeholder="WED"
                />
              </div>
              <BilingualField
                label={isKo ? '모임 이름' : 'Gathering name'}
                value={gathering.title}
                onChange={(title) => updateGathering(index, { title })}
              />
              <BilingualField
                label={isKo ? '시간 · 장소' : 'When and where'}
                value={gathering.detail}
                onChange={(detail) => updateGathering(index, { detail })}
                multiline
              />
            </ItemCard>
          ))}
          {value.gatherings.length < MAX_GATHERINGS ? (
            <button
              type="button"
              className="settings-add"
              onClick={() =>
                update({ gatherings: [...value.gatherings, emptyGathering(value.gatherings)] })
              }
            >
              + {isKo ? '모임 추가' : 'Add a gathering'}
            </button>
          ) : null}
        </div>
      </SettingsPanel>
    </div>
  );
};

export default ChurchInfoFields;
