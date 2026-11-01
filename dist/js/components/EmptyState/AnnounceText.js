"use client";

// src/components/EmptyState/AnnounceText.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
function AnnounceText() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const box = ref.current && ref.current.parentElement;
    if (!box) return;
    const words = (c) => {
      if (!c.classList.contains("dk-empty-state__suggestions")) return (c.textContent || "").trim();
      const kids = [...c.children].map((k) => (k.textContent || "").trim()).filter(Boolean);
      return kids.length ? kids[0] + " " + kids.slice(1).join(", ") : "";
    };
    const said = [...box.children].map(words).filter(Boolean).map((x) => /[.!?…。]$/.test(x) ? x : x + ".").join(" ");
    if (said) announce(said);
  }, []);
  return /* @__PURE__ */ React.createElement("span", { ref, hidden: true });
}
export {
  AnnounceText
};
//# sourceMappingURL=AnnounceText.js.map
