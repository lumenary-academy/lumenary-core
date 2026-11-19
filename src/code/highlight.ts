import "server-only";
import { createHighlighter, type Highlighter } from "shiki";

/** Languages the site highlights: Lean and Python for Lumenary Math, and those the other Scientia courses show. */
export const HIGHLIGHT_LANGS = [
  "lean4", "python", "json", "bash", "sql", "javascript", "typescript", "c", "cpp", "go", "rust", "java", "yaml", "html", "css", "diff",
  // the programming-language courses (content/cs/languages)
  "asm", "riscv", "wasm", "ada", "csharp", "clojure", "cobol", "dart", "elixir", "erlang", "fsharp", "fortran-free-form", "haskell", "julia",
  "kotlin", "lua", "matlab", "ocaml", "pascal", "perl", "php", "prolog", "r", "ruby", "scala", "scheme", "swift", "vb", "zig", "toml", "xml", "makefile",
  // Lumenary EE and Robotics, and the blockchain elective
  "verilog", "system-verilog", "vhdl", "solidity", "cmake", "dockerfile", "proto", "rosmsg",
] as const;
export type HighlightLang = (typeof HIGHLIGHT_LANGS)[number];

const ALIASES: Record<string, HighlightLang> = {
  py: "python", sh: "bash", shell: "bash", console: "bash", js: "javascript", ts: "typescript", "c++": "cpp", rs: "rust", yml: "yaml", lean: "lean4",
  "c#": "csharp", cs: "csharp", "f#": "fsharp", fortran: "fortran-free-form", f90: "fortran-free-form", octave: "matlab", "visual-basic": "vb", vbnet: "vb",
  "object-pascal": "pascal", delphi: "pascal", systemverilog: "system-verilog", sv: "system-verilog", v: "verilog", sol: "solidity", docker: "dockerfile", protobuf: "proto", ex: "elixir", exs: "elixir", erl: "erlang", hs: "haskell", ml: "ocaml", kt: "kotlin", rb: "ruby", pl: "perl", jl: "julia",
};

let highlighter: Promise<Highlighter> | null = null;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ["github-light", "github-dark-dimmed"], langs: [...HIGHLIGHT_LANGS] });
  return highlighter;
}

/** The highlightable language a fence names, or null (then the code is shown plain). */
export function highlightLang(name: string | undefined): HighlightLang | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if ((HIGHLIGHT_LANGS as readonly string[]).includes(lower)) return lower as HighlightLang;
  return ALIASES[lower] ?? null;
}

/** Server-side syntax highlighting with light/dark themes switched by CSS variables. */
export async function highlight(code: string, lang: HighlightLang | "text"): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: "light",
  });
}
