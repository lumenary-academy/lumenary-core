import type { ComponentType } from "react";
import { ExerciseCard } from "../exercises/ExerciseCard";
import type { RenderedExercise } from "../exercises/types";

/** The props of an exercise card: the core's `ExerciseCard`, or a site's card that adds exercise types. */
export type ExerciseCardComponent = ComponentType<{ exercise: RenderedExercise; index?: number }>;

/** A lesson's exercises (the MDX `<Exercises/>`), each in a card. */
export function ExerciseList({ exercises, Card = ExerciseCard }: { exercises: RenderedExercise[]; Card?: ExerciseCardComponent }) {
  return (
    <div className="not-prose !mt-6 space-y-5 font-sans">
      {exercises.map((ex, i) => (
        <Card key={ex.id} exercise={ex} index={i} />
      ))}
    </div>
  );
}
