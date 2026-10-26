// exports: Input, type InputProps, type ValidityProblem
interface ValidityProblem {
    reason: "badInput" | "patternMismatch" | "rangeOverflow" | "rangeUnderflow" | "stepMismatch" | "tooLong" | "tooShort" | "typeMismatch" | "valueMissing";
    type: string;
    length: number;
    minLength?: number;
    maxLength?: number;
    min?: string;
    max?: string;
    step?: string;
    title?: string;
}
interface InputLabels {
    charactersLeft: (left: number) => string;
    invalidValue: (problem: ValidityProblem) => string;
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
