import contentLocales from "./generated/content-locales.json";

/** Pages that exist per lesson, in English and in each locale the lesson is translated into. */
const LESSON_PAGES = /^(math\/lessons|practice|educators\/worksheets)\/([^/#]+)/;
/** Detail pages of the labs, which are generated in English only (code and reports are language-neutral). */
const ENGLISH_ONLY = /^(lab|formal)\/[^/#]+/;
const translated = contentLocales.lessons as Record<string, string[]>;
/** Courses outside Lumenary Math ("cs", "ee", "robotics", "lingua/spanish"): each is generated only in the locale it is taught in. */
const courses = (contentLocales as { courses?: Record<string, string> }).courses ?? {};
/** A subject's pages, including its nested courses (cs/languages/rust is taught like cs), or a Lingua course's. */
const COURSE = /^(lingua\/[^/#]+|[a-z][a-z-]*)(\/|$)/;

/** The locale in which a page is actually generated: the requested one, or English as a fallback. */
export function pageLocale(locale: string, path: string): string {
  if (locale === "en") return locale;
  const p = path.replace(/^\/+/, "");
  if (ENGLISH_ONLY.test(p)) return "en";
  const c = p.match(COURSE);
  if (c && courses[c[1]]) return courses[c[1]];
  const m = p.match(LESSON_PAGES);
  if (m && !(translated[m[2]] ?? []).includes(locale)) return "en";
  return locale;
}

/**
 * Locale-prefixed, trailing-slash href (the site is exported with trailingSlash: true). Links to
 * pages that exist only in English (untranslated lessons, lab and formal detail pages) point to
 * the English page.
 */
export function href(locale: string, path = ""): string {
  const [pathPart, hash] = path.replace(/^\/+/, "").split("#");
  const withSlash = pathPart && !pathPart.endsWith("/") ? `${pathPart}/` : pathPart;
  return `/${pageLocale(locale, pathPart)}/${withSlash}${hash ? `#${hash}` : ""}`;
}
