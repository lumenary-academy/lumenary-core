import en from "./messages/en.json";
import type { Locale } from "./config";
import type { Json, Messages } from "./translate";

export { makeT, translate, type Json, type Messages, type TFunction } from "./translate";

/** Loads one locale's catalogue, e.g. `() => import("./messages/es.json")`. */
export type MessageLoader = () => Promise<{ default: unknown }>;

/**
 * The UI strings every Lumenary site shares (src/i18n/messages/<locale>.json): the header and
 * footer, the theme and language menus, lesson blocks and sections, exercises, the cat guides.
 * A site adds its own strings with `createMessages` (or `createI18n` in `@lumenary/core/i18n/server`).
 */
export const CORE_MESSAGES: Messages = en;

const coreLoaders: Record<Locale, MessageLoader> = {
  en: async () => ({ default: en }),
  es: () => import("./messages/es.json"),
  ar: () => import("./messages/ar.json"),
  hi: () => import("./messages/hi.json"),
  "zh-Hans": () => import("./messages/zh-Hans.json"),
  sw: () => import("./messages/sw.json"),
};

/**
 * `over` laid onto `base`, key by key, keeping only the keys `base` has: missing keys in a locale
 * fall back to the canonical English source, so a partially translated locale still renders.
 */
export function deepMerge(base: Json, over: Json | undefined): Json {
  if (over === undefined) return base;
  if (typeof base === "string" || typeof over === "string") return typeof over === "string" ? over : base;
  const out: { [key: string]: Json } = {};
  for (const key of Object.keys(base)) out[key] = deepMerge(base[key], over[key]);
  return out;
}

/** Two catalogues joined: every key of either, `b` winning where both have one (a site's strings over the core's). */
export function combine(a: Messages, b: Messages): Messages {
  const out: Messages = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const prev = out[key];
    out[key] = prev && typeof prev === "object" && typeof value === "object" ? combine(prev, value) : value;
  }
  return out;
}

export interface SiteMessages {
  /** The site's own English strings (the canonical source). */
  en?: Messages;
  /** Loaders for the site's other locales; a missing locale falls back to English. */
  locales?: Partial<Record<Locale, MessageLoader>>;
}

/**
 * A `getMessages(locale)` for a site: the shared strings and the site's own, in English, overlaid key
 * by key with the locale's translations of both. Results are cached per locale.
 */
export function createMessages(site: SiteMessages = {}): (locale: Locale) => Promise<Messages> {
  const english = combine(en, site.en ?? {});
  const cache = new Map<Locale, Promise<Messages>>();
  const load = async (loader: MessageLoader | undefined): Promise<Messages> => {
    if (!loader) return {};
    try {
      return ((await loader()).default ?? {}) as Messages;
    } catch {
      return {};
    }
  };
  return (locale) => {
    if (locale === "en") return Promise.resolve(english);
    if (!cache.has(locale))
      cache.set(
        locale,
        Promise.all([load(coreLoaders[locale]), load(site.locales?.[locale])]).then(([core, own]) => deepMerge(english, combine(core, own)) as Messages),
      );
    return cache.get(locale)!;
  };
}

/** The shared strings alone, for a site with none of its own. */
export const getMessages = createMessages();

/** Namespaces every page's client components need (header, language menu, theme). */
export const CORE_NAMESPACES = ["meta", "nav", "theme", "cats", "language", "modes", "common", "levels", "status"] as const;

/** A subset of the catalogue, so each page only ships the strings its client components use. */
export function pickMessages(messages: Messages, namespaces: readonly string[]): Partial<Messages> {
  const out: Record<string, Json> = {};
  for (const ns of namespaces) {
    // "w.fractions" picks one sub-namespace, so pages ship only the widget strings they use.
    const [top, sub] = ns.split(".", 2);
    if (!(top in messages)) continue;
    if (sub === undefined) out[top] = messages[top];
    else {
      const node = messages[top];
      if (node && typeof node === "object" && sub in node) out[top] = { ...((out[top] as Record<string, Json>) ?? {}), [sub]: node[sub] };
    }
  }
  return out;
}
