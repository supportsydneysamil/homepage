import ContentForm, { type FormField } from './ContentForm';
import ManageList from './ManageList';
import ManageToolbar, { type ManageFilterOption } from './ManageToolbar';
import Pager from '../Pager';
import type { ApiMokjang } from '../../lib/contentApi';
import { paginate } from '../../lib/library';
import { MANAGE_PAGE_SIZE, filterMokjangs, type ManageView } from '../../lib/manageList';
import {
  MOKJANG_AUDIENCES,
  MOKJANG_DAYS,
  MOKJANG_LANGUAGES,
  audienceLabel,
  dayLabel,
  languageLabel,
  mokjangFormValues,
  sortMokjangs,
} from '../../lib/mokjang';
import type { DisplayLanguage } from '../../lib/presentation';

export type ManageStatus = { scope: 'upload' | 'list' | 'gallery'; text: string; isError: boolean };

type SharedLabels = {
  all: string;
  edit: string;
  remove: string;
  confirm: string;
  cancel: string;
  save: string;
  saving: string;
  draft: string;
  savedMark: string;
  pages: string;
  previous: string;
  next: string;
  clearSearch: string;
  noMatch: string;
  published: string;
  publishedLive: string;
  publishedDraft: string;
  photo: string;
  photoCurrent: (count: number) => string;
  photoPending: (count: number) => string;
  countRange: (from: number, to: number, total: number) => string;
};

type MokjangManagerProps = {
  lang: DisplayLanguage;
  items: ApiMokjang[];
  editing: ApiMokjang | null;
  showEditor: boolean;
  photos: string[];
  pendingRemovedCount: number;
  view: ManageView;
  editId: string | null;
  flashId: string | null;
  pendingDeleteId: string | null;
  status: ManageStatus | null;
  labels: SharedLabels;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>, files: File[]) => Promise<void>;
  onViewChange: (changes: Partial<ManageView>) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRemovePhoto: (imageUrl: string) => void;
  coverPhoto: string | null;
  coverPending: boolean;
  onChooseCover: (imageUrl: string) => void;
};

