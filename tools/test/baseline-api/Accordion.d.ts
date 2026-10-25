// exports: Accordion, AccordionItem, type AccordionItemProps, type AccordionProps
interface AccordionLabels {
    expandAll: string;
    collapseAll: string;
}
interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    type?: "multiple" | "single";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    collapsible?: boolean;
    variant?: "card" | "plain";
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    showExpandAll?: boolean;
}
interface AccordionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    value?: string;
    title: React.ReactNode;
    disabled?: boolean;
    children?: React.ReactNode;
}
declare const Accordion: React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>>;
declare const AccordionItem: React.ForwardRefExoticComponent<AccordionItemProps & React.RefAttributes<HTMLDivElement>>;
