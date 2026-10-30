"use client";
import * as React from "react";
import { cn, domId, oneOf, omit, SIZES } from "../../internal/cn";
import { announce, ensureAnnouncer } from "../../internal/announce";
import { component } from "../../internal/component";
import { useSettings } from "../../internal/provider";
import { useShowAfter } from "../../internal/showAfter";

export type LoaderVariant = 'ring' | 'spokes' | 'dots' | 'pixel' | 'text' | 'skeleton';
export type LoaderShape = 'text' | 'circle' | 'rect';
export type LoaderPattern = 'wave' | 'random' | 'sweep' | 'fall' | 'rise' | 'snake' | 'spiral' | 'cross' | 'checker';
export type LoaderTone = 'neutral' | 'primary' | 'muted' | 'inverse';
export interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 'ring' (default): an arc that grows and shrinks as it turns on a faint track. 'spokes': eight rounded spokes fading round a circle, ticking a spoke at a time, like the iOS activity indicator. 'dots': three pulsing dots, softer, for chat-like or inline waits. 'pixel': a 3×3 grid of squares lighting up in a diagonal wave. 'text': the label's words with a shine sweeping through them. 'skeleton': placeholder shapes where the content will be (see shape). */
  variant?: LoaderVariant;
  /** sm 16px (inline, small controls), md 24px (default: cards, panels, lists), lg 40px (a page or empty area). The text variant's words, and the skeleton's text lines: text-xs, text-sm, text-base. The skeleton circle: 16, 24 or 40px. */
  size?: 'sm' | 'md' | 'lg';
  /** 'neutral' (default): the text color, so it fits any surface. 'primary' or 'muted' color the ring, dots or pixel grid with those aliases (the text and skeleton variants stay in the text color). 'inverse': white in every theme, for dark scrims, overlays and media. */
  tone?: LoaderTone;
  /** Announced to screen readers when the loader appears, and its accessible name (role="progressbar"); the words the text variant shows. Default: 'Loading'. Pass '' when something nearby already announces it (the loader is then decorative). In a group of skeletons, name one and pass '' to the rest. */
  label?: string;
  /** Skeleton only. 'text' (default): lines as tall as the size's text line, full width, the last of several shorter. 'circle': an avatar, the size's 24px by default. 'rect': an image or card, full width and 96px tall. Set width and height with className (w-48, size-12, h-40). */
  shape?: LoaderShape;
  /** Skeleton with shape 'text': how many lines, 1 (default) to 20. */
  lines?: number;
  /** Pixel only. 'wave' (default): a wave of light runs along the diagonals from the top-left. 'random': each square twinkles on its own clock, so they light up in an ever-changing order. 'sweep': columns, left to right. 'fall': rows, top to bottom. 'rise': rows, bottom to top. 'snake': square by square, left to right then back, row by row. 'spiral': clockwise round the edge, then the center. 'cross': the corners, then the plus. 'checker': the X, then the edges. */
  pattern?: LoaderPattern;
  /** Pixel only: a soft halo of the loader's color round the lit squares (--loader-pixel-glow-size, 2px). Best on dark surfaces. Default false. */
  glow?: boolean;
  /** Milliseconds to wait before showing, so fast requests don't flash a loader. Its space is kept meanwhile. Default: 300. 0 shows it at once. */
  delay?: number;
  /** Whether it's loading. Keep the Loader mounted and pass false when the work ends: once shown, it stays at least 500ms, so it never flashes, then renders nothing. Default: true. */
  loading?: boolean;
}

/* Loader: shows that something is loading when you can't say how far along it is.
   variant "ring" (an arc that grows and shrinks as it turns on a faint track), "dots" (three pulsing dots) or
   "spokes" (eight rounded spokes fading round a circle, ticking a spoke at a time, like the iOS activity
   indicator), "pixel" (a 3×3 grid of square pixels, split by subtle dividers, lighting up in a pattern: a diagonal "wave" by default, or "random", "sweep", "fall", "rise", "snake", "spiral", "cross" or "checker"; glow adds a soft halo), "text" (the label's words, with a shine sweeping through them) or "skeleton" (placeholder shapes where the
   content will be: shape "text" with lines, "circle" or "rect", sized by className); sizes sm, md, lg (16, 24, 40px drawings;
   text-xs, text-sm, text-base words); tone "neutral" (the text color), "primary", "muted" (the ring or dots)
   or "inverse" (white, for dark scrims and media). By default it waits delay ms (300) before it appears, so
   fast requests don't flash it, then stays at least 500ms (loading={false} ends it), and announces label ("Loading") to screen readers; label="" makes it
   decorative, for when something nearby already says it's loading. */
