"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { warnOnce } from "../../internal/warn";
import { ICONS, hasIcon, getIcon, getRegisteredIcon, loadIcon, type CustomIconName } from "../../icons";
import type { MaterialIconName } from "../../material/icons";
import type { IconData } from "../../material/types";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";

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
  /** Size in px (number) or any CSS length. Default: 24px, or the button's icon size inside a Button. */
  size?: number | string;
}

const never = () => () => {}, yes = () => true, no = () => false;

/* Icon: an inline SVG in a 1em box, drawn in the text color. Material Symbols Rounded, filled (src/material), or
   one of your custom icons (tools/icons/build.mjs). */
/** An icon: Material Symbols Rounded (filled) or one of your custom SVG icons. Sized by font-size, drawn in the text color. Decorative by default (aria-hidden); pass aria-label to make it meaningful. */
export const Icon = /* @__PURE__ */ component<HTMLSpanElement, IconProps>("Icon", function Icon(props, ref) {
  const restyle = useServerStyles(ref);
  const [, loadedAll] = React.useReducer((n: number) => n + 1, 0);
  const own = useSerupa().icons;   // icons given to a SerupaProvider
  // The hydration render draws only what the server could (an icon passed or registered), not one this page loaded
  // since; right after it, the loaded one appears.
  const hydrated = React.useSyncExternalStore(never, yes, no);
  const custom = !props.icon && hasIcon(props.name);
  const data = props.icon || (custom || props.name == null ? undefined : own.get(props.name) || (hydrated ? getIcon : getRegisteredIcon)(props.name));
  const missing = !custom && !data && props.name != null;
  // A name not loaded yet: load it, then draw it (or warn if it isn't a Material Symbol). Until then, and on the
  // server, the box is empty: pass `icon={…}` or register the icon to draw it on the first render.
  React.useEffect(() => {
    if (!missing) return;
    let live = true;
    loadIcon(props.name as string).then((found) => {
      if (!live) return;
      if (found) loadedAll();
      else if (process.env.NODE_ENV !== "production") warnOnce("icon:" + props.name, `Icon: "${props.name}" isn't a Material Symbol or one of your icons. Check the name on the Icons page (Foundations/Icons).`);
    }, () => { /* the chunk failed to load: the box stays empty */ });
    return () => { live = false; };
  }, [missing, props.name]);
  const rest = omit(props, { name: 1, icon: 1, size: 1, className: 1, style: 1 } as const);
  const labelled = rest["aria-label"] || rest["aria-labelledby"];
  if (!labelled) rest["aria-hidden"] = true; else rest.role = "img";
  const style: React.CSSProperties = Object.assign({}, props.style);
  if (props.size != null) style.fontSize = typeof props.size === "number" ? props.size + "px" : props.size;
  const name = props.icon ? props.icon.name : props.name;
  if (name != null) rest["data-icon"] = name;
  if (custom) {
    return (
      <span {...rest} ref={restyle} className={cn("dk-icon dk-icon--custom", props.className)} style={style}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" dangerouslySetInnerHTML={{ __html: ICONS[props.name as string] }} />
      </span>
    );
  }
  return (
    <span {...rest} ref={restyle} className={cn("dk-icon", props.className)} style={style}>
      {data && <svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden focusable="false"><path d={data.d} /></svg>}
    </span>
  );
});
