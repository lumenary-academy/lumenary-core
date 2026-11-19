import { isValidElement } from "react";
import { highlight, highlightLang } from "@/lib/highlight";
import { PythonRunner } from "@/components/python/PythonRunner";

interface CodeProps {
  className?: string;
  "data-meta"?: string;
  children?: React.ReactNode;
}

/**
 * A fenced code block in a course lesson (the MDX `pre` element). Known languages are highlighted
 * on the server; ```python run makes it runnable in the browser's sandboxed Python, like the
 * experiments in Lumenary Math. compute/verify_courses.py runs every such block.
 */
export async function CodeBlock({ children }: { children?: React.ReactNode }) {
  const props: CodeProps = isValidElement<CodeProps>(children) ? children.props : {};
  const text = (typeof props.children === "string" ? props.children : String(props.children ?? "")).replace(/\n$/, "");
  const name = props.className?.match(/language-(\S+)/)?.[1];
  const lang = highlightLang(name);
  const runnable = lang === "python" && /(^|\s)run(\s|$)/.test(props["data-meta"] ?? "");
  const html = await highlight(text, lang ?? "text");
  const highlighted = <div dangerouslySetInnerHTML={{ __html: html }} />;
  return (
    <figure className="not-prose !mt-6 overflow-hidden rounded-xl border border-line bg-card font-sans" dir="ltr" {...(runnable ? { "data-mode": "C" } : {})}>
      {name && <figcaption className="border-b border-line bg-paper-2/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted">{name}</figcaption>}
      {runnable ? <PythonRunner code={text} highlighted={highlighted} /> : <div className="code-frame max-h-[36rem] overflow-auto">{highlighted}</div>}
    </figure>
  );
}
