import test from 'node:test';
import assert from 'node:assert';
import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MokjangManager from '../components/manage/MokjangManager';
import type { ApiMokjang } from './contentApi';

const noop = () => undefined;

const labels = {
  all: '전체',
  edit: '편집',
  remove: '삭제',
  confirm: '삭제 확인',
  cancel: '취소',
  save: '저장',
  saving: '저장 중...',
  draft: '초안',
  savedMark: '저장됨',
  pages: '목록 페이지',
  previous: '이전',
  next: '다음',
  clearSearch: '검색어 지우기',
  noMatch: '조건에 맞는 자료가 없습니다.',
  published: '공개',
  publishedLive: '공개',
  publishedDraft: '초안',
  photo: '사진',
  photoCurrent: (count: number) => `등록된 사진 ${count}장`,
  photoPending: (count: number) => `저장하면 사진 ${count}장이 삭제됩니다.`,
  countRange: (from: number, to: number, total: number) => `${total}건 중 ${from}–${to}`,
};

const mokjang: ApiMokjang = {
  id: 'm1',
  slug: 'chiangmai',
  nameKo: '치앙마이 목장',
  nameEn: 'Chiang Mai',
  taglineKo: '',
  taglineEn: '',
  suburb: 'Epping',
  meetingDay: 'fri',
  meetingTime: '19:00',
  audience: 'family',
  language: 'ko',
  kidsWelcome: true,
  missionKo: '',
  missionEn: '',
  storyKo: '',
  storyEn: '',
  published: false,
  coverImage: '',
  images: [],
  shepherdName: '김목자',
  partnerName: '',
};

const render = (overrides: Partial<ComponentProps<typeof MokjangManager>> = {}) =>
  renderToStaticMarkup(
    createElement(MokjangManager, {
      lang: 'ko',
      items: [mokjang],
      editing: null,
      showEditor: false,
      photos: [],
      pendingRemovedCount: 0,
      view: { filter: 'all', search: '', page: 1 },
      editId: null,
      flashId: null,
      pendingDeleteId: null,
      status: null,
      labels,
      onAdd: noop,
      onEdit: noop,
      onCancel: noop,
      onSubmit: async () => undefined,
      onViewChange: noop,
      onRequestDelete: noop,
      onConfirmDelete: noop,
      onCancelDelete: noop,
      onRemovePhoto: noop,
      ...overrides,
    })
  );

test('the list shows suburb, day, and a draft badge', () => {
  const html = render();
  assert.match(html, /치앙마이 목장/);
  assert.match(html, /Epping · 금요일 · 초안/);
});

test('the editor groups fields and explains photo consent and member-only names', () => {
  const html = render({ showEditor: true });
  assert.match(html, /기본 정보/);
  assert.match(html, /교인에게만 보이는 정보/);
  assert.match(html, /공개에 동의한 사진만 올려 주세요/);
  assert.match(html, /로그인한 교인에게만 보입니다/);
  assert.match(html, /집 주소는 적지 않습니다/);
});

test('the editor shows the current photos and the saved shepherd name', () => {
  const html = render({ showEditor: true, editing: mokjang, photos: ['/api/files/download/a'] });
  assert.match(html, /등록된 사진 1장/);
  assert.match(html, /src="\/api\/files\/download\/a"/);
  assert.match(html, /value="김목자"/);
});
