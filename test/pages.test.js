import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  BACK_TO_SEARCH_LABEL,
  DESCRIPTION,
  ANOTHER_DIRECTORY_BADGE_SRC,
  ANOTHER_DIRECTORY_HREF,
  FAZIER_BADGE_SRC,
  FAZIER_HREF,
  STARTUP_FAME_BADGE_SRC,
  STARTUP_FAME_HREF,
  FOOTER_LINKS,
  GA_ID,
  GTM_ID,
  LOGO_HOME_LABEL,
  TAGLINE,
} from "../src/content.js";
import { renderHome, renderPage, renderSearch } from "../scripts/markup.mjs";

const home = renderHome({
  jobs: [
    {
      title: "Editor",
      company: "Acme",
      location: "Paris, fr",
      remote: false,
      type: "fulltime_permanent",
      apply_url: "https://jobs.example.com/editor",
    },
    {
      title: "Bad",
      company: "Nope",
      apply_url: "javascript:alert(1)",
    },
  ],
});

test("homepage shell is one h1 with the tagline, a real search form, and apply links", () => {
  assert.equal(home.match(/<h1\b/g).length, 1);
  assert.match(home, /<h1 class="wordmark">/);
  assert.match(home, />Goo<\/span><span class="g2">job</);
  assert.ok(home.includes("The search engine for jobs"));
  assert.ok(home.includes(TAGLINE));
  assert.ok(home.includes("Apply opens the official posting for that role"));
  assert.match(home, /<form class="search-form" role="search" action="\/search" method="get">/);
  assert.match(home, /<label class="sr-only" for="q">Search jobs<\/label>/);
  assert.match(home, /name="q"/);
  assert.match(home, /aria-label="Search jobs"/);
  assert.match(home, /name="location"/);
  assert.match(home, /aria-label="Location"/);
  assert.ok(home.includes("https://jobs.example.com/editor"));
  assert.ok(home.includes(">Apply<"));
  assert.ok(home.includes("Paris, FR"));
  assert.ok(home.includes("Full-time"));
  assert.equal(home.includes("javascript:"), false);
  assert.ok(home.includes('href="/privacy"'));
  assert.match(home, new RegExp(`aria-label="${LOGO_HOME_LABEL}"`));
  assert.match(footerNav(home), /^<nav class="footer-nav" aria-label="Footer"><a href="\/">Home<\/a>/);
  assert.equal(home.includes("millions"), false);
  assert.equal(home.includes("thousands"), false);
});

function footerNav(html) {
  const match = html.match(/<nav class="footer-nav" aria-label="Footer">[\s\S]*?<\/nav>/);
  assert.ok(match, "footer nav");
  return match[0];
}

function footerBlock(html) {
  const start = html.indexOf('<footer class="site-footer">');
  const end = html.indexOf("</footer>", start);
  assert.ok(start >= 0 && end > start, "site footer");
  return html.slice(start, end);
}

