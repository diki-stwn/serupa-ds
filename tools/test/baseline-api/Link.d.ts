// exports: Link, type LinkProps
interface LinkLabels {
    opensInNewTab: string;
}
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    tone?: "neutral" | "primary";
    underline?: "always" | "hover";
    external?: boolean;
    as?: React.ElementType;
}
declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
