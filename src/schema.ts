/**
 * Schemas for the machine-readable content every Lumenary site shares: courses (syllabus, lesson
 * frontmatter, exercises), prose pages and translation records. Sites validate their content
 * against these in their tests. Keep identifiers stable: they are the join keys for translations
 * and progress records.
 *
 * Subject-specific schemas (Lumenary Math's knowledge graph and lessons, the Lean and Python reports,
 * Python exercises) live in the sites that use them; a site adds exercise types with
 * `exerciseUnion` and `exercisesFileOf`.
 */
import { z } from "zod";
import { LOCALES } from "./i18n/config";

/* ------------------------------------------------------------------ */
/* Shared vocabulary                                                   */
/* ------------------------------------------------------------------ */

/** Stable Lumenary Math topic identifier, e.g. `math.found.sets`; course lessons may cite them as `related`. */
export const TopicId = z.string().regex(/^math\.[a-z]+(\.[a-z0-9]+(-[a-z0-9]+)*)+$/, "topic ids look like math.<area>.<kebab-name>");

export const VERIFICATION_LABELS = [
  "formally-verified", // only derived from a successful Lean build report
  "computationally-tested", // only derived from a successful compute report
  "mathematically-reviewed", // requires a named human reviewer record
  "pedagogically-reviewed", // requires a named human reviewer record
  "machine-translated",
  "translation-reviewed",
  "experimental",
  "incomplete",
  "ai-drafted", // written with AI assistance, awaiting human review
] as const;
export const VerificationLabel = z.enum(VERIFICATION_LABELS);
export type VerificationLabel = z.infer<typeof VerificationLabel>;

export const Reference = z.object({
  title: z.string(),
  author: z.string().optional(),
  year: z.number().int().optional(),
  url: z.string().url().optional(),
  note: z.string().optional(),
});
export type Reference = z.infer<typeof Reference>;

/* ------------------------------------------------------------------ */
/* Translations and prose pages                                        */
/* ------------------------------------------------------------------ */

export const TranslationStatus = z.enum([
  "canonical", // the source text
  "machine-draft", // AI/machine generated, not reviewed by a human
  "human-reviewed", // reviewed for language by a named human
  "math-reviewed", // reviewed for mathematical accuracy in this language by a named human
  "incomplete",
]);
export type TranslationStatus = z.infer<typeof TranslationStatus>;

export const Translation = z.object({
  status: TranslationStatus,
  source: z.string().default("en"),
  /** sha256 (first 12 hex chars) of the canonical file this was translated from. */
  sourceHash: z.string().optional(),
  translatedAt: z.string().optional(),
  reviewers: z.array(z.string()).default([]),
});

/** A prose page (about, contribute, …): `<root>/<slug>/<locale>.mdx`. */
export const PageFrontmatter = z.object({
  title: z.string(),
  lead: z.string(),
  translation: Translation.default({ status: "canonical", source: "en", reviewers: [] }),
});
export type PageFrontmatter = z.infer<typeof PageFrontmatter>;

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

export const Feedback = z.object({ match: z.string(), message: z.string() });

/** The fields every exercise has, whatever its type. */
export const ExerciseBase = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  prompt: z.string(),
  difficulty: z.enum(["warm-up", "core", "stretch"]),
  mode: z.enum(["H", "F", "C"]),
  hints: z.array(z.string()).min(1),
  solution: z.string(),
});

export const ChoiceExercise = ExerciseBase.extend({
  type: z.literal("choice"),
  options: z.array(z.object({ id: z.string(), label: z.string(), correct: z.boolean(), feedback: z.string() })).min(2),
  multiple: z.boolean().default(false),
});

export const IntegerExercise = ExerciseBase.extend({
  type: z.literal("integer"),
  answer: z.number().int(),
  /** Targeted, non-shaming feedback for predictable wrong answers. `match` is the wrong answer as a string. */
  feedback: z.array(Feedback).default([]),
});

export const SetExercise = ExerciseBase.extend({
  type: z.literal("set"),
  /** Elements as strings; order and repetition never matter. */
  answer: z.array(z.string()),
  feedback: z.array(Feedback).default([]),
});

