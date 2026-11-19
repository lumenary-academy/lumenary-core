# @lumenary/core

The shared core of the [Lumenary Academy](https://lumenary.academy) websites. Every Lumenary site (the umbrella site at lumenary.academy, Lumenary Scientia, Lumenary Lingua at [lingua.lumenary.academy](https://lingua.lumenary.academy), Lumenary Prep) depends on this one library instead of copying code: the design system, the brand, the header and footer, the six interface languages, MDX lessons with KaTeX, courses, exercises and the learner's private progress.

It ships TypeScript and TSX **source**, with no build step. A site compiles it with Next.js (`transpilePackages`), and Tailwind CSS v4 scans it for the classes its components use.

Subject content stays in the sites: lessons, Lean, the Python sandbox and Python exercises, Lumenary Math's knowledge graph and widgets, and each site's own pages.

## What it exports

| Import | What it holds |
| --- | --- |
| `@lumenary/core/styles.css` | Design tokens (light and dark), base styles, `.card`, `.btn`, `.chip`, `.prose-lumen`, `.prose-ui`, Shiki and print styles |
| `@lumenary/core/katex` | KaTeX's stylesheet and fonts, imported once for its side effect |
| `@lumenary/core/fonts` | `fontVariables`: Inter, Source Serif 4, JetBrains Mono, Noto Sans Arabic and Devanagari, via `next/font` |
| `@lumenary/core/brand` | `LogoMark`, `Wordmark` (`division` = "Academy", "Scientia", "Lingua", "Prep"), `DIVISIONS` (the brand names) |
| `@lumenary/core/site` | `SiteHeader`, `SiteFooter`, `LanguageSelector`, `ThemeToggle`, `initScript`, `RootLocalePage` (the language-picking `/`), and the sites' URLs (`ACADEMY_URL`, `SCIENTIA_URL`, `LINGUA_URL`, `PREP_URL`) |
| `@lumenary/core/i18n` | The six locales (`LOCALES`, `LOCALE_META`, right-to-left, `negotiateLocale`, `languageName`), message catalogues (`createMessages`, `makeT`, `pickMessages`, `CORE_MESSAGES`) |
| `@lumenary/core/i18n/client` | `I18nProvider`, `useI18n` |
| `@lumenary/core/i18n/server` | `createI18n` (a site's `getMessages`, `getT` and `Messages` provider), `resolveLocale`, `formatNumber` |
| `@lumenary/core/i18n/messages/<locale>.json` | The shared interface strings, in `en`, `es`, `ar`, `hi`, `sw` and `zh-Hans` |
| `@lumenary/core/routing` | `createRouting`: locale-prefixed links for pages that exist only in some locales (a course in its teaching locale), and where the language menu sends a reader |
| `@lumenary/core/markdown` | `mdToHtml`, `mdInline`, `renderMdx`, `extractToc`, the KaTeX options and macros, `rehypeKatexHtml` (server-only) |
| `@lumenary/core/lesson` | `makeBlocks` (`Section`, `Definition`, `Theorem`, `Proof`, `Example`, `Misconception`, `Note`, `Analogy`, `Figure`, `Reflection`, `Viewpoint`, `ForGrownUps`, `Narrator`), `makeLessonComponents`, `ExerciseList`, `TranslationNotice` |
| `@lumenary/core/lesson/client` | `Say`, `Toc`, `LensArticle`, `RecordVisit`, `ProgressiveHints`, `SECTION_KINDS`, `LENSES` (safe in client components) |
| `@lumenary/core/exercises` | `ExerciseCard` (choice, integer, set and text answers, hints, worked solutions) and the answer parsers |
| `@lumenary/core/exercises/render` | `renderExerciseList`: exercises' Markdown and maths to HTML (server-only) |
| `@lumenary/core/course` | `createCourseLoader`, `CourseOverview`, `CourseLessonPage`, `CourseSite` (server-only) |
| `@lumenary/core/schema` | zod schemas: `CourseFile`, `CourseLessonFrontmatter`, `Exercise` and `exerciseUnion`, `ExercisesFile` and `exercisesFileOf`, `PageFrontmatter`, `Translation`, `Reference`, `VerificationLabel` |
| `@lumenary/core/progress` | The optional, private progress store (`localStorage`, keys `lumenary:progress:v1` and `lumenary:progress:enabled`) and `useProgress` |
| `@lumenary/core/cats` | Lumenary Scientia's cat guides: `NarratorAvatar`, `makeNarrator`, `guideLabel` (guide sets), `CatToggle` |
| `@lumenary/core/code` | `CodeBlock` (fenced code, highlighted with Shiki on the server; a site can make a language runnable) and `highlight` |
| `@lumenary/core/pages` | `createPageLoader` and `ProsePage`: MDX prose pages in several locales with English fallback |
| `@lumenary/core/ui` | `VerificationBadge`, `ModeBadge`, `PageHeader` |

The browser keeps the same keys as before the split: `lumenary:theme`, `lumenary:cats`, `lumenary:locale` and the progress keys above.

## Installing it in a site

The sites depend on a tagged release:

```json
"dependencies": {
  "@lumenary/core": "github:lumenary-academy/lumenary-core#v0.1.0"
}
```

For local work on the core and a site together, check them out side by side and link it instead:

```json
"@lumenary/core": "file:../lumenary-core"
```

npm then links the package rather than copying it, and does not install the core's own dependencies: run `npm install` in `lumenary-core` first. React, React DOM and Next.js are peer dependencies, so a site always runs with its own copies (Next.js also resolves them to its own); the core's copies are there only for its tests and type checks.

Pin the same versions of shared dependencies (`next`, `react`, `react-dom`, `lucide-react`, `zod`, the remark and rehype plugins) in the site as in the core, so npm installs one copy of each from a tagged release.

### next.config.ts

```ts
import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// When the core is linked from a sibling checkout, Turbopack may read it only if told where it is.
const core = fs.realpathSync(path.join(process.cwd(), "node_modules/@lumenary/core"));
const linked = path.relative(process.cwd(), core).startsWith("..");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@lumenary/core"],
  experimental: {
    ...(linked ? { turbopackAdditionalRoots: { "lumenary-core": { path: core } } } : {}),
  },
};

export default nextConfig;
```

`transpilePackages` makes Next.js compile the core's TypeScript. `turbopackAdditionalRoots` is needed only while the core is linked with `file:`; installed from GitHub it lives inside the site's `node_modules`.

### The global stylesheet

```css
@import "tailwindcss";
@import "@lumenary/core/styles.css";
@source "../../node_modules/@lumenary/core/src";
```

The `@source` path is relative to the stylesheet (here `src/app/globals.css`). Tailwind is imported by the site, not by the core, so it is resolved from the site's own dependencies. KaTeX's stylesheet is imported from the layout (`import "@lumenary/core/katex"`) so that its fonts resolve beside it.

### A minimal site

```ts
// src/lib/site.ts
import "server-only";
import path from "node:path";
import { createI18n } from "@lumenary/core/i18n/server";
import { createCourseLoader, type CourseSite } from "@lumenary/core/course";
import { createRouting, type RoutingConfig } from "@lumenary/core/routing";
import en from "@/i18n/messages/en.json";

export const i18n = createI18n({ en, locales: { es: () => import("@/i18n/messages/es.json") /* , … */ } });
export const courses = createCourseLoader({ root: path.join(process.cwd(), "content/courses") });
export const routingConfig: RoutingConfig = { courses: courses.courseLocales() };
export const routing = createRouting(routingConfig);
export const courseSite: CourseSite = { courses, i18n, routing };
```

```tsx
// src/app/[locale]/layout.tsx
import "@lumenary/core/katex";
import "../globals.css";
import { CORE_NAMESPACES, LOCALES, LOCALE_META, makeT, pickMessages } from "@lumenary/core/i18n";
import { I18nProvider } from "@lumenary/core/i18n/client";
import { resolveLocale } from "@lumenary/core/i18n/server";
import { fontVariables } from "@lumenary/core/fonts";
import { SiteFooter, SiteHeader, initScript } from "@lumenary/core/site";
import { i18n, routing, routingConfig } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const messages = await i18n.getMessages(locale);
  const t = makeT(messages);
  return (
    <html lang={locale} dir={LOCALE_META[locale].dir} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className="min-h-screen">
        <I18nProvider locale={locale} messages={pickMessages(messages, CORE_NAMESPACES)}>
          <SiteHeader division="Prep" siteName="Lumenary Prep" nav={[{ key: "about", path: "about" }]} routing={routingConfig} />
          <main id="main">{children}</main>
          <SiteFooter
            division="Prep"
            columns={[{ title: "Lumenary Prep", links: [{ label: t("nav.about"), href: routing.href(locale, "about") }] }]}
            license={t("footer.license")}
            note={t("footer.noEndorsement")}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
```

A course page is then `<CourseOverview c={course} locale={locale} site={courseSite} />` and a lesson `<CourseLessonPage c={course} slug={slug} locale={locale} site={courseSite} />`. [lumenary-lingua](https://github.com/lumenary-academy/lumenary-lingua) is a complete example.

### Interface strings

A site's catalogue (`createI18n({ en, locales })`) is laid over the shared one. Add strings under new keys; do not redefine a shared key, because the core's translations of it would win over the site's English. A missing translation falls back to English, key by key.

### Where a site plugs in

The core keeps the main repository's markup, CSS classes and props, and turns its Lumenary Scientia assumptions into parameters:

- **Routing** (`createRouting`): which locale each course is generated in, pages generated only in English or only in their translations, and where the language menu goes when a page does not exist in the chosen language. It is plain data, so the server layout passes the same description to the header.
- **Courses** (`createCourseLoader`): the content root, how directories are found (`courseDirs`), how they map to URLs (`pathOf`) and collections (`collectionOf`), and the exercise schema.
- **Course pages** (`CourseSite`): breadcrumbs for nested courses (`parentOf`), the site's own MDX components, a card and renderer for extra exercise types, the tested-code badge (`codeStatus`), related links, HTML rewriting and extra message namespaces; `cats: false` for a site without cat guides; `guides` to name a course's guide set.
- **Exercises**: `exerciseUnion(MyType)` and `exercisesFileOf(…)` for the schema, `renderExerciseList(…, renderExtra)` for the HTML, and `<ExerciseCard bodies={{ myType: MyBody }}>` (in a client component of the site's) for the answer area.
- **Cat guides**: their role labels and guiding questions come in sets. The default is Lumenary Math's (`narrators.chloeRole`, `narrators.chloeQ`, …); a set named `cs` reads `narrators.sets.cs.chloeRole` and so on, falling back key by key to the default. `makeBlocks(t, { guides: "cs" })`, `makeLessonComponents({ …, guides })` and `CourseSite.guides` choose the set.
- **Header and footer**: the division in the wordmark, the navigation (with per-section navigation for parts of a site), the cat button, the footer's columns and licence line.

## Development

```bash
npm install
npm run typecheck
npm test        # schemas, routing, locales and catalogue parity, Markdown and MDX, answer parsing, loaders, guide sets
```

The tests cover the parts that need no browser. A change to the components is checked by building a site against the linked core (`file:../lumenary-core`) and looking at it.

## Releasing

1. Update `version` in `package.json` and commit.
2. Tag the commit `vX.Y.Z` (for example `git tag v0.2.0`) and push the tag.
3. In each site, change its dependency to the new tag (`github:lumenary-academy/lumenary-core#v0.2.0`), run `npm install`, and open a pull request; the site's CI builds it against the new core.

Releases follow semantic versioning: a change to an export's name or props, a CSS class or token, a message key or a `localStorage` key is a breaking change.

## Licence

[Apache-2.0](LICENSE). The interface strings in `src/i18n/messages` are part of the software. Lumenary Academy is an independent project; no institutional endorsement is implied.
