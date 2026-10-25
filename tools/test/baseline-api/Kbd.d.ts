// exports: Kbd, type KbdProps
interface KbdLabels {
    keyName: (name: string) => string;
}
interface KbdProps extends React.HTMLAttributes<HTMLElement> {
    keys?: string[];
    size?: "md" | "sm";
}
declare const Kbd: React.ForwardRefExoticComponent<KbdProps & React.RefAttributes<HTMLElement>>;
