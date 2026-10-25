// exports: type DateRange, type DateRangeInput, DateRangePicker, type DateRangePickerProps
interface DateRangePickerLabels {
    chooseDates: string;
    startDate: string;
    endDate: string;
    chooseStartDate: string;
    chooseEndDate: string;
}
interface DateRange {
    start: Date | null;
    end: Date | null;
}
interface DateRangeInput {
    start: Date | null | string;
    end: Date | null | string;
}
interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "defaultValue" | "onChange"> {
    value?: DateRangeInput;
    defaultValue?: DateRangeInput;
    onValueChange?: (value: DateRange, iso: {
        start: null | string;
        end: null | string;
    }) => void;
    onInvalidInput?: (text: string, reason: "unavailable" | "unreadable") => void;
    min?: Date | string;
    max?: Date | string;
    isDateDisabled?: (date: Date) => boolean;
    locale?: string;
    weekStartsOn?: number;
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    id?: string;
    startLabel?: string;
    endLabel?: string;
    startName?: string;
    endName?: string;
    form?: string;
    buttonLabel?: string;
    months?: 1 | 2;
}
declare const DateRangePicker: React.ForwardRefExoticComponent<DateRangePickerProps & React.RefAttributes<HTMLSpanElement>>;
