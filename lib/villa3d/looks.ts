// Generated from STATES / SCHEDULE / HOLDS in scripts/create-villa-scene.py, so the
// live scene keeps the same looks and timing as the Blender renders.

export type Look = {
  sunElev: number;
  sunRot: number;
  overcast: number;
  overTop: [number, number, number];
  overHorizon: [number, number, number];
  aerosol: number;
  moonPower: number;
  stars: number;
  lights: number;
  snow: number;
  wet: number;
  spring: number;
  autumn: number;
  winter: number;
  peaks: number;
  exposure: number;
  leaves: number;
  fog: number;
  grass: number;
  wind: number;
  waves: number;
  frozen: number;
  snowcap: number;
  clouds: number;
  whitecaps: number;
};

export const LOOKS: Record<string, Look> = {
  "spring-morning": { sunElev: 16, sunRot: -120, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 0.35, snow: 0, wet: 0.25, spring: 1, autumn: 0, winter: 0, peaks: 0.35, exposure: 0, leaves: 1, fog: 0.00045, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "spring-rain": { sunElev: 40, sunRot: -150, overcast: 0.93, overTop: [0.22, 0.24, 0.27], overHorizon: [0.34, 0.36, 0.38], aerosol: 1, moonPower: 0, stars: 0, lights: 0.55, snow: 0, wet: 1, spring: 1, autumn: 0, winter: 0, peaks: 0.35, exposure: 0.2, leaves: 1, fog: 0.0011, grass: 1, wind: 0.55, waves: 1.5, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0.21429 },
  "spring-sunset": { sunElev: 1.5, sunRot: -6, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 0.8, snow: 0, wet: 0, spring: 1, autumn: 0, winter: 0, peaks: 0.35, exposure: 0, leaves: 1, fog: 0.00045, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "spring-night": { sunElev: -6.5, sunRot: -20, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0.6, stars: 1, lights: 1, snow: 0, wet: 0, spring: 1, autumn: 0, winter: 0, peaks: 0.35, exposure: 0.4, leaves: 1, fog: 0.0003, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "summer-morning": { sunElev: 20, sunRot: -115, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 0, snow: 0, wet: 0, spring: 0, autumn: 0, winter: 0, peaks: 0.2, exposure: 0, leaves: 1, fog: 0.00045, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "summer-noon": { sunElev: 62, sunRot: -160, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 0.5, moonPower: 0, stars: 0, lights: 0, snow: 0, wet: 0, spring: 0, autumn: 0, winter: 0, peaks: 0.2, exposure: -0.15, leaves: 1, fog: 0.00045, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.3, whitecaps: 0 },
  "summer-sunset": { sunElev: 1.2, sunRot: -3, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 0.85, snow: 0, wet: 0, spring: 0, autumn: 0, winter: 0, peaks: 0, exposure: 0, leaves: 1, fog: 0.00045, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.5, whitecaps: 0 },
  "summer-night": { sunElev: -6.5, sunRot: -20, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0.6, stars: 1, lights: 1, snow: 0, wet: 0, spring: 0, autumn: 0, winter: 0, peaks: 0, exposure: 0.4, leaves: 1, fog: 0.0003, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "autumn-morning": { sunElev: 12, sunRot: -125, overcast: 0.35, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 3, moonPower: 0, stars: 0, lights: 0, snow: 0, wet: 0.3, spring: 0, autumn: 1, winter: 0, peaks: 0.4, exposure: 0, leaves: 0.8, fog: 0.0014, grass: 1, wind: 0.4, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "autumn-storm": { sunElev: 22, sunRot: 150, overcast: 1, overTop: [0.1, 0.11, 0.13], overHorizon: [0.2, 0.21, 0.23], aerosol: 1, moonPower: 0, stars: 0, lights: 0.75, snow: 0, wet: 1, spring: 0, autumn: 1, winter: 0, peaks: 0.4, exposure: 0.35, leaves: 0.6, fog: 0.0018, grass: 1, wind: 1, waves: 2.8, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 1 },
  "autumn-sunset": { sunElev: 2.5, sunRot: -8, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 3, moonPower: 0, stars: 0, lights: 0.85, snow: 0, wet: 0, spring: 0, autumn: 1, winter: 0, peaks: 0.4, exposure: 0, leaves: 0.55, fog: 0.00045, grass: 1, wind: 0.45, waves: 1.4, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0.14286 },
  "autumn-night": { sunElev: -6.5, sunRot: -20, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0.5, stars: 0.8, lights: 1, snow: 0, wet: 0, spring: 0, autumn: 1, winter: 0, peaks: 0.4, exposure: 0.4, leaves: 0.55, fog: 0.0004, grass: 1, wind: 0.25, waves: 1, frozen: 0, snowcap: 0, clouds: 0.35, whitecaps: 0 },
  "winter-morning": { sunElev: 9, sunRot: -130, overcast: 0.3, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 0, snow: 0.85, wet: 0, spring: 0, autumn: 0, winter: 1, peaks: 1, exposure: 0, leaves: 0.3, fog: 0.0012, grass: 0.4, wind: 0.25, waves: 1, frozen: 0.8, snowcap: 0.6, clouds: 0.35, whitecaps: 0 },
  "winter-snowfall": { sunElev: 18, sunRot: -150, overcast: 0.9, overTop: [0.42, 0.44, 0.48], overHorizon: [0.56, 0.58, 0.61], aerosol: 1, moonPower: 0, stars: 0, lights: 0.6, snow: 1, wet: 0, spring: 0, autumn: 0, winter: 1, peaks: 1, exposure: 0.1, leaves: 0.3, fog: 0.0013, grass: 0.3, wind: 0.4, waves: 1.3, frozen: 1, snowcap: 1, clouds: 0.35, whitecaps: 0.07143 },
  "winter-dusk": { sunElev: -3, sunRot: -10, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0, stars: 0, lights: 1, snow: 1, wet: 0, spring: 0, autumn: 0, winter: 1, peaks: 1, exposure: 0, leaves: 0.3, fog: 0.0008, grass: 0.3, wind: 0.25, waves: 1, frozen: 1, snowcap: 1, clouds: 0.35, whitecaps: 0 },
  "winter-night": { sunElev: -6.5, sunRot: -20, overcast: 0, overTop: [0.5, 0.52, 0.56], overHorizon: [0.62, 0.64, 0.66], aerosol: 1, moonPower: 0.7, stars: 1, lights: 1, snow: 1, wet: 0, spring: 0, autumn: 0, winter: 1, peaks: 1, exposure: 0.35, leaves: 0.3, fog: 0.0004, grass: 0.3, wind: 0.25, waves: 1, frozen: 1, snowcap: 1, clouds: 0.35, whitecaps: 0 },
};

/** Seconds into the one-minute cycle -> look; repeated keys hold, the light eases between them. */
export const SCHEDULE: [number, string][] = [
  [0, "spring-morning"], [2.6, "spring-morning"], [4.4, "spring-rain"], [7.6, "spring-rain"],
  [9.4, "spring-sunset"], [11, "spring-sunset"], [12.6, "spring-night"], [14, "spring-night"],
  [15.6, "summer-morning"], [17.4, "summer-noon"], [21.2, "summer-noon"], [23.8, "summer-sunset"],
  [25.8, "summer-sunset"], [27.4, "summer-night"], [29, "summer-night"], [30.6, "autumn-morning"],
  [32.4, "autumn-morning"], [34, "autumn-storm"], [38.6, "autumn-storm"], [40.2, "autumn-sunset"],
  [41.6, "autumn-sunset"], [43, "autumn-night"], [44.2, "autumn-night"], [45.8, "winter-morning"],
  [47.4, "winter-snowfall"], [51, "winter-snowfall"], [53, "winter-dusk"], [54.6, "winter-night"],
  [58.2, "winter-night"], [60, "spring-morning"],
];
export const HOLDS: Record<string, number> = {"spring-morning":1.3, "spring-rain":6, "spring-sunset":10.2, "spring-night":13.3, "summer-morning":15.6, "summer-noon":19.3, "summer-sunset":24.8, "summer-night":28.2, "autumn-morning":31.5, "autumn-storm":36.3, "autumn-sunset":40.9, "autumn-night":43.6, "winter-morning":45.8, "winter-snowfall":49.2, "winter-dusk":53, "winter-night":56.4};
