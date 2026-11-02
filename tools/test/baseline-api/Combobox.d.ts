// exports: Combobox, type ComboboxMultipleProps, type ComboboxOption, type ComboboxProps, type ComboboxSingleProps
interface ComboboxLabels {
    loadingResults: string;
    loadFailed: string;
    noResults: string;
    resultsCount: (count: number) => string;
    showOptions: string;
    clearValue: (label: string) => string;
    valueAdded: (label: string) => string;
    valueRemoved: (label: string) => string;
}
type ComboboxOption<V extends string = string> = {
    value: V;
    label: string;
    description?: React.ReactNode;
    disabled?: boolean;
} | V;
interface ComboboxBaseProps<V extends string = string> extends Omit<InputProps, "defaultValue" | "onChange" | "prefix" | "rightIcon" | "showCount" | "suffix" | "type" | "value"> {
    options?: readonly ComboboxOption<V>[];
    loadOptions?: (text: string, context: {
        signal: AbortSignal;
    }) => Promise<readonly ComboboxOption<V>[]>;
    debounce?: number;
    inputValue?: string;
    defaultInputValue?: string;
    onInputChange?: (text: string) => void;
    filter?: ((option: {
        value: V;
        label: string;
    }, text: string) => boolean) | false;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
    clearable?: boolean;
    loading?: boolean;
    emptyText?: React.ReactNode;
    loadingText?: string;
    toggleLabel?: string;
    clearLabel?: string;
}
interface ComboboxSingleProps<V extends string = string> extends ComboboxBaseProps<V> {
    multiple?: false;
    value?: null | V;
    defaultValue?: null | V;
    onValueChange?: (value: null | V) => void;
}
interface ComboboxMultipleProps<V extends string = string> extends ComboboxBaseProps<V> {
    multiple: true;
    value?: readonly V[];
    defaultValue?: readonly V[];
    onValueChange?: (value: V[]) => void;
}
type ComboboxProps<V extends string = string> = ComboboxMultipleProps<V> | ComboboxSingleProps<V>;
declare const Combobox: (<V extends string = string>(props: ComboboxProps<V> & React.RefAttributes<HTMLInputElement>) => null | React.ReactElement) & {
    displayName?: string;
};
