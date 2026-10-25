// exports: AvatarGroup, type AvatarGroupProps
interface AvatarGroupLabels {
    avatarMore: (count: number) => string;
}
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    max?: number;
    total?: number;
    size?: AvatarSize;
    moreLabel?: (count: number) => string;
    label?: string;
    showMore?: boolean;
    onMore?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
declare const AvatarGroup: React.ForwardRefExoticComponent<AvatarGroupProps & React.RefAttributes<HTMLDivElement>>;
