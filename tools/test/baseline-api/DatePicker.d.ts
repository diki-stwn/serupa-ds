// exports: DatePicker, type DatePickerProps
interface DatePickerLabels {
    chooseDate: string;
    inputNotAccepted: (text: string) => string;
    formatHint: (pattern: string) => string;
}
interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "defaultValue" | "max" | "min" | "onChange" | "size" | "value"> {
    value?: Date | null | string;
    defaultValue?: Date | null | string;
    onValueChange?: (value: Date | null, iso: null | string) => void;
    onInvalidInput?: (text: string, reason: "unavailable" | "unreadable") => void;
    min?: Date | string;
    max?: Date | string;
    isDateDisabled?: (date: Date) => boolean;
    locale?: string;
    weekStartsOn?: number;
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    buttonLabel?: string;
}
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLInputElement>>;
