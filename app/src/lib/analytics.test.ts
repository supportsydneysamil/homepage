import test from 'node:test';
import assert from 'node:assert';
import { cloudflareBeaconConfig } from './analytics';

test('a production build with a token loads the beacon', () => {
  assert.strictEqual(cloudflareBeaconConfig('0123abcdEF', 'production'), '{"token":"0123abcdEF"}');
});

test('no beacon without a token, outside production, or with an unexpected token', () => {
  assert.strictEqual(cloudflareBeaconConfig(undefined, 'production'), null);
  assert.strictEqual(cloudflareBeaconConfig('', 'production'), null);
  assert.strictEqual(cloudflareBeaconConfig('0123abcd', 'development'), null);
  assert.strictEqual(cloudflareBeaconConfig('abc"}<script>', 'production'), null);
});
