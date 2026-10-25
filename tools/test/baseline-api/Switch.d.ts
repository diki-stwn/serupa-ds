// exports: Switch, type SwitchProps
interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "role" | "size" | "type"> {
    size?: "lg" | "md" | "sm";
    children?: React.ReactNode;
    description?: React.ReactNode;
    labelPosition?: "end" | "start";
    invalid?: boolean;
    readOnly?: boolean;
    pending?: boolean;
}
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLInputElement>>;
