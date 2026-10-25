// exports: Input, type InputProps
interface InputLabels {
    charactersLeft: (left: number) => string;
}
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "size"> {
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    leftIcon?: IconSource;
    rightIcon?: IconSource;
    showCount?: boolean;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
