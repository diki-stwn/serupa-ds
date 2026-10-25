// exports: ErrorBoundary, type ErrorBoundaryFallbackProps, type ErrorBoundaryProps
interface ErrorBoundaryLabels {
    errorTitle: string;
    errorDescription: string;
    tryAgain: string;
}
interface ErrorBoundaryFallbackProps {
    error: unknown;
    reset: () => void;
}
interface ErrorBoundaryProps {
    children?: React.ReactNode;
    fallback?: ((props: ErrorBoundaryFallbackProps) => React.ReactNode) | React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    onError?: (error: unknown, info: React.ErrorInfo) => void;
    onReset?: () => void;
    resetKeys?: ReadonlyArray<unknown>;
    className?: string;
}
declare const ErrorBoundary: ((props: ErrorBoundaryProps) => React.ReactElement) & {
    displayName: string;
};
