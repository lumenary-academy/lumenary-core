import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { TFunction } from "@/i18n/dictionary";
import { href } from "@/lib/href";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import { scientiaSubjects } from "@/lib/subjects";

export function SiteFooter({ locale, t }: { locale: Locale; t: TFunction }) {
  // Every open subject first, then Lumenary Math's own tools, then the project pages.
  const subjects: [string, string][] = [
    ...scientiaSubjects().open.map((sub): [string, string] => [t(`divisions.${sub.key}`), sub.path]),
    ["Lumenary Lingua", "lingua"],
  ];
  const math: [string, string][] = (
    [
      ["learn", "math/curriculum"],
      ["graph", "math/graph"],
      ["trails", "math/trails"],
      ["lab", "lab"],
      ["formal", "formal"],
      ["practice", "practice"],
    ] as const
  ).map(([key, path]) => [t(`nav.${key}`), path]);
  const project: [string, string][] = (
    [
      ["about", "about"],
      ["divisions", "divisions"],
      ["educators", "educators"],
      ["contribute", "contribute"],
      ["languages", "languages"],
      ["verification", "verification"],
      ["progress", "progress"],
    ] as const
  ).map(([key, path]) => [t(`nav.${key}`), path]);
  return (
    <footer data-site-footer className="mt-24 border-t border-line bg-paper-2/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <Wordmark />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">{t("footer.mission")}</p>
          <p className="mt-4 font-display text-lg italic text-ink">{t("meta.tagline")}</p>
          <p className="mt-1 text-sm font-semibold tracking-wide text-gold-ink">{t("footer.motto")}</p>
        </div>
        {(
          [
            [t("footer.subjects"), subjects],
            [t("nav.math"), math],
            [t("footer.project"), project],
          ] as const
        ).map(([title, links]) => (
          <div key={title}>
            <h2 className="eyebrow">{title}</h2>
            <ul className="mt-4 space-y-2.5">
              {links.map(([label, path]) => (
                <li key={path}>
                  <Link href={href(locale, path)} className="text-sm text-ink-2 hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <span>{t("footer.license")}</span>
          <span>{t("footer.noEndorsement")}</span>
        </div>
      </div>
    </footer>
  );
}
