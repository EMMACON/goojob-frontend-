import { useEffect, useRef, useState } from "react";
import { getRecentJobs, logJobClick, searchJobs } from "./api";
import {
  BACK_TO_SEARCH_LABEL,
  BRAND_TITLE,
  CHIPS,
  CONTACT_EMAIL,
  FILTERS,
  FOOTER_LINKS,
  HOME_NOTE,
  LOGO_HOME_LABEL,
  PAGES,
  SITE_ORIGIN,
  SUGGESTIONS,
  SUPPORTING,
  TAGLINE,
  splitLinks,
} from "./content.js";
import {
  formatJobLine,
  formatJobType,
  formatSnippet,
  jobLocation,
  resultsHeading,
  safeApplyUrl,
  safeColor,
} from "./format.js";
import { buildSearchUrl, normalizePath, normalizeSearch, parseSearchParams } from "./searchParams.js";

const SEARCH_TIMEOUT_MS = 25000;
const SLOW_AFTER_MS = 8000;

function track(event, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
}

function trackApply(job) {
  track("apply_click", {
    job_title: job.title || "",
    company: job.company || "",
  });
  if (job.id) logJobClick(job.id);
}

function setCanonical(url) {
  const link = document.querySelector('link[rel="canonical"]');
  if (link) link.setAttribute("href", url);
  const og = document.querySelector('meta[property="og:url"]');
  if (og) og.setAttribute("content", url);
  const twitter = document.querySelector('meta[name="twitter:url"]');
  if (twitter) twitter.setAttribute("content", url);
}

function remoteFlag(remote) {
  if (remote === "remote") return true;
  if (remote === "onsite") return false;
  return undefined;
}

function searchErrorMessage(err) {
  if (err?.name === "AbortError") return "This search is taking too long. Please try again.";
  if (err?.message && !/failed to fetch|networkerror|load failed/i.test(err.message)) return err.message;
  return "Search failed. Please try again.";
}

