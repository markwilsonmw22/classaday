/* Which paths are members-only. Shared by middleware.js and the tests. */
import CONFIG from "./site-config.js";

/** Decode, collapse slashes and resolve dot segments, so odd spellings of a path are judged like the plain one. */
export function normalize(pathname) {
  let p = pathname;
  for (let i = 0; i < 3 && /%[0-9a-f]{2}/i.test(p); i++) {
    try { p = decodeURIComponent(p); } catch (e) { break; }
  }
  p = p.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  try { p = decodeURIComponent(new URL(p, "http://n").pathname); } catch (e) { /* keep p */ }
  return p;
}

/** What kind of members-only resource a path is, or null for public pages. */
export function classify(pathname, gate = CONFIG.gate) {
  const p = normalize(pathname);
  let m = /^\/courses\/([^/]+)\/day-(\d+)(?:\/(?:index(?:\.html?)?)?)?$/i.exec(p);
  if (m) {
    const slug = m[1].toLowerCase(), n = Number(m[2]);
    if (gate.freeDays.includes(n)) return null;
    return { type: "lesson", target: `/courses/${slug}/day-${n}/preview/` };
  }
  if (/^\/prompts(?:\/(?:index(?:\.html?)?)?)?$/i.test(p)) return { type: "hub", target: "/prompts/preview/" };
  m = /^\/prompts\/([^/]+)(?:\/(?:index(?:\.html?)?)?)?$/i.exec(p);
  if (m) {
    const slug = m[1].toLowerCase();
    if (slug === "preview" || gate.freePrompts.includes(slug)) return null;
    return { type: "pack", target: `/prompts/${slug}/preview/` };
  }
  if (/^\/downloads\//i.test(p)) return { type: "download", target: "/join/?locked=download" };
  return null;
}
