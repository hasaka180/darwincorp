import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so a parent-folder lockfile doesn't confuse Next.
  outputFileTracingRoot: __dirname,
  // Hide the Next.js dev-tools / build-activity widget.
  devIndicators: false,
  // Long-lived cache for static media (images, logos, posters, videos).
  // Vercel serves /public with must-revalidate by default, which fails
  // "Add Expires headers". 30-day cache + SWR keeps them fast on repeat
  // visits while still refreshing if an asset is replaced.
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
