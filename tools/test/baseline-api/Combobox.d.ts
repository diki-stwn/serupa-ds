// exports: Combobox, type ComboboxOption, type ComboboxProps
interface ComboboxLabels {
    loadingResults: string;
    noResults: string;
    resultsCount: (count: number) => string;
    moreResults: (count: number) => string;
    showOptions: string;
    clearValue: (label: string) => string;
}
type ComboboxOption = {
    value: string;
    label: string;
    description?: React.ReactNode;
    disabled?: boolean;
} | string;
interface ComboboxProps extends Omit<InputProps, "defaultValue" | "onChange" | "prefix" | "rightIcon" | "showCount" | "suffix" | "type" | "value"> {
    options: ComboboxOption[];
    value?: null | string;
    defaultValue?: null | string;
    onValueChange?: (value: null | string) => void;
    onInputChange?: (text: string) => void;
    filter?: ((option: {
        value: string;
        label: string;
    }, text: string) => boolean) | false;
    clearable?: boolean;
    loading?: boolean;
    emptyText?: React.ReactNode;
    loadingText?: string;
    toggleLabel?: string;
    clearLabel?: string;
}
declare const Combobox: React.ForwardRefExoticComponent<ComboboxProps & React.RefAttributes<HTMLInputElement>>;
