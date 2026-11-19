/** A message catalogue: nested objects whose leaves are strings. */
export type Json = string | { [key: string]: Json };
export type Messages = { [key: string]: Json };

/** Look up a dotted key and interpolate `{name}` placeholders. */
export function translate(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as object)) node = (node as Record<string, unknown>)[part];
    else {
      node = undefined;
      break;
    }
  }
  let text = typeof node === "string" ? node : key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

export function makeT(messages: Messages): TFunction {
  return (key, vars) => translate(messages, key, vars);
}
