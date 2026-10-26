"use client";
import * as React from "react";
import { cn, oneOf, setRef } from "../../internal/cn";
import { useServerStyles } from "../../internal/serverStyles";
import { Dialog } from "../Dialog/Dialog";
import { Icon } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { component } from "../../internal/component";
import { useSerupa } from "../../internal/provider";
import { warnOnce } from "../../internal/warn";
import * as icons from "../../material/builtin";

export type ImageRatio = 'auto' | 'square' | '4:3' | 'video' | number;

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src' | 'placeholder' | 'children'> {
  /** The picture's address. */
  src: string;
  /** What the picture shows, for people who can't see it. Required: use "" only for a decorative picture. */
  alt: string;
  /** The frame's shape: 'auto' (the picture's own, default), 'square' (1:1), '4:3', 'video' (16:9) or a number (width / height). */
  ratio?: ImageRatio;
  /** How the picture fills a fixed ratio: 'cover' (fills and crops, default) or 'contain' (fits whole). */
  fit?: 'cover' | 'contain';
  /** Rounded corners (--image-radius). Default: true. */
  rounded?: boolean;
  /** What shows if the picture fails to load. Default: a muted broken-image icon. */
  fallback?: React.ReactNode;
  /** Makes it a button that opens the picture full size in a viewer. Default: false. */
  viewable?: boolean;
  /** A larger version for the viewer. Default: src. */
  fullSrc?: string;
  /** The view button's name. Default: "View image" plus the alt text. */
  viewLabel?: string;
  /** Shows a remove button in the corner; called when it's pressed. */
  onRemove?: () => void;
  /** The remove button's name. Default: "Remove image" plus the alt text. */
  removeLabel?: string;
  /** The main picture at the top of a page (a hero): loads at once with high priority instead of lazily, so it
   *  shows sooner (Largest Contentful Paint). Default: false. */
  priority?: boolean;
  /** Props for the outer frame, such as style for its width. */
  frameProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const RATIOS = ["auto", "square", "4:3", "video"] as const;
const never = () => () => {}, yes = () => true, no = () => false;
const QUICK = 250;   // ms: a picture that arrives this soon after mount appears without the fade

// The largest candidate in a srcSet ("a.jpg 400w, b.jpg 1600w" or "a.jpg 1x, b.jpg 2x"), for the viewer when there's no fullSrc.
function largest(srcSet: string | undefined): string | undefined {
  let best: string | undefined, most = 0;
  for (const m of (srcSet || "").matchAll(/(?:^|,)\s*(\S+?)\s+(\d+(?:\.\d+)?)[wx]\s*(?=,|$)/g)) if (+m[2] > most) { most = +m[2]; best = m[1]; }
  return best;
}

/* The viewer's picture: the frame's placeholder (and its sweep) while it loads, the frame's fallback if it fails. The
   stage has the picture's shape (its width and height, the thumbnail's, then its own once it arrives), within the
   screen. The Dialog is titled with the alt text, so the picture itself has alt="" and isn't read twice. */
function Full({ src, alt, fallback, shape }: { src: string; alt: string; fallback: React.ReactNode; shape: [number, number] | null }) {
  const [state, setState] = React.useState<"loading" | "loaded" | "error">("loading");
  const [own, setOwn] = React.useState<[number, number] | null>(null);
  const [w, h] = own || shape || [4, 3];
  return (
    <span className={cn("dk-image__stage", "dk-image--" + state)} data-state={state} style={{ "--dk-image-ratio": w + " / " + h, "--dk-image-w": own || shape ? w + "px" : "100%" } as React.CSSProperties}>
      {state === "error"
        ? <span className="dk-image__fallback" role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>{fallback != null ? fallback : <Icon icon={icons.BrokenImage} />}</span>
        : <img src={src} alt="" className="dk-image__full" decoding="async"
            onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth > 0) setOwn([i.naturalWidth, i.naturalHeight]); setState("loaded"); }} onError={() => setState("error")} />}
    </span>
  );
}

/* Image: a picture in a frame. ratio fixes the frame's shape (fit says whether the picture crops or fits), with
   rounded corners from --image-radius; with ratio "auto", width and height shape the frame before it loads. It
   loads lazily by default (priority: at once, high priority, for a hero picture); until it arrives the frame shows a muted
   placeholder, and if it fails, a fallback (a broken-image icon named by the alt text). viewable makes the
   picture a button that opens it full size in a Dialog (Escape, the × or the backdrop close it, focus comes
   back). onRemove adds a remove button in the corner. alt is required. ref, className and other img props go
   to the <img>; frameProps to the frame. */
