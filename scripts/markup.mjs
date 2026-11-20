import {
  BACK_TO_SEARCH_LABEL,
  CHIPS,
  CONTACT_EMAIL,
  FAZIER_BADGE_ALT,
  FAZIER_BADGE_HEIGHT,
  FAZIER_BADGE_SRC,
  FAZIER_BADGE_WIDTH,
  FAZIER_HREF,
  FILTERS,
  FOOTER_LINKS,
  HOME_NOTE,
  LOGO_HOME_LABEL,
  PAGES,
  SUPPORTING,
  TAGLINE,
  splitLinks,
} from "../src/content.js";
import { formatJobLine, safeApplyUrl } from "../src/format.js";
import { buildSearchUrl } from "../src/searchParams.js";

export const LATEST_PLACEHOLDER = `<section id="latest-mount" hidden></section>`;

const WORDMARK = `<span class="g1">Goo</span><span class="g2">job</span>`;

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function richText(text) {
  return splitLinks(text)
    .map((part) => {
      if (!part.href) return esc(part.text);
      const extra = part.external ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<a href="${esc(part.href)}"${extra}>${esc(part.text)}</a>`;
    })
    .join("");
}

function wordmark({ large = false, heading = false }) {
  const cls = large ? "wordmark" : "wordmark-sm";
  const label = esc(LOGO_HOME_LABEL);
  if (heading) return `<h1 class="${cls}"><a href="/" aria-label="${label}">${WORDMARK}</a></h1>`;
  return `<a class="${cls}" href="/" aria-label="${label}">${WORDMARK}</a>`;
}

export function searchFormHtml() {
  return `<form class="search-form" role="search" action="/search" method="get">
    <div class="search-box">
      <label class="sr-only" for="q">Search jobs</label>
      <span class="search-icon" aria-hidden="true">⌕</span>
      <input id="q" class="search-input" type="search" name="q" aria-label="Search jobs" placeholder="Job title, company, or skill..." autocomplete="off" />
      <label class="sr-only" for="location">Location</label>
      <input id="location" class="search-input loc-input" type="text" name="location" aria-label="Location" placeholder="City or country" autocomplete="off" />
      <button class="search-btn" type="submit">Search</button>
    </div>
  </form>`;
}

function chipsHtml() {
  return CHIPS.map((chip) => {
    const href = buildSearchUrl({ q: chip.q || "", remote: chip.remote || "all" });
    return `<a class="hero-chip" href="${href}">${esc(chip.label)}</a>`;
  }).join("");
}

function xIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>`;
}

export function footerHtml() {
  const links = FOOTER_LINKS.map((link) => `<a href="${link.href}">${esc(link.label)}</a>`).join("");
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
    <nav class="footer-nav" aria-label="Footer">${links}</nav>
    <div class="site-footer-row">
      <a class="footer-email" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      <a class="footer-x" href="https://x.com/contactgoojob" target="_blank" rel="noopener noreferrer" aria-label="Goojob on X" title="Follow Goojob on X">${xIcon()}</a>
    </div>
    <p class="footer-copy">© ${year} Goojob</p>
    <div class="footer-featured">
      <p class="footer-featured-label">Featured on</p>
      <a href="${FAZIER_HREF}" target="_blank" rel="noopener"><img src="${FAZIER_BADGE_SRC}" width="${FAZIER_BADGE_WIDTH}" height="${FAZIER_BADGE_HEIGHT}" alt="${esc(FAZIER_BADGE_ALT)}" loading="lazy" /></a>
    </div>
  </footer>`;
}

export function renderLatestSection(jobs) {
  const cards = [];
  for (const job of jobs) {
    const href = safeApplyUrl(job.apply_url);
    const title = String(job.title || "").trim();
    if (!href || !title) continue;
    cards.push(`<a class="latest-card" href="${esc(href)}" target="_blank" rel="noopener noreferrer">
      <span class="latest-card-main">
        <h3 class="latest-title">${esc(title)}</h3>
        <p class="latest-company">${esc(formatJobLine(job))}</p>
      </span>
      <span class="latest-apply">Apply</span>
    </a>`);
  }
  if (!cards.length) return LATEST_PLACEHOLDER;
  return `<section class="latest-section" id="latest-mount" aria-labelledby="latest-heading">
    <h2 class="latest-heading" id="latest-heading">Latest jobs</h2>
    <div class="latest-list">${cards.join("")}</div>
  </section>`;
}

export function renderHome({ jobs = [] } = {}) {
  const latest = jobs.length ? renderLatestSection(jobs) : LATEST_PLACEHOLDER;
  return `<div class="page-wrap">
    <main class="hero">
      ${wordmark({ large: true, heading: true })}
      <p class="brand-line">${esc(SUPPORTING)}</p>
      <p class="tagline">${esc(TAGLINE)}</p>
      <div class="search-wrap">
        ${searchFormHtml()}
      </div>
      <div class="hero-chips">${chipsHtml()}</div>
      <p class="footer-note">${esc(HOME_NOTE)}</p>
      ${latest}
    </main>
    ${footerHtml()}
  </div>`;
}

export function renderSearch() {
  const filters = FILTERS.map(
    (filter) =>
      `<a class="filter-btn" href="${buildSearchUrl({ remote: filter.key === "all" ? "all" : filter.key })}">${esc(filter.label)}</a>`
  ).join("");
  return `<div class="page-wrap">
    <div class="top-bar">
      ${wordmark({ heading: true })}
      <div class="search-wrap">${searchFormHtml()}</div>
    </div>
    <div class="filters">
      <a class="home-btn" href="/">← Home</a>
      ${filters}
    </div>
    <main class="results-wrap">
      <h2 class="results-heading">Search results</h2>
      <p class="results-note">Each Apply button opens that role's official posting.</p>
      <noscript>
        <p class="empty-copy">JavaScript is required to load search results. Latest roles are listed on the homepage, and every Apply link there opens the official posting.</p>
      </noscript>
    </main>
    ${footerHtml()}
  </div>`;
}

function blocksHtml(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "h2") return `<h2>${esc(block.text)}</h2>`;
      if (block.type === "p") return `<p>${richText(block.text)}</p>`;
      if (block.type === "ul") {
        return `<ul>${block.items.map((item) => `<li>${richText(item)}</li>`).join("")}</ul>`;
      }
      return "";
    })
    .join("");
}

export function renderPage(path) {
  const page = PAGES[path];
  if (!page) throw new Error(`Unknown page ${path}`);
  return `<div class="page-wrap">
    <header class="sub-header">${wordmark({ heading: false })}<a class="back-home" href="/">${esc(BACK_TO_SEARCH_LABEL)}</a></header>
    <main class="prose">
      <h1>${esc(page.h1)}</h1>
      ${blocksHtml(page.blocks)}
    </main>
    ${footerHtml()}
  </div>`;
}

export function pagePaths() {
  return Object.keys(PAGES);
}
