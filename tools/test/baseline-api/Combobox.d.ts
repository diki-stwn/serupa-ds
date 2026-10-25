// exports: Combobox, type ComboboxMultipleProps, type ComboboxOption, type ComboboxProps, type ComboboxSingleProps
interface ComboboxLabels {
    loadingResults: string;
    loadFailed: string;
    noResults: string;
    resultsCount: (count: number) => string;
    moreResults: (count: number) => string;
    showOptions: string;
    clearValue: (label: string) => string;
    valueAdded: (label: string) => string;
    valueRemoved: (label: string) => string;
}
type ComboboxOption = {
    value: string;
    label: string;
    description?: React.ReactNode;
    disabled?: boolean;
} | string;
interface ComboboxBaseProps extends Omit<InputProps, "defaultValue" | "onChange" | "prefix" | "rightIcon" | "showCount" | "suffix" | "type" | "value"> {
    options?: ComboboxOption[];
    loadOptions?: (text: string, context: {
        signal: AbortSignal;
    }) => Promise<ComboboxOption[]>;
    debounce?: number;
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
interface ComboboxSingleProps extends ComboboxBaseProps {
    multiple?: false;
    value?: null | string;
    defaultValue?: null | string;
    onValueChange?: (value: null | string) => void;
}
interface ComboboxMultipleProps extends ComboboxBaseProps {
    multiple: true;
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
}
type ComboboxProps = ComboboxMultipleProps | ComboboxSingleProps;
declare const Combobox: React.ForwardRefExoticComponent<ComboboxProps & React.RefAttributes<HTMLInputElement>>;