export const TextExercise = ExerciseBase.extend({
  /** A short typed answer (a word, phrase or sentence), compared after normalising case, spacing and punctuation. */
  type: z.literal("text"),
  /** Every accepted answer. Accents count: an answer right but for its accents is told so. */
  answers: z.array(z.string().min(1)).min(1),
  /** Language of the expected answer (BCP 47), for the input's `lang` attribute. */
  lang: z.string().optional(),
  feedback: z.array(Feedback).default([]),
});

/** The exercise types the core checks in the browser (none of them runs code). */
export const CORE_EXERCISE_TYPES = [ChoiceExercise, IntegerExercise, SetExercise, TextExercise] as const;

/**
 * The core's exercise types plus a site's own, as one discriminated union. Lumenary Scientia adds its
 * Python exercises: `exerciseUnion(PythonExercise)`, with `PythonExercise = ExerciseBase.extend({ type: z.literal("python"), … })`.
 */
export function exerciseUnion<const Extra extends readonly z.core.$ZodTypeDiscriminable[]>(...extra: Extra) {
  return z.discriminatedUnion("type", [...CORE_EXERCISE_TYPES, ...extra] as const);
}

export const Exercise = z.discriminatedUnion("type", CORE_EXERCISE_TYPES);
export type Exercise = z.infer<typeof Exercise>;

/** An exercises.json file whose exercises follow `exercise`. */
export function exercisesFileOf<T extends z.ZodType>(exercise: T) {
  return z.object({
    lesson: z.string(),
    exercises: z.array(exercise).min(1),
  });
}

export const ExercisesFile = exercisesFileOf(Exercise);
export type ExercisesFile = z.infer<typeof ExercisesFile>;

/* ------------------------------------------------------------------ */
/* Courses: a syllabus and a directory per lesson                      */
/* ------------------------------------------------------------------ */

const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slugs are kebab-case");

export const CourseLevel = z.object({
  id: Slug,
  title: z.string(),
  /** A short label, e.g. "A1" or "Foundations". */
  short: z.string(),
  summary: z.string(),
  /** Lesson slugs, in teaching order. */
  lessons: z.array(Slug).min(1),
});
export type CourseLevel = z.infer<typeof CourseLevel>;

export const CourseFile = z.object({
  version: z.literal(1),
  id: Slug,
  division: z.enum(["scientia", "lingua"]),
  title: z.string(),
  subtitle: z.string(),
  /** Markdown paragraphs for the course page. */
  description: z.array(z.string()).min(1),
  /** The language the course is taught in; its pages are generated in this site locale only. */
  locale: z.enum(LOCALES),
  /** Lingua: the language being learned (BCP 47). */
  learn: z.string().optional(),
  /** Programming-language courses: the family they are listed under on /cs/languages/, and the year the language appeared. */
  group: z.string().optional(),
  year: z.number().int().optional(),
  /** Interface words the course pages need beyond the site catalogue, in the course's language. */
  ui: z.object({
    levels: z.string(),
    lesson: z.string(),
    lessons: z.string(),
    minutes: z.string(),
    objectives: z.string(),
    prerequisites: z.string(),
    none: z.string(),
    references: z.string(),
    previous: z.string(),
    next: z.string(),
    contents: z.string(),
    aiDrafted: z.string(),
    awaitingReview: z.string(),
    codeTested: z.string().optional(),
    backTo: z.string(),
  }),
  levels: z.array(CourseLevel).min(1),
  references: z.array(Reference).default([]),
});
export type CourseFile = z.infer<typeof CourseFile>;

/** The cat guides (Lumenary Scientia): Chloe (human insight), Margaret (computation) and Gideon (formal proof). */
export const NARRATOR_IDS = ["chloe", "margaret", "gideon"] as const;

export const CourseLessonFrontmatter = z.object({
  title: z.string(),
  subtitle: z.string(),
  minutes: z.number().int().positive(),
  objectives: z.array(z.string()).min(1),
  /** Earlier lessons of the same course this one builds on. */
  prerequisites: z.array(Slug).default([]),
  /** Lumenary Math topics worth knowing alongside (math.* ids). */
  related: z.array(TopicId).default([]),
  /** Further reading and outside resources, by link only. */
  references: z.array(Reference).default([]),
  /** The cat guides who speak in the lesson (<Narrator who="…">), as in Lumenary Math. */
  narrators: z.array(z.enum(NARRATOR_IDS)).default([]),
});
export type CourseLessonFrontmatter = z.infer<typeof CourseLessonFrontmatter>;
