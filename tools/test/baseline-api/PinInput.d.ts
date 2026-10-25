// exports: PinInput, type PinInputProps
interface PinInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "defaultValue" | "maxLength" | "onChange" | "size" | "type" | "value"> {
    length?: number;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onComplete?: (value: string) => void;
    type?: "alphanumeric" | "numeric";
    mask?: boolean;
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
}
declare const PinInput: React.ForwardRefExoticComponent<PinInputProps & React.RefAttributes<HTMLInputElement>>;
