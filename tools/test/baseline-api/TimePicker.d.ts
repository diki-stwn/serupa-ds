// exports: TimePicker, type TimePickerProps
interface TimePickerLabels {
    chooseTime: string;
}
interface TimePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "max" | "min" | "onChange" | "size" | "step" | "value"> {
    value?: null | string;
    defaultValue?: null | string;
    onValueChange?: (value: null | string) => void;
    onInvalidInput?: (text: string, reason: "unavailable" | "unreadable") => void;
    min?: string;
    max?: string;
    step?: number;
    locale?: string;
    hour12?: boolean;
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    listLabel?: string;
}
declare const TimePicker: React.ForwardRefExoticComponent<TimePickerProps & React.RefAttributes<HTMLInputElement>>;
