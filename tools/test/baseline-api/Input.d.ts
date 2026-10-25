// exports: Input, type InputProps
interface InputLabels {
    charactersLeft: (left: number) => string;
}
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "prefix" | "size"> {
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    leftIcon?: IconSource;
    rightIcon?: IconSource;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    showCount?: boolean;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