test("footer leads with Home, then About, Privacy, Terms, and Contact", () => {
  assert.deepEqual(
    FOOTER_LINKS.map((link) => [link.label, link.href]),
    [
      ["Home", "/"],
      ["About", "/about"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Contact", "/contact"],
    ]
  );
});

test("every page footer links to the featured badges", () => {
  const pages = [
    home,
    renderSearch(),
    renderPage("/about"),
    renderPage("/privacy"),
    renderPage("/terms"),
    renderPage("/contact"),
  ];
  for (const html of pages) {
    const footer = footerBlock(html);
    assert.ok(footer.includes(`href="${FAZIER_HREF}"`));
    assert.ok(footer.includes(FAZIER_BADGE_SRC));
    assert.ok(footer.includes('alt="Fazier badge"'));
    assert.ok(footer.includes('width="120"'));
    assert.ok(footer.includes('height="51"'));
    assert.ok(footer.includes('loading="lazy"'));
    assert.ok(footer.includes(`href="${STARTUP_FAME_HREF}"`));
    assert.ok(footer.includes(STARTUP_FAME_BADGE_SRC));
    assert.ok(footer.includes('alt="Goojob - Featured on Startup Fame"'));
    assert.ok(footer.includes('width="224"'));
    assert.ok(footer.includes('height="36"'));
    const startup = footer.match(/<a href="https:\/\/startupfa\.me\/s\/goojob\?utm_source=www\.goojob\.io"[^>]*>/);
    assert.ok(startup, "startup fame anchor");
    assert.equal(startup[0].includes("nofollow"), false);
    assert.equal(startup[0].includes("rel="), false);
    assert.ok(footer.includes(`href="${ANOTHER_DIRECTORY_HREF}"`));
    assert.ok(footer.includes(ANOTHER_DIRECTORY_BADGE_SRC));
    assert.ok(footer.includes('title="Listed on Another Directory"'));
    assert.ok(footer.includes('alt="Listed on Another Directory"'));
    assert.ok(footer.includes('width="214"'));
    assert.ok(footer.includes('height="48"'));
    const directory = footer.match(/<a href="https:\/\/another\.directory\/tools\/goojob"[^>]*>/);
    assert.ok(directory, "another directory anchor");
    assert.equal(directory[0].includes("nofollow"), false);
    assert.equal(directory[0].includes("rel="), false);
    assert.equal(directory[0].includes("target="), false);
    assert.ok(footer.indexOf(`href="${FAZIER_HREF}"`) < footer.indexOf(`href="${STARTUP_FAME_HREF}"`));
    assert.ok(footer.indexOf(`href="${STARTUP_FAME_HREF}"`) < footer.indexOf(`href="${ANOTHER_DIRECTORY_HREF}"`));
    assert.equal(footerNav(html).includes("fazier.com"), false);
    assert.equal(footerNav(html).includes("startupfa.me"), false);
    assert.equal(footerNav(html).includes("another.directory"), false);
    assert.ok(footer.indexOf("footer-nav") < footer.indexOf("footer-featured"));
    assert.ok(footer.includes("Featured on"));
  }
});

test("search and legal pages are linkable documents", () => {
  const search = renderSearch();
  assert.equal(search.match(/<h1\b/g).length, 1);
  assert.match(search, /<h2 class="results-heading">/);
  assert.match(search, /role="search"/);
  assert.match(search, new RegExp(`<a href="/" aria-label="${LOGO_HOME_LABEL}">`));
  assert.match(footerNav(search), /<a href="\/">Home<\/a><a href="\/about">About<\/a>/);

  const privacy = renderPage("/privacy");
  assert.match(privacy, /<h1>Privacy<\/h1>/);
  assert.equal(privacy.includes("draft-banner"), false);
  assert.equal(privacy.includes("Draft for the site owner"), false);
  assert.equal(privacy.includes("placeholder legal"), false);
  assert.equal(privacy.includes("not legal advice"), false);
  assert.ok(privacy.includes("Google Analytics 4"));
  assert.ok(privacy.includes(GA_ID));
  assert.ok(privacy.includes(GTM_ID));
  assert.ok(privacy.includes("contact@goojob.io"));
  assert.equal(privacy.match(/<h1\b/g).length, 1);

  for (const path of ["/about", "/privacy", "/terms", "/contact"]) {
    const html = renderPage(path);
    assert.equal(html.match(/<h1\b/g).length, 1);
    assert.ok(html.includes("contact@goojob.io"));
    assert.match(
      html,
      new RegExp(`<a class="wordmark-sm" href="/" aria-label="${LOGO_HOME_LABEL}">`)
    );
    assert.match(html, new RegExp(`<a class="back-home" href="/">${BACK_TO_SEARCH_LABEL}</a>`));
    assert.match(
      footerNav(html),
      /<a href="\/">Home<\/a><a href="\/about">About<\/a><a href="\/privacy">Privacy<\/a><a href="\/terms">Terms<\/a><a href="\/contact">Contact<\/a>/
    );
    assert.equal(html.includes("draft-banner"), false);
    assert.equal(html.includes("Draft for the site owner"), false);
    assert.equal(html.includes("placeholder legal"), false);
    assert.equal(html.includes("not legal advice"), false);
  }
});

test("source head uses the canonical www origin and one description", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const vercel = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const robots = fs.readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
  const sitemap = fs.readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

  assert.ok(html.includes("<title>Goojob — The Search Engine for Jobs</title>"));
  assert.equal(html.split(DESCRIPTION).length - 1 >= 3, true);
  assert.ok(html.includes('rel="canonical" href="https://www.goojob.io/"'));
  assert.ok(html.includes('property="og:url" content="https://www.goojob.io/"'));
  assert.ok(html.includes('property="og:image" content="https://www.goojob.io/og.png"'));
  assert.ok(html.includes('name="twitter:image" content="https://www.goojob.io/og.png"'));
  assert.ok(html.includes('property="og:site_name" content="Goojob"'));
  assert.ok(html.includes('property="og:locale" content="en_US"'));
  assert.ok(html.includes("https://www.goojob.io/search?q={search_term_string}"));
  assert.ok(html.includes("GTM-TJZLWC74"));
  assert.ok(html.includes("fonts.googleapis.com"));
  assert.ok(html.includes('rel="preconnect" href="https://fonts.gstatic.com"'));
  assert.ok(html.includes('href="/favicon.ico"'));
  assert.ok(html.includes('href="/apple-touch-icon.png"'));
  assert.equal(html.includes("millions"), false);
  assert.equal(html.includes("thousands"), false);
  assert.equal(html.includes("https://goojob.io/"), false);
  assert.equal(html.includes('content="https://goojob.io"'), false);

  assert.equal(robots.includes("Allow: /"), true);
  assert.equal(robots.includes("Sitemap: https://www.goojob.io/sitemap.xml"), true);
  for (const url of [
    "https://www.goojob.io/",
    "https://www.goojob.io/search",
    "https://www.goojob.io/about",
    "https://www.goojob.io/privacy",
    "https://www.goojob.io/terms",
    "https://www.goojob.io/contact",
  ]) {
    assert.ok(sitemap.includes(url), url);
  }

  const headerBlob = JSON.stringify(vercel.headers);
  assert.match(headerBlob, /X-Content-Type-Options/);
  assert.match(headerBlob, /Referrer-Policy/);
  assert.match(headerBlob, /X-Frame-Options/);
  assert.match(headerBlob, /frame-ancestors/);
  assert.match(headerBlob, /immutable/);
  assert.equal(vercel.rewrites[0].destination, "/index.html");
});
