import test from 'node:test';
import assert from 'node:assert';
import { fitWithin } from './photoPrep';

test('shrinks a landscape photo so its width meets the cap', () => {
  assert.deepStrictEqual(fitWithin(4000, 3000, 1600), { width: 1600, height: 1200 });
});

test('shrinks a portrait photo so its height meets the cap', () => {
  assert.deepStrictEqual(fitWithin(3000, 4000, 1600), { width: 1200, height: 1600 });
});

test('leaves a photo already inside the cap alone', () => {
  assert.deepStrictEqual(fitWithin(800, 600, 1600), { width: 800, height: 600 });
});

test('leaves a photo exactly at the cap alone', () => {
  assert.deepStrictEqual(fitWithin(1600, 900, 1600), { width: 1600, height: 900 });
  assert.deepStrictEqual(fitWithin(1600, 1600, 1600), { width: 1600, height: 1600 });
});

test('rounds to whole pixels and never goes below one', () => {
  assert.deepStrictEqual(fitWithin(3000, 2000, 1600), { width: 1600, height: 1067 });
  assert.deepStrictEqual(fitWithin(3000, 1000, 1600), { width: 1600, height: 533 });
  assert.deepStrictEqual(fitWithin(10000, 2, 1600), { width: 1600, height: 1 });
});
