import type { ChurchGathering, ChurchInfo, ChurchService, LocalizedText } from '../../lib/churchInfo';
import BilingualField from './BilingualField';

type Labels = {
  churchTitle: string;
  contactTitle: string;
  servicesTitle: string;
  gatheringsTitle: string;
  addService: string;
  addGathering: string;
  remove: string;
};

const emptyService = (index: number): ChurchService => ({
  id: `service-${index + 1}`,
  time: '',
  period: 'AM',
  label: { ko: '', en: '' },
  note: { ko: '', en: '' },
});

const emptyGathering = (index: number): ChurchGathering => ({
  id: `gathering-${index + 1}`,
  badge: '',
  title: { ko: '', en: '' },
  detail: { ko: '', en: '' },
});

const textField = (
  label: string,
  value: string,
  onChange: (next: string) => void
) => (
  <label className="settings-field">
    <span>{label}</span>
    <input value={value} onChange={(event) => onChange(event.currentTarget.value)} />
  </label>
);

const ChurchInfoFields = ({
  value,
  onChange,
  labels,
  isKo,
}: {
  value: ChurchInfo;
  onChange: (next: ChurchInfo) => void;
  labels: Labels;
  isKo: boolean;
}) => {
  const update = (patch: Partial<ChurchInfo>) => onChange({ ...value, ...patch });
  const updateService = (index: number, patch: Partial<ChurchService>) => {
    onChange({
      ...value,
      services: value.services.map((service, i) => (i === index ? { ...service, ...patch } : service)),
    });
  };
  const updateGathering = (index: number, patch: Partial<ChurchGathering>) => {
    onChange({
      ...value,
      gatherings: value.gatherings.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  };

  return (
    <>
      <div className="settings-fields">
        <h3>{labels.churchTitle}</h3>
        {textField(isKo ? '영문 교회명' : 'Church name (EN)', value.churchNameEn, (churchNameEn) =>
          update({ churchNameEn })
        )}
        {textField(isKo ? '한글 교회명' : 'Church name (KO)', value.churchNameKo, (churchNameKo) =>
          update({ churchNameKo })
        )}
        {textField(isKo ? '헤더 브랜드' : 'Header brand', value.brandTitle, (brandTitle) => update({ brandTitle }))}
        {textField(isKo ? '담임목사 (한글)' : 'Pastor name (KO)', value.pastorNameKo, (pastorNameKo) =>
          update({ pastorNameKo })
        )}
        {textField(isKo ? '담임목사 (영문)' : 'Pastor name (EN)', value.pastorNameEn, (pastorNameEn) =>
          update({ pastorNameEn })
        )}
      </div>

      <div className="settings-fields">
        <h3>{labels.contactTitle}</h3>
        {textField(isKo ? '전화' : 'Phone', value.phone, (phone) => update({ phone }))}
        {textField(isKo ? '이메일' : 'Email', value.email, (email) => update({ email }))}
        {textField(isKo ? '주소 1줄' : 'Address line 1', value.addressLine1, (addressLine1) =>
          update({ addressLine1 })
        )}
        {textField(isKo ? '주소 2줄' : 'Address line 2', value.addressLine2, (addressLine2) =>
          update({ addressLine2 })
        )}
        {textField(isKo ? '지역 표기' : 'Suburb', value.suburb, (suburb) => update({ suburb }))}
        {textField(isKo ? '지도 검색어' : 'Maps search', value.mapsQuery, (mapsQuery) => update({ mapsQuery }))}
      </div>

      <div className="settings-fields">
        <h3>{labels.servicesTitle}</h3>
        {value.services.map((service, index) => (
          <article className="settings-repeat" key={service.id}>
            <div className="settings-repeat__row">
              {textField(isKo ? '시간' : 'Time', service.time, (time) => updateService(index, { time }))}
              {textField(isKo ? '오전/오후' : 'Period', service.period, (period) => updateService(index, { period }))}
              <button
                type="button"
                className="settings-photo__reset"
                onClick={() =>
                  onChange({ ...value, services: value.services.filter((_, i) => i !== index) })
                }
              >
                {labels.remove}
              </button>
            </div>
            <BilingualField
              label={isKo ? '예배 이름' : 'Service name'}
              value={service.label}
              onChange={(label: LocalizedText) => updateService(index, { label })}
            />
            <BilingualField
              label={isKo ? '안내' : 'Note'}
              value={service.note}
              onChange={(note: LocalizedText) => updateService(index, { note })}
            />
          </article>
        ))}
        {value.services.length < 4 ? (
          <button
            type="button"
            className="settings-photo__reset"
            onClick={() => onChange({ ...value, services: [...value.services, emptyService(value.services.length)] })}
          >
            {labels.addService}
          </button>
        ) : null}
      </div>

      <div className="settings-fields">
        <h3>{labels.gatheringsTitle}</h3>
        {value.gatherings.map((gathering, index) => (
          <article className="settings-repeat" key={gathering.id}>
            <div className="settings-repeat__row">
              {textField(isKo ? '배지' : 'Badge', gathering.badge, (badge) => updateGathering(index, { badge }))}
              <button
                type="button"
                className="settings-photo__reset"
                onClick={() =>
                  onChange({ ...value, gatherings: value.gatherings.filter((_, i) => i !== index) })
                }
              >
                {labels.remove}
              </button>
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
          </article>
        ))}
        {value.gatherings.length < 6 ? (
          <button
            type="button"
            className="settings-photo__reset"
            onClick={() =>
              onChange({ ...value, gatherings: [...value.gatherings, emptyGathering(value.gatherings.length)] })
            }
          >
            {labels.addGathering}
          </button>
        ) : null}
      </div>
    </>
  );
};

export default ChurchInfoFields;
