"use client";

// src/components/EmptyState/AnnounceText.tsx
import * as React from "react";
import { announce } from "../../internal/announce.js";
function AnnounceText() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const box = ref.current && ref.current.parentElement;
    if (!box) return;
    const said = [...box.children].map((c) => (c.textContent || "").trim()).filter(Boolean).map((x) => /[.!?…。]$/.test(x) ? x : x + ".").join(" ");
    if (said) announce(said);
  }, []);
  return /* @__PURE__ */ React.createElement("span", { ref, hidden: true });
}
export {
  AnnounceText
};
//# sourceMappingURL=AnnounceText.js.map
