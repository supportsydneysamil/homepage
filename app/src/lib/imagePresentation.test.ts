import test from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_IMAGE_PRESENTATION,
  imagePresentationStyle,
  parseImagePresentation,
  sameImageComposition,
} from './imagePresentation';

test('missing image presentation uses slot-specific defaults', () => {
  assert.deepStrictEqual(parseImagePresentation(null), DEFAULT_IMAGE_PRESENTATION);
  assert.strictEqual(DEFAULT_IMAGE_PRESENTATION.hero.focusY, 50);
  assert.strictEqual(DEFAULT_IMAGE_PRESENTATION.pastor.focusY, 24);
});

test('image presentation clamps unsafe coordinates and zoom', () => {
  const parsed = parseImagePresentation({
    hero: { focusX: -10, focusY: 140, zoom: 4 },
    pastor: { focusX: 35, focusY: 42, zoom: 1.25 },
  });

  assert.deepStrictEqual(parsed.hero, { focusX: 0, focusY: 100, zoom: 2 });
  assert.deepStrictEqual(parsed.pastor, { focusX: 35, focusY: 42, zoom: 1.25 });
});

test('image presentation style keeps crop and zoom anchored to the focal point', () => {
  assert.deepStrictEqual(
    imagePresentationStyle({ focusX: 30, focusY: 65, zoom: 1.2 }),
    {
      objectPosition: '30% 65%',
      transform: 'scale(1.2)',
      transformOrigin: '30% 65%',
    }
  );
});

test('composition equality detects unsaved focus and zoom changes', () => {
  const base = { focusX: 50, focusY: 50, zoom: 1 };
  assert.strictEqual(sameImageComposition(base, { ...base }), true);
  assert.strictEqual(sameImageComposition(base, { ...base, focusX: 51 }), false);
  assert.strictEqual(sameImageComposition(base, { ...base, zoom: 1.01 }), false);
});
