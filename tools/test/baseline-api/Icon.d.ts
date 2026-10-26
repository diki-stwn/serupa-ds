// exports: Icon, type IconName, type IconProps, type IconSource
type IconName = (string & {}) | CustomIconName | MaterialIconName;
type IconSource = IconData | IconName | React.ReactNode;
interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name?: IconName;
    icon?: IconData;
    size?: number | string;
    mirror?: "auto" | boolean;
}
declare const Icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<HTMLSpanElement>>;
