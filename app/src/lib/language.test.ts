import test from 'node:test';
import assert from 'node:assert';
import { pickInitialLanguage } from './language';

test('a stored choice wins over the browser languages', () => {
  assert.strictEqual(pickInitialLanguage('en', ['ko-KR']), 'en');
  assert.strictEqual(pickInitialLanguage('ko', ['en-AU']), 'ko');
});

test('any Korean entry in the browser languages picks Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, ['ko-KR', 'en-AU']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'ko']), 'ko');
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'KO-kr']), 'ko');
});

test('browser languages without Korean pick English', () => {
  assert.strictEqual(pickInitialLanguage(null, ['en-AU', 'en']), 'en');
  assert.strictEqual(pickInitialLanguage('fr', ['zh-CN']), 'en');
  assert.strictEqual(pickInitialLanguage(null, ['kok-IN']), 'en');
});

test('no browser language information keeps Korean', () => {
  assert.strictEqual(pickInitialLanguage(null, []), 'ko');
  assert.strictEqual(pickInitialLanguage(null, undefined), 'ko');
});
