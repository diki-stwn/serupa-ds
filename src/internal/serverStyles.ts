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
        if (!("style" in el)) continue;
        const text = el.getAttribute("style");
        // One declaration at a time: Firefox ignores a cssText written over the attribute it blocked. React writes
        // these attributes, so no !important; a ; inside parentheses (url(data:…;base64,…)) doesn't end one.
        if (text) {
          for (const d of text.split(/;(?![^(]*\))/)) {
            const at = d.indexOf(":");
            if (at > 0) (el as HTMLElement).style.setProperty(d.slice(0, at).trim(), d.slice(at + 1).trim());
          }
        } else fromProps(el as HTMLElement);
      }
    }
    if (ref) setRef(ref, node);
  }, [ref]);
}

/* Firefox keeps a blocked style attribute but empties it, so there's no text to apply again. The style React
   hydrated the element with is on the props React keeps on it (__reactProps$…, set on every element it renders or
   hydrates since React 17), so it's applied from there: a custom property as given, any other property as given or,
   a number the browser turns down (width: 200), in px, as React writes it. */
function fromProps(el: HTMLElement) {
  const key = Object.keys(el).find((k) => k.startsWith("__reactProps$"));
  const props = (key ? Reflect.get(el, key) : undefined) as { style?: Record<string, string | number | boolean | null | undefined> } | undefined;
  for (const [k, v] of Object.entries(props?.style || {})) {
    if (v == null || typeof v === "boolean" || v === "") continue;
    if (k.startsWith("--")) el.style.setProperty(k, String(v));
    else if (Reflect.set(el.style, k, String(v)) && typeof v === "number" && v && !Reflect.get(el.style, k)) Reflect.set(el.style, k, v + "px");
  }
}
