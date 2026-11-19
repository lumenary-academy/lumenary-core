/**
 * The exercise engine for the types that need no code to run: multiple choice, integers, sets and
 * typed text. Safe in client components. Rendering exercises' Markdown to HTML is server-only:
 * `@lumenary/core/exercises/render`.
 */
export { ExerciseCard, type ExerciseBody } from "./ExerciseCard";
export * from "./parse";
export type * from "./types";
