// exports: Link, type LinkOwnProps, type LinkProps
interface LinkLabels {
    opensInNewTab: string;
}
interface LinkOwnProps {
    tone?: "neutral" | "primary";
    underline?: "always" | "hover";
    external?: boolean;
}
type LinkProps<C extends React.ElementType = "a"> = LinkOwnProps & {
    as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | keyof LinkOwnProps>;
declare const Link: {
    <C extends React.ElementType = "a">(props: LinkProps<C> & {
        ref?: React.Ref<React.ComponentRef<C>>;
    }): null | React.ReactElement;
    displayName?: string;
};
