import { LOCALES, LOCALE_META } from "../i18n/config";

/**
 * The script behind a static root: a remembered choice, else the browser's preferences, else English.
 * It mirrors `negotiateLocale` in `@lumenary/core/i18n`.
 */
export const rootLocaleScript = `(function(){
var L=${JSON.stringify(LOCALES)};var pick="en";
try{var s=localStorage.getItem("lumenary:locale");if(s&&L.indexOf(s)>=0){location.replace("/"+s+"/");return}}catch(e){}
var prefs=navigator.languages||[navigator.language||"en"];
var ar=["arz","apc","afb","acm","ary","arq","aeb","ayl","apd"];
for(var i=0;i<prefs.length;i++){var p=(prefs[i]||"").toLowerCase();var b=p.split("-")[0];
if(b==="zh"){if(/hant|-tw$|-hk$|-mo$/.test(p))continue;pick="zh-Hans";break}
if(ar.indexOf(b)>=0){pick="ar";break}
var m=L.filter(function(l){return l.toLowerCase()===b})[0];if(m){pick=m;break}}
location.replace("/"+pick+"/");})();`;

/**
 * The page at `/`, which picks a language: a remembered choice, else the browser's preferences, else
 * English. Without JavaScript the meta refresh and the visible list still work.
 */
export function RootLocalePage({ title = "Lumenary Academy", tagline = "All the sciences. Many languages. Every nation." }: { title?: string; tagline?: string }) {
  return (
    <>
      <meta httpEquiv="refresh" content="2;url=/en/" />
      <script dangerouslySetInnerHTML={{ __html: rootLocaleScript }} />
      <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "15vh auto", padding: 16, textAlign: "center" }}>
        <h1 style={{ fontWeight: 600 }}>{title}</h1>
        <p>{tagline}</p>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {LOCALES.map((l) => (
            <li key={l}>
              <a href={`/${l}/`} lang={l} hrefLang={l}>
                {LOCALE_META[l].nativeName}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
