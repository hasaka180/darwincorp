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
  // Flatten @graph blocks: bespoke pages group their schema in one graph.
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(m => { const d = JSON.parse(m[1]); return d["@graph"] || [d]; });
  assert.ok(data.some(d => d["@type"] === "BreadcrumbList"), `${route}: missing breadcrumbs`);
  // /locations/worldwide is a bespoke hub described as a WebPage, not a Service.
  if ((route.startsWith("/services/") || route.startsWith("/industries/") || route.startsWith("/locations/")) && route !== "/locations/worldwide") {
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
assert.equal(routes.length, 59);
console.log(`Verified ${routes.length} pages: unique metadata, H1s, canonicals, sitemap, structured data, local images and ${links} internal links.`);

// One host everywhere. The server 301s every other host to this one, so a
// canonical, og:url or sitemap entry on another host points at a redirect.
const robots = fs.readFileSync(path.join(buildDir, "server/app/robots.txt.body"), "utf8");
const origins = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).origin));
assert.equal(origins.size, 1, `sitemap mixes hosts: ${[...origins]}`);
const [origin] = origins;
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), "robots.txt names a different sitemap host");

const CORE = ["/", "/services", "/services/website-development", "/services/brand-identity", "/contact", "/journal", "/work", "/cases", "/careers"];
const ldTypes = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(m => { const d = JSON.parse(m[1]); return (d["@graph"] || [d]).map(x => x["@type"]); });
for (const route of [...CORE, ...routes]) {
  const html = fs.readFileSync(path.join(buildDir, "server/app", route === "/" ? "index.html" : `${route.slice(1)}.html`), "utf8");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
  assert.equal(new URL(canonical).origin, origin, `${route}: canonical on another host`);
  // A page that inherits the layout's og:url tells social sites it is the homepage.
  assert.equal(ogUrl && new URL(ogUrl).href.replace(/\/$/, ""), canonical.replace(/\/$/, ""), `${route}: og:url ${ogUrl} is not its canonical`);
  assert.ok(ldTypes(html).filter(t => t === "FAQPage").length <= 1, `${route}: more than one FAQPage`);
}

// The homepage is the strongest page; it must link to the main service pages.
const home = fs.readFileSync(path.join(buildDir, "server/app/index.html"), "utf8");
for (const target of ["/services/website-development", "/services/brand-identity"]) {
  assert.ok(home.includes(`href="${target}"`), `homepage does not link to ${target}`);
}
console.log(`Verified one host (${origin}) across sitemap, robots, canonicals and og:url on ${CORE.length + routes.length} pages.`);
