// exports: type FileRejection, FileUpload, type FileUploadProps, formatFileSize
interface FileUploadLabels {
    dragFiles: string;
    dragFile: string;
    chooseFiles: string;
    chooseFile: string;
    chosenFiles: string;
    chosenFile: string;
    fileWrongType: (name: string, types: null | string[]) => string;
    fileTooLarge: (name: string, limit: string) => string;
    fileTooMany: (name: string, max: number) => string;
    fileOnlyOne: (name: string) => string;
    fileMissing: (multiple: boolean) => string;
    fileFolder: (name: string) => string;
    fileAlreadyAdded: (name: string) => string;
    filesAdded: (names: string[]) => string;
    fileRemoved: (name: string) => string;
}
declare function formatFileSize(bytes: number, locale?: string): string;
type FileRejection = {
    file: File;
    reason: "count" | "duplicate" | "folder" | "size" | "type";
    message: string;
};
interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "title"> {
    files?: File[];
    onFilesChange?: (files: File[]) => void;
    onReject?: (rejections: FileRejection[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    readOnly?: boolean;
    name?: string;
    form?: string;
    title?: React.ReactNode;
    buttonLabel?: string;
    hint?: React.ReactNode;
    removeLabel?: (name: string) => string;
}
declare const FileUpload: React.ForwardRefExoticComponent<FileUploadProps & React.RefAttributes<HTMLDivElement>>;
