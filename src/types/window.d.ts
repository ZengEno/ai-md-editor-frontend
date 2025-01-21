interface FileSystemDirectoryHandle {
    kind: 'directory';
    name: string;
    values(): AsyncIterableIterator<FileSystemHandle>;
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
} 