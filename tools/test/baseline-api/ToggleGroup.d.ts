// exports: ToggleGroup, type ToggleGroupProps
interface ToggleGroupProps extends Omit<ButtonGroupProps, "defaultValue" | "onChange"> {
    type?: "multiple" | "single";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    required?: boolean;
    disabled?: boolean;
    size?: ToggleButtonProps["size"];
    variant?: ToggleButtonProps["variant"];
    children?: React.ReactNode;
}
declare const ToggleGroup: React.ForwardRefExoticComponent<ToggleGroupProps & React.RefAttributes<HTMLDivElement>>;
