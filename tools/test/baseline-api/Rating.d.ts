// exports: Rating, type RatingProps
interface RatingLabels {
    ratingStars: (value: number) => string;
    ratingValue: (value: number, max: number) => string;
}
interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    value?: null | number;
    defaultValue?: null | number;
    onValueChange?: (value: null | number) => void;
    max?: number;
    allowHalf?: boolean;
    clearable?: boolean;
    readOnly?: boolean;
    disabled?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    invalid?: boolean;
    size?: "lg" | "md" | "sm";
}
declare const Rating: React.ForwardRefExoticComponent<RatingProps & React.RefAttributes<HTMLDivElement>>;
