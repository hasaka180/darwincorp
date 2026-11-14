import { LOOKS, SCHEDULE, type Look } from "./looks";

/** The one-minute cycle: four seasons of 15 s, each from morning to night. */
export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
export const SEASON_LENGTH = 15;
export const CYCLE = SEASON_LENGTH * SEASONS.length;

const smooth = (k: number) => k * k * (3 - 2 * k);

/** The look at cycle time t, eased between schedule keys (mirrors look_at in the Blender script). */
export function lookAt(t: number, out: Look = { ...LOOKS["spring-morning"] }): Look {
  t = Math.max(0, Math.min(CYCLE, t));
  for (let i = 0; i < SCHEDULE.length - 1; i++) {
    const [t0, a] = SCHEDULE[i], [t1, b] = SCHEDULE[i + 1];
    if (t < t0 || t > t1) continue;
    const k = t1 === t0 ? 0 : smooth((t - t0) / (t1 - t0));
    const A = LOOKS[a], B = LOOKS[b];
    for (const key of Object.keys(A) as (keyof Look)[]) {
      const va = A[key], vb = B[key];
      if (Array.isArray(va)) {
        const arr = (out[key] as number[]) ?? [0, 0, 0];
        for (let c = 0; c < 3; c++) arr[c] = va[c] + ((vb as number[])[c] - va[c]) * k;
        (out as Record<string, unknown>)[key] = arr;
      } else {
        (out as Record<string, unknown>)[key] = va + ((vb as number) - va) * k;
      }
    }
    return out;
  }
  return Object.assign(out, LOOKS[SCHEDULE[SCHEDULE.length - 1][1]]);
}

const SEGMENTS: [number, string][] = [
  [0, "Morning"], [4.4, "Rain shower"], [8.6, "Sunset"], [12, "Night"],
  [15, "Morning"], [17.4, "Midday"], [22.6, "Golden hour"], [26.6, "Night"],
  [30, "Misty morning"], [33.4, "Storm"], [39.4, "Sunset"], [42.3, "Night"],
  [45, "Frosty morning"], [47, "Snowfall"], [52.2, "Dusk"], [54, "Snowy night"],
];
export function labelAt(t: number) {
  let label = SEGMENTS[0][1];
  for (const [start, name] of SEGMENTS) if (t >= start) label = name;
  return `${SEASONS[Math.floor(t / SEASON_LENGTH) % 4]} · ${label}`;
}

export type Weather = { rain: number; snow: number; leaves: number; storm: number };
const ramp = (a: number, b: number, v: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const pulse = (t: number, a: number, b: number, r = 0.8) => ramp(a, a + r, t) * (1 - ramp(b - r, b, t));
/** Falling weather over the cycle: the spring shower, the autumn storm, winter snow. */
export function weatherAt(t: number): Weather {
  const shower = pulse(t, 4.4, 8.4), storm = pulse(t, 33.4, 39.2);
  return {
    rain: shower * 0.8 + storm,
    storm,
    leaves: pulse(t, 30.2, 42, 1) * 0.45 + storm * 0.55,
    snow: pulse(t, 46.8, 52.4, 1) + pulse(t, 52, 58.2, 1) * 0.55,
  };
}

/** Gulls stay grounded at night, in the storm and in heavy snow. */
export const NO_FLY: [number, number][] = [[11.8, 15.6], [26.4, 30.4], [34.4, 38.4], [42, 45.8], [48, 50.6], [53.6, 60.5]];
