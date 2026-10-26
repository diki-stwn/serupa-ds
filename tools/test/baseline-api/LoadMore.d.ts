// exports: LoadMore, type LoadMoreProps
interface LoadMoreLabels {
    loadMore: string;
    showingOf: (shown: string, total: string) => string;
    loadedMore: (added: string) => string;
    moreLoaded: string;
    allLoaded: string;
}
interface LoadMoreProps extends React.HTMLAttributes<HTMLDivElement> {
    onLoadMore: () => PromiseLike<unknown> | void;
    hasMore?: boolean;
    loading?: boolean;
    count?: number;
    total?: number;
    infinite?: boolean;
    label?: React.ReactNode;
    endText?: React.ReactNode;
}
declare const LoadMore: React.ForwardRefExoticComponent<LoadMoreProps & React.RefAttributes<HTMLDivElement>>;
