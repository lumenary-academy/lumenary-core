import type { TFunction } from "../i18n/translate";
import { NarratorAvatar, type NarratorId } from "./Narrators";

const NARRATOR_MODE = { chloe: "H", margaret: "C", gideon: "F" } as const;
const NARRATOR_BG = { chloe: "bg-human-soft", margaret: "bg-compute-soft", gideon: "bg-formal-soft" } as const;
const NARRATOR_FG = { chloe: "text-human", margaret: "text-compute", gideon: "text-formal" } as const;

/**
 * A cat guide's role label (`Role`, e.g. "The Mathematician") or guiding question (`Q`, e.g. "Why is
 * this true?") in a guide set. The guides' roles vary by subject: a set's labels live under
 * `narrators.sets.<set>.<who>Role` and `.<who>Q`; the default set (no `set`, or a key the set lacks)
 * is Lumenary Math's, `narrators.<who>Role` and `narrators.<who>Q`. Names never vary.
 */
export function guideLabel(t: TFunction, who: NarratorId, field: "Role" | "Q", set?: string): string {
  if (set) {
    const key = `narrators.sets.${set}.${who}${field}`;
    const label = t(key);
    if (label !== key) return label;
  }
  return t(`narrators.${who}${field}`);
}

/**
 * The `<Narrator who="…">` lesson block: a brief aside by one of the three cat guides, labelled with
 * their role in the guide set `guides` (see `guideLabel`). Their portraits and names are marked
 * `data-cat`, so the header's cat button can hide them site-wide while the role label and text stay.
 */
export function makeNarrator(t: TFunction, guides?: string) {
  return function Narrator({ who, children }: { who: NarratorId; children?: React.ReactNode }) {
    return (
      <aside className="!mt-7 flex items-start gap-3.5" data-mode={NARRATOR_MODE[who]}>
        <span data-cat className="mt-1 shrink-0">
          <NarratorAvatar who={who} size={46} />
        </span>
        <div className={`relative min-w-0 flex-1 rounded-2xl rounded-ss-md px-4 py-3 font-sans text-[0.98rem] leading-relaxed text-ink ${NARRATOR_BG[who]}`}>
          <p className={`text-xs font-bold ${NARRATOR_FG[who]}`}>
            <span data-cat>{t(`narrators.${who}`)} · </span>
            <span>{guideLabel(t, who, "Role", guides)}</span>
          </p>
          <div className="mt-1 [&>p]:m-0 [&>p+p]:mt-2">{children}</div>
        </div>
      </aside>
    );
  };
}
