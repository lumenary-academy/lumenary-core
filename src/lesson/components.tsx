import type { TFunction } from "../i18n/translate";
import type { MdxComponents } from "../markdown/mdx";
import type { RenderedExercise } from "../exercises/types";
import { makeBlocks } from "./blocks";
import { ExerciseList, type ExerciseCardComponent } from "./Exercises";
import { Say } from "./Say";

/**
 * The MDX components of a lesson: the blocks (`makeBlocks`), `<Exercises/>` with the lesson's rendered
 * exercises, and `<Say>`. Without `cats`, `<Narrator>` is left out, so a lesson that uses it fails to
 * render (Lumenary Lingua has no cat guides); `guides` names the cat guides' set of role labels
 * (default: Lumenary Math's). Sites add their own components (links, widgets, Lean and Python blocks)
 * to the returned map.
 */
export function makeLessonComponents({ t, exercises = [], ExerciseCard, cats = true, guides }: { t: TFunction; exercises?: RenderedExercise[]; ExerciseCard?: ExerciseCardComponent; cats?: boolean; guides?: string }): MdxComponents {
  const { Narrator, ...blocks } = makeBlocks(t, { guides });
  return {
    ...blocks,
    ...(cats ? { Narrator } : {}),
    Exercises: () => <ExerciseList exercises={exercises} Card={ExerciseCard} />,
    Say,
  };
}
