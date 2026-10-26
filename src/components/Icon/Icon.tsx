"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { warnOnce } from "../../internal/warn";
import { ICONS, hasIcon, getIcon, getRegisteredIcon, loadIcon, type CustomIconName } from "../../icons";
import type { MaterialIconName } from "../../material/icons";
import type { IconData } from "../../material/types";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";

/** Any Material Symbol's name, a custom icon's name, or a name you registered with registerIcons. */
export type IconName = CustomIconName | MaterialIconName | (string & {});

/** What icon props (Button's leftIcon, IconButton's icon…) take: an icon name, an icon from serupa-ds/icons
 * (`leftIcon={Add}`), or any element. */
export type IconSource = IconName | IconData | React.ReactNode;

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Any Material Symbols name (search them on Foundations/Icons), a custom icon's name, or one you registered with
   * registerIcons. A custom icon with the same name wins. Give `name` or `icon`. */
  name?: IconName;
  /** A Material Symbols icon imported from serupa-ds/icons: `icon={ArrowForward}`. Give `name` or `icon`. */
  icon?: IconData;
  /** Size in px (a number, or a string of one: "20") or any CSS length. Default: 24px, or the button's icon size inside a Button. */
  size?: number | string;
  /** Flips the icon in right-to-left text (dir="rtl"), so an arrow points the way reading goes. 'auto' (default) flips
   * Material Symbols' directional icons (arrow_forward, chevron_right, send, undo…); true flips any icon, false none. */
  mirror?: boolean | "auto";
}

const never = () => () => {}, yes = () => true, no = () => false;

/* The names an icon name could have been meant as: Material Symbols are snake_case, so "Home" and "ArrowForward"
   (the serupa-ds/icons export names), "arrow-forward" and "ARROW_FORWARD" all mean one, with a number its own word
   ("Looks3" is looks_3) or not ("Rotate90DegreesCcw" is rotate_90_degrees_ccw). */
function spellings(name: string): string[] {
  const words = name.trim().replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase();
  return [words, words.replace(/([a-z])(\d)/g, "$1_$2")].filter((n, i, all) => n !== name && all.indexOf(n) === i);
}


/* A custom icon's markup as React elements, so it's never written as HTML: a page with Trusted Types on
   (require-trusted-types-for 'script') needs no policy for it. tools/icons/build.mjs writes the markup: <g> and shape
   tags whose attributes are numbers, path data and keywords, in double quotes, with nothing to unescape. */
function shapes(markup: string): React.ReactNode[] {
  const kids: React.ReactNode[][] = [[]], open: Array<[string, object]> = [];
  for (const [, close, tag, attrs, alone] of markup.matchAll(/<(\/?)(\w+)([^>]*?)(\/?)>/g)) {
    const here = kids[kids.length - 1];
    if (close) { const [t, p] = open.pop()!, inner = kids.pop()!; kids[kids.length - 1].push(React.createElement(t, p, ...inner)); continue; }
    const p: Record<string, string> = { key: String(here.length) };
    for (const [, k, v] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) p[k.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())] = v;
    if (alone) here.push(React.createElement(tag, p));
    else { open.push([tag, p]); kids.push([]); }
  }
  return kids[0];
}

/* Icon: an inline SVG in a 1em box, drawn in the text color. Material Symbols Rounded, filled (src/material), or
   one of your custom icons (tools/icons/build.mjs). */
/** An icon: Material Symbols Rounded (filled) or one of your custom SVG icons. Sized by font-size, drawn in the text color. Decorative by default (aria-hidden); pass aria-label to make it meaningful. */
export const Icon = /* @__PURE__ */ component<HTMLSpanElement, IconProps>("Icon", function Icon(props, ref) {
  const restyle = useServerStyles(ref);
  // Counts the loads that came back (or a retry after a failed one), so the box draws what arrived.
  const [tries, again] = React.useReducer((n: number) => n + 1, 0);
  const own = useSettings().icons;   // icons given to a SerupaProvider
  // The hydration render draws only what the server could (an icon passed or registered), not one this page loaded
  // since; right after it, the loaded one appears.
  const hydrated = React.useSyncExternalStore(never, yes, no);
  const custom = !props.icon && hasIcon(props.name);
  const data = props.icon || (custom || props.name == null ? undefined : own.get(props.name) || (hydrated ? getIcon : getRegisteredIcon)(props.name));
  const missing = !custom && !data && props.name != null;
  // A name not loaded yet: load it, then draw it (or warn if it isn't a Material Symbol). Until then, and on the
  // server, the box is empty: pass `icon={…}` or register the icon to draw it on the first render. If the icons fail
  // to load, the box stays empty and tries again when the browser is back online (the next Icon tries at once).
  React.useEffect(() => {
    if (!missing) return;
    let live = true, offline = () => {};
    loadIcon(props.name as string).then((found) => {
      if (!live) return;
      if (found) again();
      else if (process.env.NODE_ENV !== "production") {
        // Every icon is loaded by now, so a name in another spelling ("Home", the export's, or "arrow-forward") can be looked up.
        const known = (n: string) => hasIcon(n) || !!own.get(n) || !!getIcon(n);
        const meant = spellings(props.name as string).find(known);
        warnOnce("icon-unknown", `Icon: "${props.name}" isn't a Material Symbol or one of your icons. ${meant ? `Did you mean "${meant}"? Names are snake_case.` : "Check the name on the Icons page (Foundations/Icons)."}`, "icon:" + props.name);
      }
    }, (err: unknown) => {
      if (!live) return;
      if (process.env.NODE_ENV !== "production") warnOnce("icon-load", `Icon: the icons drawn by name didn't load (${err instanceof Error ? err.message : String(err)}), so "${props.name}" is empty for now. It tries again when the browser is back online; pass icon={…} to draw an icon without loading it.`);
      window.addEventListener("online", again, { once: true });
      offline = () => window.removeEventListener("online", again);
    });
    return () => { live = false; offline(); };
  }, [missing, props.name, tries, own]);
  const rest = omit(props, { name: 1, icon: 1, size: 1, mirror: 1, className: 1, style: 1 } as const);
  const labelled = rest["aria-label"] || rest["aria-labelledby"];
  if (!labelled) rest["aria-hidden"] = true; else rest.role = "img";
  const style: React.CSSProperties = Object.assign({}, props.style);
  // A plain number as a string (size="20", as from a data attribute or a CMS) is px too: font-size: 20 is invalid and would leave it 24px.
  if (props.size != null) style.fontSize = typeof props.size === "number" || /^\s*\d*\.?\d+\s*$/.test(props.size) ? String(props.size).trim() + "px" : props.size;
  const name = props.icon ? props.icon.name : props.name;
  if (name != null) rest["data-icon"] = name;
  // Which icons flip in right-to-left text is in Icon.css (by data-icon), so the list costs no script.
  const mirror = props.mirror === true ? "dk-icon--mirror" : props.mirror === false ? "dk-icon--fixed" : null;
  if (custom) {
    return (
      <span {...rest} ref={restyle} className={cn("dk-icon dk-icon--custom", mirror, props.className)} style={style}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">{shapes(ICONS[props.name as string])}</svg>
      </span>
    );
  }
  return (
    <span {...rest} ref={restyle} className={cn("dk-icon", mirror, props.className)} style={style}>
      {data && <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden focusable="false"><path d={data.d} /></svg>}
    </span>
  );
});
