// exports: InlineEdit, type InlineEditProps
interface InlineEditLabels {
    edit: string;
}
interface InlineEditProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onChange"> {
    label: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onCancel?: () => void;
    validate?: (value: string) => React.ReactNode;
    placeholder?: string;
    size?: "lg" | "md" | "sm";
    editing?: boolean;
    defaultEditing?: boolean;
    onEditingChange?: (editing: boolean) => void;
    disabled?: boolean;
    readOnly?: boolean;
    editLabel?: string;
    inputProps?: Omit<InputProps, "aria-label" | "defaultValue" | "size" | "value">;
}
declare const InlineEdit: React.ForwardRefExoticComponent<InlineEditProps & React.RefAttributes<HTMLDivElement>>;
