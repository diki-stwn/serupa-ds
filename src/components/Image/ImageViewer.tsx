"use client";
import * as React from "react";
import { cn } from "../../internal/cn";
import { Dialog } from "../Dialog/Dialog";
import { Icon } from "../Icon/Icon";
import * as icons from "../../material/builtin";

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

/** Image's full-size viewer: a large Dialog titled with the alt text (or named by label), showing the picture. Loaded
 *  on demand by Image.tsx, so only pages that view a picture full size carry Dialog. */
export function ImageViewer({ open, onOpenChange, title, label, src, alt, fallback, shape }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string | undefined; label: string | undefined;
  src: string; alt: string; fallback: React.ReactNode; shape: [number, number] | null;
}): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg" title={title} aria-label={label} className="dk-image__viewer">
      {open ? <Full src={src} alt={alt} fallback={fallback} shape={shape} /> : null}
    </Dialog>
  );
}
