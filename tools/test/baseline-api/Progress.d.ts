// exports: Progress, type ProgressProps, type ProgressTone
interface ProgressLabels {
    progressComplete: (name: string) => string;
}
type ProgressTone = "danger" | "primary" | "success" | "warning";
interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
    value?: null | number;
    max?: number;
    variant?: "bar" | "circle";
    size?: "lg" | "md" | "sm";
    tone?: ProgressTone;
    label?: React.ReactNode;
    showValue?: boolean;
    formatValue?: (value: number, max: number) => string;
    announceComplete?: boolean | string;
    onComplete?: () => void;
}
declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
