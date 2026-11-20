/**
 * The site chrome every Lumenary site shares: header, footer, language menu, theme switch, the
 * scripts that apply stored preferences before first paint, and the language-picking root page.
 */
export { SiteHeader, type NavItem, type NavSection, type SiteHeaderProps } from "./SiteHeader";
export { SiteFooter, type FooterColumn, type FooterLink, type SiteFooterProps } from "./SiteFooter";
export { LanguageSelector } from "./LanguageSelector";
export { ThemeToggle } from "./ThemeToggle";
export { CATS_KEY, THEME_KEY, initScript } from "./init-scripts";
export { RootLocalePage, rootLocaleScript } from "./RootLocalePage";

/** The Lumenary sites, for footers and cross-links between them: change a site's address here, once. */
export const ACADEMY_URL = "https://lumenary.academy/";
/** Lumenary Scientia's own site. */
export const SCIENTIA_URL = "https://scientia.lumenary.academy/";
export const LINGUA_URL = "https://lingua.lumenary.academy/";
export const PREP_URL = "https://prep.lumenary.academy";
