// exports: SkipLink, type SkipLinkProps
interface SkipLinkLabels {
    skipToContent: string;
}
interface SkipLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
    target?: string;
    children?: React.ReactNode;
}
declare const SkipLink: React.ForwardRefExoticComponent<SkipLinkProps & React.RefAttributes<HTMLAnchorElement>>;
