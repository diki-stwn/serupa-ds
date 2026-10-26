// exports: TypeToConfirm, type TypeToConfirmProps
interface TypeToConfirmLabels {
    typeToConfirm: string;
    typePhraseFirst: (phrase: string) => string;
}
interface TypeToConfirmProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    phrase: string;
    confirmLabel: React.ReactNode;
    onConfirm: () => unknown;
    label?: React.ReactNode;
    hint?: React.ReactNode;
    caseSensitive?: boolean;
    onMatch?: (matched: boolean) => void;
    disabled?: boolean;
}
declare const TypeToConfirm: React.ForwardRefExoticComponent<TypeToConfirmProps & React.RefAttributes<HTMLDivElement>>;
