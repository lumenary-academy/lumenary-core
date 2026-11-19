import { describe, expect, it } from "vitest";
import { compile } from "@mdx-js/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { extractToc, katexOptions, mdInline, mdToHtml, rehypeKatexHtml } from "../src/markdown";

describe("Markdown", () => {
  it("renders GFM and typesets maths on the server", () => {
    const html = mdToHtml("| a | b |\n| - | - |\n| $x^2$ | **y** |");
    expect(html).toContain("<table>");
    expect(html).toContain('class="katex"');
    expect(html).toContain("<strong>y</strong>");
  });
  it("unwraps a single paragraph for inline labels", () => {
    expect(mdInline("*hola*")).toBe("<em>hola</em>");
    expect(mdInline("one\n\ntwo")).toBe("<p>one</p>\n<p>two</p>");
  });
  it("expands the shared KaTeX macros", () => {
    expect(mdToHtml("$\\R$")).toContain("mathbb");
  });
});

describe("MDX pipeline", () => {
  it("collapses every typeset formula, including those inside JSX blocks, into one HTML string", async () => {
    const source = '<Section id="a" kind="human" title="t">\n\nLet $x^2$ be given.\n\n<Theorem name="T">\n\n$$\n\\frac{1}{2}\n$$\n\n</Theorem>\n\n</Section>';
    const out = String(await compile(source, { remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, katexOptions], rehypeKatexHtml] }));
    expect((out.match(/KatexHtml/g) ?? []).length).toBeGreaterThanOrEqual(2);
    // No KaTeX span tree survives as JSX: the formula markup lives only inside the html strings.
    expect(out).not.toMatch(/className: "mord/);
  });
  it("builds a table of contents from the sections", () => {
    expect(extractToc('<Section id="a" kind="vocabulary" title="Words">\n\n<Section id="b" title="No kind">')).toEqual([
      { id: "a", title: "Words", kind: "vocabulary" },
      { id: "b", title: "No kind", kind: "" },
    ]);
  });
});