const VARIANTS: readonly LoaderVariant[] = ["ring", "spokes", "dots", "pixel", "text", "skeleton"];
const SHAPES: readonly LoaderShape[] = ["text", "circle", "rect"];
const TONES: readonly LoaderTone[] = ["neutral", "primary", "muted", "inverse"];
const PATTERNS: readonly LoaderPattern[] = ["wave", "random", "sweep", "fall", "rise", "snake", "spiral", "cross", "checker"];
/* Pixel patterns that light the squares in steps: each square's step (0 to 8), by its index (row × 3 + column).
   A step is one --loader-pixel-stagger (100ms) later than step 0; Loader.css has the timings. */
const PIXEL_STEPS: Record<string, number[]> = {
  sweep: [0, 2, 4, 0, 2, 4, 0, 2, 4],     // columns, left to right
  fall: [0, 0, 0, 2, 2, 2, 4, 4, 4],      // rows, top to bottom
  rise: [4, 4, 4, 2, 2, 2, 0, 0, 0],      // rows, bottom to top
  snake: [0, 1, 2, 5, 4, 3, 6, 7, 8],     // left to right, then back, row by row
  spiral: [0, 1, 2, 7, 8, 3, 6, 5, 4],    // clockwise round the edge from the top-left, then the center
  cross: [0, 7, 0, 7, 7, 7, 0, 7, 0],     // the corners, then the plus (edges and center)
  checker: [0, 7, 0, 7, 0, 7, 0, 7, 0]    // the X (corners and center), then the edges
};
const OWN = { variant: 1, size: 1, tone: 1, label: 1, delay: 1, loading: 1, shape: 1, lines: 1, pattern: 1, glow: 1, className: 1 } as const;

