import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { guideLabel, makeNarrator } from "../src/cats/Narrator";
import { CORE_MESSAGES, combine, makeT } from "../src/i18n/dictionary";

// A site's catalogue that adds one guide set, as the main repository does for its subjects.
const t = makeT(combine(CORE_MESSAGES, { narrators: { sets: { cs: { chloeRole: "The Computer Scientist", chloeQ: "Why does this work?" } } } }));

describe("the cat guides' sets of role labels", () => {
  it("default to Lumenary Math's labels", () => {
    expect(guideLabel(t, "chloe", "Role")).toBe("The Mathematician");
    expect(guideLabel(t, "gideon", "Q")).toBe("Can we prove this precisely?");
  });
  it("read a named set, falling back key by key to the default", () => {
    expect(guideLabel(t, "chloe", "Role", "cs")).toBe("The Computer Scientist");
    expect(guideLabel(t, "chloe", "Q", "cs")).toBe("Why does this work?");
    expect(guideLabel(t, "margaret", "Role", "cs")).toBe("The Computationalist");
    expect(guideLabel(t, "gideon", "Role", "no-such-set")).toBe("The Formalist");
  });
  it("label the <Narrator> block with the set's role and the cat's own name", () => {
    const html = (guides?: string) => renderToStaticMarkup(createElement(makeNarrator(t, guides), { who: "chloe" }, "Look."));
    expect(html()).toContain("The Mathematician");
    expect(html("cs")).toContain("The Computer Scientist");
    expect(html("cs")).toContain("Chloe · ");
    expect(html("cs")).toContain('data-mode="H"');
  });
});
