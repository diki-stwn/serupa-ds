// exports: Carousel, type CarouselProps
interface CarouselLabels {
    previousSlide: string;
    nextSlide: string;
    slideOf: (slide: number, total: number) => string;
    carouselRole: string;
    slideRole: string;
}
interface CarouselProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    children?: React.ReactNode;
    label: string;
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
    loop?: boolean;
    arrows?: boolean;
    dots?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    slideLabel?: (index: number, count: number) => string;
}
declare const Carousel: React.ForwardRefExoticComponent<CarouselProps & React.RefAttributes<HTMLElement>>;
