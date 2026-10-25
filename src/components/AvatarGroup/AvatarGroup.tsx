"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { AVATAR_SIZES, AvatarGroupSize } from "../Avatar/Avatar";
import type { AvatarSize } from "../Avatar/Avatar";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import { flattenChildren } from "../../internal/children";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The avatars: <Avatar> elements, or elements around them such as a Tooltip or a link. */
  children?: React.ReactNode;
  /** The most avatars to show. The rest fold into a "+N" avatar at the end. Default: all of them. */
  max?: number;
  /** How many there are in all, when you pass only some (e.g. the first 5 of 120 members). Default: the number of children. */
  total?: number;
  /** One size for every avatar in the group: 'xs', 'sm', 'md' (default), 'lg' or 'xl'. */
  size?: AvatarSize;
  /** What a screen reader hears for the "+N" avatar. Default: the avatarMore label ("N more"). */
  moreLabel?: (count: number) => string;
  /** The group's accessible name, such as "Assigned to". */
  label?: string;
}

/* AvatarGroup: avatars in a row that overlap, each in a surface ring, with a "+N" avatar for the ones that
   don't fit. Each child sits in its own item, so an avatar inside a Tooltip or a link lines up too, and the
   earlier ones sit on top, so every status dot shows. size sets every avatar's size (it wins over each
   avatar's own). The group is role="group"; label names it. className and every other prop go to the <div>. */
const OWN = { children: 1, max: 1, total: 1, size: 1, moreLabel: 1, label: 1, className: 1 } as const;

/** Avatars in an overlapping row, with "+N" for the rest. */
export const AvatarGroup = /* @__PURE__ */ component<HTMLDivElement, AvatarGroupProps>("AvatarGroup", function AvatarGroup(props, ref) {
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const size = oneOf(AVATAR_SIZES, props.size, "md");
  const all = flattenChildren(props.children).filter(React.isValidElement);
  const max = props.max != null && props.max >= 0 ? Math.floor(props.max) : Infinity;
  const total = Math.max(all.length, props.total != null && props.total > 0 ? Math.floor(props.total) : 0);
  const shown = all.slice(0, max);
  const sds = useSerupa();
  const more = total - shown.length;
  const count = shown.length + (more > 0 ? 1 : 0);
  const cap = size === "xs" ? 9 : 99;   // the most "+N" writes out: three characters don't fit in 24px
  if (props.label) rest["aria-label"] = props.label;
  return (
    <div {...rest} ref={restyle} role="group" className={cn("dk-avatar-group", "dk-avatar-group--" + size, props.className)}
      data-component="avatar-group" data-size={size}>
      <AvatarGroupSize.Provider value={size}>
        {shown.map((el, i) => <span key={el.key ?? i} className="dk-avatar-group__item" style={{ zIndex: count - i }}>{el}</span>)}
      </AvatarGroupSize.Provider>
      {more > 0 ? (
        <span className="dk-avatar-group__item" style={{ zIndex: 1 }}>
          <span className={"dk-avatar dk-avatar--" + size + " dk-avatar-group__more"} role="img"
            aria-label={(props.moreLabel || sds.labels.avatarMore)(more)} data-component="avatar" data-size={size}>
            <span className="dk-avatar__frame"><span className="dk-avatar__initials" aria-hidden="true">{more > cap ? cap + "+" : "+" + more}</span></span>
          </span>
        </span>
      ) : null}
    </div>
  );
});
