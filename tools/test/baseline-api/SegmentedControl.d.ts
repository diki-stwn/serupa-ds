// exports: SegmentedControl, type SegmentedControlOption, type SegmentedControlProps
interface SegmentedControlOption {
    value: string;
    label?: React.ReactNode;
    icon?: IconSource;
    "aria-label"?: string;
    disabled?: boolean;
}
interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    options: SegmentedControlOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    size?: "md" | "sm";
    fullWidth?: boolean;
    disabled?: boolean;
    name?: string;
    form?: string;
    invalid?: boolean;
    required?: boolean;
    readOnly?: boolean;
}
declare const SegmentedControl: React.ForwardRefExoticComponent<SegmentedControlProps & React.RefAttributes<HTMLDivElement>>;
