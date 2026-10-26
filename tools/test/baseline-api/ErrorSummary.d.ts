// exports: ErrorSummary, type ErrorSummaryItem, type ErrorSummaryProps
interface ErrorSummaryLabels {
    errorSummaryTitle: (count: number) => string;
}
interface ErrorSummaryItem {
    field: string;
    message: React.ReactNode;
}
interface ErrorSummaryProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    errors: readonly ErrorSummaryItem[];
    title?: React.ReactNode;
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    description?: React.ReactNode;
    autoFocus?: boolean;
}
declare const ErrorSummary: React.ForwardRefExoticComponent<ErrorSummaryProps & React.RefAttributes<HTMLDivElement>>;
