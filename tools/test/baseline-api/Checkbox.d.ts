// exports: Checkbox, CheckboxGroup, type CheckboxGroupProps, type CheckboxProps
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
    size?: "lg" | "md" | "sm";
    children?: React.ReactNode;
    description?: React.ReactNode;
    indeterminate?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    selectAll?: boolean;
    onCheckedChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}
interface CheckboxGroupProps<V extends number | string = number | string> extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
    value?: readonly V[];
    defaultValue?: readonly V[];
    onValueChange?: (value: V[], event: React.ChangeEvent<HTMLInputElement>) => void;
    name?: string;
    orientation?: "horizontal" | "vertical";
    size?: "lg" | "md" | "sm";
    invalid?: boolean;
    disabled?: boolean;
    required?: boolean;
    children?: React.ReactNode;
}
declare const CheckboxGroup: (<V extends number | string = number | string>(props: CheckboxGroupProps<V> & React.RefAttributes<HTMLDivElement>) => null | React.ReactElement) & {
    displayName?: string;
};
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
