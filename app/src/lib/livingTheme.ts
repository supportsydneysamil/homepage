export const LIVING_CHAOS = 0.55;
export const LIVING_UPDATE_MS = 2_000;
export const LIVING_TRANSITION_MS = 1_200;

export type LivingTarget = {
  hue: number;
  sat: number;
  rawDark: number;
  side: 0 | 1;
};

export type LivingTone = {
  hue: number;
  sat: number;
  dark: number;
  flip: 0 | 1;
};

type ClockPoint = {
  hour: number;
  hue: number;
  sat: number;
  dark: number;
};

const CLOCK_POINTS: readonly ClockPoint[] = [
  { hour: 5.5, hue: 265, sat: 34, dark: 0.86 },
  { hour: 7, hue: 214, sat: 44, dark: 0.26 },
  { hour: 9, hue: 202, sat: 48, dark: 0.03 },
  { hour: 13, hue: 198, sat: 46, dark: 0 },
  { hour: 16.5, hue: 210, sat: 48, dark: 0.06 },
  { hour: 18.3, hue: 25, sat: 62, dark: 0.46 },
  { hour: 19.5, hue: 350, sat: 52, dark: 0.82 },
  { hour: 21.5, hue: 252, sat: 40, dark: 0.95 },
  { hour: 23.5, hue: 232, sat: 36, dark: 0.98 },
];

const TAU = Math.PI * 2;
const DAY_MS = 86_400_000;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const lerpHue = (from: number, to: number, progress: number) => {
  const distance = ((to - from + 540) % 360) - 180;
  return (from + distance * progress + 360) % 360;
};

const smoothstep = (progress: number) => {
  const bounded = clamp(progress, 0, 1);
  return bounded * bounded * (3 - 2 * bounded);
};

const hash = (value: number) => {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43_758.5453;
  return hashed - Math.floor(hashed);
};

const dateSeed = (date: Date) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);

const nextDateSeed = (date: Date) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1) / DAY_MS);

const clockHours = (date: Date) =>
  date.getHours()
  + date.getMinutes() / 60
  + date.getSeconds() / 3_600
  + date.getMilliseconds() / 3_600_000;

const dayProgress = (date: Date) => clockHours(date) / 24;

const clockTone = (hour: number): Omit<LivingTarget, 'side'> => {
  for (let index = 0; index < CLOCK_POINTS.length; index += 1) {
    const current = CLOCK_POINTS[index];
    const next = CLOCK_POINTS[(index + 1) % CLOCK_POINTS.length];
    const nextHour = next.hour > current.hour ? next.hour : next.hour + 24;
    const comparedHour = hour >= current.hour ? hour : hour + 24;
    if (comparedHour >= current.hour && comparedHour <= nextHour) {
      const progress = (comparedHour - current.hour) / (nextHour - current.hour);
      return {
        hue: lerpHue(current.hue, next.hue, progress),
        sat: lerp(current.sat, next.sat, progress),
        rawDark: lerp(current.dark, next.dark, progress),
      };
    }
  }

  return { hue: 198, sat: 46, rawDark: 0 };
};

const wander = (
  seconds: number,
  seed: number,
  firstPeriod: number,
  secondPeriod: number,
  thirdPeriod: number
) =>
  Math.sin(TAU * (seconds / firstPeriod + hash(seed + 1))) * 0.55
  + Math.sin(TAU * (seconds / secondPeriod + hash(seed + 2))) * 0.3
  + Math.sin(TAU * (seconds / thirdPeriod + hash(seed + 3))) * 0.15;

const seededTone = (
  date: Date,
  seed: number,
  chaos: number
): Omit<LivingTarget, 'side'> => {
  const seconds = date.getTime() / 1_000;
  const shiftedHour = (clockHours(date) + (hash(seed + 7) - 0.5) * 1.6 * chaos + 24) % 24;
  const base = clockTone(shiftedHour);
  return {
    hue: (
      base.hue
      + wander(seconds, seed, 1_900, 5_300, 21_100) * 34 * chaos
      + 360
    ) % 360,
    sat: clamp(
      base.sat + wander(seconds, seed + 40, 2_600, 7_700, 18_100) * 14 * chaos,
      14,
      72
    ),
    rawDark: clamp(
      base.rawDark + wander(seconds, seed + 80, 3_100, 9_400, 25_300) * 0.18 * chaos,
      0,
      1
    ),
  };
};

const safeDate = (date: Date) => {
  if (Number.isFinite(date.getTime())) return date;
  const fallback = new Date();
  fallback.setHours(13, 0, 0, 0);
  return fallback;
};

export const computeLivingTarget = (
  inputDate: Date,
  reducedMotion: boolean
): LivingTarget => {
  const date = safeDate(inputDate);
  const chaos = reducedMotion ? 0 : LIVING_CHAOS;

  if (chaos === 0) {
    const base = clockTone(clockHours(date));
    return { ...base, side: base.rawDark < 0.5 ? 0 : 1 };
  }

  // Blend adjacent daily profiles across the whole day. The date still
  // determines the path, but local midnight cannot introduce a visible jump.
  const today = seededTone(date, dateSeed(date), chaos);
  const tomorrow = seededTone(date, nextDateSeed(date), chaos);
  const blend = smoothstep(dayProgress(date));
  const target = {
    hue: lerpHue(today.hue, tomorrow.hue, blend),
    sat: lerp(today.sat, tomorrow.sat, blend),
    rawDark: lerp(today.rawDark, tomorrow.rawDark, blend),
  };
  return { ...target, side: target.rawDark < 0.5 ? 0 : 1 };
};

const dayDarkness = (rawDark: number) => 0.04 + 0.14 * rawDark;
const nightDarkness = (rawDark: number) => 0.8 + 0.19 * rawDark;

const hslToRgb = (hue: number, saturation: number, lightness: number) => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const sat = saturation / 100;
  const light = lightness / 100;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs((normalizedHue / 60) % 2 - 1));
  const offset = light - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (normalizedHue < 60) [red, green] = [chroma, x];
  else if (normalizedHue < 120) [red, green] = [x, chroma];
  else if (normalizedHue < 180) [green, blue] = [chroma, x];
  else if (normalizedHue < 240) [green, blue] = [x, chroma];
  else if (normalizedHue < 300) [red, blue] = [x, chroma];
  else [red, blue] = [chroma, x];

  return [red + offset, green + offset, blue + offset] as const;
};

const relativeLuminance = (rgb: readonly number[]) => {
  const [red, green, blue] = rgb.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (first: number, second: number) =>
  (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

const contrastForFlip = (
  hue: number,
  sat: number,
  dark: number,
  flip: 0 | 1
) => {
  const background = relativeLuminance(hslToRgb(hue, sat, 96 - 90 * dark));
  const ink = flip === 0 ? 0 : 1;
  return contrastRatio(background, ink);
};

export const resolveLivingTone = (
  target: LivingTarget,
  progress = 1
): LivingTone => {
  const eased = smoothstep(progress);
  const day = dayDarkness(target.rawDark);
  const night = nightDarkness(target.rawDark);
  const dark = target.side === 0
    ? lerp(night, day, eased)
    : lerp(day, night, eased);
  const darkContrast = contrastForFlip(target.hue, target.sat, dark, 0);
  const lightContrast = contrastForFlip(target.hue, target.sat, dark, 1);
  return {
    hue: target.hue,
    sat: target.sat,
    dark,
    flip: lightContrast > darkContrast ? 1 : 0,
  };
};

export const contrastRatioForTone = (tone: LivingTone) =>
  contrastForFlip(tone.hue, tone.sat, tone.dark, tone.flip);
