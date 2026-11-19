import "server-only";
import type { z } from "zod";
import type { Exercise, ExerciseBase } from "../schema";
import { mdInline, mdToHtml } from "../markdown/markdown";
import type { RenderedExercise, RenderedExerciseBase } from "./types";

/**
 * Renders an exercise of a type a site adds (Scientia's `python`): given the exercise and its rendered
 * common fields, return the full rendered exercise, or `undefined` if the type is unknown.
 */
export type RenderExtraExercise = (exercise: { type: string } & Record<string, unknown>, base: RenderedExerciseBase) => RenderedExercise | undefined;

/** Any validated exercise: the core's types, or a site's own built on `ExerciseBase`. */
export type ExerciseLike = z.infer<typeof ExerciseBase> & { type: string };

/** Exercises with their markdown and maths rendered to HTML, for the client components. Server-only. */
export function renderExerciseList(exercises: readonly ExerciseLike[], slug: string, lessonTitle: string, renderExtra?: RenderExtraExercise): RenderedExercise[] {
  return (exercises as readonly Exercise[]).map((ex) => {
    const base: RenderedExerciseBase = {
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
      case "text":
        return { ...base, type: "text", answers: ex.answers, ...(ex.lang ? { lang: ex.lang } : {}), feedback: ex.feedback.map((f) => ({ match: f.match, html: mdInline(f.message) })) };
      default: {
        const other = ex as { type: string } & Record<string, unknown>;
        const rendered = renderExtra?.(other, base);
        if (!rendered) throw new Error(`exercise ${base.id} in ${slug}: no renderer for type "${other.type}"`);
        return rendered;
      }
    }
  });
}
