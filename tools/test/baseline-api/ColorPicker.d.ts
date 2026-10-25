// exports: ColorPicker, type ColorPickerProps, type ColorSwatch
interface ColorPickerLabels {
    colorName: (hue: ColorHue, tone: ColorTone) => string;
    customColor: string;
    hexCode: string;
    contrast: (ratio: string) => string;
    lowContrast: (minimum: string) => string;
}
interface ColorSwatch {
    value: string;
    label: string;
}
interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    swatches: ReadonlyArray<ColorSwatch | string>;
    value?: null | string;
    defaultValue?: null | string;
    onValueChange?: (value: string) => void;
    onValueCommit?: (value: string) => void;
    custom?: boolean;
    contrastWith?: string;
    minContrast?: number;
    size?: "md" | "sm";
    disabled?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    invalid?: boolean;
}
declare const ColorPicker: React.ForwardRefExoticComponent<ColorPickerProps & React.RefAttributes<HTMLDivElement>>;
