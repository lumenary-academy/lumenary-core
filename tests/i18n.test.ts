import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LOCALES, LOCALE_META, LOCALE_UI_STATUS, languageName, negotiateLocale } from "../src/i18n/config";
import { combine, createMessages, deepMerge, getMessages, makeT, pickMessages, translate, type Messages } from "../src/i18n/dictionary";

type Tree = { [k: string]: string | Tree };
const catalogue = (l: string) => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "../src/i18n/messages", `${l}.json`), "utf8")) as Tree;

function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
  }
  return out;
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const en = flatten(catalogue("en"));

describe("the shared message catalogues", () => {
  it("English has only string leaves (no arrays)", () => {
    const walk = (t: unknown): void => {
      expect(Array.isArray(t)).toBe(false);
      if (t && typeof t === "object") Object.values(t).forEach(walk);
    };
    walk(catalogue("en"));
  });
  for (const locale of LOCALES.filter((l) => l !== "en")) {
    describe(locale, () => {
      const flat = flatten(catalogue(locale));
      it("has exactly the keys English has", () => {
        expect([...flat.keys()].filter((k) => !en.has(k)), "orphan keys").toEqual([]);
        expect([...en.keys()].filter((k) => !flat.has(k)), "missing keys").toEqual([]);
      });
      it("keeps the same {placeholders}", () => {
        for (const [k, v] of flat) expect(placeholders(v), `${locale}: ${k}`).toEqual(placeholders(en.get(k)!));
      });
    });
  }
});

describe("locale negotiation", () => {
  it("matches base languages and falls back to English", () => {
    expect(negotiateLocale(["es-MX", "en"])).toBe("es");
    expect(negotiateLocale(["fr-FR"])).toBe("en");
    expect(negotiateLocale(["sw-KE"])).toBe("sw");
    expect(negotiateLocale(["zh-CN"])).toBe("zh-Hans");
  });
  it("sends Arabic varieties to Modern Standard Arabic", () => {
    expect(negotiateLocale(["arz"])).toBe("ar");
    expect(negotiateLocale(["ar-EG"])).toBe("ar");
  });
  it("does not silently convert Traditional Chinese preferences to Simplified", () => {
    expect(negotiateLocale(["zh-TW"])).toBe("en");
    expect(negotiateLocale(["zh-Hant-HK", "zh-Hans"])).toBe("zh-Hans");
  });
  it("marks Arabic right-to-left and every non-English interface a machine draft", () => {
    expect(LOCALES.filter((l) => LOCALE_META[l].dir === "rtl")).toEqual(["ar"]);
    expect(LOCALES.filter((l) => LOCALE_UI_STATUS[l] === "canonical")).toEqual(["en"]);
  });
  it("names languages in each locale from CLDR", () => {
    expect(languageName("es", "en")).toBe("Spanish");
    expect(languageName("en", "es")).toBe("inglés");
    expect(languageName("es", "zh-Hans")).toBe("西班牙语");
  });
});

describe("message lookup", () => {
  const messages: Messages = { a: { b: "Hello {name}, {name}", c: "x" } };
  it("interpolates and falls back to the key", () => {
    expect(translate(messages, "a.b", { name: "Ada" })).toBe("Hello Ada, Ada");
    expect(translate(messages, "a.missing")).toBe("a.missing");
    expect(makeT(messages)("a.c")).toBe("x");
  });
  it("merges a locale onto English key by key, dropping orphans", () => {
    expect(deepMerge({ a: { b: "B", c: "C" } }, { a: { b: "β", z: "orphan" } })).toEqual({ a: { b: "β", c: "C" } });
    expect(combine({ a: { b: "B" } }, { a: { c: "C" }, d: "D" })).toEqual({ a: { b: "B", c: "C" }, d: "D" });
  });
  it("picks namespaces and sub-namespaces", () => {
    expect(pickMessages({ a: { x: "1", y: "2" }, b: "3" }, ["a.x", "b", "none"])).toEqual({ a: { x: "1" }, b: "3" });
  });
});

describe("a site's catalogue", () => {
  const getSiteMessages = createMessages({
    en: { site: { hello: "Hello" }, nav: { courses: "Courses" } },
    locales: { es: async () => ({ default: { site: { hello: "Hola" } } }) },
  });
  it("adds the site's strings to the shared ones, with English fallback", async () => {
    const es = makeT(await getSiteMessages("es"));
    expect(es("site.hello")).toBe("Hola");
    expect(es("nav.courses")).toBe("Courses");
    expect(es("nav.home")).toBe("Inicio");
    const sw = makeT(await getSiteMessages("sw"));
    expect(sw("site.hello")).toBe("Hello");
    expect(sw("theme.label")).toBe(makeT(await getMessages("sw"))("theme.label"));
  });
});
