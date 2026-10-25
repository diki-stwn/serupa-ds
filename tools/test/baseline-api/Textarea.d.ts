// exports: Textarea, type TextareaProps
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "children" | "rows"> {
    size?: "lg" | "md" | "sm";
    rows?: number;
    autoResize?: boolean;
    maxRows?: number;
    resize?: "none" | "vertical";
    invalid?: boolean;
    showCount?: boolean;
}
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
