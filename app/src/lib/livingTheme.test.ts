import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeLivingTarget,
  contrastRatioForTone,
  LIVING_CHAOS,
  resolveLivingTone,
} from './livingTheme';

test('uses the approved chaos intensity', () => {
  assert.equal(LIVING_CHAOS, 0.55);
});

test('returns bounded values throughout the day', () => {
  for (let minute = 0; minute < 24 * 60; minute += 5) {
    const date = new Date(2026, 8, 25, 0, minute);
    const tone = computeLivingTarget(date, false);
    assert.ok(tone.hue >= 0 && tone.hue < 360);
    assert.ok(tone.sat >= 14 && tone.sat <= 72);
    assert.ok(tone.rawDark >= 0 && tone.rawDark <= 1);
    assert.ok(tone.side === 0 || tone.side === 1);
  }
});

test('is stable for the same local date and time', () => {
  const date = new Date(2026, 8, 25, 15, 30, 10);
  assert.deepEqual(computeLivingTarget(date, false), computeLivingTarget(date, false));
});

test('changes the seeded path on another local date', () => {
  const first = computeLivingTarget(new Date(2026, 8, 25, 15, 30), false);
  const second = computeLivingTarget(new Date(2026, 8, 26, 15, 30), false);
  assert.notDeepEqual(first, second);
});

test('reduced motion removes seeded drift', () => {
  const first = computeLivingTarget(new Date(2026, 8, 25, 15, 30), true);
  const second = computeLivingTarget(new Date(2026, 8, 26, 15, 30), true);
  assert.deepEqual(first, second);
});

test('moves by less than one hue degree per two-second tick outside a side change', () => {
  for (let minute = 0; minute < 24 * 60; minute += 10) {
    const firstDate = new Date(2026, 8, 25, 0, minute, 0);
    const secondDate = new Date(firstDate.getTime() + 2_000);
    const first = computeLivingTarget(firstDate, false);
    const second = computeLivingTarget(secondDate, false);
    if (first.side === second.side) {
      const distance = Math.abs(((second.hue - first.hue + 540) % 360) - 180);
      assert.ok(distance < 1);
    }
  }
});

test('keeps every sampled transition frame at WCAG AA contrast', () => {
  const day = { hue: 210, sat: 48, rawDark: 0.1, side: 0 as const };
  const night = { hue: 252, sat: 40, rawDark: 0.9, side: 1 as const };
  for (const target of [day, night]) {
    for (let step = 0; step <= 100; step += 1) {
      const tone = resolveLivingTone(target, step / 100);
      assert.ok(contrastRatioForTone(tone) >= 4.5);
      assert.ok(tone.flip === 0 || tone.flip === 1);
    }
  }
});

test('is continuous across local midnight', () => {
  const before = computeLivingTarget(new Date(2026, 8, 25, 23, 59, 59), true);
  const after = computeLivingTarget(new Date(2026, 8, 26, 0, 0, 1), true);
  const hueDistance = Math.abs(((after.hue - before.hue + 540) % 360) - 180);
  assert.ok(hueDistance < 1);
  assert.ok(Math.abs(after.rawDark - before.rawDark) < 0.01);
});

test('invalid dates fall back to a safe bounded tone', () => {
  const tone = computeLivingTarget(new Date(Number.NaN), false);
  assert.ok(Number.isFinite(tone.hue));
  assert.ok(Number.isFinite(tone.sat));
  assert.ok(Number.isFinite(tone.rawDark));
});
