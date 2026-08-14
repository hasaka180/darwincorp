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
};

export default nextConfig;
