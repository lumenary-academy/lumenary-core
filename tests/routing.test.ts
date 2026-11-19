import { describe, expect, it } from "vitest";
import { createRouting, href, pageLocale } from "../src/routing";

describe("plain routing", () => {
  it("prefixes the locale and adds the trailing slash", () => {
    expect(href("en")).toBe("/en/");
    expect(href("es", "about")).toBe("/es/about/");
    expect(href("ar", "/about/")).toBe("/ar/about/");
    expect(href("zh-Hans", "about#team")).toBe("/zh-Hans/about/#team");
    expect(pageLocale("sw", "anything")).toBe("sw");
  });
});

describe("courses generated in their teaching locale only", () => {
  const { href, pageLocale } = createRouting({ courses: { spanish: "en", ingles: "es" } });
  it("links every locale to the course's own locale", () => {
    expect(href("es", "spanish")).toBe("/en/spanish/");
    expect(href("ar", "ingles")).toBe("/es/ingles/");
    expect(href("hi", "spanish/sounds-and-greetings")).toBe("/en/spanish/sounds-and-greetings/");
    expect(href("en", "ingles/quien-eres#vocabulario")).toBe("/es/ingles/quien-eres/#vocabulario");
    expect(href("es", "ingles")).toBe("/es/ingles/");
    expect(href("sw", "about")).toBe("/sw/about/");
    expect(href("zh-Hans")).toBe("/zh-Hans/");
  });
  it("matches whole path segments only", () => {
    expect(pageLocale("es", "spanishness")).toBe("es");
    expect(pageLocale("hi", "spanish/")).toBe("en");
  });
  it("uses the longest matching course path", () => {
    const r = createRouting({ courses: { cs: "en", "cs/languages/rust": "es" } });
    expect(r.pageLocale("hi", "cs/languages/rust/ownership")).toBe("es");
    expect(r.pageLocale("hi", "cs/languages")).toBe("en");
  });
});

describe("Lumenary Scientia's routing, described as data", () => {
  // The rules of the main repository's src/lib/href.ts.
  const r = createRouting({
    courses: { cs: "en", ee: "en", "cs/languages/rust": "en", "lingua/spanish": "en", "lingua/ingles": "es" },
    translated: { pattern: "^(math\\/lessons|practice|educators\\/worksheets)\\/([^/#]+)", locales: { collections: ["ar", "es"] } },
    englishOnly: ["^(lab|formal)\\/[^/#]+"],
    fallbacks: { "math/lessons": "math/curriculum" },
  });
  it("reproduces its links", () => {
    expect(r.href("es", "cs/complexity")).toBe("/en/cs/complexity/");
    expect(r.href("ar", "lingua/ingles")).toBe("/es/lingua/ingles/");
    expect(r.href("es", "lingua/spanish/sounds-and-greetings")).toBe("/en/lingua/spanish/sounds-and-greetings/");
    expect(r.href("hi", "lingua")).toBe("/hi/lingua/");
    // Fixed here: the main repository's href() sent English pages to /en/lingua/ingles/, which is never generated.
    expect(r.href("en", "lingua/ingles")).toBe("/es/lingua/ingles/");
    expect(r.href("es", "math/lessons/collections")).toBe("/es/math/lessons/collections/");
    expect(r.href("sw", "math/lessons/collections")).toBe("/en/math/lessons/collections/");
    expect(r.href("sw", "practice/collections")).toBe("/en/practice/collections/");
    expect(r.href("ar", "lab/hilbert-hotel")).toBe("/en/lab/hilbert-hotel/");
    expect(r.href("ar", "lab")).toBe("/ar/lab/");
  });
  it("sends the language menu to the nearest page that exists", () => {
    expect(r.switchHref("es", "math/lessons/collections/")).toBe("/es/math/lessons/collections/");
    expect(r.switchHref("sw", "math/lessons/collections/")).toBe("/sw/math/curriculum/");
    expect(r.switchHref("ar", "lab/hilbert-hotel/")).toBe("/ar/lab/");
    expect(r.switchHref("es", "cs/complexity/")).toBe("/en/cs/");
    expect(r.switchHref("hi", "about/")).toBe("/hi/about/");
  });
});

describe("the language menu on a site whose courses fall back to the front page", () => {
  const r = createRouting({ courses: { spanish: "en", ingles: "es" }, fallbacks: { spanish: "", ingles: "" } });
  it("keeps a page that exists and otherwise goes home", () => {
    expect(r.switchHref("es", "ingles/quien-eres/")).toBe("/es/ingles/quien-eres/");
    expect(r.switchHref("ar", "ingles/quien-eres/")).toBe("/ar/");
    expect(r.switchHref("en", "spanish/")).toBe("/en/spanish/");
    expect(r.switchHref("en", "ingles/")).toBe("/en/");
    expect(r.switchHref("zh-Hans", "spanish/")).toBe("/zh-Hans/");
    expect(r.switchHref("sw", "")).toBe("/sw/");
  });
});
