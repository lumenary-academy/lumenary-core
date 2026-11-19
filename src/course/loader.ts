import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/i18n/config";
import { CourseCodeReport, CourseFile, CourseLessonFrontmatter, ExercisesFile, type CourseLevel, type Exercise } from "./schema";
import { ROOT } from "./content";

/**
 * Courses outside Lumenary Math: Lumenary Scientia's other subjects (content/cs, content/ee,
 * content/robotics), the courses nested in a subject (Lumenary CS's programming languages,
 * content/cs/languages/<id>, and electives, content/cs/electives/<id>), and Lumenary Lingua's
 * courses (content/lingua/<id>). A course is a syllabus (course.json: levels, each an ordered list
 * of lesson slugs) and one directory per lesson (lesson.mdx, exercises.json). Pages are generated
 * only in the locale the course is taught in (see src/lib/href.ts). docs/courses.md is the
 * authoring guide.
 */

const CONTENT = path.join(ROOT, "content");
const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);

/** Families of courses nested in a subject, by directory: each has an index page at its path. */
export const COLLECTIONS = {
  "cs/languages": { label: "Programming languages" },
  "cs/electives": { label: "Electives" },
} as const;
export type Collection = keyof typeof COLLECTIONS;

/** Directories under content/ that are not courses (Lingua's courses are one level down). */
const NOT_COURSES = new Set(["math", "pages", "registry", "verification", "lingua"]);

export interface LoadedCourse {
  course: CourseFile;
  /** Directory under content/, e.g. "cs", "ee", "cs/languages/rust" or "lingua/spanish". */
  dir: string;
  /** Site path of the course page, without locale: "cs" or "lingua/spanish". */
  path: string;
  /** The family the course is nested in ("cs/languages", "cs/electives"), if any. */
  collection?: Collection;
  /** Every lesson slug, in teaching order across levels. */
  slugs: string[];
}

export interface CourseLesson {
  slug: string;
  frontmatter: CourseLessonFrontmatter;
  body: string;
  level: CourseLevel;
}

const memo = new Map<string, unknown>();
function cached<T>(key: string, load: () => T): T {
  if (!memo.has(key)) memo.set(key, load());
  return memo.get(key) as T;
}

/** content/ directories that hold a course.json: subjects (cs, ee, robotics), cs/languages/<id>, cs/electives/<id>, lingua/<id>. */
export function courseDirs(): string[] {
  const out = fs
    .readdirSync(CONTENT)
    .sort()
    .filter((d) => !NOT_COURSES.has(d) && exists(path.join(CONTENT, d, "course.json")));
  for (const family of [...Object.keys(COLLECTIONS), "lingua"]) {
    const base = path.join(CONTENT, family);
    if (!exists(base)) continue;
    for (const d of fs.readdirSync(base).sort()) if (exists(path.join(base, d, "course.json"))) out.push(`${family}/${d}`);
  }
  return out;
}

const collectionOf = (dir: string) => (Object.keys(COLLECTIONS) as Collection[]).find((k) => dir.startsWith(`${k}/`));

export function getCourses(): LoadedCourse[] {
  return cached("courses", () =>
    courseDirs().map((dir) => {
      const course = CourseFile.parse(JSON.parse(read(path.join(CONTENT, dir, "course.json"))));
      return { course, dir, path: course.division === "lingua" ? `lingua/${course.id}` : dir, collection: collectionOf(dir), slugs: course.levels.flatMap((l) => l.lessons) };
    }),
  );
}

/** A subject (cs, ee, robotics) or a Lingua course, by id; never a course nested in a collection. */
export function getCourse(id: string, division?: CourseFile["division"]): LoadedCourse | undefined {
  return getCourses().find((c) => c.course.id === id && (!division || c.course.division === division) && !c.collection);
}

/** The courses of a collection (content/cs/languages/<id>, content/cs/electives/<id>), in alphabetical order. */
export function getCollection(collection: Collection): LoadedCourse[] {
  return getCourses().filter((c) => c.collection === collection);
}

export function getCollectionCourse(collection: Collection, id: string): LoadedCourse | undefined {
  return getCollection(collection).find((c) => c.course.id === id);
}

/** The programming-language courses (content/cs/languages/<id>), in alphabetical order. */
export function getLanguageCourses(): LoadedCourse[] {
  return getCollection("cs/languages");
}

export function getLanguageCourse(id: string): LoadedCourse | undefined {
  return getCollectionCourse("cs/languages", id);
}

export function getCourseLesson(c: LoadedCourse, slug: string): CourseLesson {
  return cached(`lesson:${c.dir}:${slug}`, () => {
    const { data, content } = matter(read(path.join(CONTENT, c.dir, "lessons", slug, "lesson.mdx")));
    const level = c.course.levels.find((l) => l.lessons.includes(slug));
    if (!level) throw new Error(`${slug} is in no level of ${c.dir}/course.json`);
    return { slug, frontmatter: CourseLessonFrontmatter.parse(data), body: content, level };
  });
}

export function getCourseExercises(c: LoadedCourse, slug: string): Exercise[] {
  const p = path.join(CONTENT, c.dir, "lessons", slug, "exercises.json");
  return exists(p) ? ExercisesFile.parse(JSON.parse(read(p))).exercises : [];
}

/** The locale a course's pages are generated in, by course path ("cs", "ee", "cs/languages/rust", "lingua/spanish"). */
export function courseLocales(): Record<string, Locale> {
  return Object.fromEntries(getCourses().map((c) => [c.path, c.course.locale]));
}

export function getCourseCodeReport() {
  return cached("courseCode", () => {
    const p = path.join(CONTENT, "verification/course-code-report.json");
    return exists(p) ? CourseCodeReport.parse(JSON.parse(read(p))) : null;
  });
}

/** Whether a lesson's runnable code was run and passed, from the generated report; null when it has none. */
export function lessonCodeStatus(c: LoadedCourse, slug: string): { tested: boolean; count: number } | null {
  const row = getCourseCodeReport()?.lessons[`${c.dir}/${slug}`];
  if (!row) return null;
  const count = row.snippets + row.exercises + row.checks;
  if (count === 0) return null;
  return { tested: row.snippetsPassed === row.snippets && row.exercisesPassed === row.exercises && row.checksPassed === row.checks, count };
}
