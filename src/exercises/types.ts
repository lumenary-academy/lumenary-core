/** Exercise data after server-side rendering of markdown/maths to HTML. */
export interface RenderedFeedback {
  match: string;
  html: string;
}

/** What every rendered exercise has, whatever its type. */
export interface RenderedExerciseBase {
  id: string;
  lesson: string;
  lessonTitle: string;
  difficulty: "warm-up" | "core" | "stretch";
  mode: "H" | "F" | "C";
  promptHtml: string;
  hintsHtml: string[];
  solutionHtml: string;
}
type Base = RenderedExerciseBase;

/** The exercise types the core checks in the browser. */
export type RenderedCoreExercise =
  | (Base & { type: "choice"; multiple: boolean; options: { id: string; labelHtml: string; correct: boolean; feedbackHtml: string }[] })
  | (Base & { type: "integer"; answer: number; feedback: RenderedFeedback[] })
  | (Base & { type: "set"; answer: string[]; feedback: RenderedFeedback[] })
  | (Base & { type: "text"; answers: string[]; lang?: string; feedback: RenderedFeedback[] });

/**
 * An exercise of a type a site adds (Lumenary Scientia's `python`), with whatever extra data its
 * answer area needs; the site's card supplies the component that renders it (see `ExerciseCard`'s `bodies`).
 */
export type RenderedExtraExercise = Base & { type: string; [field: string]: unknown };

export type RenderedExercise = RenderedCoreExercise | RenderedExtraExercise;

/** Reports a checked answer: right or not, with feedback as HTML or plain text. */
export type OnResult = (ok: boolean, detail?: { html?: string; text?: string }) => void;
