"use client";
import * as React from "react";
import { announce } from "../../internal/announce";

/* EmptyState's announce: once, as it appears, the title and description beside it are said to screen readers
   through the shared polite announcer, as sentences. It's a client module of its own, so EmptyState stays a
   Server Component. It draws an empty hidden span to find them. */
export function AnnounceText() {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    const box = ref.current && ref.current.parentElement;
    if (!box) return;
    // Each part's words. The suggestions' "Did you mean:" and each search are elements side by
    // side, whose textContent would run them into one word ("Did you mean:marsmaze") (L8E62).
    const words = (c: Element): string => {
      if (!c.classList.contains("dk-empty-state__suggestions")) return (c.textContent || "").trim();
      const kids = [...c.children].map((k) => (k.textContent || "").trim()).filter(Boolean);
      return kids.length ? kids[0] + " " + kids.slice(1).join(", ") : "";
    };
    const said = [...box.children].map(words).filter(Boolean).map((x) => (/[.!?…。]$/.test(x) ? x : x + ".")).join(" ");
    if (said) announce(said);
  }, []);
  return <span ref={ref} hidden />;
}
