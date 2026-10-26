// exports: Tab, TabList, type TabListProps, TabPanel, type TabPanelProps, type TabProps, Tabs, type TabsProps, type TabsVariant
type TabsVariant = "line" | "pill";
interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    variant?: TabsVariant;
    size?: "md" | "sm";
    activation?: "auto" | "manual";
    orientation?: "horizontal" | "vertical";
}
declare const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
type TabListProps = React.HTMLAttributes<HTMLDivElement>;
declare const TabList: React.ForwardRefExoticComponent<TabListProps & React.RefAttributes<HTMLDivElement>>;
interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
    value: string;
    icon?: IconSource;
}
declare const Tab: React.ForwardRefExoticComponent<TabProps & React.RefAttributes<HTMLButtonElement>>;
interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
    keepMounted?: boolean;
}
declare const TabPanel: React.ForwardRefExoticComponent<TabPanelProps & React.RefAttributes<HTMLDivElement>>;
