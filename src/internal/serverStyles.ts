import * as React from "react";
import { setRef } from "./cn";

const never = () => () => {}, yes = () => true, no = () => false;

/* Server HTML carries style attributes (a Progress fill's width, a Slider thumb's place, a swatch's color, a Grid's
   columns). A Content Security Policy without 'unsafe-inline' in style-src (or style-src-attr) makes the browser
   ignore them, and hydrating keeps them as sent, so they would stay ignored until the value next changes. Setting
   the same text through the CSSOM is allowed, so right after hydration the element and everything in it with a style
   attribute gets it applied again. Only a hydrated element pays for this: a render in the browser sets styles through
   the CSSOM already. Returns the ref to put on the element, which also fills the component's own ref. */
export function useServerStyles<T extends Element>(ref?: React.ForwardedRef<T>): (node: T | null) => void {
  const hydrating = !React.useSyncExternalStore(never, yes, no);
  const pending = React.useRef(hydrating);   // set by the first render only: true when it was the hydration's
  return React.useCallback(function (node: T | null) {
    if (node && pending.current) {
      pending.current = false;
      for (const el of [node, ...node.querySelectorAll("[style]")]) {
        const text = el.getAttribute("style");
        if (!text || !("style" in el)) continue;
        // One declaration at a time: Firefox ignores a cssText written over the attribute it blocked. React writes
        // these attributes, so no !important; a ; inside parentheses (url(data:…;base64,…)) doesn't end one.
        for (const d of text.split(/;(?![^(]*\))/)) {
          const at = d.indexOf(":");
          if (at > 0) (el as HTMLElement).style.setProperty(d.slice(0, at).trim(), d.slice(at + 1).trim());
        }
      }
    }
    if (ref) setRef(ref, node);
  }, [ref]);
}

