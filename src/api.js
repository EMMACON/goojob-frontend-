// API client — talks to the Goojob backend on Railway.
// Search accepts q, remote (true/false), location (substring match),
// type (exact), and page. An empty q is allowed only when remote is set.

const API_BASE =
  import.meta.env.VITE_API_URL || "https://goojob-backend-production.up.railway.app";

export async function searchJobs({ q, remote, location, type, page = 1, signal } = {}) {
  const params = new URLSearchParams();
  params.set("q", q ?? "");
  if (remote === true) params.set("remote", "true");
  if (remote === false) params.set("remote", "false");
  if (location) params.set("location", location);
  if (type) params.set("type", type);
  params.set("page", String(page));

  const res = await fetch(`${API_BASE}/api/jobs/search?${params.toString()}`, { signal });
  if (res.status === 400) {
    throw new Error("Add a role, or choose Remote or On-site.");
  }
  if (!res.ok) throw new Error("Search failed. Please try again.");
  return res.json();
}

export async function logJobClick(jobId) {
  try {
    await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(jobId)}/click`, {
      method: "POST",
    });
  } catch {
    // non-critical
  }
}

export async function getRecentJobs() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/recent`);
    if (!res.ok) return { jobs: [] };
    return res.json();
  } catch {
    return { jobs: [] };
  }
}
