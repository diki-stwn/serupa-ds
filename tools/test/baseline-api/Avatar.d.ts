// exports: Avatar, type AvatarProps, type AvatarSize, type AvatarStatus, initials
interface AvatarLabels {
    avatarStatus: (status: "away" | "busy" | "offline" | "online") => string;
}
declare function initials(name?: string): string;
type AvatarSize = "lg" | "md" | "sm" | "xl" | "xs";
type AvatarStatus = "away" | "busy" | "offline" | "online";
interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
    src?: string;
    name?: string;
    alt?: string;
    size?: AvatarSize;
    shape?: "circle" | "square";
    status?: AvatarStatus;
    statusLabel?: string;
}
declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>;
