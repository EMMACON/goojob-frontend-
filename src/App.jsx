import { useState, useRef } from "react";
import { searchJobs, logJobClick } from "./api";

const SUGGESTIONS = ["engineer", "designer", "marketing", "data", "sales", "product", "devops", "intern"];

function getSourceLabel(url = "") {
  if (url.includes("greenhouse.io")) return "Greenhouse";
  if (url.includes("lever.co")) return "Lever";
  if (url.includes("ashbyhq.com")) return "Ashby";
  return "Direct";
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function Goojob() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const filteredSuggestions = SUGGESTIONS.filter(s => s.includes(query.toLowerCase()) && query.length > 0);

  const handleSearch = async (q = query, activeFilter = filter) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    setError("");

    const remote = activeFilter === "remote" ? true : activeFilter === "onsite" ? false : undefined;

    try {
      const data = await searchJobs({ q, remote });
      setResults(data.jobs || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (f) => {
    setFilter(f);
    if (searched && query) handleSearch(query, f);
  };

  const reset = () => {
    setQuery(""); setResults([]); setSearched(false); setFilter("all"); setError("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleApply = (job) => {
    if (job.id) logJobClick(job.id);
    window.open(job.apply_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#FAFAF8", color: "#111" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:wght@700&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #C1FF4E; color: #000; }
        .hero { display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 80px 20px 60px; }
        .wordmark { font-family: 'Fraunces', serif; font-weight: 700; font-size: clamp(60px, 12vw, 96px); letter-spacing: -4px; cursor: pointer; line-height: 1; }
        .g1 { color: #111; }
        .g2 { color: #C1FF4E; -webkit-text-stroke: 2px #111; }
        .tagline { font-size: 15px; color: #777; margin-top: 12px; text-align: center; max-width: 360px; line-height: 1.5; }
        .search-wrap { width: 100%; max-width: 640px; margin-top: 36px; position: relative; }
        .search-box { display: flex; align-items: center; background: #fff; border: 2px solid #E0E0DA; border-radius: 48px; padding: 6px 6px 6px 20px; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: border-color 0.2s, box-shadow 0.2s; }
        .search-box.focused { border-color: #111; box-shadow: 0 4px 20px rgba(0,0,0,0.09); }
        .search-icon { font-size: 18px; color: #BBB; flex-shrink: 0; }
        .search-input { flex: 1; border: none; outline: none; font-size: 16px; font-family: 'DM Sans', sans-serif; background: transparent; min-width: 0; }
        .search-input::placeholder { color: #C0C0BA; }
        .search-btn { background: #111; color: #fff; border: none; border-radius: 40px; padding: 11px 24px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; flex-shrink: 0; }
        .search-btn:hover { background: #333; }
        .suggestions { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #fff; border: 1.5px solid #E0E0DA; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 28px rgba(0,0,0,0.08); z-index: 100; }
        .suggestion-item { padding: 11px 20px; font-size: 14px; color: #333; cursor: pointer; display: flex; align-items: center; gap: 10px; }
        .suggestion-item:hover { background: #F5F5F0; }
        .hero-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 28px; max-width: 540px; }
        .hero-chip { padding: 7px 16px; border: 1.5px solid #DDDDD8; border-radius: 20px; font-size: 13px; color: #555; cursor: pointer; transition: all 0.15s; background: #fff; font-family: 'DM Sans', sans-serif; }
        .hero-chip:hover { border-color: #111; color: #111; }
        .top-bar { display: flex; align-items: center; gap: 16px; padding: 12px 20px; border-bottom: 1.5px solid #EBEBEB; background: #FAFAF8; position: sticky; top: 0; z-index: 50; }
        .wordmark-sm { font-family: 'Fraunces', serif; font-weight: 700; font-size: 26px; letter-spacing: -1px; cursor: pointer; flex-shrink: 0; }
        .filters { display: flex; gap: 8px; padding: 14px 20px 0; flex-wrap: wrap; }
        .filter-btn { padding: 6px 16px; border-radius: 20px; border: 1.5px solid #DDDDD8; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; background: transparent; transition: all 0.15s; }
        .filter-btn.active { background: #111; color: #fff; border-color: #111; }
        .results-wrap { max-width: 700px; margin: 0 auto; padding: 16px 20px 80px; }
        .results-meta { font-size: 13px; color: #888; margin-bottom: 18px; }
        .job-card { background: #fff; border: 1.5px solid #EBEBEB; border-radius: 16px; padding: 20px; margin-bottom: 12px; transition: all 0.15s; }
        .job-card:hover { border-color: #CFCFCA; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .job-top { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px; }
        .company-logo { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
        .job-title { font-size: 16px; font-weight: 600; margin-bottom: 3px; }
        .job-company { font-size: 13px; color: #666; margin-bottom: 6px; }
        .job-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .tag { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 10px; background: #F2F2EE; color: #555; }
        .tag.remote { background: #EDFFF0; color: #1A7A32; }
        .job-snippet { font-size: 13.5px; color: #555; line-height: 1.55; margin-bottom: 12px; }
        .job-link-row { display: flex; align-items: center; gap: 8px; background: #F7F7F3; border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; }
        .job-link-url { font-size: 11px; color: #666; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .job-link-source { font-size: 10px; background: #E8E8E2; color: #555; padding: 2px 7px; border-radius: 6px; flex-shrink: 0; font-weight: 500; }
        .job-footer { display: flex; align-items: center; justify-content: space-between; }
        .job-posted { font-size: 12px; color: #AAA; }
        .direct-badge { font-size: 11px; color: #1A7A32; display: flex; align-items: center; gap: 4px; margin-top: 3px; font-weight: 500; }
        .direct-dot { width: 6px; height: 6px; border-radius: 50%; background: #C1FF4E; border: 1px solid #1A7A32; display: inline-block; }
        .apply-btn { background: #111; color: #fff; border: none; border-radius: 24px; padding: 10px 22px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .apply-btn:hover { background: #333; }
        .loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; gap: 16px; }
        .loader { display: flex; gap: 6px; }
        .ld { width: 9px; height: 9px; border-radius: 50%; background: #111; animation: bounce 0.8s infinite; }
        .ld:nth-child(2) { animation-delay: 0.15s; }
        .ld:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-12px)} }
        .error-box { background: #FFF3F3; border: 1.5px solid #FFCECE; color: #C00; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; font-size: 14px; }
        .empty { text-align: center; padding: 60px 20px; color: #888; }
        .footer-note { margin-top: 48px; font-size: 12px; color: #CCC; text-align: center; line-height: 1.6; }
        @media (max-width: 600px) {
          .top-bar { padding: 10px 14px; }
          .results-wrap, .filters { padding-left: 14px; padding-right: 14px; }
        }
      `}</style>

      {!searched ? (
        <div className="hero">
          <div className="wordmark" onClick={reset}>
            <span className="g1">goo</span><span className="g2">job</span>
          </div>
          <p className="tagline">Search jobs. Tap Apply. Land directly on the specific job page — no middlemen.</p>

          <div className="search-wrap">
            <div className={`search-box ${focused ? "focused" : ""}`}>
              <span className="search-icon">⌕</span>
              <input
                ref={inputRef}
                className="search-input"
                placeholder="Job title, company, or skill..."
                value={query}
                onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => { setFocused(true); setShowSuggestions(true); }}
                onBlur={() => { setFocused(false); setTimeout(() => setShowSuggestions(false), 150); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <button className="search-btn" onClick={() => handleSearch()}>Search</button>
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="suggestions">
                {filteredSuggestions.map(s => (
                  <div key={s} className="suggestion-item" onMouseDown={() => { setQuery(s); handleSearch(s); }}>
                    <span style={{ color: "#AAA", fontSize: 12 }}>↗</span> {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hero-chips">
            {["Engineer", "Designer", "Marketing", "Sales", "Remote", "Data", "Internship"].map(chip => (
              <button key={chip} className="hero-chip" onClick={() => { setQuery(chip); handleSearch(chip); }}>{chip}</button>
            ))}
          </div>

          <p className="footer-note">
            Every Apply Now button goes to the exact job posting page.<br/>
            Not a careers homepage. The specific role. Directly.
          </p>
        </div>
      ) : (
        <>
          <div className="top-bar">
            <div className="wordmark-sm" onClick={reset}>
              <span className="g1">goo</span><span className="g2" style={{ color: "#C1FF4E", WebkitTextStroke: "1.5px #111" }}>job</span>
            </div>
            <div className="search-wrap" style={{ margin: 0, flex: 1 }}>
              <div className={`search-box ${focused ? "focused" : ""}`}>
                <span className="search-icon">⌕</span>
                <input
                  className="search-input"
                  placeholder="Search jobs..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { setFocused(true); setShowSuggestions(true); }}
                  onBlur={() => { setFocused(false); setTimeout(() => setShowSuggestions(false), 150); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
                <button className="search-btn" onClick={() => handleSearch()}>Search</button>
              </div>
            </div>
          </div>

          <div className="filters">
            {[["all","All Jobs"],["remote","🌐 Remote"],["onsite","🏢 On-site"]].map(([key, label]) => (
              <button key={key} className={`filter-btn ${filter === key ? "active" : ""}`} onClick={() => handleFilter(key)}>{label}</button>
            ))}
          </div>

          <div className="results-wrap">
            {loading ? (
              <div className="loading-wrap">
                <div className="loader"><div className="ld"/><div className="ld"/><div className="ld"/></div>
                <p style={{ fontSize: 13, color: "#AAA" }}>Finding direct job links...</p>
              </div>
            ) : (
              <>
                {error && <div className="error-box">{error}</div>}
                {!error && results.length > 0 && (
                  <p className="results-meta">{total} jobs for "<strong>{query}</strong>" — each Apply Now goes directly to that specific role</p>
                )}
                {results.map((job, i) => (
                  <div key={job.id || i} className="job-card">
                    <div className="job-top">
                      <div className="company-logo" style={{ background: job.logo_color || "#555" }}>
                        {(job.company || "?")[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="job-title">{job.title}</div>
                        <div className="job-company">{job.company} · {job.location}</div>
                        <div className="job-tags">
                          <span className="tag">{job.type || "Full-time"}</span>
                          {job.remote && <span className="tag remote">Remote</span>}
                        </div>
                      </div>
                    </div>

                    {job.description && <p className="job-snippet">{job.description.slice(0, 180)}...</p>}

                    <div className="job-link-row">
                      <span style={{ fontSize: 13 }}>🔗</span>
                      <span className="job-link-url">{job.apply_url}</span>
                      <span className="job-link-source">{getSourceLabel(job.apply_url)}</span>
                    </div>

                    <div className="job-footer">
                      <div>
                        <div className="job-posted">{timeAgo(job.posted_at)}</div>
                        <div className="direct-badge">
                          <span className="direct-dot"/> Direct link to this specific role
                        </div>
                      </div>
                      <button className="apply-btn" onClick={() => handleApply(job)}>
                        Apply Now ↗
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && !error && results.length === 0 && (
                  <div className="empty">
                    <p>No jobs found for "<strong>{query}</strong>". Try another keyword.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
