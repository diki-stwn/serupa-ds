// exports: NumberInput, type NumberInputProps
interface NumberInputLabels {
    decrease: string;
    increase: string;
}
interface NumberInputProps extends Omit<InputProps, "defaultValue" | "max" | "min" | "rightIcon" | "showCount" | "step" | "type" | "value"> {
    value?: null | number;
    defaultValue?: null | number;
    onValueChange?: (value: null | number) => void;
    min?: number;
    max?: number;
    step?: number;
    largeStep?: number;
    steppers?: boolean;
    decrementLabel?: string;
    incrementLabel?: string;
    locale?: string;
    formatOptions?: Intl.NumberFormatOptions;
    currency?: string;
    minorUnits?: boolean;
}
declare const NumberInput: React.ForwardRefExoticComponent<NumberInputProps & React.RefAttributes<HTMLInputElement>>;
