# Living Theme Design

## Goal

Add a sixth site theme, Living, whose palette drifts continuously. Visitors should notice atmosphere by comparing morning vs evening or today vs tomorrow, not by watching a single page flicker. Existing five themes stay static.

## Product Rules

- Living is a selectable theme in Appearance settings, same save flow as other themes. It is not an overlay on Church Bright / Dark / etc.
- Time of day sets the large shape of the palette (dawn indigo, midday sky, dusk amber/rose, night dark).
- A daily seed derived from the visitor's local calendar date randomizes that day's path so the same clock time is not the same color every day. Refreshing the page on the same date does not re-roll.
- Visitors in the same local timezone see the same Living palette at the same moment. Church-site timezone is not used.
- Within a visit, hue and saturation keep drifting slowly (incommensurate periods). Light vs dark does not drift through mid-gray.
- Chaos intensity is 0.55 (the approved mockup default). That value is a named constant, not an admin control in v1.

## Architecture

Three continuous numbers plus a discrete ink side drive the whole palette.

| Token | Meaning |
| --- | --- |
| `--living-hue` | Base hue in degrees |
| `--living-sat` | Base saturation (percent units, without `%`) |
| `--living-dark` | Darkness after snap, 0 (day) to 1 (night) |
| `--living-flip` | Discrete ink side, 0 (dark text) or 1 (light text) |

`app/src/lib/livingTheme.ts` is a pure module: given a `Date` and reduced-motion flag, it returns `{ hue, sat, dark, flip }`. Tests live in `livingTheme.test.ts` using the existing `tsx --test` convention.

`ThemeContext` applies `theme-living` on `document.body` when `themeId === 'living'`. A 2-second interval (and an immediate tick) writes the four custom properties. When the theme is not Living, the interval is cleared and the four properties are removed so leftover inline values cannot leak into other themes.

`globals.css` defines `body.theme-living` with `hsl()` formulas that consume those four tokens. Background, surfaces, glows, primary, and accent move. Text, heading, and muted ink move only with `--living-flip`, never with the slow wander, so contrast is either day-stable or night-stable.

`THEME_IDS` / `THEME_OPTIONS` in `ThemeContext.tsx` and `SUPPORTED_THEMES` in `api/site-settings/index.js` gain `living`. Appearance radio cards pick it up automatically. Add a `.theme-preview--living` chip.

## Tone Computation

### Clock curve

Interpolate these keypoints around a 24-hour wrap. Hue interpolates the short arc on the color wheel.

| Local hour | Hue | Sat | Dark |
| --- | --- | --- | --- |
| 5.5 | 265 | 34 | 0.86 |
| 7.0 | 214 | 44 | 0.26 |
| 9.0 | 202 | 48 | 0.03 |
| 13.0 | 198 | 46 | 0.00 |
| 16.5 | 210 | 48 | 0.06 |
| 18.3 | 25 | 62 | 0.46 |
| 19.5 | 350 | 52 | 0.82 |
| 21.5 | 252 | 40 | 0.95 |
| 23.5 | 232 | 36 | 0.98 |

### Daily seed and wander

`seed = floor(UTC midnight of the visitor's Y-M-D / 86400000)` so the integer is timezone-stable for a given local calendar date.

Chaos `C = 0.55`.

- Shift the sample hour by `(hash(seed) - 0.5) * 1.6 * C` hours (about ±48 minutes at C=1, ±26 minutes at 0.55) so dusk does not always land at the same clock time.
- Add three-sine wander to hue (±34° × C), sat (±14 × C), and dark (±0.18 × C), with periods that do not share a short common multiple (1900 / 5300 / 21100 seconds and nearby variants). Clamp sat to 14–72 and dark to 0–1.

`prefers-reduced-motion: reduce` zeros wander amplitude and the hour shift. The visitor still gets the clock curve for that date's seed, but it is still.

### Light / dark snap

Do not lerp `--living-flip`. When computed dark crosses 0.5, animate background darkness from the day pole to the night pole (or back) over 1.2 seconds with a smoothstep. Day pole darkness is `0.04 + 0.14 * dark`; night pole is `0.80 + 0.19 * dark`. During that transition, switch `--living-flip` discretely between black and white at the frame where the incoming ink has higher contrast. Exhaustive sampling of the approved hue, saturation, and darkness ranges gives a minimum best-side contrast of 4.58:1; softer 16%/92% ink falls to 3.36:1 and is not permitted. This avoids creating a mid-gray ink color and keeps text readable throughout the snap.

The snap may be visible twice a day. That is accepted. Background-tab pause (`document.visibilityState`) stops the interval; on return, recompute instantly with no catch-up animation other than completing an in-progress 1.2s snap if the side changed while hidden.

Body text contrast against the page background must stay at or above WCAG AA (4.5:1) at every tick, including during the 1.2s snap. Tests sample the clock curve plus snap frames.

## Error Handling and Runtime

- If `Date` is invalid, fall back to the midday keypoint with the daily seed of today.
- Living never requires a network call. Static export remains valid.
- Unknown `themeId` from the API still falls back to `church`, unchanged.

## Testing

- `computeLivingTone` stays in range for hue, sat, dark, flip.
- Adjacent 2-second samples (excluding snap windows) change hue by well under a degree.
- Midnight wrap is continuous in hue (shortest-arc).
- Same local calendar date + same time of day + reduced-motion on yields identical output.
- Different dates at the same clock time differ.
- Crossing dark = 0.5 produces a 1.2s background snap with one discrete ink switch, not a 20-minute gray fade.
- Reduced-motion: wander amplitude is 0.
- `SUPPORTED_THEMES` and front-end `THEME_IDS` both include `living`.
- Selecting a non-Living theme removes Living custom properties from `document.body`.

## Out of Scope

- Admin slider for chaos, custom keypoints, or church timezone.
- Per-visit re-roll.
- Overlaying Living motion onto the other five themes.
- Overlaying Living motion onto photographic home backgrounds. Living paints surfaces from CSS variables (gradients and glows), not `church-bg.png`, so the whole page including Home can follow the palette.
