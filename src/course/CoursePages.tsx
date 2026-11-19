import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, ExternalLink } from "lucide-react";
import { LOCALE_META, type Locale } from "../i18n/config";
import type { TFunction } from "../i18n/translate";
import type { SiteI18n } from "../i18n/server";
import type { Routing } from "../routing";
import type { Exercise } from "../schema";
import { renderExerciseList, type RenderExtraExercise } from "../exercises/render";
import { mdInline, mdToHtml } from "../markdown/markdown";
import { extractToc, renderMdx, type MdxComponents } from "../markdown/mdx";
import { makeLessonComponents } from "../lesson/components";
import type { ExerciseCardComponent } from "../lesson/Exercises";
import { Toc } from "../lesson/LessonChrome";
import { VerificationBadge } from "../ui/Badges";
import { NarratorAvatar } from "../cats/Narrators";
import { CatToggle } from "../cats/CatToggle";
import { CodeBlock } from "../code/CodeBlock";
import type { CourseLoader, LoadedCourse } from "./loader";

/**
 * Everything the course pages need from the site that renders them. The site builds it once, in a
 * server-only module, from its course loader, its i18n and its routing; the hooks are where a site's
 * own subjects plug in (Lumenary Scientia: Lumenary CS's collections, Lumenary Math topics, Python).
 */
export interface CourseSite<E = Exercise> {
  courses: CourseLoader<E>;
  i18n: SiteI18n;
  routing: Routing;
  /**
   * The parent page of a nested course (Lumenary CS's programming languages and electives): the breadcrumb
   * link, and the eyebrow above the course title. Without one, the eyebrow is the division's name.
   */
  parentOf?: (c: LoadedCourse, locale: Locale) => { href: string; label: string; eyebrow: string } | null;
  /** The cat guides: a lesson's frontmatter `narrators` and `<Narrator>` (default true; Lumenary Lingua has none). */
  cats?: boolean;
  /**
   * The cat guides' set of role labels for a course (`narrators.sets.<set>.*`, e.g. "cs" or "ee"); without
   * one, or for a course it returns nothing for, Lumenary Math's default labels.
   */
  guides?: (c: LoadedCourse) => string | undefined;
  /** The site's own MDX components for a lesson (links, widgets, a runnable code block…), laid over the core's. */
  components?: (ctx: { c: LoadedCourse; slug: string; locale: Locale; t: TFunction }) => MdxComponents;
  /** A card for exercise types the site adds, and how to render them (Lumenary Scientia: Python). */
  ExerciseCard?: ExerciseCardComponent;
  renderExercise?: RenderExtraExercise;
  /** A lesson's tested code, from the site's report, for the "code tested" badge. */
  codeStatus?: (c: LoadedCourse, slug: string) => { tested: boolean; count: number } | null;
  /** Links shown beside a lesson's prerequisites for its frontmatter `related` ids (Lumenary Math topics). */
  related?: (ids: string[], locale: Locale) => { key: string; href: string; title: string }[];
  /** Rewrites a course's rendered description and subtitle (Scientia: links into unpublished subjects become text). */
  rewriteHtml?: (html: string) => string;
  /** Message namespaces the lesson's client components need beyond the core's (Scientia: "python" and widget strings). */
  messageNamespaces?: (body: string) => string[];
}

const DIVISION_NAME = { scientia: "Lumenary Scientia", lingua: "Lumenary Lingua" } as const;

const lessonHref = (site: { routing: Routing }, locale: string, c: LoadedCourse, slug: string) => site.routing.href(locale, `${c.path}/${slug}`);

