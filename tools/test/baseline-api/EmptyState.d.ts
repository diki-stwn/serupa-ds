// exports: EmptyState, type EmptyStateProps
interface EmptyStateLabels {
    didYouMean: string;
    clearFilters: string;
}
interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    icon?: IconSource;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    size?: "md" | "sm";
    variant?: "dashed" | "plain";
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    announce?: boolean;
    suggestions?: string[];
    onSuggestion?: (suggestion: string) => void;
    onClearFilters?: () => void;
}
declare const EmptyState: React.ForwardRefExoticComponent<EmptyStateProps & React.RefAttributes<HTMLDivElement>>;
