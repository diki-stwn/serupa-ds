// exports: Timeline, type TimelineAlign, TimelineItem, type TimelineItemProps, type TimelineProps, type TimelineStatus
type TimelineAlign = "alternate" | "start";
type TimelineStatus = "danger" | "info" | "neutral" | "primary" | "success" | "warning";
interface TimelineProps extends React.OlHTMLAttributes<HTMLOListElement> {
    align?: TimelineAlign;
    children?: React.ReactNode;
}
interface TimelineItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
    title?: React.ReactNode;
    time?: React.ReactNode;
    dateTime?: string;
    icon?: IconSource;
    status?: TimelineStatus;
    children?: React.ReactNode;
}
declare const Timeline: React.ForwardRefExoticComponent<TimelineProps & React.RefAttributes<HTMLOListElement>>;
declare const TimelineItem: React.ForwardRefExoticComponent<TimelineItemProps & React.RefAttributes<HTMLLIElement>>;
