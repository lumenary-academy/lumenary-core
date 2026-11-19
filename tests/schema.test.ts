import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CourseFile, CourseLessonFrontmatter, Exercise, ExerciseBase, ExercisesFile, PageFrontmatter, exerciseUnion, exercisesFileOf } from "../src/schema";
import fs from "node:fs";
import path from "node:path";

const fixture = (p: string) => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "fixtures", p), "utf8"));
const base = { id: "q-1", prompt: "?", difficulty: "core", mode: "H", hints: ["h"], solution: "s" } as const;

describe("course schemas", () => {
  it("accept a syllabus and reject an unknown teaching locale", () => {
    const course = fixture("courses/demo/course.json");
    expect(CourseFile.parse(course).levels[0]!.lessons).toEqual(["first-steps", "next-steps"]);
    expect(CourseFile.safeParse({ ...course, locale: "fr" }).success).toBe(false);
    expect(CourseFile.safeParse({ ...course, id: "Not Kebab" }).success).toBe(false);
  });
  it("fill a lesson's optional frontmatter with defaults", () => {
    const fm = CourseLessonFrontmatter.parse({ title: "t", subtitle: "s", minutes: 10, objectives: ["o"] });
    expect(fm).toMatchObject({ prerequisites: [], related: [], references: [], narrators: [] });
    expect(CourseLessonFrontmatter.safeParse({ title: "t", subtitle: "s", minutes: 0, objectives: ["o"] }).success).toBe(false);
    expect(CourseLessonFrontmatter.safeParse({ title: "t", subtitle: "s", minutes: 5, objectives: [] }).success).toBe(false);
    expect(CourseLessonFrontmatter.safeParse({ title: "t", subtitle: "s", minutes: 5, objectives: ["o"], narrators: ["felix"] }).success).toBe(false);
  });
  it("mark a prose page canonical unless it says otherwise", () => {
    expect(PageFrontmatter.parse({ title: "t", lead: "l" }).translation.status).toBe("canonical");
  });
});

describe("exercise schemas", () => {
  it("accept the four core types", () => {
    expect(ExercisesFile.parse(fixture("courses/demo/lessons/first-steps/exercises.json")).exercises).toHaveLength(2);
    expect(Exercise.parse({ ...base, type: "integer", answer: 4 })).toMatchObject({ feedback: [] });
    expect(Exercise.parse({ ...base, type: "set", answer: ["1", "2"] })).toMatchObject({ type: "set" });
    expect(Exercise.parse({ ...base, type: "choice", options: [{ id: "a", label: "A", correct: true, feedback: "" }, { id: "b", label: "B", correct: false, feedback: "" }] })).toMatchObject({ multiple: false });
  });
  it("reject what no core type checks", () => {
    expect(Exercise.safeParse({ ...base, type: "python", starter: "", tests: "" }).success).toBe(false);
    expect(Exercise.safeParse({ ...base, type: "text", answers: [] }).success).toBe(false);
    expect(Exercise.safeParse({ ...base, type: "choice", options: [{ id: "a", label: "A", correct: true, feedback: "" }] }).success).toBe(false);
    expect(Exercise.safeParse({ ...base, id: "Bad Id", type: "integer", answer: 1 }).success).toBe(false);
    expect(ExercisesFile.safeParse({ lesson: "x", exercises: [] }).success).toBe(false);
  });
  it("let a site add its own exercise type", () => {
    const Python = ExerciseBase.extend({ type: z.literal("python"), starter: z.string(), tests: z.string() });
    const File = exercisesFileOf(exerciseUnion(Python));
    const parsed = File.parse({ lesson: "x", exercises: [{ ...base, type: "python", starter: "", tests: "assert True" }, { ...base, id: "q-2", type: "integer", answer: 1 }] });
    expect(parsed.exercises.map((e) => e.type)).toEqual(["python", "integer"]);
  });
});
