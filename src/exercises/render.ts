import "server-only";
import type { Locale } from "@/i18n/config";
import type { RenderedExercise } from "@/components/exercises/types";
import { getExercises, getLesson } from "./content";
import type { Exercise } from "./schema";
import { mdInline, mdToHtml } from "./markdown";

export function renderExercises(slug: string, locale: Locale): RenderedExercise[] {
  return renderExerciseList(getExercises(slug, locale).exercises, slug, getLesson(slug, locale).frontmatter.title);
}

/** Exercises with their markdown and maths rendered to HTML, for the client components. */
export function renderExerciseList(exercises: Exercise[], slug: string, lessonTitle: string): RenderedExercise[] {
  return exercises.map((ex) => {
    const base = {
      id: ex.id,
      lesson: slug,
      lessonTitle,
      difficulty: ex.difficulty,
      mode: ex.mode,
      promptHtml: mdToHtml(ex.prompt),
      hintsHtml: ex.hints.map(mdInline),
      solutionHtml: mdToHtml(ex.solution),
    };
    switch (ex.type) {
      case "choice":
        return { ...base, type: "choice", multiple: ex.multiple, options: ex.options.map((o) => ({ id: o.id, labelHtml: mdInline(o.label), correct: o.correct, feedbackHtml: mdInline(o.feedback) })) };
      case "integer":
        return { ...base, type: "integer", answer: ex.answer, feedback: ex.feedback.map((f) => ({ match: f.match, html: mdInline(f.message) })) };
      case "set":
        return { ...base, type: "set", answer: ex.answer, feedback: ex.feedback.map((f) => ({ match: f.match, html: mdInline(f.message) })) };
      case "python":
        return { ...base, type: "python", starter: ex.starter, tests: ex.tests };
      case "text":
        return { ...base, type: "text", answers: ex.answers, ...(ex.lang ? { lang: ex.lang } : {}), feedback: ex.feedback.map((f) => ({ match: f.match, html: mdInline(f.message) })) };
    }
  });
}
