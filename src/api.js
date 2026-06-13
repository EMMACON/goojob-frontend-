const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Search jobs
 * @param {Object} params - { q, location, type, remote, page }
 */
export async function searchJobs({ q, location = "", type = "", remote, page = 1 }) {
  const params = new URLSearchParams({ q, page });
  if (location) params.set("location", location);
  if (type) params.set("type", type);
  if (remote !== undefined) params.set("remote", remote);

  const res = await fetch(`${BASE}/api/jobs/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

/**
 * Get featured jobs for homepage
 */
export async function getFeaturedJobs() {
  const res = await fetch(`${BASE}/api/jobs/featured`);
  if (!res.ok) return { jobs: [] };
  return res.json();
}

/**
 * Log a job click (fire and forget)
 */
export function logJobClick(jobId) {
  fetch(`${BASE}/api/jobs/${jobId}/click`, { method: "POST" }).catch(() => {});
}
