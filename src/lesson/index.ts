/**
 * Lesson components: the MDX blocks and sections, exercises, `<Say>`, the table of contents and the
 * translation notice. Server components import from here; client components import the client-side
 * pieces from `@lumenary/core/lesson/client` (this module renders Markdown, which is server-only).
 */
export { makeBlocks } from "./blocks";
export { makeLessonComponents } from "./components";
export { ExerciseList, type ExerciseCardComponent } from "./Exercises";
export { TranslationNotice } from "./TranslationNotice";
export * from "./client";
