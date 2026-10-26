// exports: SearchInput, type SearchInputProps
interface SearchInputLabels {
    searching: string;
    clearSearch: string;
}
interface SearchInputProps extends Omit<InputProps, "leftIcon" | "prefix" | "rightIcon" | "showCount" | "suffix" | "type"> {
    onSearch?: (value: string) => void;
    onClear?: () => void;
    clearLabel?: string;
    loading?: boolean;
    loadingLabel?: string;
}
declare const SearchInput: React.ForwardRefExoticComponent<SearchInputProps & React.RefAttributes<HTMLInputElement>>;
