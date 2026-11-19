/**
 * Markdown and MDX, rendered on the server (at build time for a static export) with KaTeX for
 * mathematics: no maths JavaScript ships to the browser. Server-only.
 */
export { katexOptions, mdInline, mdToHtml, KATEX_MACROS } from "./markdown";
export { extractToc, rehypeCodeMeta, renderMdx, type MdxComponents, type TocEntry } from "./mdx";
export { rehypeKatexHtml } from "./rehype-katex-html";
