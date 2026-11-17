// Defensive display helpers. The API still returns raw enums, lowercase
// country codes, and messy snippets; clean them here as well.

const TAIL = "Each Apply button opens that role's official posting.";

export function formatJobType(type) {
  if (type == null) return "";
  const raw = String(type).replace(/[\u00a0\u200B-\u200D\uFEFF]/g, " ").trim();
  if (!raw) return "";
  const key = raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!key) return "";
  if (/intern/.test(key)) return "Internship";
  if (/part\s*time/.test(key)) return "Part-time";
  if (/contract|freelance|temporary|^temp$/.test(key)) return "Contract";
  if (/full\s*time|permanent/.test(key)) return "Full-time";
  return key.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function isRemotePhrase(loc) {
  return /^(remote|remotely|wfh|work from home)(\s*[-–—:,/|]\s*(worldwide|anywhere|global|only|ok|friendly))?$/i.test(
    loc.trim()
  );
}

export function cleanPlace(location) {
  let loc = String(location ?? "")
    .replace(/[\u00a0\u200B-\u200D\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!loc) return "";

  const pieces = loc.split(/\s*[·•|]\s*/).map((part) => part.trim()).filter(Boolean);
  const deduped = [];
  for (const piece of pieces) {
    if (/^remote$/i.test(piece) && deduped.some((part) => /^remote$/i.test(part))) continue;
    deduped.push(piece);
  }
  loc = deduped.join(" · ");

  if (isRemotePhrase(loc)) return "Remote";
  if (/^[.,\s]+(?:,\s*)?[a-z]{2}$/i.test(loc)) return "";
  if (!/[a-z]/i.test(loc)) return "";
  if (/^(n\/a|na|null|none|undefined|tbd|unknown)$/i.test(loc)) return "";

  loc = loc.replace(/^[.,\s]+/, "").replace(/[.,\s]+$/, "").trim();
  if (!loc || /^[.,\s]+(?:,\s*)?[a-z]{2}$/i.test(loc) || !/[a-z]/i.test(loc)) return "";

  loc = loc.replace(/,\s*([A-Za-z]{2})$/, (_, code) => `, ${code.toUpperCase()}`);
  if (/^[A-Za-z]{2}$/.test(loc)) loc = loc.toUpperCase();
  return loc;
}

export function jobLocation(job = {}) {
  const place = cleanPlace(job.location);
  const flaggedRemote = Boolean(job.remote) || place === "Remote";
  const city = place === "Remote" ? "" : place;
  if (flaggedRemote && !city) return { text: "Remote", showRemoteTag: false };
  if (flaggedRemote && city) return { text: city, showRemoteTag: true };
  return { text: city, showRemoteTag: false };
}

export function formatJobLine(job = {}) {
  const company = String(job.company || "").replace(/\s+/g, " ").trim();
  const { text, showRemoteTag } = jobLocation(job);
  const type = formatJobType(job.type);
  const place = [text, showRemoteTag ? "Remote" : ""].filter(Boolean).join(" · ");
  return [company, place, type].filter(Boolean).join(" · ");
}

export function formatSnippet(text, max = 180) {
  if (text == null) return "";
  let snippet = String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xa0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[\u00a0\u200B-\u200D\uFEFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  snippet = snippet.replace(/([.!?])([A-Za-z])/g, "$1 $2");
  snippet = snippet.replace(/([:;])([A-Za-z])/g, "$1 $2");
  snippet = snippet.replace(/\s+/g, " ").trim();
  if (!snippet) return "";
  if (snippet.length <= max) return snippet;
  const cut = snippet.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > Math.floor(max * 0.6) ? cut.slice(0, lastSpace) : cut).trim();
  return `${trimmed}…`;
}

export function resultsHeading({ total = 0, q = "", remote = "all" } = {}) {
  const count = Number(total) || 0;
  const noun = count === 1 ? "job" : "jobs";
  const query = String(q || "").trim();
  if (query) return `${count} ${noun} for "${query}." ${TAIL}`;
  if (remote === "remote") return `${count} remote ${noun}. ${TAIL}`;
  if (remote === "onsite") return `${count} on-site ${noun}. ${TAIL}`;
  return `${count} ${noun}. ${TAIL}`;
}

export function safeApplyUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.href;
  } catch {
    return "";
  }
}

export function safeColor(value) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || "")) ? value : "#555555";
}
