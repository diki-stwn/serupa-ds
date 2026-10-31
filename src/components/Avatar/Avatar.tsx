"use client";
import * as React from "react";
import { cn, oneOf, omit } from "../../internal/cn";
import { Icon } from "../Icon/Icon";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { initials } from "./initials";
import * as icons from "../../material/builtin";
import { en as words } from "./labels";

export { initials };

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The picture's URL. Without one, or when it fails to load, the initials (or the person icon) show instead. */
  src?: string;
  /** The person's or thing's name: the initials come from it, and it's the accessible name. */
  name?: string;
  /** The accessible name, when it isn't the name. Pass alt="" when the name is already written next to it. */
  alt?: string;
  /** 'xs' 24px, 'sm' 32px, 'md' 40px (default), 'lg' 48px or 'xl' 64px. */
  size?: AvatarSize;
  /** 'circle' (default, people) or 'square' (teams, projects, organisations). */
  shape?: 'circle' | 'square';
  /** A dot at the bottom end: 'online', 'busy', 'away' or 'offline'. Added to the accessible name. */
  status?: AvatarStatus;
  /** What a screen reader hears for the status. Default: the avatarStatus label ("online", "daring" in idLabels). */
  statusLabel?: string;
  /** Props for the <img>, such as loading="eager" for an avatar above the fold, or referrerPolicy. Default: loading="lazy", decoding="async". */
  imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

/* Avatar: a picture of a person (circle) or a team or project (square), with initials or a person icon when
   there's no picture or it fails to load. Sizes xs to xl (24 to 64px). status adds a dot with a shape per status. The name
   (or alt) is the accessible name; alt="" hides it from screen readers. className and every other prop go to
   the outer <span>. */
const OWN = { src: 1, name: 1, alt: 1, size: 1, shape: 1, status: 1, statusLabel: 1, imgProps: 1, className: 1, children: 1 } as const;
export const AVATAR_SIZES: readonly AvatarSize[] = ["xs", "sm", "md", "lg", "xl"];
const SIZES = AVATAR_SIZES;
/** The size an AvatarGroup sets for every Avatar inside it, however deep (inside a Tooltip or a link too). */
export const AvatarGroupSize = /* @__PURE__ */ React.createContext<AvatarSize | null>(null);
const STATUSES: readonly AvatarStatus[] = ["online", "busy", "away", "offline"];


/** A picture of a person, team or project, with initials or an icon when there's no picture. */
export const Avatar = /* @__PURE__ */ component<HTMLSpanElement, AvatarProps>("Avatar", function Avatar(props, ref) {
  const rest = omit(props, OWN);
  const size = React.useContext(AvatarGroupSize) || oneOf(SIZES, props.size, "md");
  const square = props.shape === "square";
  const sds = useSettings(words);
  const status = props.status && STATUSES.indexOf(props.status) >= 0 ? props.status : null;
  // Remember which src failed rather than resetting a flag in an effect: a fast error (WebKit) can land
  // before that effect runs, and the reset would then bring back the broken picture.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const failed = failedSrc != null && failedSrc === props.src;
  // A name of only spaces counts as no name: no "   " for a screen reader to say.
  const label = (props.alt != null ? props.alt : props.name || "").trim();
  const said = status ? props.statusLabel || sds.labels.avatarStatus(status) : "";
  const full = label && said ? label + ", " + said : label;
  const showImg = !!props.src && !failed;
  // A server-rendered picture can fail before the page hydrates, and React never hears that error: the broken picture
  // stayed in place of the initials. A picture that has finished but won't decode has failed (L8E44).
  const pic = React.useRef<HTMLImageElement | null>(null);
  React.useEffect(() => {
    const i = pic.current, src = props.src;
    if (i && src && i.complete) i.decode().catch(() => { if (pic.current === i && i.complete && !i.naturalWidth) setFailedSrc(src); });
  }, [props.src]);
  const text = initials(props.name);
  const body = showImg
    // Lazy and async by default, so a long list of people doesn't fetch every picture at once.
    ? <img loading="lazy" decoding="async" {...props.imgProps} className={cn("dk-avatar__img", props.imgProps && props.imgProps.className)} src={props.src} alt="" ref={pic}
        onError={(e) => { if (props.imgProps && props.imgProps.onError) props.imgProps.onError(e); setFailedSrc(props.src as string); }} />
    : text ? <span className="dk-avatar__initials" aria-hidden="true">{text}</span>
    : <Icon className="dk-avatar__icon" icon={icons.Person} />;
  // With alt="" the name is written next to it, but the status isn't: then only the dot is read ("online").
  if (full) { rest.role = "img"; rest["aria-label"] = full; } else if (!status) rest["aria-hidden"] = true;
  return (
    <span {...rest} ref={ref} className={cn("dk-avatar", "dk-avatar--" + size, square && "dk-avatar--square", props.className)}
      data-component="avatar" data-size={size} data-shape={square ? "square" : "circle"}>
      <span className="dk-avatar__frame">{body}</span>
      {status ? <span className={"dk-avatar__status dk-avatar__status--" + status} {...(full ? { "aria-hidden": true } : { role: "img", "aria-label": said })} /> : null}
    </span>
  );
});
