import { isValidElement, type ComponentType, type ReactNode } from "react";
import { highlight, highlightLang } from "./highlight";

interface CodeProps {
  className?: string;
  "data-meta"?: string;
  children?: ReactNode;
}

/** Makes a ```<lang> run block runnable in the browser (Lumenary Scientia's Python sandbox). */
export type CodeRunner = ComponentType<{ code: string; highlighted: ReactNode }>;

/**
 * A fenced code block in a lesson (the MDX `pre` element). Known languages are highlighted on the
 * server. A block whose fence reads ```<lang> run is handed to `runners[lang]` when the site supplies
 * one (Lumenary Scientia: `{ python: PythonRunner }`); otherwise it is shown highlighted.
 */
export async function CodeBlock({ children, runners }: { children?: ReactNode; runners?: Record<string, CodeRunner> }) {
  const props: CodeProps = isValidElement<CodeProps>(children) ? children.props : {};
  const text = (typeof props.children === "string" ? props.children : String(props.children ?? "")).replace(/\n$/, "");
  const name = props.className?.match(/language-(\S+)/)?.[1];
  const lang = highlightLang(name);
  const Runner = lang && /(^|\s)run(\s|$)/.test(props["data-meta"] ?? "") ? runners?.[lang] : undefined;
  const html = await highlight(text, lang ?? "text");
  const highlighted = <div dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <figure className="not-prose !mt-6 overflow-hidden rounded-xl border border-line bg-card font-sans" dir="ltr" {...(Runner ? { "data-mode": "C" } : {})}>
      {name && <figcaption className="border-b border-line bg-paper-2/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted">{name}</figcaption>}
      {Runner ? <Runner code={text} highlighted={highlighted} /> : <div className="code-frame max-h-[36rem] overflow-auto">{highlighted}</div>}
    </figure>
  );
}
