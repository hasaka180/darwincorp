import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Let production QA build alongside an already-running development server.
  distDir: process.env.DARWIN_BUILD_DIR || ".next",
  // Pin the workspace root so a parent-folder lockfile doesn't confuse Next.
  outputFileTracingRoot: __dirname,
  // Hide the Next.js dev-tools / build-activity widget.
  devIndicators: false,
  // Long-lived cache for static media (images, logos, posters, videos).
  // Vercel serves /public with must-revalidate by default, which fails
  // "Add Expires headers". 30-day cache + SWR keeps them fast on repeat
  // visits while still refreshing if an asset is replaced.
  // Sweden and Finland had no Search Console impressions in three months, so
  // they were folded into one Worldwide page. Permanent, so any links or
  // rankings they had carry over instead of ending in a 404.
  async redirects() {
    return [
      { source: "/locations/sweden", destination: "/locations/worldwide", permanent: true },
      { source: "/locations/finland", destination: "/locations/worldwide", permanent: true },
    ];
  },
  async headers() {
    const cache = [
      { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
    ];
    return [
      { source: "/assets/:path*", headers: cache },
      { source: "/video/:path*", headers: cache },
    ];
  },
};

export default nextConfig;
