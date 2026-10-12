import test from 'node:test';
import assert from 'node:assert';
import { CONTACT_TOPICS, parseContactTopic } from './contact';

test('known topics pass through', () => {
  for (const topic of CONTACT_TOPICS) {
    assert.strictEqual(parseContactTopic(topic), topic);
  }
});

test('missing, unknown, or repeated topics fall back to general', () => {
  for (const value of [undefined, '', 'Prayer', 'spam', ['prayer'], 42]) {
    assert.strictEqual(parseContactTopic(value), 'general', String(value));
  }
});
