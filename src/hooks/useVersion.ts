import { useCallback } from 'react';
import { useVersionStore } from '../stores/versionStore';
import { useToast } from '@chakra-ui/react';
import { Version } from '../types/version';

export const useVersion = (
    currentFile: {
        name: string;
        handle: FileSystemFileHandle;
        id: string;
        path: string;
    } | null,
    workspaceHandle: FileSystemDirectoryHandle | null,
    currentContent: string,
    onContentChange: (content: string) => void
) => {
    const {
        versions,
        comparison,
        isModalOpen,
        setModalOpen,
        setComparison,
        createVersion,
        loadVersions,
        deleteVersion,
    } = useVersionStore();
    
    const toast = useToast();

    const handleCreateVersion = useCallback(async (versionName: string) => {
        if (!currentFile || !workspaceHandle) {
            toast({
                title: "No file selected",
                status: "error",
                duration: 3000,
            });
            return false;
        }

        try {
            await createVersion({
                name: versionName,
                content: currentContent,
                fileHandle: currentFile.handle,
                workspaceHandle
            });
            
            toast({
                title: "Version created",
                status: "success",
                duration: 2000,
            });
            return true;
        } catch (error) {
            toast({
                title: "Error creating version",
                status: "error",
                duration: 3000,
            });
            return false;
        }
    }, [currentFile, workspaceHandle, currentContent, createVersion, toast]);

    const handleLoadVersions = useCallback(async () => {
        if (!currentFile || !workspaceHandle) return;

        try {
            await loadVersions({
                fileName: currentFile.name,
                workspaceHandle
            });
        } catch (error) {
            toast({
                title: "Error loading versions",
                status: "error",
                duration: 3000,
            });
        }
    }, [currentFile, workspaceHandle, loadVersions, toast]);

    const handleDeleteVersion = useCallback(async (version: Version) => {
        if (!workspaceHandle) return;

        try {
            await deleteVersion({ version, workspaceHandle });
            toast({
                title: "Version deleted",
                status: "success",
                duration: 2000,
            });
        } catch (error) {
            toast({
                title: "Error deleting version",
                status: "error",
                duration: 3000,
            });
        }
    }, [workspaceHandle, deleteVersion, toast]);

    const handleVersionSelect = useCallback(async (version: Version) => {
        if (!workspaceHandle) return;

        try {
            const versionsHandle = await workspaceHandle.getDirectoryHandle('versions');
            const versionFileHandle = await versionsHandle.getFileHandle(version.filePath);
            const versionFile = await versionFileHandle.getFile();
            const content = await versionFile.text();
            
            setComparison({ version, content });
            setModalOpen(false);
        } catch (error) {
            toast({
                title: "Error loading version",
                status: "error",
                duration: 3000,
            });
        }
    }, [workspaceHandle, setComparison, setModalOpen, toast]);

    const handleAcceptChanges = useCallback(() => {
        if (!comparison) return;
        onContentChange(comparison.content);
        setComparison(null);
    }, [comparison, onContentChange, setComparison]);

    return {
        versions,
        comparison,
        isModalOpen,
        setModalOpen,
        handleCreateVersion,
        handleLoadVersions,
        handleDeleteVersion,
        handleVersionSelect,
        handleAcceptChanges,
    };
}; 