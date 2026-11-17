import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_TITLE, DESCRIPTION, PAGES, SITE_ORIGIN } from "../src/content.js";
import { safeApplyUrl } from "../src/format.js";
import {
  LATEST_PLACEHOLDER,
  renderLatestSection,
  renderPage,
  renderSearch,
} from "./markup.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const API_BASE = process.env.VITE_API_URL || "https://goojob-backend-production.up.railway.app";

function replaceRoot(html, inner) {
  const marker = '<div id="root">';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("Could not find #root in built HTML");
  let index = start + marker.length;
  let depth = 1;
  while (index < html.length && depth > 0) {
    const nextOpen = html.indexOf("<div", index);
    const nextClose = html.indexOf("</div>", index);
    if (nextClose < 0) throw new Error("Could not find the #root close tag");
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) {
        return html.slice(0, start + marker.length) + inner + html.slice(nextClose);
      }
      index = nextClose + 6;
    }
  }
  throw new Error("Could not find the #root close tag");
}

function replaceAttr(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Missing head tag: ${pattern}`);
  return html.replace(pattern, replacement);
}

function setCanonical(html, url) {
  let next = replaceAttr(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`
  );
  next = replaceAttr(
    next,
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`
  );
  next = replaceAttr(
    next,
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${url}" />`
  );
  return next;
}

function setTitle(html, title) {
  const safe = title.replace(/</g, "");
  let next = replaceAttr(html, /<title>[^<]*<\/title>/, `<title>${safe}</title>`);
  next = replaceAttr(
    next,
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${safe}" />`
  );
  next = replaceAttr(
    next,
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${safe}" />`
  );
  return next;
}

async function fetchRecentJobs() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/recent`, {
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`recent jobs HTTP ${res.status}`);
      const data = await res.json();
      const jobs = (data.jobs || []).filter((job) => safeApplyUrl(job.apply_url) && job.title);
      if (jobs.length) return jobs;
      lastError = new Error("recent jobs response had no linkable roles");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function assertHome(html) {
  const required = [
    "<h1",
    "Goo",
    "job",
    "The search engine for jobs",
    "Search a role. Hit Apply.",
    "Apply opens the official posting for that role",
    'role="search"',
    'name="q"',
    'aria-label="Search jobs"',
    'rel="canonical" href="https://www.goojob.io/"',
    "https://www.goojob.io/og.png",
    'property="og:site_name"',
    'property="og:locale"',
    "SearchAction",
    DESCRIPTION,
    BRAND_TITLE,
    "Latest jobs",
    ">Apply<",
  ];
  for (const needle of required) {
    if (!html.includes(needle)) {
      throw new Error(`Prerendered homepage is missing: ${needle}`);
    }
  }
  if (/https:\/\/goojob\.io(?![\w./-]*www)/.test(html) && html.includes("https://goojob.io")) {
    throw new Error("Homepage still points at the apex domain");
  }
  if (html.includes("https://goojob.io/") || html.includes('content="https://goojob.io"')) {
    throw new Error("Homepage still uses the non-www origin");
  }
}

const homePath = path.join(dist, "index.html");
let home = fs.readFileSync(homePath, "utf8");
const jobs = await fetchRecentJobs();
if (!home.includes(LATEST_PLACEHOLDER)) {
  throw new Error("Built homepage has no latest-jobs placeholder");
}
home = home.replace(LATEST_PLACEHOLDER, renderLatestSection(jobs));
const seed = JSON.stringify(
  jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: Boolean(job.remote),
    type: job.type,
    apply_url: safeApplyUrl(job.apply_url),
    logo_color: job.logo_color,
    source: job.source,
    source_type: job.source_type || "direct",
    posted_at: job.posted_at,
  }))
).replace(/</g, "\\u003c");
home = home.replace("</body>", `<script type="application/json" id="recent-data">${seed}</script>\n</body>`);
assertHome(home);
fs.writeFileSync(homePath, home);

const shell = fs.readFileSync(homePath, "utf8").replace(
  /<script type="application\/json" id="recent-data">[\s\S]*?<\/script>\n?/,
  ""
);

const extras = [
  { file: "search.html", path: "/search", title: "Search jobs — Goojob", html: renderSearch() },
  ...Object.keys(PAGES).map((pagePath) => ({
    file: `${pagePath.slice(1)}.html`,
    path: pagePath,
    title: `${PAGES[pagePath].h1} — Goojob`,
    html: renderPage(pagePath),
  })),
];

for (const page of extras) {
  let html = replaceRoot(shell, page.html);
  html = setTitle(html, page.title);
  html = setCanonical(html, `${SITE_ORIGIN}${page.path}`);
  if (!html.includes("<h1")) throw new Error(`${page.file} is missing an h1`);
  fs.writeFileSync(path.join(dist, page.file), html);
}

for (const file of ["robots.txt", "sitemap.xml", "favicon.ico", "apple-touch-icon.png", "og.png"]) {
  if (!fs.existsSync(path.join(dist, file))) {
    throw new Error(`Build did not emit ${file}`);
  }
}

const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
if (!robots.includes("Sitemap: https://www.goojob.io/sitemap.xml")) {
  throw new Error("robots.txt is missing the sitemap URL");
}
for (const url of ["https://www.goojob.io/", "https://www.goojob.io/search", "https://www.goojob.io/privacy"]) {
  if (!sitemap.includes(url)) throw new Error(`sitemap.xml is missing ${url}`);
}

console.log(`Prerendered homepage with ${jobs.length} latest jobs, plus search and info pages.`);
