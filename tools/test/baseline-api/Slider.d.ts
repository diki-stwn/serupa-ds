// exports: Slider, type SliderProps, type SliderValue
interface SliderLabels {
    sliderMinimum: string;
    sliderMaximum: string;
}
type SliderValue = [
    number,
    number
] | number;
interface SliderProps<V extends SliderValue = SliderValue> extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    value?: V;
    defaultValue?: V;
    onValueChange?: (value: V) => void;
    onValueCommit?: (value: V) => void;
    min?: number;
    max?: number;
    step?: number;
    largeStep?: number;
    size?: "md" | "sm";
    disabled?: boolean;
    formatValue?: (value: number) => string;
    thumbLabels?: [
        string,
        string
    ];
    name?: string;
    invalid?: boolean;
    readOnly?: boolean;
    required?: boolean;
}
declare const Slider: (<V extends SliderValue = SliderValue>(props: SliderProps<V> & React.RefAttributes<HTMLDivElement>) => null | React.ReactElement) & {
    displayName?: string;
};
