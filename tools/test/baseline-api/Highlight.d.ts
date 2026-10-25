// exports: Highlight, type HighlightProps, highlightRanges
interface HighlightProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
    children: string;
    query: ReadonlyArray<string> | string;
    words?: boolean;
}
declare function highlightRanges(text: string, query: ReadonlyArray<string> | string, words?: boolean): Array<[
    number,
    number
]>;
declare const Highlight: React.ForwardRefExoticComponent<HighlightProps & React.RefAttributes<HTMLSpanElement>>;
