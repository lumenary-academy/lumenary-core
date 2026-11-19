import { Inter, JetBrains_Mono, Noto_Sans_Arabic, Noto_Sans_Devanagari, Source_Serif_4 } from "next/font/google";

/*
 * The design system's typefaces, self-hosted by next/font at build time. The CSS tokens in
 * styles.css (--font-display, --font-sans, --font-serif, --font-mono) read these variables; put
 * `fontVariables` on the <html> element of every locale layout.
 */
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
// One serif family for headings and reading text; its optical-size axis gives large headings the display cut.
const sourceSerif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-source-serif", display: "swap", style: ["normal", "italic"], axes: ["opsz"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
// Arabic and Devanagari are loaded only when the page needs their glyphs; Chinese uses system fonts.
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-noto-arabic", display: "swap", preload: false });
const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva", display: "swap", preload: false });

/** The class names that define the font variables, for `<html className={fontVariables}>`. */
export const fontVariables = [inter, sourceSerif, jetbrains, notoArabic, notoDeva].map((f) => f.variable).join(" ");