/** A picture in a frame with a ratio, a loading placeholder and an error fallback; optionally opens full size or can be removed. */
export const Image = /* @__PURE__ */ component<HTMLImageElement, ImageProps>("Image", function Image(props, ref) {
  const restyle = useServerStyles<HTMLSpanElement>();
  const sds = useSerupa();
  const { src, alt, ratio: _r, fit: _f, rounded, fallback, viewable, fullSrc, viewLabel, onRemove, removeLabel, frameProps, className, onLoad, onError, loading, priority, decoding, fetchPriority, ...rest } = props;
  const ratio = typeof props.ratio === "number" && props.ratio > 0 ? props.ratio : oneOf(RATIOS, props.ratio as string, "auto");
  const fit = oneOf(["cover", "contain"] as const, props.fit, "cover");
  const [state, setState] = React.useState<"loading" | "loaded" | "error">("loading");
  const [open, setOpen] = React.useState(false);
  const img = React.useRef<HTMLImageElement | null>(null);
  // The picture is hidden while it loads only once the page's script runs (live), so server-rendered HTML paints
  // it as soon as it arrives, with or without JavaScript. A lazy one still loading a frame after mount is hidden
  // and fades in when it arrives; one that arrives within QUICK ms of mount just appears (no fade as a page
  // opens); a priority one never hides. A broken one drops it too, so its frame is the same whenever it fails. One
  // that hydrates from server HTML never hides either: it may have painted in part already (a large JPEG on a slow
  // link), and hiding it would make it flicker; a later src is the client's, and fades.
  const [live, setLive] = React.useState(false);
  const since = React.useRef(0);
  const served = React.useRef(React.useSyncExternalStore(never, yes, no) ? null : src);   // the src the server drew
  React.useEffect(() => { setState("loading"); }, [src]);
  // An image already in the cache can finish before React listens.
  React.useEffect(() => {
    const i = img.current;
    if (i && i.complete) { setState(i.naturalWidth > 0 ? "loaded" : "error"); return; }
    since.current = performance.now();
    if (served.current === src) return;
    const f = requestAnimationFrame(() => { if (img.current && !img.current.complete) setLive(true); });
    return () => cancelAnimationFrame(f);
  }, [src]);
  const arrived = () => { if (performance.now() - since.current < QUICK) setLive(false); };
  const named = (base: string) => (alt ? base + ": " + alt : base);
  // With ratio "auto", width and height (the picture's size) shape the frame before the picture arrives, so the
  // page doesn't jump when it loads.
  const w = Number(props.width), h = Number(props.height);
  const sized = ratio === "auto" && w > 0 && h > 0;
  React.useEffect(() => {   // in the browser only, once per page
    if (process.env.NODE_ENV !== "production" && ratio === "auto" && !sized) warnOnce("image-size", 'Image: with ratio "auto" and no width and height, the frame has no height until the picture loads, so the page jumps. Pass the picture\'s width and height, or a ratio.');
  }, [ratio, sized]);
  const shape = typeof ratio === "number" ? { "--dk-image-ratio": String(ratio) } : sized ? { "--dk-image-ratio": w + " / " + h, width: w } : null;
  const frameStyle = shape ? { ...shape, ...(frameProps && frameProps.style) } as React.CSSProperties : frameProps && frameProps.style;
  const picture = state === "error"
    ? <span className="dk-image__fallback" role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>{fallback != null ? fallback : <Icon icon={icons.BrokenImage} />}</span>
    : <img {...rest} ref={(n) => { img.current = n; setRef(ref, n); }} src={src} alt={alt} loading={loading || (priority ? "eager" : "lazy")}
        decoding={decoding || "async"} fetchPriority={fetchPriority || (priority ? "high" : undefined)}
        className={cn("dk-image__img", className)} onLoad={(e) => { arrived(); setState("loaded"); if (onLoad) onLoad(e); }} onError={(e) => { setLive(false); setState("error"); if (onError) onError(e); }} />;
  return (
    <span {...frameProps} ref={restyle} style={frameStyle}
      className={cn("dk-image", "dk-image--ratio-" + (typeof ratio === "number" ? "custom" : ratio.replace(":", "-")), sized && "dk-image--sized", "dk-image--" + fit, rounded !== false && "dk-image--rounded", "dk-image--" + state, live && !priority && "dk-image--fades", frameProps && frameProps.className)}
      data-component="image" data-state={state}>
      {viewable && state !== "error"
        ? <button type="button" className="dk-image__view" aria-label={viewLabel || named(sds.labels.viewImage)} aria-haspopup="dialog" onClick={() => setOpen(true)}>{picture}</button>
        : picture}
      {onRemove ? <IconButton className="dk-image__remove" icon={icons.Close} label={removeLabel || named(sds.labels.removeImage)} size="sm" variant="secondary" shape="round" noTitle onClick={onRemove} /> : null}
      {viewable ? (
        <Dialog open={open} onOpenChange={setOpen} size="lg" title={alt || undefined} aria-label={alt ? undefined : viewLabel || sds.labels.image} className="dk-image__viewer">
          {open ? <Full src={fullSrc || largest(rest.srcSet) || src} alt={alt} fallback={fallback} shape={w > 0 && h > 0 ? [w, h] : img.current && img.current.naturalWidth > 0 ? [img.current.naturalWidth, img.current.naturalHeight] : null} /> : null}
        </Dialog>
      ) : null}
    </span>
  );
});
