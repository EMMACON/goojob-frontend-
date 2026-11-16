const WORK_TYPES = {
  remote: "remote",
  remotely: "remote",
  wfh: "remote",
  anywhere: "remote",
  "work from home": "remote",
  onsite: "onsite",
  "on-site": "onsite",
  "on site": "onsite",
  office: "onsite",
  "in office": "onsite",
  "in-office": "onsite",
};

export function normalizePath(pathname) {
  let path = pathname || "/";
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep the raw path
  }
  path = path.replace(/\/+$/, "") || "/";
  if (path.endsWith(".html")) path = path.slice(0, -5) || "/";
  if (path === "/index") path = "/";
  return path;
}

export function parseSearchParams(search = "") {
  const params = new URLSearchParams(String(search).replace(/^\?/, ""));
  const remoteRaw = params.get("remote");
  let remote = "all";
  if (remoteRaw === "true") remote = "remote";
  else if (remoteRaw === "false") remote = "onsite";
  return {
    q: params.get("q") || "",
    remote,
    location: params.get("location") || "",
  };
}

export function normalizeSearch({ q = "", remote = "all", location = "" } = {}) {
  const query = String(q || "").trim();
  const loc = String(location || "").trim();
  const key = query.toLowerCase();
  if (WORK_TYPES[key] && remote === "all") {
    return { q: "", remote: WORK_TYPES[key], location: loc };
  }
  return { q: query, remote, location: loc };
}

export function buildSearchUrl({ q = "", remote = "all", location = "" } = {}) {
  const params = new URLSearchParams();
  const query = String(q || "").trim();
  const loc = String(location || "").trim();
  if (query) params.set("q", query);
  if (remote === "remote") params.set("remote", "true");
  else if (remote === "onsite") params.set("remote", "false");
  if (loc) params.set("location", loc);
  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}
