// exports: type DateRange, DateRangePicker, type DateRangePickerProps
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
interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "defaultValue" | "onChange"> {
    value?: DateRange;
    defaultValue?: DateRange;
    onValueChange?: (value: DateRange) => void;
    onInvalidInput?: (text: string, reason: "unavailable" | "unreadable") => void;
    min?: Date;
    max?: Date;
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
