import type { CSSProperties } from 'react';

export type ImageComposition = {
  focusX: number;
  focusY: number;
  zoom: number;
};

export type SiteImagePresentation = {
  hero: ImageComposition;
  pastor: ImageComposition;
};

export const DEFAULT_IMAGE_PRESENTATION: SiteImagePresentation = {
  hero: { focusX: 50, focusY: 50, zoom: 1 },
  pastor: { focusX: 50, focusY: 24, zoom: 1 },
};

const clamp = (value: unknown, minimum: number, maximum: number, fallback: number) => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, number));
};

const parseComposition = (
  input: unknown,
  fallback: ImageComposition
): ImageComposition => {
  const row = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    focusX: clamp(row.focusX, 0, 100, fallback.focusX),
    focusY: clamp(row.focusY, 0, 100, fallback.focusY),
    zoom: clamp(row.zoom, 1, 2, fallback.zoom),
  };
};

export const parseImagePresentation = (input: unknown): SiteImagePresentation => {
  const row = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  return {
    hero: parseComposition(row.hero, DEFAULT_IMAGE_PRESENTATION.hero),
    pastor: parseComposition(row.pastor, DEFAULT_IMAGE_PRESENTATION.pastor),
  };
};

export const imagePresentationStyle = (
  value: ImageComposition
): CSSProperties => {
  const position = `${value.focusX}% ${value.focusY}%`;
  return {
    objectPosition: position,
    transform: `scale(${value.zoom})`,
    transformOrigin: position,
  };
};

export const sameImageComposition = (
  left: ImageComposition,
  right: ImageComposition
) =>
  left.focusX === right.focusX &&
  left.focusY === right.focusY &&
  left.zoom === right.zoom;
