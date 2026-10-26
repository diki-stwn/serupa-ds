// exports: Carousel, type CarouselPerView, type CarouselProps
interface CarouselLabels {
    previousSlide: string;
    nextSlide: string;
    slideOf: (slide: number, total: number) => string;
    slidesOf: (first: number, last: number, total: number) => string;
    carouselRole: string;
    slideRole: string;
}
interface CarouselProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
    children?: React.ReactNode;
    label?: string;
    index?: number;
    defaultIndex?: number;
    onIndexChange?: (index: number) => void;
    loop?: boolean;
    arrows?: boolean;
    dots?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    slideLabel?: (index: number, count: number) => string;
    perView?: CarouselPerView | number;
}
interface CarouselPerView {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
}
declare const Carousel: React.ForwardRefExoticComponent<CarouselProps & React.RefAttributes<HTMLElement>>;