/** Shows that something is loading when you can't say how far along it is. Mark the area that's loading with aria-busy while it shows. */
export const Loader = /* @__PURE__ */ component<HTMLSpanElement, LoaderProps>("Loader", function Loader(props, ref) {
  const sds = useSettings();
  const rest = omit(props, OWN);
  const variant = oneOf(VARIANTS, props.variant, "ring");
  const size = oneOf(SIZES, props.size, "md");
  const tone = oneOf(TONES, props.tone, "neutral");
  const label = props.label == null ? sds.labels.loading : String(props.label);
  const isText = variant === "text", isSkeleton = variant === "skeleton";
  const shape = oneOf(SHAPES, props.shape, "text");
  const pattern = oneOf(PATTERNS, props.pattern, "wave");   // pixel only
  const lines = Math.min(20, Math.max(1, Math.floor(Number(props.lines)) || 1));   // text shape: 1 to 20 lines
  const words = label || sds.labels.loading;   // the text variant always shows words; label="" only makes it decorative
  const delay = props.delay == null ? 300 : Math.max(0, Number(props.delay) || 0);
  const [wait] = React.useState(delay);   // the delay it mounted with: a later change doesn't restart the wait
  const loading = props.loading !== false;
  const shown = useShowAfter(loading, wait);
  React.useEffect(function () { ensureAnnouncer(); }, []);   // no cleanup: the region is shared
  // Announced once, when it shows, with the label it has then (a later label change isn't announced again).
  const latestLabel = React.useRef(label);
  React.useEffect(function () { latestLabel.current = label; });   // every render: keeps the latest label
  React.useEffect(function () { if (shown && latestLabel.current) announce(latestLabel.current); }, [shown]);

  rest["data-component"] = "loader";
  rest["data-variant"] = variant;
  rest["data-size"] = size;
  if (isSkeleton) rest["data-shape"] = shape;
  if (variant === "pixel") rest["data-pattern"] = pattern;
  if (shown && label) {   // an indeterminate progress bar (no value), named by label
    rest.role = "progressbar";
    rest["aria-label"] = label;
  } else rest["aria-hidden"] = true;
  const maskId = domId("dk-px", React.useId());   // one per loader, for the pixel grid's dividers
  const cells: React.ReactNode[] = [];
  if (variant === "pixel") for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)   // square, edge to edge; the wave runs along the diagonals (row + column)
    cells.push(<rect key={r * 3 + c} className={"dk-loader__px " + (pattern === "wave" ? "dk-loader__px--d" + (r + c) : pattern === "random" ? "dk-loader__px--r" + (r * 3 + c) : "dk-loader__px--s" + PIXEL_STEPS[pattern][r * 3 + c])} x={c * 8} y={r * 8} width={8} height={8} />);
  const drawing = !shown || isText ? null : variant === "pixel"
    ? <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden focusable="false">
        {/* cut the lines out of the squares… */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
          <rect width={24} height={24} fill="white" />
          <path className="dk-loader__px-cut" d="M16 0V48M32 0V48M0 16H48M0 32H48" transform="scale(0.5)" />
        </mask>
        <g mask={"url(#" + maskId + ")"}>{cells}</g>
        {/* …and draw them at one fixed strength (drawn at half scale: 1 unit = half a grid unit), so a divider looks the same whether its squares are lit or dim */}
        <path className="dk-loader__px-divider" d="M16 0V48M32 0V48M0 16H48M0 32H48" transform="scale(0.5)" />
      </svg>
    : variant === "spokes"
    ? <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden focusable="false">
        {/* the lead spoke points up; each one behind it (anticlockwise) is fainter: Loader.css.
            Drawn at 5/8 scale (a 38.4-unit grid) so the spoke width lands on a token: stroke-width-4 = 2.5 of the 24 units */}
        <g transform="scale(0.625)">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return <line key={k} className="dk-loader__spoke" x1={19.2} y1={4} x2={19.2} y2={9.6} transform={"rotate(" + (-45 * k) + " 19.2 19.2)"} />; })}
        </g>
      </svg>
    : variant === "dots"
    ? <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden focusable="false">
        <circle className="dk-loader__dot" cx={4} cy={12} r={2.5} />
        <circle className="dk-loader__dot" cx={12} cy={12} r={2.5} />
        <circle className="dk-loader__dot" cx={20} cy={12} r={2.5} />
      </svg>
    : <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden focusable="false">
        {/* a quarter arc turning (1s a turn): Loader.css; still and breathing under reduced motion */}
        <circle className="dk-loader__track" cx={12} cy={12} r={10} />
        <circle className="dk-loader__arc" cx={12} cy={12} r={10} pathLength={100} strokeDasharray="25 150" />
      </svg>;
  // The visible label repeats the accessible name, so it's hidden from assistive tech (no double reading).
  // The glint holds a full-color copy of the words in its ::after (from data-words, so the text isn't read twice).
  const text = isText ? <span className="dk-loader__label" aria-hidden key="label">{words}<span className="dk-loader__glint" data-words={words} /></span> : null;
  const cls = cn("dk-loader", "dk-loader--" + variant, isSkeleton && "dk-loader--shape-" + shape, variant === "pixel" && pattern !== "wave" && "dk-loader--pattern-" + pattern, variant === "pixel" && props.glow && "dk-loader--glow", "dk-loader--size-" + size, tone !== "neutral" && "dk-loader--" + tone, !shown && "dk-loader--waiting", props.className);
  if (!loading && !shown) return null;   // done, and shown long enough (or never shown)
  if (isSkeleton) {   // the shapes are drawn even while waiting, so the space they keep is the content's
    const bones: React.ReactNode[] = [];
    if (shape === "text") for (let i = 0; i < lines; i++) bones.push(<span className="dk-loader__line" key={i}><span className="dk-loader__bone" /></span>);
    else bones.push(<span className="dk-loader__bone" key="bone" />);
    return <span {...rest} ref={ref} className={cls}>{bones}</span>;
  }
  return (
    <span {...rest} ref={ref} className={cls}>
      {isText ? null : <span className="dk-loader__art" key="art">{drawing}</span>}
      {text}
    </span>
  );
});
