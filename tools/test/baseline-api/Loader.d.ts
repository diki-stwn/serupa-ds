// exports: Loader, type LoaderPattern, type LoaderProps, type LoaderShape, type LoaderTone, type LoaderVariant
type LoaderVariant = "dots" | "pixel" | "ring" | "skeleton" | "spokes" | "text";
type LoaderShape = "circle" | "rect" | "text";
type LoaderPattern = "checker" | "cross" | "fall" | "random" | "rise" | "snake" | "spiral" | "sweep" | "wave";
type LoaderTone = "inverse" | "muted" | "neutral" | "primary";
interface LoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: LoaderVariant;
    size?: "lg" | "md" | "sm";
    tone?: LoaderTone;
    label?: string;
    shape?: LoaderShape;
    lines?: number;
    pattern?: LoaderPattern;
    glow?: boolean;
    delay?: number;
    loading?: boolean;
}
declare const Loader: React.ForwardRefExoticComponent<LoaderProps & React.RefAttributes<HTMLSpanElement>>;
