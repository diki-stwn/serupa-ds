// exports: Calendar, type CalendarProps
interface CalendarLabels {
    previousMonth: string;
    nextMonth: string;
}
interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    value?: Date | null | string;
    defaultValue?: Date | null | string;
    onValueChange?: (value: Date, iso: string) => void;
    month?: Date;
    defaultMonth?: Date;
    onMonthChange?: (month: Date) => void;
    min?: Date | string;
    max?: Date | string;
    isDateDisabled?: (date: Date) => boolean;
    locale?: string;
    weekStartsOn?: number;
    autoFocus?: boolean;
    previousLabel?: string;
    nextLabel?: string;
}
declare const Calendar: React.ForwardRefExoticComponent<CalendarProps & React.RefAttributes<HTMLDivElement>>;
