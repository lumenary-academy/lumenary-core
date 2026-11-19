import { LOCALE_META, type Locale } from "../i18n/config";
import type { TFunction } from "../i18n/translate";
import { renderMdx, type MdxComponents } from "../markdown/mdx";
import { makeBlocks } from "../lesson/blocks";
import { PageHeader } from "../ui/PageHeader";
import { TranslationNotice } from "../lesson/TranslationNotice";
import type { PageLoader } from "./loader";

/**
 * Renders an MDX prose page from `<root>/<slug>/<locale>.mdx` with English fallback. `pages` is the
 * site's `createPageLoader`; `helpHref` links the translation notice to the site's contribute page.
 */
export async function ProsePage({ slug, locale, t, eyebrow, children, components = {}, pages, helpHref }: { slug: string; locale: Locale; t: TFunction; eyebrow?: string; children?: React.ReactNode; components?: MdxComponents; pages: PageLoader; helpHref?: string }) {
  const page = pages.getPage(slug, locale);
  const body = await renderMdx(page.body, { ...makeBlocks(t), ...components });
  const lang = { lang: page.locale, dir: LOCALE_META[page.locale].dir };
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={page.frontmatter.title} lead={page.frontmatter.lead} />
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <TranslationNotice t={t} requested={locale} rendered={page.locale} fallback={page.fallback} stale={page.stale} status={page.frontmatter.translation.status} helpHref={helpHref} />
          <div className="prose-ui mt-2" {...lang}>
            {body}
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
