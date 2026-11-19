"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n/client";
import { createRouting, type RoutingConfig } from "../routing";
import { LogoMark, Wordmark } from "../brand/Logo";
import { CatToggle } from "../cats/CatToggle";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

/**
 * One link in the header. Its label is `label`, or the message `nav.<key>` (and `nav.short.<key>` in
 * the wide bar). It is marked current on every page under its path, unless `exact`; `also` lists other
 * path prefixes that count as it, and `except` prefixes under its path that do not.
 */
export interface NavItem {
  key: string;
  path: string;
  label?: string;
  short?: string;
  exact?: boolean;
  also?: string[];
  except?: string[];
}

/** A different navigation for part of the site: pages whose pathname matches `match` (a regular expression's source). */
export interface NavSection {
  match: string;
  nav: NavItem[];
  mobileNav?: NavItem[];
}

export interface SiteHeaderProps {
  /** The second line of the wordmark: "Academy" (the default), "Scientia", "Lingua" or "Prep". */
  division?: string;
  /** The site's name for the home link's label (default: the message `meta.siteName`). */
  siteName?: string;
  /** The links in the header bar, and in the mobile menu unless `mobileNav` is given. */
  nav?: NavItem[];
  mobileNav?: NavItem[];
  /** Other navigation for parts of the site; the first section whose `match` fits the pathname wins. */
  sections?: NavSection[];
  /** Hide the navigation on the front page (when the front page is itself the site's index). */
  hideNavOnHome?: boolean;
  /** Show the button that shows or hides the cat guides (Lumenary Scientia). */
  cats?: boolean;
  /** How the site's paths map to locales (see `createRouting`); used by the links and the language menu. */
  routing?: RoutingConfig;
  /** A page listing every language and its status, linked from the language menu. */
  allLanguagesPath?: string;
}

/** The site header: the mark and wordmark, the navigation, the language menu and the theme switch. */
export function SiteHeader({ division, siteName, nav: mainNav = [], mobileNav: mainMobileNav, sections = [], hideNavOnHome = false, cats = false, routing, allLanguagesPath }: SiteHeaderProps) {
  const { locale, t } = useI18n();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { href } = useMemo(() => createRouting(routing), [routing]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const home = pathname === `/${locale}/` || pathname === `/${locale}`;
  const showNav = !(hideNavOnHome && home);
  const section = sections.find((s) => new RegExp(s.match).test(pathname));
  const nav = section ? section.nav : mainNav;
  const mobileNav = section ? (section.mobileNav ?? section.nav) : (mainMobileNav ?? mainNav);
  const label = (item: NavItem) => item.label ?? t(`nav.${item.key}`);
  const shortLabel = (item: NavItem) => item.short ?? item.label ?? t(`nav.short.${item.key}`);

  const isActive = (item: NavItem) => {
    const under = (path: string) => pathname.startsWith(`/${locale}/${path}`);
    const target = `/${locale}/${item.path}`;
    if (item.except?.some(under)) return false;
    const self = item.exact ? pathname === `${target}/` || pathname === target : under(item.path);
    return self || (item.also ?? []).some(under);
  };

  return (
    <header
      data-site-header
      className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-line bg-paper/85 backdrop-blur-md" : "border-transparent bg-paper/60 backdrop-blur-sm"}`}
    >
      <div className="container-page flex h-16 items-center gap-4">
        <Link href={href(locale)} className="flex shrink-0 items-center gap-2.5 text-ink" aria-label={`${siteName ?? t("meta.siteName")} — ${t("nav.home")}`}>
          <LogoMark size={30} />
          <Wordmark division={division} />
        </Link>
        {showNav && nav.length > 0 && (
          <nav className="ms-2 hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={href(locale, item.path)}
                aria-current={isActive(item) ? "page" : undefined}
                title={label(item)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[0.9rem] font-medium transition-colors ${
                  isActive(item) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                }`}
              >
                {shortLabel(item)}
              </Link>
            ))}
          </nav>
        )}
        <div className="ms-auto flex items-center gap-1">
          <LanguageSelector routing={routing} allLanguagesPath={allLanguagesPath} />
          {cats && <CatToggle />}
          <ThemeToggle />
          {showNav && mobileNav.length > 0 && (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t("nav.close") : t("nav.menu")}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>
      {open && showNav && (
        <nav id="mobile-nav" className="border-t border-line bg-paper lg:hidden" aria-label="Primary">
          <ul className="container-page grid grid-cols-2 gap-1 py-3 sm:grid-cols-4">
            {mobileNav.map((item) => (
              <li key={item.key}>
                <Link
                  href={href(locale, item.path)}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive(item) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}
                >
                  {label(item)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
