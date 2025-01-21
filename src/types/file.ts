export interface FileItem {
    name: string;
    handle: FileSystemFileHandle;
    id: string;
    path: string;
    isReadOnly?: boolean;
    file_category: "editable" | "reference";
    file_type: string;
} 