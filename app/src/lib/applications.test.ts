import test from 'node:test';
import assert from 'node:assert';
import {
  applicationStatus,
  filterApplications,
  highlightedApplications,
  statusLabel,
} from './applications';
import type { ApiApplication } from './contentApi';

const application = (values: Partial<ApiApplication>): ApiApplication => ({
  id: '1',
  title: 'MS 계정 신청',
  description: '교회 계정',
  formUrl: 'https://forms.office.com/r/account',
  category: 'account',
  visibility: 'member',
  opensOn: '',
  closesOn: '',
  published: true,
  highlightOnHome: false,
  ...values,
});

test('an application is open through its closing date', () => {
  assert.strictEqual(
    applicationStatus(application({ opensOn: '2026-09-01', closesOn: '2026-09-27' }), '2026-09-27'),
    'open'
  );
});

test('an application is scheduled before it opens and closed after it ends', () => {
  const item = application({ opensOn: '2026-10-01', closesOn: '2026-10-31' });
  assert.strictEqual(applicationStatus(item, '2026-09-27'), 'scheduled');
  assert.strictEqual(applicationStatus(item, '2026-11-01'), 'closed');
});

test('a draft stays a draft even inside its dates', () => {
  assert.strictEqual(applicationStatus(application({ published: false }), '2026-09-27'), 'draft');
});

test('filters applications by category and title', () => {
  const items = [
    application({ id: 'a', title: 'MS 계정', category: 'account' }),
    application({ id: 'b', title: '생명의 삶', category: 'discipleship' }),
  ];
  assert.deepStrictEqual(
    filterApplications(items, 'discipleship', '생명').map((item) => item.id),
    ['b']
  );
});

test('home highlights are the open applications marked for the homepage', () => {
  const items = [
    application({ id: 'open', highlightOnHome: true }),
    application({ id: 'later', highlightOnHome: true, opensOn: '2026-12-01' }),
    application({ id: 'quiet', highlightOnHome: false }),
  ];
  assert.deepStrictEqual(
    highlightedApplications(items, '2026-09-27').map((item) => item.id),
    ['open']
  );
});

test('status labels stay short in Korean', () => {
  assert.strictEqual(statusLabel('open', 'ko'), '접수 중');
  assert.strictEqual(statusLabel('closed', 'ko'), '마감');
});
