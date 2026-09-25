import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyLivingTone,
  clearLivingTone,
  LIVING_PROPERTIES,
} from './useLivingTheme';

const fakeStyle = () => {
  const values = new Map<string, string>();
  return {
    values,
    setProperty(name: string, value: string) {
      values.set(name, value);
    },
    removeProperty(name: string) {
      values.delete(name);
      return '';
    },
  };
};

test('writes all four Living properties', () => {
  const style = fakeStyle();
  applyLivingTone(style, { hue: 210.25, sat: 48.5, dark: 0.12, flip: 0 });
  assert.deepEqual(Array.from(style.values.keys()), LIVING_PROPERTIES);
  assert.equal(style.values.get('--living-hue'), '210.250');
  assert.equal(style.values.get('--living-sat'), '48.500%');
  assert.equal(style.values.get('--living-dark'), '12.00%');
  assert.equal(style.values.get('--living-flip'), '0%');
});

test('clears every Living property when the theme deactivates', () => {
  const style = fakeStyle();
  applyLivingTone(style, { hue: 210, sat: 48, dark: 0.12, flip: 0 });
  clearLivingTone(style);
  assert.equal(style.values.size, 0);
});
