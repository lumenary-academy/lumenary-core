import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import type { Locale } from "../i18n/config";
import { PageFrontmatter } from "../schema";

/** The first 12 hex characters of a text's SHA-256: how a translation records the original it was made from. */
export function shortHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
}

export interface LoadedDoc<F> {
  frontmatter: F;
  body: string;
  /** Locale actually rendered (may differ from requested on fallback). */
  locale: Locale;
  requested: Locale;
  fallback: boolean;
  /** True when a translation's sourceHash no longer matches the canonical file. */
  stale: boolean;
}

/**
 * A document kept as `<dir>/en.mdx` (canonical) and `<dir>/<locale>.mdx` (translations): the requested
 * locale's file when it exists, otherwise English, with a flag when the translation is out of date.
 */
export function loadLocalized<F>(dir: string, locale: Locale, parse: (data: unknown) => F, sourceHashOf: (f: F) => string | undefined): LoadedDoc<F> {
  const read = (p: string) => fs.readFileSync(p, "utf8");
  const canonicalPath = path.join(dir, "en.mdx");
  const localPath = path.join(dir, `${locale}.mdx`);
  const useLocal = locale !== "en" && fs.existsSync(localPath);
  const { data, content } = matter(read(useLocal ? localPath : canonicalPath));
  const frontmatter = parse(data);
  let stale = false;
  if (useLocal) {
    const canonicalBody = matter(read(canonicalPath)).content;
    const recorded = sourceHashOf(frontmatter);
    stale = recorded !== undefined && recorded !== shortHash(canonicalBody);
  }
  return { frontmatter, body: content, locale: useLocal ? locale : "en", requested: locale, fallback: locale !== "en" && !useLocal, stale };
}

export interface PageLoader {
  getPage: (slug: string, locale: Locale) => LoadedDoc<PageFrontmatter>;
}

/** Prose pages (about, contribute, …) under a content root: `<root>/<slug>/<locale>.mdx`. */
export function createPageLoader({ root }: { root: string }): PageLoader {
  const base = path.resolve(root);
  return {
    getPage: (slug, locale) => loadLocalized(path.join(base, slug), locale, (d) => PageFrontmatter.parse(d), (f) => f.translation.sourceHash),
  };
}
