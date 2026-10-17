import {
  PUBLIC_SECTION_NAV,
  type PublicSection,
  type SectionAvailability,
} from '../../lib/sectionAvailability';
import SettingsPanel from './SettingsPanel';

const SectionAvailabilityFields = ({
  value,
  onChange,
  isKo,
}: {
  value: SectionAvailability;
  onChange: (next: SectionAvailability) => void;
  isKo: boolean;
}) => {
  const description = isKo
    ? '끄면 공개 페이지와 관련 공개 데이터가 숨겨지며 콘텐츠 관리는 계속 사용할 수 있습니다.'
    : 'Turning this off hides the public page and related public data; content management remains available.';

  return (
    <div className="settings-panels">
      <SettingsPanel
        title={isKo ? '공개 메뉴' : 'Public sections'}
        hint={
          isKo
            ? '방문자에게 공개할 일곱 개의 사이트 영역을 선택합니다.'
            : 'Choose which of the seven site sections visitors can access.'
        }
      >
        <div className="settings-items">
          {PUBLIC_SECTION_NAV.map((item) => {
            const section = item.href.slice(1) as PublicSection;
            return (
              <label className="settings-item" key={section}>
                <span className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={value[section]}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        [section]: event.currentTarget.checked,
                      })
                    }
                  />
                  <span>{isKo ? item.labelKo : item.labelEn}</span>
                </span>
                <span className="settings-item__note">{description}</span>
              </label>
            );
          })}
        </div>
      </SettingsPanel>
    </div>
  );
};

export default SectionAvailabilityFields;
