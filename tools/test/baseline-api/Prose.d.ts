// exports: Prose, type ProseProps
interface ProseProps extends React.HTMLAttributes<HTMLElement> {
    as?: "article" | "div" | "section";
    children?: React.ReactNode;
}
declare const Prose: React.ForwardRefExoticComponent<ProseProps & React.RefAttributes<HTMLElement>>;
