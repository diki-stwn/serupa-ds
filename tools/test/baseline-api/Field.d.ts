// exports: Field, type FieldProps
interface FieldLabels {
    fieldOptional: string;
}
interface FieldProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    optional?: boolean | string;
    disabled?: boolean;
    group?: boolean;
    id?: string;
    children?: React.ReactNode;
}
declare const Field: ((props: FieldProps) => React.ReactElement) & {
    displayName: string;
};
