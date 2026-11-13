// Markets on the Working worldwide page. The city is the reference point for
// the globe arc and the live clock only; we don't have offices in any of them.
export type Market = {
  name: string;
  kicker: string;
  body: string;
  city: string;
  tz: string;
  lat: number;
  lon: number;
};

export const STUDIO = { name: "United Arab Emirates", city: "Dubai", tz: "Asia/Dubai", lat: 25.2048, lon: 55.2708 };

export const MARKETS: Market[] = [
  { name: "United Kingdom", kicker: "Remote collaboration", city: "London", tz: "Europe/London", lat: 51.5072, lon: -0.1276, body: "Working with teams looking to establish stronger digital identities, modernise their websites and create more engaging online experiences." },
  { name: "United States", kicker: "Remote collaboration", city: "New York", tz: "America/New_York", lat: 40.7128, lon: -74.006, body: "Partnering with ambitious businesses and growing brands on distinctive websites, digital products and creative technology." },
  { name: "Europe", kicker: "Remote collaboration", city: "Amsterdam", tz: "Europe/Amsterdam", lat: 52.3676, lon: 4.9041, body: "Working across diverse audiences and business environments, with thoughtful approaches to digital design, brand communication and localisation." },
  { name: "Asia-Pacific", kicker: "Remote collaboration", city: "Singapore", tz: "Asia/Singapore", lat: 1.3521, lon: 103.8198, body: "Collaborating across time zones to create digital experiences for businesses with regional and international ambitions." },
  { name: "Saudi Arabia & the wider Middle East", kicker: "Remote collaboration", city: "Riyadh", tz: "Asia/Riyadh", lat: 24.7136, lon: 46.6753, body: "Supporting businesses looking to strengthen their digital presence through considered branding, modern websites and interactive experiences." },
];

/** Minutes a zone is ahead of UTC at a given moment (DST-aware). */
export function tzOffset(tz: string, d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - d.getTime()) / 60000);
}
