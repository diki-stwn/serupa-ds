"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { AVATAR_SIZES, AvatarGroupSize } from "../Avatar/Avatar";
import type { AvatarSize } from "../Avatar/Avatar";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { flattenChildren } from "../../internal/children";
import { Popover } from "../Popover/Popover";
import { en as words } from "./labels";

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
  /** Makes "+N" a button that opens a popover listing the people not shown, so keyboard and touch users can see them too. */
  showMore?: boolean;
  /** Makes "+N" a button that calls this, to show the rest your own way (a Dialog, a page). Wins over showMore. */
  onMore?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/* AvatarGroup: avatars in a row that overlap, each in a surface ring, with a "+N" avatar for the ones that
   don't fit (a button with showMore or onMore). Each child sits in its own item, so an avatar inside a Tooltip or a link lines up too, and the
   earlier ones sit on top, so every status dot shows. size sets every avatar's size (it wins over each
   avatar's own). The group is role="group"; label names it. className and every other prop go to the <div>. */
const OWN = { children: 1, max: 1, total: 1, size: 1, moreLabel: 1, label: 1, showMore: 1, onMore: 1, className: 1 } as const;

/** Avatars in an overlapping row, with "+N" for the rest. */
export const AvatarGroup = /* @__PURE__ */ component<HTMLDivElement, AvatarGroupProps>("AvatarGroup", function AvatarGroup(props, ref) {
  const restyle = useServerStyles(ref);
  const rest = omit(props, OWN);
  const size = oneOf(AVATAR_SIZES, props.size, "md");
  const all = flattenChildren(props.children).filter(React.isValidElement);
  const max = props.max != null && props.max >= 0 ? Math.floor(props.max) : Infinity;
  const total = Math.max(all.length, props.total != null && props.total > 0 ? Math.floor(props.total) : 0);
  const shown = all.slice(0, max);
  const sds = useSettings(words);
  const more = total - shown.length;
  const count = shown.length + (more > 0 ? 1 : 0);
  const cap = size === "xs" ? 9 : 99;   // the most "+N" writes out: three characters don't fit in 24px
  if (props.label) rest["aria-label"] = props.label;
  const moreName = (props.moreLabel || sds.labels.avatarMore)(more);
  const face = <span className="dk-avatar__frame"><span className="dk-avatar__initials" aria-hidden="true">{more > cap ? cap + "+" : "+" + more}</span></span>;
  const cls = "dk-avatar dk-avatar--" + size + " dk-avatar-group__more";
  // Static, "+N" is one image; with showMore or onMore it's a button with the same name.
  const plus = (onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void) => props.onMore || props.showMore
    ? <button type="button" className={cls} aria-label={moreName} onClick={onClick} data-component="avatar" data-size={size}>{face}</button>
    : <span className={cls} role="img" aria-label={moreName} data-component="avatar" data-size={size}>{face}</span>;
  return (
    <div {...rest} ref={restyle} role="group" className={cn("dk-avatar-group", "dk-avatar-group--" + size, props.className)}
      data-component="avatar-group" data-size={size}>
      <AvatarGroupSize.Provider value={size}>
        {shown.map((el, i) => <span key={el.key ?? i} className="dk-avatar-group__item" style={{ zIndex: count - i }}>{el}</span>)}
      </AvatarGroupSize.Provider>
      {more > 0 ? (
        <span className="dk-avatar-group__item" style={{ zIndex: 1 }}>
          {props.onMore || !props.showMore ? plus(props.onMore) : (
            <Popover trigger={plus()} aria-label={moreName} placement="bottom-start">
              <ul className="dk-avatar-group__list" role="list">
                {all.slice(shown.length).map((el, i) => {
                  const name = (el.props as { name?: string }).name;
                  // An Avatar is shown with its name written next to it (alt="", so it isn't read twice); a wrapped one as it is.
                  return <li key={el.key ?? i}>{name ? <><AvatarGroupSize.Provider value="xs">{React.cloneElement(el as React.ReactElement<{ alt?: string }>, { alt: "" })}</AvatarGroupSize.Provider>{name}</> : el}</li>;
                })}
                {total > all.length ? <li>{(props.moreLabel || sds.labels.avatarMore)(total - all.length)}</li> : null}
              </ul>
            </Popover>
          )}
        </span>
      ) : null}
    </div>
  );
});
