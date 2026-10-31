// exports: relativeTime, RelativeTime, type RelativeTimeProps
interface RelativeTimeProps extends Omit<React.TimeHTMLAttributes<HTMLTimeElement>, "children" | "dateTime"> {
    date: Date | number | string;
    format?: "long" | "narrow" | "short";
    numeric?: "always" | "auto";
    titleFormat?: false | Intl.DateTimeFormatOptions;
    absoluteAfter?: false | number;
    absoluteFormat?: Intl.DateTimeFormatOptions;
    locale?: string;
}
declare function relativeTime(date: Date | number | string, now: number, locale?: string, options?: {
    format?: "long" | "narrow" | "short";
    numeric?: "always" | "auto";
}): string;
declare const RelativeTime: React.ForwardRefExoticComponent<RelativeTimeProps & React.RefAttributes<HTMLTimeElement>>;
