// exports: type SaveState, SaveStatus, type SaveStatusProps
interface SaveStatusLabels {
    saving: string;
    saved: string;
    saveFailed: string;
    retrySave: string;
}
type SaveState = "error" | "idle" | "saved" | "saving";
interface SaveStatusProps extends React.HTMLAttributes<HTMLDivElement> {
    status: SaveState;
    savedAt?: Date | number;
    onRetry?: () => void;
    errorText?: React.ReactNode;
}
declare const SaveStatus: React.ForwardRefExoticComponent<SaveStatusProps & React.RefAttributes<HTMLDivElement>>;
