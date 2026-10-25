// exports: PasswordInput, type PasswordInputProps
interface PasswordInputLabels {
    showPassword: string;
    capsLockOn: string;
}
interface PasswordInputProps extends Omit<InputProps, "rightIcon" | "showCount" | "type"> {
    visible?: boolean;
    defaultVisible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    toggleLabel?: string;
    capsLockHint?: boolean;
}
declare const PasswordInput: React.ForwardRefExoticComponent<PasswordInputProps & React.RefAttributes<HTMLInputElement>>;
