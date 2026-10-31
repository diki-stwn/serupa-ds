// exports: SegmentedControl, type SegmentedControlOption, type SegmentedControlProps
interface SegmentedControlOption<V extends string = string> {
    value: V;
    label?: React.ReactNode;
    icon?: IconSource;
    "aria-label"?: string;
    disabled?: boolean;
}
interface SegmentedControlProps<V extends string = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    options: readonly SegmentedControlOption<V>[];
    value?: V;
    defaultValue?: V;
    onValueChange?: (value: V) => void;
    size?: "lg" | "md" | "sm";
    fullWidth?: boolean;
    disabled?: boolean;
    name?: string;
    form?: string;
    invalid?: boolean;
    required?: boolean;
    readOnly?: boolean;
}
declare const SegmentedControl: (<V extends string = string>(props: SegmentedControlProps<V> & React.RefAttributes<HTMLDivElement>) => null | React.ReactElement) & {
    displayName?: string;
};
