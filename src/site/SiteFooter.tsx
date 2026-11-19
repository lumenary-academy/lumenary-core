import Link from "next/link";
import { LogoMark, Wordmark } from "../brand/Logo";

/** A footer link: a path on this site (`/en/about/`) or a full URL to another site. */
export interface FooterLink {
  label: string;
  href: string;
  /** The language of the label, when it differs from the page's (a brand name, a course title). */
  lang?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SiteFooterProps {
  /** The second line of the wordmark: "Academy" (the default), "Scientia", "Lingua" or "Prep". */
  division?: string;
  /** What the site is, in a sentence or two, under the wordmark. */
  mission?: string;
  /** A tagline in display type, and a short motto under it. */
  tagline?: string;
  motto?: string;
  /** Up to three columns of links. */
  columns: FooterColumn[];
  /** The bottom line: the licences, and a note (no institutional endorsement). */
  license?: React.ReactNode;
  note?: React.ReactNode;
}

const external = (href: string) => /^[a-z]+:/i.test(href);

/** The site footer: the wordmark with the site's mission, columns of links, and the licence line. */
export function SiteFooter({ division, mission, tagline, motto, columns, license, note }: SiteFooterProps) {
  return (
    <footer data-site-footer className="mt-24 border-t border-line bg-paper-2/60">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <Wordmark division={division} />
          </div>
          {mission && <p className="mt-4 text-sm leading-relaxed text-ink-2">{mission}</p>}
          {tagline && <p className="mt-4 font-display text-lg italic text-ink">{tagline}</p>}
          {motto && <p className="mt-1 text-sm font-semibold tracking-wide text-gold-ink">{motto}</p>}
        </div>
        {columns.map(({ title, links }) => (
          <div key={title}>
            <h2 className="eyebrow">{title}</h2>
            <ul className="mt-4 space-y-2.5">
              {links.map(({ label, href, lang }) => (
                <li key={href}>
                  {external(href) ? (
                    <a href={href} lang={lang} className="text-sm text-ink-2 hover:text-ink hover:underline">
                      {label}
                    </a>
                  ) : (
                    <Link href={href} lang={lang} className="text-sm text-ink-2 hover:text-ink hover:underline">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {(license || note) && (
        <div className="border-t border-line">
          <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
            <span>{license}</span>
            <span>{note}</span>
          </div>
        </div>
      )}
    </footer>
  );
}