const MokjangManager = ({
  lang,
  items,
  editing,
  showEditor,
  photos,
  pendingRemovedCount,
  view,
  editId,
  flashId,
  pendingDeleteId,
  status,
  labels,
  onAdd,
  onEdit,
  onCancel,
  onSubmit,
  onViewChange,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onRemovePhoto,
  coverPhoto,
  coverPending,
  onChooseCover,
}: MokjangManagerProps) => {
  const isKo = lang === 'ko';
  const text = {
    add: isKo ? '목장 추가' : 'Add a house church',
    edit: isKo ? '목장 수정' : 'Edit house church',
    empty: isKo ? '등록된 목장이 없습니다.' : 'No house churches yet.',
    search: isKo ? '이름 · 지역으로 검색' : 'Search name or suburb',
    filter: isKo ? '공개 상태' : 'Status',
    photoHint: isKo
      ? 'JPG, PNG, WebP 파일을 여러 장 고를 수 있습니다. 목장 식구들이 공개에 동의한 사진만 올려 주세요. 아이 얼굴은 특히 주의해 주세요. 처음 올린 사진이 대표 사진이 되고, 저장한 뒤 사진 목록에서 바꿀 수 있습니다.'
      : 'Pick one or more JPG, PNG, or WebP files. Only upload photos the members agreed to share, and take special care with children’s faces. The first photo uploaded becomes the cover; you can change it in the photo list after saving.',
    cover: isKo ? '대표' : 'Cover',
    coverHint: isKo ? '사진을 누르면 대표 사진이 됩니다.' : 'Select a photo to make it the cover.',
    makeCover: isKo ? '눌러서 대표 사진으로' : 'Make this the cover',
    photoNumber: (number: number) => (isKo ? `사진 ${number}` : `Photo ${number}`),
    removePhoto: isKo ? '사진 삭제' : 'Remove photo',
    coverPending: isKo
      ? '저장하면 대표 사진이 바뀝니다. 취소하면 그대로 남습니다.'
      : 'The cover changes when you save. Cancel keeps the current one.',
    membersOnly: isKo ? '로그인한 교인에게만 보입니다.' : 'Shown only to signed-in members.',
    englishOptional: isKo ? '비워 두면 영어 화면에도 한국어가 나옵니다.' : 'Leave empty to show the Korean text in English too.',
  };

  const sorted = sortMokjangs(items);
  const matched = filterMokjangs(sorted, view.filter, view.search);
  const page = paginate(matched, view.page, MANAGE_PAGE_SIZE);
  const filterOptions: ManageFilterOption[] = [
    { value: 'all', label: labels.all, count: items.length },
    { value: 'published', label: labels.publishedLive, count: items.filter((item) => item.published).length },
    { value: 'draft', label: labels.draft, count: items.filter((item) => !item.published).length },
  ];

  const fields: FormField[] = [
    { name: 'nameKo', label: isKo ? '목장 이름 (한국어)' : 'Name (Korean)', type: 'text', required: true, section: isKo ? '기본 정보' : 'Basics' },
    { name: 'nameEn', label: isKo ? '목장 이름 (영어)' : 'Name (English)', type: 'text', hint: text.englishOptional },
    {
      name: 'slug',
      label: isKo ? '주소 이름' : 'Address name',
      type: 'text',
      hint: isKo
        ? '영어 소문자, 숫자, 하이픈만 씁니다. 비워 두면 영어 이름으로 만듭니다. 예: chiangmai'
        : 'Lowercase letters, numbers, and hyphens. Leave empty to build it from the English name. Example: chiangmai',
    },
    { name: 'taglineKo', label: isKo ? '한 줄 소개 (한국어)' : 'One-line introduction (Korean)', type: 'text' },
    { name: 'taglineEn', label: isKo ? '한 줄 소개 (영어)' : 'One-line introduction (English)', type: 'text', hint: text.englishOptional },
    {
      name: 'suburb',
      label: isKo ? '지역' : 'Suburb',
      type: 'text',
      required: true,
      hint: isKo ? '동네 이름만 적어 주세요. 집 주소는 적지 않습니다.' : 'Enter the suburb only. Never enter a home address.',
    },
    {
      name: 'meetingDay',
      label: isKo ? '모임 요일' : 'Meeting day',
      type: 'select',
      options: MOKJANG_DAYS.map((day) => ({ value: day, label: dayLabel(day, lang, 'long') })),
    },
    { name: 'meetingTime', label: isKo ? '모임 시간' : 'Meeting time', type: 'time', required: true },
    {
      name: 'audience',
      label: isKo ? '대상' : 'Who it is for',
      type: 'select',
      section: isKo ? '모임 정보' : 'Gathering',
      options: MOKJANG_AUDIENCES.map((audience) => ({ value: audience, label: audienceLabel(audience, lang) })),
    },
    {
      name: 'language',
      label: isKo ? '모임 언어' : 'Language',
      type: 'select',
      options: MOKJANG_LANGUAGES.map((language) => ({ value: language, label: languageLabel(language, lang) })),
    },
    {
      name: 'kidsWelcome',
      label: isKo ? '아이 동반' : 'Children',
      type: 'select',
      options: [
        { value: 'false', label: isKo ? '표시 안 함' : 'Do not show' },
        { value: 'true', label: isKo ? '가능해요' : 'Welcome' },
      ],
    },
    { name: 'missionKo', label: isKo ? '후원 선교지 (한국어)' : 'Mission partner (Korean)', type: 'text' },
    { name: 'missionEn', label: isKo ? '후원 선교지 (영어)' : 'Mission partner (English)', type: 'text', hint: text.englishOptional },
    { name: 'storyKo', label: isKo ? '목장 이야기 (한국어)' : 'Story (Korean)', type: 'textarea', section: isKo ? '목장 이야기' : 'Story' },
    { name: 'storyEn', label: isKo ? '목장 이야기 (영어)' : 'Story (English)', type: 'textarea', hint: text.englishOptional },
    {
      name: 'shepherdName',
      label: isKo ? '목자' : 'Shepherd',
      type: 'text',
      hint: text.membersOnly,
      section: isKo ? '교인에게만 보이는 정보' : 'Members only',
    },
    { name: 'partnerName', label: isKo ? '목녀·목부' : 'Co-shepherd', type: 'text', hint: text.membersOnly },
    {
      name: 'published',
      label: labels.published,
      type: 'select',
      section: isKo ? '공개' : 'Publishing',
      options: [
        { value: 'true', label: labels.publishedLive },
        { value: 'false', label: labels.publishedDraft },
      ],
    },
  ];

  return (
    <section className="manage-panel">
      <div className="manage-actions">
        <button type="button" className="manage-button" onClick={onAdd}>
          + {text.add}
        </button>
      </div>

      {showEditor ? (
        <div className="manage-editor" tabIndex={-1}>
          <h2>{editing ? text.edit : text.add}</h2>

          {status?.scope === 'gallery' ? (
            <p className="error-text" role="alert">
              {status.text}
            </p>
          ) : null}

          {pendingRemovedCount ? <p className="muted">{labels.photoPending(pendingRemovedCount)}</p> : null}

          {photos.length ? (
            <fieldset className="manage-gallery manage-gallery--cover">
              <legend className="muted">{labels.photoCurrent(photos.length)}</legend>
              <p className="muted">{text.coverHint}</p>
              {coverPending ? <p className="manage-gallery__note">{text.coverPending}</p> : null}
              <ul>
                {photos.map((image, index) => {
                  const isCover = image === coverPhoto;
                  return (
                    <li key={image} className={isCover ? 'manage-cover manage-cover--current' : 'manage-cover'}>
                      <label>
                        <input
                          type="radio"
                          name="mokjang-cover"
                          className="visually-hidden"
                          aria-label={text.photoNumber(index + 1)}
                          checked={isCover}
                          onChange={() => onChooseCover(image)}
                        />
                        <img src={image} alt="" />
                        {isCover ? (
                          <span className="manage-cover__tag">{text.cover}</span>
                        ) : (
                          <span className="manage-cover__hint" aria-hidden="true">
                            {text.makeCover}
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        className="manage-cover__remove"
                        aria-label={text.removePhoto}
                        onClick={() => onRemovePhoto(image)}
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}

          <ContentForm
            fields={fields}
            fileField={{
              name: 'mokjang-photo',
              label: labels.photo,
              accept: '.jpg,.jpeg,.png,.webp',
              hint: text.photoHint,
              multiple: true,
            }}
            initialValues={mokjangFormValues(editing)}
            submitLabel={labels.save}
            busyLabel={labels.saving}
            cancelLabel={labels.cancel}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        </div>
      ) : null}

      <ManageToolbar
        id="manage-mokjang"
        filterLabel={text.filter}
        filterValue={view.filter}
        filterOptions={filterOptions}
        filterAs="chips"
        onFilterChange={(value) => onViewChange({ filter: value, page: 1 })}
        searchLabel={text.search}
        searchPlaceholder={text.search}
        searchValue={view.search}
        clearLabel={labels.clearSearch}
        onSearchChange={(value) => onViewChange({ search: value, page: 1 })}
        countLabel={labels.countRange(page.from, page.to, matched.length)}
      />

      {status?.scope === 'list' ? (
        <p
          className={status.isError ? 'manage-status manage-status--error' : 'manage-status'}
          role={status.isError ? 'alert' : 'status'}
          aria-live={status.isError ? 'assertive' : 'polite'}
        >
          {status.text}
        </p>
      ) : null}

      <ManageList
        items={page.items.map((item) => ({
          id: item.id,
          primary: item.nameKo,
          secondary: [item.suburb, dayLabel(item.meetingDay, lang, 'long'), item.published ? '' : labels.draft]
            .filter(Boolean)
            .join(' · '),
        }))}
        activeId={editId}
        flashId={flashId}
        flashLabel={labels.savedMark}
        emptyLabel={items.length ? labels.noMatch : text.empty}
        editLabel={labels.edit}
        deleteLabel={labels.remove}
        confirmLabel={labels.confirm}
        cancelLabel={labels.cancel}
        pendingDeleteId={pendingDeleteId}
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
        onConfirmDelete={onConfirmDelete}
        onCancelDelete={onCancelDelete}
      />

      <Pager
        page={page.page}
        pageCount={page.pageCount}
        label={labels.pages}
        previousLabel={labels.previous}
        nextLabel={labels.next}
        onChange={(next) => onViewChange({ page: next })}
      />
    </section>
  );
};

export default MokjangManager;