function readRecentData() {
  const el = document.getElementById("recent-data");
  if (!el) return null;
  try {
    const data = JSON.parse(el.textContent || "null");
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function getSourceLabel(url = "", sourceType = "", source = "") {
  if (sourceType === "aggregator") {
    if (source === "remotive") return "Remotive";
    if (source === "remoteok") return "RemoteOK";
    if (source === "arbeitnow") return "Arbeitnow";
    if (source === "adzuna") return "Adzuna";
    return "Listing";
  }
  if (url.includes("greenhouse.io")) return "Greenhouse";
  if (url.includes("lever.co")) return "Lever";
  if (url.includes("ashbyhq.com")) return "Ashby";
  if (url.includes("workable.com")) return "Workable";
  return "Direct";
}

function getViaLabel(source = "") {
  if (source === "remotive") return "Via Remotive";
  if (source === "remoteok") return "Via RemoteOK";
  if (source === "arbeitnow") return "Via Arbeitnow";
  if (source === "adzuna") return "Via Adzuna";
  return "Via listing";
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Wordmark({ large = false, heading = false }) {
  const className = large ? "wordmark" : "wordmark-sm";
  const mark = (
    <>
      <span className="g1">Goo</span>
      <span className="g2">job</span>
    </>
  );
  if (heading) {
    return (
      <h1 className={className}>
        <a href="/" aria-label={LOGO_HOME_LABEL}>
          {mark}
        </a>
      </h1>
    );
  }
  return (
    <a className={className} href="/" aria-label={LOGO_HOME_LABEL}>
      {mark}
    </a>
  );
}

function RichText({ text }) {
  return splitLinks(text).map((part, index) =>
    part.href ? (
      <a
        key={index}
        href={part.href}
        {...(part.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {part.text}
      </a>
    ) : (
      <span key={index}>{part.text}</span>
    )
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-nav" aria-label="Footer">
        {FOOTER_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="site-footer-row">
        <a className="footer-email" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <a
          className="footer-x"
          href="https://x.com/contactgoojob"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Goojob on X"
          title="Follow Goojob on X"
          onClick={() => track("x_profile_click")}
        >
          <XIcon />
        </a>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Goojob</p>
    </footer>
  );
}

function SearchForm({
  remote = "all",
  initialQ = "",
  initialLocation = "",
  showSuggestions = false,
  showChips = false,
}) {
  const [query, setQuery] = useState(initialQ);
  const [location, setLocation] = useState(initialLocation);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState("");
  const trimmed = query.trim().toLowerCase();
  const suggestions = SUGGESTIONS.filter(
    (item) => trimmed.length > 0 && item.includes(trimmed) && item !== trimmed
  );

  function onSubmit(event) {
    const normalized = normalizeSearch({ q: query, location, remote });
    if (!normalized.q && normalized.remote === "all" && !normalized.location) {
      event.preventDefault();
      setHint("Enter a role to search.");
      return;
    }
    event.preventDefault();
    window.location.assign(buildSearchUrl(normalized));
  }

  return (
    <>
      <div className="search-wrap">
        <form className="search-form" role="search" action="/search" method="get" onSubmit={onSubmit}>
          {remote === "remote" && <input type="hidden" name="remote" value="true" />}
          {remote === "onsite" && <input type="hidden" name="remote" value="false" />}
          <div className="search-box">
            <label className="sr-only" htmlFor="q">
              Search jobs
            </label>
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id="q"
              className="search-input"
              type="search"
              name="q"
              aria-label="Search jobs"
              placeholder="Job title, company, or skill..."
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHint("");
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            <label className="sr-only" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              className="search-input loc-input"
              type="text"
              name="location"
              aria-label="Location"
              placeholder="City or country"
              autoComplete="off"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setHint("");
              }}
            />
            <button className="search-btn" type="submit">
              Search
            </button>
          </div>
          {showSuggestions && open && suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((item) => (
                <li key={item}>
                  <a
                    className="suggestion-item"
                    href={buildSearchUrl(normalizeSearch({ q: item, location, remote }))}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <span aria-hidden="true">↗</span> {item}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {hint && (
            <p className="form-hint" role="status">
              {hint}
            </p>
          )}
        </form>
      </div>
      {showChips && (
        <div className="hero-chips">
          {CHIPS.map((chip) => (
            <a
              key={chip.label}
              className="hero-chip"
              href={buildSearchUrl(
                normalizeSearch({ q: chip.q || "", remote: chip.remote || remote, location })
              )}
            >
              {chip.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

function LatestCard({ job }) {
  const href = safeApplyUrl(job.apply_url);
  if (!href) return null;
  return (
    <a
      className="latest-card"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackApply(job)}
    >
      <span className="latest-card-main">
        <h3 className="latest-title">{job.title}</h3>
        <p className="latest-company">{formatJobLine(job)}</p>
      </span>
      <span className="latest-apply">Apply</span>
    </a>
  );
}

function JobCard({ job }) {
  const href = safeApplyUrl(job.apply_url);
  const { text, showRemoteTag } = jobLocation(job);
  const type = formatJobType(job.type);
  const snippet = formatSnippet(job.description);
  const company = String(job.company || "").replace(/\s+/g, " ").trim();
  const where = [company, text].filter(Boolean).join(" · ");
  const posted = timeAgo(job.posted_at);

  return (
    <article className="job-card">
      <div className="job-top">
        <div className="company-logo" style={{ background: safeColor(job.logo_color) }} aria-hidden="true">
          {(company || "?").charAt(0) || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="job-title">
            {href ? (
              <a
                className="card-stretch-link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackApply(job)}
              >
                {job.title}
                {company ? <span className="sr-only"> at {company}</span> : null}
              </a>
            ) : (
              job.title
            )}
          </h3>
          {where && <p className="job-company">{where}</p>}
          {(type || showRemoteTag) && (
            <div className="job-tags">
              {type && <span className="tag">{type}</span>}
              {showRemoteTag && <span className="tag remote">Remote</span>}
            </div>
          )}
        </div>
      </div>
      {snippet && <p className="job-snippet">{snippet}</p>}
      {href && (
        <div className="job-link-row">
          <span aria-hidden="true">🔗</span>
          <span className="job-link-url">{href}</span>
          <span className="job-link-source">{getSourceLabel(href, job.source_type, job.source)}</span>
        </div>
      )}
      <div className="job-footer">
        <div>
          {posted && <div className="job-posted">{posted}</div>}
          {job.source_type === "aggregator" ? (
            <div className="via-badge">
              <span className="via-dot" /> {getViaLabel(job.source)} — broader listing
            </div>
          ) : (
            href && (
              <div className="direct-badge">
                <span className="direct-dot" /> Direct link to this specific role
              </div>
            )
          )}
        </div>
        {href && (
          <a
            className="apply-btn"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Apply to ${job.title || "this role"}${company ? ` at ${company}` : ""}`}
            onClick={() => trackApply(job)}
          >
            Apply
          </a>
        )}
      </div>
    </article>
  );
}

function HomePage() {
  const seeded = readRecentData();
  const [jobs, setJobs] = useState(() => seeded || []);
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    let active = true;
    getRecentJobs()
      .then((data) => {
        if (active && Array.isArray(data.jobs) && data.jobs.length) setJobs(data.jobs);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = jobs.filter((job) => safeApplyUrl(job.apply_url) && job.title);

  return (
    <div className="page-wrap">
      <main className="hero">
        <Wordmark large heading />
        <p className="brand-line">{SUPPORTING}</p>
        <p className="tagline">{TAGLINE}</p>
        <SearchForm showSuggestions showChips />
        <p className="footer-note">{HOME_NOTE}</p>
        {loading && visible.length === 0 && (
          <p className="footer-note" role="status">
            Loading latest jobs…
          </p>
        )}
        {visible.length > 0 && (
          <section className="latest-section" aria-labelledby="latest-heading">
            <h2 className="latest-heading" id="latest-heading">
              Latest jobs
            </h2>
            <div className="latest-list">
              {visible.map((job, index) => (
                <LatestCard key={job.id || job.apply_url || index} job={job} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SearchPage() {
  const params = normalizeSearch(parseSearchParams(window.location.search));
  const canSearch = Boolean(params.q) || params.remote !== "all";
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(canSearch);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const searchGen = useRef(0);

  useEffect(() => {
    const next = buildSearchUrl(params);
    const here = `${window.location.pathname}${window.location.search}`;
    if (here !== next) window.history.replaceState(null, "", next);
    const label = params.q.length > 60 ? `${params.q.slice(0, 57)}…` : params.q;
    document.title = label ? `${label} jobs — Goojob` : "Search jobs — Goojob";
    setCanonical(`${SITE_ORIGIN}${next}`);
  }, [params.q, params.remote, params.location]);

  useEffect(() => {
    if (!canSearch) return undefined;
    const gen = ++searchGen.current;
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setSlow(false);
    setError("");
    setMoreError("");
    const slowTimer = setTimeout(() => {
      if (active) setSlow(true);
    }, SLOW_AFTER_MS);
    const timeoutTimer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    track("search", {
      search_term: params.q || `[filter:${params.remote}]`,
      filter: params.remote,
    });

    searchJobs({
      q: params.q,
      remote: remoteFlag(params.remote),
      location: params.location,
      page: 1,
      signal: controller.signal,
    })
      .then((data) => {
        if (!active) return;
        setResults(data.jobs || []);
        setTotal(data.total || 0);
        setPage(1);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        if (!active) return;
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setError(searchErrorMessage(err));
      })
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(timeoutTimer);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      clearTimeout(slowTimer);
      clearTimeout(timeoutTimer);
    };
  }, [params.q, params.remote, params.location, attempt, canSearch]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const gen = searchGen.current;
    setLoadingMore(true);
    setMoreError("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    try {
      const data = await searchJobs({
        q: params.q,
        remote: remoteFlag(params.remote),
        location: params.location,
        page: page + 1,
        signal: controller.signal,
      });
      if (searchGen.current !== gen) return;
      setResults((prev) => [...prev, ...(data.jobs || [])]);
      setPage((current) => current + 1);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setMoreError(
        err?.name === "AbortError" ? "Loading more jobs timed out." : "Couldn't load more jobs."
      );
    } finally {
      clearTimeout(timer);
      setLoadingMore(false);
    }
  }

  const count = total > 0 ? total : results.length;
  let prompt = "";
  if (!canSearch && params.location) {
    prompt = `Add a role to search in ${params.location}. Location filters the roles you search for.`;
  } else if (!canSearch) {
    prompt = "Search a role, or choose Remote or On-site to browse.";
  }

  return (
    <div className="page-wrap">
      <div className="top-bar">
        <Wordmark heading />
        <SearchForm
          remote={params.remote}
          initialQ={params.q}
          initialLocation={params.location}
          showSuggestions
        />
      </div>
      <div className="filters">
        <a className="home-btn" href="/">
          ← Home
        </a>
        {FILTERS.map((filter) => {
          const active = filter.key === "all" ? params.remote === "all" : params.remote === filter.key;
          return (
            <a
              key={filter.key}
              className={`filter-btn${active ? " active" : ""}`}
              href={buildSearchUrl({
                q: params.q,
                location: params.location,
                remote: filter.key === "all" ? "all" : filter.key,
              })}
              aria-current={active ? "true" : undefined}
            >
              {filter.label}
            </a>
          );
        })}
      </div>
      <main className="results-wrap">
        {prompt && (
          <div className="empty">
            <h2>Search jobs</h2>
            <p>{prompt}</p>
          </div>
        )}
        {loading && (
          <div className="loading-wrap" role="status">
            <div className="loader" aria-hidden="true">
              <div className="ld" />
              <div className="ld" />
              <div className="ld" />
            </div>
            <p>{slow ? "Still searching… this is taking longer than usual." : "Finding direct job links…"}</p>
          </div>
        )}
        {!loading && error && (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button className="retry-btn" type="button" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </button>
          </div>
        )}
        {!loading && !error && canSearch && results.length > 0 && (
          <h2 className="results-heading">
            {resultsHeading({ total: count, q: params.q, remote: params.remote })}
          </h2>
        )}
        {!loading &&
          !error &&
          results.map((job, index) => <JobCard key={job.id || job.apply_url || index} job={job} />)}
        {!loading && !error && canSearch && results.length === 0 && (
          <div className="empty">
            <h2>No jobs found</h2>
            <p>
              {params.q
                ? `No jobs for "${params.q}". Try another role, or clear the location and remote filters.`
                : "No jobs matched these filters. Try another role, or clear the location and remote filters."}
            </p>
            <p>
              <a href="/">Back to home</a>
            </p>
          </div>
        )}
        {moreError && <p className="more-error">{moreError}</p>}
        {!loading && !error && results.length > 0 && hasMore && (
          <button className="load-more-btn" type="button" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more jobs"}
          </button>
        )}
      </main>
      <Footer />
    </div>
  );
}

function InfoPage({ page }) {
  return (
    <div className="page-wrap">
      <header className="sub-header">
        <Wordmark />
        <a className="back-home" href="/">
          {BACK_TO_SEARCH_LABEL}
        </a>
      </header>
      <main className="prose">
        <h1>{page.h1}</h1>
        {page.blocks.map((block, index) => {
          if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
          if (block.type === "p")
            return (
              <p key={index}>
                <RichText text={block.text} />
              </p>
            );
          if (block.type === "ul") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>
                    <RichText text={item} />
                  </li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="page-wrap">
      <header className="sub-header">
        <Wordmark />
      </header>
      <main className="prose">
        <h1>Page not found</h1>
        <p>That page isn't on Goojob.</p>
        <p>
          <a href="/">Back to the homepage</a>
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const path = normalizePath(window.location.pathname);

  useEffect(() => {
    if (path === "/search") return;
    if (path === "/") {
      document.title = BRAND_TITLE;
      setCanonical(`${SITE_ORIGIN}/`);
      return;
    }
    const page = PAGES[path];
    if (page) {
      document.title = `${page.h1} — Goojob`;
      setCanonical(`${SITE_ORIGIN}${path}`);
    }
  }, [path]);

  if (path === "/") return <HomePage />;
  if (path === "/search") return <SearchPage />;
  if (PAGES[path]) return <InfoPage page={PAGES[path]} />;
  return <NotFound />;
}
