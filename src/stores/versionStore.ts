import { create } from 'zustand';
import { Version } from '../types/version';

interface VersionState {
    versions: Version[];
    comparison: {
        version: Version;
        content: string;
    } | null;
    isModalOpen: boolean;
    fileComparisons: Record<string, { version: Version; content: string } | null>;

    // Actions
    setVersions: (versions: Version[]) => void;
    setComparison: (comparison: { version: Version; content: string } | null) => void;
    setModalOpen: (isOpen: boolean) => void;
    setFileComparison: (fileId: string, comparison: { version: Version; content: string } | null) => void;
    getFileComparison: (fileId: string) => { version: Version; content: string } | null;
    
    // Async actions
    createVersion: (params: {
        name: string;
        content: string;
        fileHandle: FileSystemFileHandle;
        workspaceHandle: FileSystemDirectoryHandle;
    }) => Promise<void>;
    loadVersions: (params: {
        fileName: string;
        workspaceHandle: FileSystemDirectoryHandle;
    }) => Promise<void>;
    deleteVersion: (params: {
        version: Version;
        workspaceHandle: FileSystemDirectoryHandle;
    }) => Promise<void>;
    revertToVersion: (params: {
        version: Version;
        workspaceHandle: FileSystemDirectoryHandle;
        onRevert: (content: string) => void;
    }) => Promise<void>;
}

export const useVersionStore = create<VersionState>((set, get) => ({
    versions: [],
    comparison: null,
    isModalOpen: false,
    fileComparisons: {},

    setVersions: (versions) => set({ versions }),
    setComparison: (comparison) => set({ comparison }),
    setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
    
    setFileComparison: (fileId, comparison) => 
        set((state) => ({
            fileComparisons: {
                ...state.fileComparisons,
                [fileId]: comparison
            }
        })),

    getFileComparison: (fileId) => get().fileComparisons[fileId] || null,

    createVersion: async ({ name, content, fileHandle, workspaceHandle }) => {
        try {
            const versionsHandle = await workspaceHandle.getDirectoryHandle('versions', {
                create: true
            });

            const baseFileName = fileHandle.name.replace('.md', '');
            const timestamp = Date.now();
            const versionFileName = `${baseFileName}-${name}-${timestamp}.md`;

            const versionFileHandle = await versionsHandle.getFileHandle(versionFileName, {
                create: true
            });

            const writable = await (versionFileHandle as any).createWritable({
                keepExistingData: false
            });
            await writable.write(new TextEncoder().encode(content));
            await writable.close();

            // Reload versions after creating new one
            await get().loadVersions({
                fileName: fileHandle.name,
                workspaceHandle
            });
        } catch (error) {
            console.error('Error creating version:', error);
            throw error;
        }
    },

    loadVersions: async ({ fileName, workspaceHandle }) => {
        try {
            const versionsHandle = await workspaceHandle.getDirectoryHandle('versions', {
                create: true
            });

            const baseFileName = fileName.replace('.md', '');
            const loadedVersions: Version[] = [];

            for await (const entry of versionsHandle.values()) {
                if (entry.kind === 'file' && entry.name.startsWith(baseFileName + '-')) {
                    const withoutExt = entry.name.slice(0, -3);
                    const parts = withoutExt.split('-');
                    const timestamp = parts[parts.length - 1];
                    const name = parts.slice(baseFileName.split('-').length, -1).join('-');

                    const timestampNum = parseInt(timestamp);
                    if (!isNaN(timestampNum)) {
                        loadedVersions.push({
                            name,
                            timestamp: new Date(timestampNum).toISOString(),
                            filePath: entry.name
                        });
                    }
                }
            }

            set({ versions: loadedVersions.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )});
        } catch (error) {
            console.error('Error loading versions:', error);
            throw error;
        }
    },

    deleteVersion: async ({ version, workspaceHandle }) => {
        try {
            const versionsHandle = await workspaceHandle.getDirectoryHandle('versions');
            await versionsHandle.removeEntry(version.filePath);
            
            set((state) => ({
                versions: state.versions.filter(v => v.filePath !== version.filePath)
            }));
        } catch (error) {
            console.error('Error deleting version:', error);
            throw error;
        }
    },

    revertToVersion: async ({ version, workspaceHandle, onRevert }) => {
        try {
            const versionsHandle = await workspaceHandle.getDirectoryHandle('versions');
            const versionFileHandle = await versionsHandle.getFileHandle(version.filePath);
            const versionFile = await versionFileHandle.getFile();
            const content = await versionFile.text();
            
            onRevert(content);
            set({ comparison: null });
        } catch (error) {
            console.error('Error reverting version:', error);
            throw error;
        }
    }
})); 