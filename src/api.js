// ─────────────────────────────────────────────────────────────
// API client — talks to the Goojob backend on Railway.
// ─────────────────────────────────────────────────────────────

const API_BASE =
  import.meta.env.VITE_API_URL || "https://goojob-backend-production.up.railway.app";

/**
 * Search jobs. Supports pagination via `page`.
 * Returns { jobs, total, page, hasMore, directCount, aggregatorCount, ... }
 */
export async function searchJobs({ q, remote, location, type, page = 1 }) {
  const params = new URLSearchParams();
  params.set("q", q);
  if (remote === true) params.set("remote", "true");
  if (remote === false) params.set("remote", "false");
  if (location) params.set("location", location);
  if (type) params.set("type", type);
  params.set("page", String(page));

  const res = await fetch(`${API_BASE}/api/jobs/search?${params.toString()}`);
  if (!res.ok) throw new Error("Search request failed");
  return res.json();
}

/**
 * Log a click on a job (fire-and-forget; ignores errors).
 */
export async function logJobClick(jobId) {
  try {
    await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/click`, {
      method: "POST",
    });
  } catch (e) {
    // non-critical
  }
}

/**
 * Featured jobs for the homepage (optional).
 */
export async function getFeaturedJobs() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/featured`);
    if (!res.ok) return { jobs: [] };
    return res.json();
  } catch (e) {
    return { jobs: [] };
  }
}
