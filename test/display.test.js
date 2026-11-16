import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanPlace,
  formatJobLine,
  formatJobType,
  formatSnippet,
  resultsHeading,
  safeApplyUrl,
} from "../src/format.js";
import { buildSearchUrl, normalizeSearch, parseSearchParams } from "../src/searchParams.js";

test("maps raw job types onto the four labels", () => {
  assert.equal(formatJobType("fulltime_permanent"), "Full-time");
  assert.equal(formatJobType("FULL-TIME"), "Full-time");
  assert.equal(formatJobType("part_time"), "Part-time");
  assert.equal(formatJobType("Part-time"), "Part-time");
  assert.equal(formatJobType("contract"), "Contract");
  assert.equal(formatJobType("freelance"), "Contract");
  assert.equal(formatJobType("internship"), "Internship");
  assert.equal(formatJobType("intern"), "Internship");
  assert.equal(formatJobType(""), "");
  assert.equal(formatJobType(null), "");
});

test("cleans locations and does not repeat Remote", () => {
  assert.equal(cleanPlace("Paris, fr"), "Paris, FR");
  assert.equal(cleanPlace("São Paulo, br"), "São Paulo, BR");
  assert.equal(cleanPlace("., fr"), "");
  assert.equal(cleanPlace("."), "");
  assert.equal(cleanPlace("New York, NY"), "New York, NY");
  assert.equal(cleanPlace("London, United Kingdom"), "London, United Kingdom");
  assert.equal(cleanPlace("Remote · Remote"), "Remote");

  assert.equal(
    formatJobLine({ company: "Acme", location: "Remote", remote: true, type: "fulltime_permanent" }),
    "Acme · Remote · Full-time"
  );
  assert.equal(
    formatJobLine({ company: "Acme", location: "Paris, fr", remote: true, type: "Full-time" }),
    "Acme · Paris, FR · Remote · Full-time"
  );
  assert.equal(
    formatJobLine({ company: "Acme", location: "., fr", remote: false, type: "" }),
    "Acme"
  );
  assert.equal(formatJobLine({ company: "Acme", location: "Remote", remote: true }).includes("Remote · Remote"), false);
});

test("collapses snippet whitespace and separates jammed sentences", () => {
  assert.equal(formatSnippet("  Be the   person.Next   "), "Be the person. Next");
  assert.equal(formatSnippet("<p>Hello&nbsp;there</p>"), "Hello there");
  assert.equal(formatSnippet(""), "");
  const long = formatSnippet("word ".repeat(80), 40);
  assert.ok(long.endsWith("…"));
  assert.ok(long.length <= 41);
});

test("results heading uses the shared Apply sentence", () => {
  assert.equal(
    resultsHeading({ total: 12, q: "engineer" }),
    '12 jobs for "engineer." Each Apply button opens that role\'s official posting.'
  );
  assert.equal(
    resultsHeading({ total: 1, q: "designer" }),
    '1 job for "designer." Each Apply button opens that role\'s official posting.'
  );
  assert.equal(
    resultsHeading({ total: 4, remote: "remote" }),
    "4 remote jobs. Each Apply button opens that role's official posting."
  );
});

test("search urls round-trip and treat a lone work-type word as a filter", () => {
  assert.equal(buildSearchUrl({ q: "data scientist" }), "/search?q=data+scientist");
  assert.equal(buildSearchUrl({ remote: "remote" }), "/search?remote=true");
  assert.equal(buildSearchUrl({ q: "nurse", remote: "onsite", location: "Paris" }), "/search?q=nurse&remote=false&location=Paris");
  assert.deepEqual(normalizeSearch({ q: "remote" }), { q: "", remote: "remote", location: "" });
  assert.deepEqual(parseSearchParams("?q=editor&remote=false&location=Lyon"), {
    q: "editor",
    remote: "onsite",
    location: "Lyon",
  });
  assert.equal(safeApplyUrl("javascript:alert(1)"), "");
  assert.equal(safeApplyUrl("https://jobs.example.com/role"), "https://jobs.example.com/role");
});
