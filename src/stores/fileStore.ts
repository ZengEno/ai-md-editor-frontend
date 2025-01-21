import { create } from "zustand";
import { Version } from "../types/version";
import { FileItem } from "../types/file";

interface CurrentFile {
    name: string;
    handle: FileSystemFileHandle;
    id: string;
    path: string;
    isReadOnly?: boolean;
    file_category: "editable" | "reference";
    file_type: string;
}

interface FileContent {
    current: string;
    original: string;
}

interface FileComparison {
    version: Version;
    content: string;
}

interface FileStore {
    currentFile: CurrentFile | null;
    hasWorkspace: boolean;
    unsavedFileIds: Set<string>;
    fileContents: Record<string, FileContent>;
    workspaceHandle: FileSystemDirectoryHandle | null;
    fileComparisons: Record<string, FileComparison | null>;
    files: FileItem[];
    editorRef: React.MutableRefObject<any> | null;
    getFileContent: (fileId: string) => Promise<string>;

    // Actions
    setCurrentFile: (file: CurrentFile | null) => void;
    setHasWorkspace: (has: boolean) => void;
    updateFileContent: (fileId: string, content: FileContent) => void;
    getCurrentContent: () => string;
    handleFileSelect: (content: string, file: CurrentFile) => void;
    handleContentChange: (newContent: string) => void;
    handleFileSave: () => void;
    handleWorkspaceRead: () => void;
    handleFileDelete: () => void;
    setWorkspaceHandle: (handle: FileSystemDirectoryHandle) => void;
    selectWorkspaceFolder: () => Promise<FileSystemDirectoryHandle | null>;
    setFileComparison: (
        fileId: string,
        comparison: FileComparison | null
    ) => void;
    getFileComparison: (fileId: string) => FileComparison | null;
    setFiles: (files: FileItem[]) => void;
    setEditorRef: (ref: React.MutableRefObject<any>) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
    currentFile: null,
    hasWorkspace: false,
    unsavedFileIds: new Set<string>(),
    fileContents: {},
    workspaceHandle: null,
    fileComparisons: {},
    files: [],
    editorRef: null,

    setCurrentFile: (file) => set({ currentFile: file }),
    setHasWorkspace: (has) => set({ hasWorkspace: has }),

    updateFileContent: (fileId, content) =>
        set((state) => ({
            fileContents: {
                ...state.fileContents,
                [fileId]: content,
            },
        })),

    getCurrentContent: () => {
        const state = get();
        if (!state.currentFile) return "";
        return state.fileContents[state.currentFile.id]?.current || "";
    },

    handleFileSelect: (content, file) => {
        const state = get();
        // Save current file's content before switching
        if (state.currentFile) {
            const currentContent = state.getCurrentContent();
            state.updateFileContent(state.currentFile.id, {
                current: currentContent,
                original:
                    state.fileContents[state.currentFile.id]?.original || "",
            });
        }

        // Set new current file
        set({ currentFile: file });

        // Initialize content for new file if not exists
        if (!state.fileContents[file.id]) {
            state.updateFileContent(file.id, {
                current: content,
                original: content,
            });
        }
    },

    handleContentChange: (newContent) => {
        const state = get();
        if (!state.currentFile) return;

        state.updateFileContent(state.currentFile.id, {
            ...state.fileContents[state.currentFile.id],
            current: newContent,
        });

        // Update unsaved files set
        const originalContent =
            state.fileContents[state.currentFile.id]?.original || "";
        if (newContent !== originalContent) {
            set((state) => ({
                unsavedFileIds: new Set(state.unsavedFileIds).add(
                    state.currentFile!.id
                ),
            }));
        } else {
            set((state) => {
                const next = new Set(state.unsavedFileIds);
                next.delete(state.currentFile!.id);
                return { unsavedFileIds: next };
            });
        }
    },

    handleFileSave: () => {
        const state = get();
        if (!state.currentFile) return;

        const content = state.getCurrentContent();

        // Write to the file
        const writeFile = async () => {
            try {
                // Create a text encoder for faster writing
                const encoder = new TextEncoder();
                const encodedContent = encoder.encode(content);

                const writable = await (
                    state.currentFile!.handle as any
                ).createWritable({
                    keepExistingData: false, // Don't read existing data
                });

                // Write the entire content at once
                await writable.write(encodedContent);

                const closeStartTime = performance.now();
                await writable.close();
                const closeEndTime = performance.now();
                console.log(`fileStore writable close took ${closeEndTime - closeStartTime} ms`);

                // Update the original content after successful save
                state.updateFileContent(state.currentFile!.id, {
                    current: content,
                    original: content,
                });

                // Clear the unsaved status
                set((state) => {
                    const next = new Set(state.unsavedFileIds);
                    next.delete(state.currentFile!.id);
                    return { unsavedFileIds: next };
                });

                return true;
            } catch (error) {
                console.error("Error saving file:", error);
                return false;
            }
        };

        return writeFile();
    },

    handleWorkspaceRead: () => {
        set({
            hasWorkspace: true,
            currentFile: null,
            fileContents: {},
            unsavedFileIds: new Set(),
        });
    },

    handleFileDelete: () => {
        const state = get();
        if (!state.currentFile) return;

        set((state) => {
            const newContents = { ...state.fileContents };
            delete newContents[state.currentFile!.id];

            const next = new Set(state.unsavedFileIds);
            next.delete(state.currentFile!.id);

            return {
                fileContents: newContents,
                unsavedFileIds: next,
                currentFile: null,
            };
        });
    },

    setWorkspaceHandle: (handle) => set({ workspaceHandle: handle }),

    selectWorkspaceFolder: async () => {
        try {
            // @ts-ignore - for the showDirectoryPicker API
            const dirHandle = await window.showDirectoryPicker();
            set({
                workspaceHandle: dirHandle,
                hasWorkspace: true,
            });
            return dirHandle;
        } catch (error) {
            console.error("Error selecting folder:", error);
            return null;
        }
    },

    setFileComparison: (fileId, comparison) =>
        set((state) => ({
            fileComparisons: {
                ...state.fileComparisons,
                [fileId]: comparison,
            },
        })),

    getFileComparison: (fileId) => get().fileComparisons[fileId] || null,

    setFiles: (files) => set({ files }),

    setEditorRef: (ref) => set({ editorRef: ref }),

    getFileContent: async (fileId: string) => {
        const state = get();
        const file = state.files.find(f => f.id === fileId);
        if (!file) throw new Error("File not found");

        try {
            const fileData = await file.handle.getFile();
            const content = await fileData.text();
            return content;
        } catch (error) {
            console.error("Error reading file content:", error);
            throw new Error("Failed to read file content");
        }
    },
}));
