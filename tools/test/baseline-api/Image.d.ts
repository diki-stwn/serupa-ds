// exports: Image, type ImageProps, type ImageRatio, type ImageSource
interface ImageLabels {
    viewImage: string;
    removeImage: string;
}
type ImageRatio = "4:3" | "auto" | "square" | "video" | number;
interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt" | "children" | "placeholder" | "src"> {
    src: string;
    alt: string;
    ratio?: ImageRatio;
    fit?: "contain" | "cover";
    rounded?: boolean;
    fallback?: React.ReactNode;
    viewable?: boolean;
    fullSrc?: string;
    viewLabel?: string;
    onRemove?: () => void;
    removeLabel?: string;
    priority?: boolean;
    sources?: ImageSource[];
    frameProps?: React.HTMLAttributes<HTMLSpanElement>;
}
interface ImageSource {
    srcSet: string;
    media?: string;
    type?: string;
    sizes?: string;
    width?: number;
    height?: number;
}
declare const Image: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>;
