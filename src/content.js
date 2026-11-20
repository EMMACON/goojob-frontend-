export const SITE_ORIGIN = "https://www.goojob.io";
export const BRAND_TITLE = "Goojob — The Search Engine for Jobs";
export const DESCRIPTION =
  "Search jobs and apply on the company's own posting. No middlemen. No sign-up. Just the role, and a direct link.";
export const SUPPORTING = "The search engine for jobs";
export const TAGLINE =
  "Search a role. Hit Apply. Go straight to that job on the company's site - no middlemen, no sign-up.";
export const HOME_NOTE =
  "Apply opens the official posting for that role - not a generic careers page.";
export const GTM_ID = "GTM-TJZLWC74";
export const GA_ID = "G-H5X43NYENX";
export const CONTACT_EMAIL = "contact@goojob.io";

export const SUGGESTIONS = [
  "engineer",
  "designer",
  "marketing",
  "data",
  "sales",
  "product",
  "devops",
  "intern",
];

export const CHIPS = [
  { label: "Engineer", q: "Engineer" },
  { label: "Designer", q: "Designer" },
  { label: "Marketing", q: "Marketing" },
  { label: "Sales", q: "Sales" },
  { label: "Remote", remote: "remote" },
  { label: "Data", q: "Data" },
  { label: "Internship", q: "Internship" },
];

export const FILTERS = [
  { key: "all", label: "All jobs" },
  { key: "remote", label: "Remote" },
  { key: "onsite", label: "On-site" },
];

export const LOGO_HOME_LABEL = "Goojob home";
export const BACK_TO_SEARCH_LABEL = "← Back to search";

export const FAZIER_HREF = "https://fazier.com";
export const FAZIER_BADGE_SRC =
  "https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light";
export const FAZIER_BADGE_ALT = "Fazier badge";
// The SVG is 103×44. At the required 120px width the reserved height is 51px.
export const FAZIER_BADGE_WIDTH = 120;
export const FAZIER_BADGE_HEIGHT = 51;

export const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const LINKABLES = [
  { match: "contact@goojob.io", href: "mailto:contact@goojob.io", external: false },
  { match: "https://x.com/contactgoojob", href: "https://x.com/contactgoojob", external: true },
  { match: "https://www.goojob.io/", href: "https://www.goojob.io/", external: false },
  { match: "https://www.goojob.io", href: "https://www.goojob.io/", external: false },
];

export function splitLinks(text) {
  const input = String(text ?? "");
  const parts = [];
  let rest = input;
  while (rest) {
    let foundAt = -1;
    let found = null;
    for (const link of LINKABLES) {
      const at = rest.indexOf(link.match);
      if (at !== -1 && (foundAt === -1 || at < foundAt || (at === foundAt && link.match.length > found.match.length))) {
        foundAt = at;
        found = link;
      }
    }
    if (!found) {
      parts.push({ text: rest });
      break;
    }
    if (foundAt > 0) parts.push({ text: rest.slice(0, foundAt) });
    parts.push({ text: found.match, href: found.href, external: found.external });
    rest = rest.slice(foundAt + found.match.length);
  }
  return parts;
}

export const PAGES = {
  "/about": {
    h1: "About",
    blocks: [
      {
        type: "p",
        text: "Goojob is a search engine for jobs. Search a role, hit Apply, and go straight to that job on the company's site. No middlemen. No sign-up.",
      },
      {
        type: "p",
        text: "The index is a set of direct postings we can link to. It is not a promise that every open role is listed here.",
      },
      { type: "h2", text: "Contact" },
      { type: "p", text: "Questions about the site: contact@goojob.io." },
    ],
  },
  "/privacy": {
    h1: "Privacy",
    blocks: [
      {
        type: "p",
        text: "Goojob is a job search website at https://www.goojob.io/. You can look up roles and open the company's own posting. You do not create an account to use it.",
      },
      { type: "h2", text: "Analytics" },
      {
        type: "p",
        text: `We use Google Analytics 4 (measurement ID ${GA_ID}) through Google Tag Manager (container ID ${GTM_ID}). Google may receive information such as pages you open, searches you run, an approximate location, and your device and browser. Google handles that information under its own policies.`,
      },
      {
        type: "p",
        text: "You can block or delete cookies in your browser. Google also offers a browser opt-out for Analytics.",
      },
      { type: "h2", text: "Apply clicks" },
      {
        type: "p",
        text: "Apply leaves Goojob and opens the official posting on another website. That site has its own privacy policy. Goojob does not submit an application for you. We count the click so we can see which postings people open, and the server may process the IP address on that request as part of the log.",
      },
      { type: "h2", text: "What we don't collect" },
      {
        type: "ul",
        items: [
          "We don't ask you to sign up or build a profile.",
          "We don't take applications on your behalf.",
          "We don't sell personal information.",
        ],
      },
      { type: "h2", text: "Contact" },
      { type: "p", text: "Privacy questions: contact@goojob.io." },
    ],
  },
  "/terms": {
    h1: "Terms",
    blocks: [
      {
        type: "p",
        text: "Goojob lets you search job postings and follow a link to the company's own page. Listings are provided as-is. A role may already be closed, and a description may be incomplete or out of date.",
      },
      { type: "h2", text: "Not the employer" },
      {
        type: "p",
        text: "Goojob is not the employer and is not a recruiter for the roles it lists. We don't control how a company hires, and we don't guarantee a response.",
      },
      { type: "h2", text: "Using the site" },
      {
        type: "p",
        text: "Don't misuse the site, try to break it, or use it to do something unlawful. The postings belong to the companies that published them.",
      },
      { type: "h2", text: "Other websites" },
      {
        type: "p",
        text: "Apply leaves Goojob. The page you land on is operated by someone else, under their own terms.",
      },
      { type: "h2", text: "Contact" },
      { type: "p", text: "Questions about these terms: contact@goojob.io." },
    ],
  },
  "/contact": {
    h1: "Contact",
    blocks: [
      {
        type: "p",
        text: "Email contact@goojob.io for questions about the site, a listing, or the privacy and terms pages.",
      },
      { type: "p", text: "Goojob is also on X: https://x.com/contactgoojob." },
    ],
  },
};
