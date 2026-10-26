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
    const said = [...box.children].map((c) => (c.textContent || "").trim()).filter(Boolean).map((x) => (/[.!?…。]$/.test(x) ? x : x + ".")).join(" ");
    if (said) announce(said);
  }, []);
  return <span ref={ref} hidden />;
}
