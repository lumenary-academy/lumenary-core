import { describe, expect, it } from "vitest";
import path from "node:path";
import { createCourseLoader, immediateCourseDirs } from "../src/course/loader";
import { renderExerciseList } from "../src/exercises/render";
import { createPageLoader, shortHash } from "../src/pages/loader";

const fixtures = path.join(import.meta.dirname, "fixtures");

describe("the course loader", () => {
  const courses = createCourseLoader({ root: path.join(fixtures, "courses") });
  it("finds every directory with a course.json", () => {
    expect(immediateCourseDirs(path.join(fixtures, "courses"))).toEqual(["demo"]);
    expect(courses.getCourses().map((c) => [c.dir, c.path, c.slugs])).toEqual([["demo", "demo", ["first-steps", "next-steps"]]]);
    expect(courses.courseLocales()).toEqual({ demo: "en" });
    expect(courses.getCourse("demo", "lingua")?.course.learn).toBe("es");
    expect(courses.getCourse("demo", "scientia")).toBeUndefined();
  });
  it("maps directories to site paths as the site says", () => {
    const nested = createCourseLoader({ root: path.join(fixtures, "courses"), pathOf: (dir, c) => `${c.division}/${dir}`, collectionOf: () => "family" });
    expect(nested.getCourses()[0]).toMatchObject({ path: "lingua/demo", collection: "family" });
    expect(nested.getCourse("demo")).toBeUndefined();
    expect(nested.getCollectionCourse("family", "demo")?.path).toBe("lingua/demo");
  });
  it("loads a lesson with its level, and its exercises", () => {
    const c = courses.getCourse("demo")!;
    const lesson = courses.getCourseLesson(c, "next-steps");
    expect(lesson.level.short).toBe("A1");
    expect(lesson.frontmatter.prerequisites).toEqual(["first-steps"]);
    expect(courses.getCourseExercises(c, "first-steps").map((e) => e.type)).toEqual(["choice", "text"]);
    expect(courses.getCourseExercises(c, "next-steps")).toEqual([]);
  });
});

describe("exercise rendering", () => {
  const courses = createCourseLoader({ root: path.join(fixtures, "courses") });
  const c = courses.getCourse("demo")!;
  it("renders Markdown to HTML and keeps answers as data", () => {
    const [choice, text] = renderExerciseList(courses.getCourseExercises(c, "first-steps"), "first-steps", "First steps");
    expect(choice).toMatchObject({ type: "choice", lessonTitle: "First steps", promptHtml: "<p>Which word means <em>hello</em>?</p>" });
    expect(text).toMatchObject({ type: "text", answers: ["hola"], lang: "es", feedback: [] });
  });
  it("hands other types to the site's renderer, and refuses them without one", () => {
    const python = [{ id: "p", type: "python", prompt: "p", difficulty: "core" as const, mode: "C" as const, hints: ["h"], solution: "s", starter: "x = 1" }];
    const rendered = renderExerciseList(python, "l", "L", (ex, base) => ({ ...base, type: ex.type, starter: ex.starter }));
    expect(rendered[0]).toMatchObject({ type: "python", starter: "x = 1" });
    expect(() => renderExerciseList(python, "l", "L")).toThrow(/no renderer for type "python"/);
  });
});

describe("prose pages", () => {
  const pages = createPageLoader({ root: path.join(fixtures, "pages") });
  it("load a translation, flag it stale, and fall back to English", () => {
    const es = pages.getPage("about", "es");
    expect(es).toMatchObject({ locale: "es", fallback: false, stale: true });
    expect(es.frontmatter.translation.status).toBe("machine-draft");
    const sw = pages.getPage("about", "sw");
    expect(sw).toMatchObject({ locale: "en", requested: "sw", fallback: true, stale: false });
    expect(shortHash("x")).toMatch(/^[0-9a-f]{12}$/);
  });
});
