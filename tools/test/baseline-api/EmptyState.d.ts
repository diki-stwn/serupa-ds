// exports: EmptyState, type EmptyStateProps
interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    icon?: IconSource;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    size?: "md" | "sm";
    variant?: "dashed" | "plain";
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    announce?: boolean;
}
declare const EmptyState: React.ForwardRefExoticComponent<EmptyStateProps & React.RefAttributes<HTMLDivElement>>;
