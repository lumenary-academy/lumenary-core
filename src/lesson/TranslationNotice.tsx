import { Languages } from "lucide-react";
import Link from "next/link";
import { LOCALE_META, type Locale } from "../i18n/config";
import type { TFunction } from "../i18n/translate";

/**
 * Says when a page is shown in another language than the one asked for, is an unreviewed machine
 * draft, or was translated from an older original. `helpHref` links to the site's page on helping
 * with translations, when it has one.
 */
export function TranslationNotice({ t, requested, rendered, fallback, stale, status, helpHref }: { t: TFunction; requested: Locale; rendered: Locale; fallback: boolean; stale: boolean; status: string; helpHref?: string }) {
  if (requested === "en") return null;
  const messages: string[] = [];
  if (fallback) messages.push(t("language.fallbackNotice", { language: LOCALE_META[requested].nativeName, fallback: LOCALE_META[rendered].nativeName }));
  else if (status === "machine-draft") messages.push(t("language.draftNotice"));
  if (stale) messages.push(t("language.staleNotice"));
  if (!messages.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink" role="note">
      <Languages size={17} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
      <div>
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
        {helpHref && (
          <Link href={helpHref} className="link text-xs">
            {t("language.helpTranslate")} →
          </Link>
        )}
      </div>
    </div>
  );
}
