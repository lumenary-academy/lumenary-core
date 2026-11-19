/**
 * Locale-prefixed URLs for a statically exported Lumenary site (`/<locale>/<path>/`, with
 * `trailingSlash: true`). Not every page exists in every locale: a course is generated only in the
 * locale it is taught in, and a site may generate some pages in English only or only in the locales
 * an item is translated into. A site describes this once, as plain data (so the same description can
 * be passed from a server layout to client components such as the language menu), and every link
 * goes through `href`.
 */
export interface RoutingConfig {
  /** Site path of each course ("spanish", "cs", "lingua/spanish") → the one locale its pages are generated in. */
  courses?: Record<string, string>;
  /**
   * Pages generated per translated item, in English and in the item's translations only: a regular
   * expression (source text) matched against the path, whose group `slugGroup` (default 2) is the item,
   * and the non-English locales each item is translated into.
   */
  translated?: { pattern: string; slugGroup?: number; locales: Record<string, string[]> };
  /** Regular expressions (source text) for pages generated in English only. */
  englishOnly?: string[];
  /**
   * For the language menu: where to send a reader whose page does not exist in the locale they pick,
   * by path prefix ("math/lessons" → "math/curriculum"). Without a match, the first path segment.
   */
  fallbacks?: Record<string, string>;
}

export interface Routing {
  config: RoutingConfig;
  /** The locale in which a page is actually generated: the requested one, or the one it falls back to. */
  pageLocale: (locale: string, path: string) => string;
  /**
   * Locale-prefixed, trailing-slash href. Links to pages that exist only in another locale (a course
   * taught in English, an untranslated lesson) point to that locale's page.
   */
  href: (locale: string, path?: string) => string;
  /** The page the language menu offers for `path` in `locale`: the same page if it exists there, else its fallback. */
  switchHref: (locale: string, path: string) => string;
}

/** The longest key of `table` that is `path` or a whole-segment prefix of it. */
function longestPrefix(table: Record<string, unknown> | undefined, path: string): string | undefined {
  let best: string | undefined;
  for (const key of Object.keys(table ?? {}))
    if ((path === key || path.startsWith(`${key}/`)) && (best === undefined || key.length > best.length)) best = key;
  return best;
}

export function createRouting(config: RoutingConfig = {}): Routing {
  const englishOnly = (config.englishOnly ?? []).map((s) => new RegExp(s));
  const translated = config.translated ? { re: new RegExp(config.translated.pattern), group: config.translated.slugGroup ?? 2, locales: config.translated.locales } : null;
  const courses = config.courses ?? {};

  const pageLocale = (locale: string, path: string): string => {
    const p = path.replace(/^\/+/, "").split("#")[0]!.replace(/\/+$/, "");
    // A course exists only in its teaching locale, English included: English pages link to /es/ingles/.
    const course = longestPrefix(courses, p);
    if (course !== undefined) return courses[course]!;
    if (locale === "en") return locale;
    if (englishOnly.some((re) => re.test(p))) return "en";
    const m = translated && p.match(translated.re);
    if (m && !(translated.locales[m[translated.group] ?? ""] ?? []).includes(locale)) return "en";
    return locale;
  };

  const href = (locale: string, path = ""): string => {
    const [pathPart = "", hash] = path.replace(/^\/+/, "").split("#");
    const withSlash = pathPart && !pathPart.endsWith("/") ? `${pathPart}/` : pathPart;
    return `/${pageLocale(locale, pathPart)}/${withSlash}${hash ? `#${hash}` : ""}`;
  };

  const switchHref = (locale: string, path: string): string => {
    const rest = path.replace(/^\/+/, "");
    if (pageLocale(locale, rest) === locale) return `/${locale}/${rest}`;
    const key = longestPrefix(config.fallbacks, rest.replace(/\/+$/, ""));
    return href(locale, key !== undefined ? config.fallbacks![key] : rest.split("/")[0]);
  };

  return { config, pageLocale, href, switchHref };
}

/** Plain locale-prefixed links, for a site whose every page exists in every locale. */
export const { href, pageLocale } = createRouting();
