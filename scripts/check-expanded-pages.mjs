import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Checks the actual production HTML, without requiring a browser or live CMS.
// Run after `npm run build`.
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const buildDir = process.env.DARWIN_BUILD_DIR || ".next";
const routes = readJson("lib/content/expanded-routes.json");
const prerendered = readJson(path.join(buildDir, "prerender-manifest.json")).routes;
const appPaths = readJson(path.join(buildDir, "server/app-paths-manifest.json"));
const known = new Set([...Object.keys(prerendered), ...Object.keys(appPaths).filter(p => p.endsWith("/page")).map(p => p.slice(0, -5) || "/")]);
const sitemap = fs.readFileSync(path.join(buildDir, "server/app/sitemap.xml.body"), "utf8");
const titles = new Set();
const descriptions = new Set();
let links = 0;

for (const route of routes) {
  assert.ok(prerendered[route], `${route}: missing static generation`);
  const html = fs.readFileSync(path.join(buildDir, "server/app", `${route.slice(1)}.html`), "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${route}: expected one H1`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/ )?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(title && !titles.has(title), `${route}: missing or duplicate title`);
  assert.ok(description && !descriptions.has(description), `${route}: missing or duplicate description`);
  titles.add(title); descriptions.add(description);
  assert.equal(new URL(canonical).pathname, route, `${route}: canonical mismatch`);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${route}: absent from sitemap`);
  assert.ok(html.includes('property="og:title"'), `${route}: missing social metadata`);
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.ok(data.some(d => d["@type"] === "BreadcrumbList"), `${route}: missing breadcrumbs`);
  if (route.startsWith("/services/") || route.startsWith("/industries/") || route.startsWith("/locations/")) {
    assert.ok(data.some(d => d["@type"] === "Service"), `${route}: missing Service schema`);
  }
  if (route.startsWith("/journal/") && !route.startsWith("/journal/category/")) {
    assert.ok(data.some(d => d["@type"] === "Article"), `${route}: missing Article schema`);
  }
  for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"?#]*)[^\"]*"/g)) {
    const target = match[1] || "/";
    assert.ok(known.has(target) || fs.existsSync(path.join("public", target)), `${route}: broken internal link ${target}`);
    links++;
  }
  for (const match of html.matchAll(/<img\b[^>]*src="(\/[^"?]*)/g)) {
    assert.ok(fs.existsSync(path.join("public", match[1])), `${route}: missing image ${match[1]}`);
  }
}
assert.equal(routes.length, 60);
console.log(`Verified ${routes.length} pages: unique metadata, H1s, canonicals, sitemap, structured data, local images and ${links} internal links.`);
