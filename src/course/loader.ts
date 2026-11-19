import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import type { Locale } from "../i18n/config";
import { CourseFile, CourseLessonFrontmatter, ExercisesFile, type CourseLevel, type Exercise } from "../schema";

/**
 * Courses: a syllabus (course.json: levels, each an ordered list of lesson slugs) and one directory
 * per lesson (lessons/<slug>/lesson.mdx and exercises.json). A course's pages are generated only in
 * the locale it is taught in (see `createRouting` in `@lumenary/core/routing`).
 *
 * A site creates one loader for its content root and says how its directories become URLs:
 *
 *   Lumenary Lingua:   createCourseLoader({ root: "content/lingua" })            spanish → /en/spanish/
 *   Lumenary Scientia: createCourseLoader({ root: "content", courseDirs, pathOf, collectionOf })
 *                      cs → /en/cs/, cs/languages/rust → /en/cs/languages/rust/, lingua/spanish → /en/lingua/spanish/
 */
export interface LoadedCourse {
  course: CourseFile;
  /** Directory under the content root, e.g. "spanish", "cs" or "cs/languages/rust". */
  dir: string;
  /** Site path of the course page, without locale or slashes: "spanish", "cs", "lingua/spanish". */
  path: string;
  /** The family the course is nested in ("cs/languages", "cs/electives"), if any. */
  collection?: string;
  /** Every lesson slug, in teaching order across levels. */
  slugs: string[];
}

export interface CourseLesson {
  slug: string;
  frontmatter: CourseLessonFrontmatter;
  body: string;
  level: CourseLevel;
}

export interface CourseLoaderOptions<E> {
  /** The content root holding the course directories (absolute, or relative to the working directory). */
  root: string;
  /** The course directories under the root, in order. Default: every immediate subdirectory with a course.json. */
  courseDirs?: (root: string) => string[];
  /** A course's site path. Default: its directory. */
  pathOf?: (dir: string, course: CourseFile) => string;
  /** The family a course is nested in, if any (Scientia: "cs/languages" for cs/languages/rust). */
  collectionOf?: (dir: string) => string | undefined;
  /** The schema of exercises.json. Default: the core's exercise types; Scientia adds Python with `exercisesFileOf(exerciseUnion(PythonExercise))`. */
  exercisesFile?: z.ZodType<{ lesson: string; exercises: E[] }>;
}

export interface CourseLoader<E = Exercise> {
  root: string;
  getCourses(): LoadedCourse[];
  /** A course by id (never one nested in a collection), optionally only in one division. */
  getCourse(id: string, division?: CourseFile["division"]): LoadedCourse | undefined;
  /** The courses of a collection, in directory order. */
  getCollection(collection: string): LoadedCourse[];
  getCollectionCourse(collection: string, id: string): LoadedCourse | undefined;
  getCourseLesson(c: LoadedCourse, slug: string): CourseLesson;
  getCourseExercises(c: LoadedCourse, slug: string): E[];
  /** The locale each course's pages are generated in, by course path: the `courses` of a `RoutingConfig`. */
  courseLocales(): Record<string, Locale>;
}

const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);

/** Every immediate subdirectory of `root` that holds a course.json, sorted. */
export function immediateCourseDirs(root: string): string[] {
  if (!exists(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && exists(path.join(root, d.name, "course.json")))
    .map((d) => d.name)
    .sort();
}

export function createCourseLoader<E = Exercise>(options: CourseLoaderOptions<E>): CourseLoader<E> {
  const root = path.resolve(options.root);
  const discover = options.courseDirs ?? immediateCourseDirs;
  const pathOf = options.pathOf ?? ((dir: string) => dir);
  const collectionOf = options.collectionOf ?? (() => undefined);
  const exercisesFile = (options.exercisesFile ?? ExercisesFile) as z.ZodType<{ lesson: string; exercises: E[] }>;

  const memo = new Map<string, unknown>();
  function cached<T>(key: string, load: () => T): T {
    if (!memo.has(key)) memo.set(key, load());
    return memo.get(key) as T;
  }

  const getCourses = (): LoadedCourse[] =>
    cached("courses", () =>
      discover(root).map((dir) => {
        const course = CourseFile.parse(JSON.parse(read(path.join(root, dir, "course.json"))));
        const collection = collectionOf(dir);
        return { course, dir, path: pathOf(dir, course), ...(collection ? { collection } : {}), slugs: course.levels.flatMap((l) => l.lessons) };
      }),
    );

  const getCollection = (collection: string) => getCourses().filter((c) => c.collection === collection);

  return {
    root,
    getCourses,
    getCourse: (id, division) => getCourses().find((c) => c.course.id === id && (!division || c.course.division === division) && !c.collection),
    getCollection,
    getCollectionCourse: (collection, id) => getCollection(collection).find((c) => c.course.id === id),
    getCourseLesson: (c, slug) =>
      cached(`lesson:${c.dir}:${slug}`, () => {
        const { data, content } = matter(read(path.join(root, c.dir, "lessons", slug, "lesson.mdx")));
        const level = c.course.levels.find((l) => l.lessons.includes(slug));
        if (!level) throw new Error(`${slug} is in no level of ${c.dir}/course.json`);
        return { slug, frontmatter: CourseLessonFrontmatter.parse(data), body: content, level };
      }),
    getCourseExercises: (c, slug) => {
      const p = path.join(root, c.dir, "lessons", slug, "exercises.json");
      return exists(p) ? exercisesFile.parse(JSON.parse(read(p))).exercises : [];
    },
    courseLocales: () => Object.fromEntries(getCourses().map((c) => [c.path, c.course.locale])),
  };
}
