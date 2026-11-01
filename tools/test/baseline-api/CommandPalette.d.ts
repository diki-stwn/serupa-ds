// exports: type Command, CommandPalette, type CommandPaletteProps
interface CommandPaletteLabels {
    commandPalette: string;
    searchCommands: string;
    noCommands: string;
    commandsCount: (count: number) => string;
    otherCommands: string;
}
interface Command {
    id: string;
    label: string;
    group?: string;
    keywords?: string[];
    icon?: IconData | React.ReactNode;
    shortcut?: string[];
    href?: string;
    disabled?: boolean;
    onSelect?: () => void;
}
interface CommandPaletteProps extends Omit<DialogProps, "alert" | "children" | "closeButton" | "closeLabel" | "description" | "footer" | "fullScreen" | "initialFocus" | "onSelect" | "size" | "title"> {
    commands: Command[];
    onSelect?: (command: Command) => void;
    hotkey?: false | string[];
    placeholder?: string;
    emptyText?: React.ReactNode;
    limit?: number;
}
declare const CommandPalette: React.ForwardRefExoticComponent<CommandPaletteProps & React.RefAttributes<HTMLDialogElement>>;
