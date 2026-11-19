"use client";

import { Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

/**
 * A word or phrase in the language being learned, with a button that reads it aloud using the
 * browser's own speech synthesis (nothing is sent anywhere by this page). The button appears only
 * when the browser has a voice for the language; the text is always shown.
 */
export function Say({ lang, children }: { lang: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  const [voice, setVoice] = useState(false);
  const text = typeof children === "string" ? children : Array.isArray(children) ? children.filter((c) => typeof c === "string").join("") : "";

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const base = lang.toLowerCase().split("-")[0];
    const check = () => setVoice(window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().replace("_", "-").startsWith(base)));
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, [lang]);

  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  return (
    <span lang={lang} className="whitespace-normal">
      {children}
      {voice && text && (
        <button type="button" onClick={speak} className="ms-1 inline-flex translate-y-[0.1em] items-center rounded p-0.5 text-sky-ink hover:bg-sky-soft" aria-label={`${t("lingua.say")}: ${text}`} title={t("lingua.say")}>
          <Volume2 size={14} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
