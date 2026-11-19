import "server-only";
import { notFound } from "next/navigation";
import { isLocale, LOCALE_META, type Locale } from "./config";
import { createMessages, makeT, pickMessages, type Messages as Catalogue, type SiteMessages, type TFunction } from "./dictionary";
import { I18nProvider } from "./client";

/** The `[locale]` route parameter, or a 404 for anything that is not one of the six locales. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(LOCALE_META[locale].intl).format(value);
}

export interface SiteI18n {
  /** The full catalogue for a locale: shared strings and the site's own, with English fallback. */
  getMessages: (locale: Locale) => Promise<Catalogue>;
  getT: (locale: Locale) => Promise<TFunction>;
  /** Server component: make extra message namespaces available to the client components inside it. */
  Messages: (props: { locale: Locale; ns: string[]; children: React.ReactNode }) => Promise<React.JSX.Element>;
}

/**
 * A site's message catalogue and the server helpers around it. Call once, in a server-only module:
 *
 *   export const i18n = createI18n({ en, locales: { es: () => import("./messages/es.json"), … } });
 */
export function createI18n(site: SiteMessages = {}): SiteI18n {
  const getMessages = createMessages(site);
  const getT = async (locale: Locale) => makeT(await getMessages(locale));
  async function Messages({ locale, ns, children }: { locale: Locale; ns: string[]; children: React.ReactNode }) {
    const messages = await getMessages(locale);
    return (
      <I18nProvider locale={locale} messages={pickMessages(messages, ns)}>
        {children}
      </I18nProvider>
    );
  }
  return { getMessages, getT, Messages };
}
