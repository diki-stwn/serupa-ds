// exports: Radio, RadioGroup, type RadioGroupProps, type RadioProps
interface RadioGroupProps<V extends number | string = number | string> extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    name?: string;
    value?: null | V;
    defaultValue?: V;
    onValueChange?: (value: V, event: React.ChangeEvent<HTMLInputElement>) => void;
    orientation?: "horizontal" | "vertical";
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    disabled?: boolean;
    required?: boolean;
    children?: React.ReactNode;
}
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    size?: "lg" | "md" | "sm";
    children?: React.ReactNode;
    description?: React.ReactNode;
    invalid?: boolean;
}
declare const RadioGroup: (<V extends number | string = number | string>(props: RadioGroupProps<V> & React.RefAttributes<HTMLDivElement>) => null | React.ReactElement) & {
    displayName?: string;
};
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;
