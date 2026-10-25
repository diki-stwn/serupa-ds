// exports: DatePicker, type DatePickerProps
interface DatePickerLabels {
    chooseDate: string;
    inputNotAccepted: (text: string) => string;
}
interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "defaultValue" | "max" | "min" | "onChange" | "size" | "value"> {
    value?: Date | null;
    defaultValue?: Date | null;
    onValueChange?: (value: Date | null) => void;
    onInvalidInput?: (text: string, reason: "unavailable" | "unreadable") => void;
    min?: Date;
    max?: Date;
    isDateDisabled?: (date: Date) => boolean;
    locale?: string;
    weekStartsOn?: number;
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    buttonLabel?: string;
}
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLInputElement>>;