/** A course's front page: its description, anything the subject adds (`extra`), and every level with its lessons. */
export async function CourseOverview<E>({ c, locale, extra, site }: { c: LoadedCourse; locale: Locale; extra?: React.ReactNode; site: CourseSite<E> }) {
  const parent = site.parentOf?.(c, locale) ?? null;
  const rewrite = site.rewriteHtml ?? ((html: string) => html);
  const { getCourseLesson } = site.courses;
  const { course } = c;
  let n = 0;
  return (
    <div lang={course.locale} dir={LOCALE_META[course.locale].dir}>
      <header className="relative overflow-hidden border-b border-line">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" aria-hidden="true" />
        <div className="container-page relative py-12 sm:py-16">
          <p className="eyebrow">
            {parent ? (
              <Link href={parent.href} className="hover:underline">
                {parent.eyebrow}
              </Link>
            ) : (
              DIVISION_NAME[course.division]
            )}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.08] text-ink sm:text-[3.4rem]">{course.title}</h1>
          <p className="mt-4 max-w-3xl font-serif text-xl leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: rewrite(mdInline(course.subtitle)) }} />
          <div className="prose-lumen mt-6 max-w-3xl text-ink-2">
            {course.description.map((p, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: rewrite(mdToHtml(p)) }} />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <VerificationBadge label="ai-drafted" text={course.ui.aiDrafted} />
            <VerificationBadge label="awaiting" text={course.ui.awaitingReview} />
          </div>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label={course.ui.levels}>
            {course.levels.map((l) => (
              <a key={l.id} href={`#${l.id}`} className="chip hover:border-line-2 hover:text-ink">
                {l.short}
              </a>
            ))}
          </nav>
        </div>
      </header>
      {extra}
      <div className="container-page space-y-14 py-12">
        {course.levels.map((level) => (
          <section key={level.id} id={level.id} className="scroll-mt-24" aria-labelledby={`${level.id}-title`}>
            <p className="eyebrow">
              {level.short} · {level.lessons.length} {course.ui.lessons}
            </p>
            <h2 id={`${level.id}-title`} className="mt-2 text-3xl font-semibold text-ink">
              {level.title}
            </h2>
            <p className="mt-2 max-w-3xl text-ink-2" dangerouslySetInnerHTML={{ __html: mdInline(level.summary) }} />
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {level.lessons.map((slug) => {
                const { frontmatter: fm } = getCourseLesson(c, slug);
                n += 1;
                return (
                  <li key={slug}>
                    <Link prefetch={false} href={lessonHref(site, locale, c, slug)} className="card group flex h-full gap-4 p-4 hover:shadow-[var(--shadow-lg)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-sm font-bold text-muted group-hover:bg-gold group-hover:text-[#1b1406]">{n}</span>
                      <span className="min-w-0">
                        <span className="block font-display text-lg font-semibold leading-snug text-ink">{fm.title}</span>
                        <span className="mt-1 block text-sm leading-snug text-ink-2" dangerouslySetInnerHTML={{ __html: mdInline(fm.subtitle) }} />
                        <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted">
                          <Clock size={12} aria-hidden="true" /> {fm.minutes} {course.ui.minutes}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        {course.references.length > 0 && (
          <section aria-labelledby="course-references">
            <h2 id="course-references" className="text-2xl font-semibold text-ink">
              {course.ui.references}
            </h2>
            <References refs={course.references} />
          </section>
        )}
      </div>
    </div>
  );
}

function References({ refs }: { refs: LoadedCourse["course"]["references"] }) {
  return (
    <ul className="mt-4 space-y-2 text-ink-2">
      {refs.map((r) => (
        <li key={`${r.title}${r.url ?? ""}`} className="flex gap-2">
          <ExternalLink size={14} className="mt-1 shrink-0 text-muted" aria-hidden="true" />
          <span>
            {r.url ? (
              <a href={r.url} className="link" rel="noopener noreferrer">
                {r.title}
              </a>
            ) : (
              <span className="font-semibold text-ink">{r.title}</span>
            )}
            {r.author && <span className="text-muted"> · {r.author}</span>}
            {r.year && <span className="text-muted"> · {r.year}</span>}
            {r.note && <span className="block text-sm text-muted" dangerouslySetInnerHTML={{ __html: mdInline(r.note) }} />}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** One lesson of a course: header, objectives, the MDX body with its exercises, references, and the way on. */
export async function CourseLessonPage<E>({ c, slug, locale, site }: { c: LoadedCourse; slug: string; locale: Locale; site: CourseSite<E> }) {
  const { course } = c;
  const { getCourseLesson, getCourseExercises } = site.courses;
  const href = site.routing.href;
  const t = await site.i18n.getT(locale);
  const cats = site.cats ?? true;
  const lesson = getCourseLesson(c, slug);
  const fm = lesson.frontmatter;
  const exercises = renderExerciseList(getCourseExercises(c, slug) as never, slug, fm.title, site.renderExercise);
  const components: MdxComponents = {
    ...makeLessonComponents({ t, exercises, ExerciseCard: site.ExerciseCard, cats, guides: site.guides?.(c) }),
    pre: CodeBlock,
    LessonLink: ({ slug: to, children }: { slug: string; children?: React.ReactNode }) => {
      if (!c.slugs.includes(to)) throw new Error(`<LessonLink slug="${to}">: no such lesson in ${c.dir}`);
      return (
        <Link prefetch={false} href={lessonHref(site, locale, c, to)} className="underline decoration-gold/60 underline-offset-2 hover:decoration-gold">
          {children ?? getCourseLesson(c, to).frontmatter.title}
        </Link>
      );
    },
    ...site.components?.({ c, slug, locale, t }),
  };
  const content = await renderMdx(lesson.body, components);
  const toc = extractToc(lesson.body);
  const index = c.slugs.indexOf(slug);
  const prev = c.slugs[index - 1];
  const next = c.slugs[index + 1];
  const levelIndex = lesson.level.lessons.indexOf(slug);
  const code = site.codeStatus?.(c, slug) ?? null;
  const related = site.related?.(fm.related, locale) ?? [];
  const narrators = cats ? fm.narrators : [];
  const ui = course.ui;
  const parent = site.parentOf?.(c, locale) ?? null;
  const { Messages } = site.i18n;

  return (
    <Messages locale={locale} ns={["exercise", "lesson", "lingua", ...(site.messageNamespaces?.(lesson.body) ?? [])]}>
      <div lang={course.locale} dir={LOCALE_META[course.locale].dir}>
        <header className="relative overflow-hidden border-b border-line">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" aria-hidden="true" />
          <div className="container-page relative py-10 sm:py-14">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Breadcrumb">
              {parent && (
                <>
                  <Link href={parent.href} className="hover:text-ink">
                    {parent.label}
                  </Link>
                  <span aria-hidden="true">/</span>
                </>
              )}
              <Link href={href(locale, c.path)} className="hover:text-ink">
                {course.title}
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={`${href(locale, c.path)}#${lesson.level.id}`} className="hover:text-ink">
                {lesson.level.short}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-ink-2">
                {levelIndex + 1} · {fm.title}
              </span>
            </nav>
            <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip border-ink bg-ink text-paper">{lesson.level.short}</span>
                  <span className="chip">
                    <Clock size={12} aria-hidden="true" /> {fm.minutes} {ui.minutes}
                  </span>
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.08] text-ink sm:text-[3.2rem]">{fm.title}</h1>
                <p className="mt-4 max-w-2xl font-serif text-xl leading-relaxed text-ink-2" dangerouslySetInnerHTML={{ __html: mdInline(fm.subtitle) }} />
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {code?.tested && ui.codeTested && <VerificationBadge label="computationally-tested" text={`${ui.codeTested} · ${code.count}`} />}
                  <VerificationBadge label="ai-drafted" text={ui.aiDrafted} />
                  <VerificationBadge label="awaiting" text={ui.awaitingReview} />
                </div>
                {narrators.length > 0 && (
                  <div data-cat className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {narrators.map((n) => (
                        <NarratorAvatar key={n} who={n} size={36} className="rounded-full ring-2 ring-paper" />
                      ))}
                    </div>
                    <p className="text-sm text-muted">
                      {t("lesson.narrators")}: {narrators.map((n) => t(`narrators.${n}`)).join(", ")}
                    </p>
                    <span className="no-print">
                      <CatToggle variant="text" />
                    </span>
                  </div>
                )}
              </div>
              <aside className="card self-start p-5">
                <p className="eyebrow">{ui.objectives}</p>
                <ul className="mt-3 space-y-2">
                  {fm.objectives.map((o) => (
                    <li key={o} className="flex gap-2.5 text-[0.95rem] leading-snug text-ink">
                      <Check size={16} className="mt-0.5 shrink-0 text-good" aria-hidden="true" />
                      <span dangerouslySetInnerHTML={{ __html: mdInline(o) }} />
                    </li>
                  ))}
                </ul>
                <p className="eyebrow mt-5">{ui.prerequisites}</p>
                {fm.prerequisites.length + related.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-2">{ui.none}</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {fm.prerequisites.map((p) => (
                      <li key={p}>
                        <Link prefetch={false} href={lessonHref(site, locale, c, p)} className="chip hover:border-line-2 hover:text-ink">
                          {getCourseLesson(c, p).frontmatter.title}
                        </Link>
                      </li>
                    ))}
                    {related.map((r) => (
                      <li key={r.key}>
                        <Link prefetch={false} href={r.href} className="chip border-gold/50 bg-gold-soft text-gold-ink hover:border-gold">
                          {r.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          </div>
        </header>

        <div className="container-page grid gap-10 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,46rem)_1fr]">
          <aside className="no-print hidden lg:block">
            <div className="sticky top-24 space-y-8">
              <nav aria-label={lesson.level.title}>
                <p className="eyebrow mb-3">{lesson.level.short}</p>
                <ol className="max-h-[50vh] space-y-1 overflow-y-auto pe-1">
                  {lesson.level.lessons.map((s, i) => {
                    const current = s === slug;
                    return (
                      <li key={s}>
                        <Link
                          prefetch={false}
                          href={lessonHref(site, locale, c, s)}
                          aria-current={current ? "page" : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${current ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${current ? "bg-gold text-[#1b1406]" : "bg-paper-2 text-muted"}`}>{i + 1}</span>
                          {getCourseLesson(c, s).frontmatter.title}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <Toc entries={toc} title={ui.contents} />
            </div>
          </aside>

          <article className="min-w-0">
            {content}
            {fm.references.length > 0 && (
              <section className="border-t border-line py-10" aria-labelledby="lesson-references">
                <h2 id="lesson-references" className="text-[1.6rem] font-semibold text-ink">
                  {ui.references}
                </h2>
                <References refs={fm.references} />
              </section>
            )}
            <nav className="no-print mt-12 grid gap-3 border-t border-line pt-8 sm:grid-cols-2" aria-label={ui.lessons}>
              {prev ? (
                <Link prefetch={false} href={lessonHref(site, locale, c, prev)} className="card group flex items-center gap-3 p-4 hover:shadow-[var(--shadow-lg)]">
                  <ArrowLeft size={18} className="text-muted transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-muted">{ui.previous}</span>
                    <span className="font-display text-lg font-semibold text-ink">{getCourseLesson(c, prev).frontmatter.title}</span>
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link prefetch={false} href={lessonHref(site, locale, c, next)} className="card group flex items-center justify-end gap-3 p-4 text-end hover:shadow-[var(--shadow-lg)]">
                  <span>
                    <span className="block text-xs text-muted">{ui.next}</span>
                    <span className="font-display text-lg font-semibold text-ink">{getCourseLesson(c, next).frontmatter.title}</span>
                  </span>
                  <ArrowRight size={18} className="text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
              ) : (
                <Link prefetch={false} href={href(locale, c.path)} className="card flex items-center justify-end p-4 text-end text-sm font-semibold text-ink">
                  {ui.backTo} {course.title}
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </Messages>
  );
}
