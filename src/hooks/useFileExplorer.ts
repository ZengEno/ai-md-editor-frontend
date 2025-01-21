import { useState, useCallback, useEffect } from "react";
import { useFileStore } from "../stores/fileStore";
import { useToast } from "@chakra-ui/react";
import { FileItem } from "../types/file";
import { useAssistantStore } from "../stores/assistantStore";
import { useConversationStore } from "../stores/conversationStore";
import { ConversationManager } from "../services/ConversationManager";
import Logger from "../utils/logger";

export const useFileExplorer = () => {
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [directoryHandle, setDirectoryHandle] =
        useState<FileSystemDirectoryHandle | null>(null);
    const toast = useToast();

    const {
        setWorkspaceHandle,
        selectWorkspaceFolder,
        handleFileSelect: storeFileSelect,
        handleWorkspaceRead,
        handleFileDelete: storeFileDelete,
        unsavedFileIds,
        files,
        setFiles,
        workspaceHandle,
    } = useFileStore();

    const { selectedAssistant } = useAssistantStore();
    const { createNewConversation, showConversation } =
        useConversationStore();

    const processDirectory = useCallback(
        async (dirHandle: FileSystemDirectoryHandle, path: string = "") => {
            const filesInDir: FileItem[] = [];

            for await (const entry of dirHandle.values()) {
                const entryPath = path ? `${path}/${entry.name}` : entry.name;

                if (entry.kind === "file" && "getFile" in entry) {
                    if (
                        entry.name.endsWith(".md") &&
                        !entry.name.startsWith(".") &&
                        !path.startsWith("versions")
                    ) {
                        filesInDir.push({
                            id: crypto.randomUUID(),
                            name: entry.name,
                            path: entryPath,
                            file_type: "md",
                            file_category: entryPath.includes("references/")
                                ? "reference"
                                : "editable",
                            handle: entry as FileSystemFileHandle,
                            isReadOnly: entryPath.includes("references/"),
                        });
                    }
                } else if (
                    entry.kind === "directory" &&
                    "getDirectoryHandle" in entry
                ) {
                    const dirEntry = entry as FileSystemDirectoryHandle;
                    if (
                        !entry.name.startsWith(".") &&
                        entry.name !== "images" &&
                        entry.name !== "versions"
                    ) {
                        const subDirFiles = await processDirectory(
                            dirEntry,
                            entryPath
                        );
                        filesInDir.push(...subDirFiles);
                    }
                }
            }

            return filesInDir;
        },
        []
    );

    const handleFolderSelect = useCallback(async () => {
        try {
            const dirHandle = await selectWorkspaceFolder();
            if (!dirHandle) return;

            setDirectoryHandle(dirHandle);
            setWorkspaceHandle(dirHandle);

            const requiredFolders = ["references", "versions", "images"];
            const missingFolders: string[] = [];

            for (const folderName of requiredFolders) {
                try {
                    await dirHandle.getDirectoryHandle(folderName);
                } catch {
                    missingFolders.push(folderName);
                }
            }

            if (missingFolders.length > 0) {
                const shouldCreate = window.confirm(
                    `The following folders are missing:\n${missingFolders.join(
                        ", "
                    )}\n\nCreate them?`
                );

                if (shouldCreate) {
                    try {
                        for (const folderName of missingFolders) {
                            await dirHandle.getDirectoryHandle(folderName, {
                                create: true,
                            });
                        }
                        toast({
                            title: "Workspace initialized",
                            description: "Required folders created",
                            status: "success",
                            duration: 3000,
                        });
                    } catch (error) {
                        console.error("Error creating folders:", error);
                        toast({
                            title: "Error creating folders",
                            status: "error",
                            duration: 3000,
                        });
                        return;
                    }
                }
            }

            const processedFiles = await processDirectory(dirHandle);
            setFiles(processedFiles);
            handleWorkspaceRead();

            if (selectedAssistant) {
                const latestConversation =
                    await ConversationManager.getLatestConversation(
                        selectedAssistant.assistant_id
                    );
                if (latestConversation) {
                    showConversation(latestConversation);
                } else {
                    await createNewConversation(selectedAssistant.assistant_id);
                }
            }
        } catch (error) {
            console.error("Error reading directory:", error);
            toast({
                title: "Error reading workspace",
                status: "error",
                duration: 3000,
            });
        }
    }, [
        processDirectory,
        selectWorkspaceFolder,
        setWorkspaceHandle,
        handleWorkspaceRead,
        setFiles,
        toast,
        selectedAssistant,
        createNewConversation,
        showConversation,
    ]);

    const handleFileClick = useCallback(
        async (selectedFile: FileItem, e: React.MouseEvent) => {
            if ((e.target as HTMLElement).closest(".file-menu")) {
                return;
            }

            try {
                const fileData = await selectedFile.handle.getFile();
                const content = await fileData.text();
                setSelectedFileId(selectedFile.id);
                storeFileSelect(content, selectedFile);
            } catch (error) {
                console.error("Error reading file:", error);
                toast({
                    title: "Error reading file",
                    status: "error",
                    duration: 3000,
                });
            }
        },
        [storeFileSelect, toast]
    );

    const handleDelete = useCallback(
        async (file: FileItem) => {
            if (!workspaceHandle) return;

            try {
                await workspaceHandle.removeEntry(file.name);
                setFiles(files.filter((f) => f.id !== file.id));

                if (selectedFileId === file.id) {
                    setSelectedFileId(null);
                    storeFileDelete();
                }

                toast({
                    title: "File deleted",
                    status: "success",
                    duration: 2000,
                });
            } catch (error) {
                console.error("Error deleting file:", error);
                toast({
                    title: "Error deleting file",
                    status: "error",
                    duration: 3000,
                });
            }
        },
        [
            workspaceHandle,
            selectedFileId,
            storeFileDelete,
            files,
            setFiles,
            toast,
        ]
    );

    const getGroupedFiles = useCallback(() => {
        const editableFiles = files.filter((file) => !file.isReadOnly);
        const readOnlyFiles = files.filter((file) => file.isReadOnly);
        return { editableFiles, readOnlyFiles };
    }, [files]);

    const handleCreateFile = useCallback(
        async (fileName: string) => {
            if (!workspaceHandle) {
                toast({
                    title: "No workspace selected",
                    status: "error",
                    duration: 3000,
                });
                return false;
            }

            try {
                const fileHandle = await workspaceHandle.getFileHandle(
                    fileName,
                    {
                        create: true,
                    }
                );

                // Create new file object
                const newFile: FileItem = {
                    id: crypto.randomUUID(),
                    name: fileName,
                    path: fileName,
                    file_type: "md",
                    file_category: fileName.includes("references/")
                        ? "reference"
                        : "editable",
                    handle: fileHandle,
                    isReadOnly: false,
                };

                // Update files list
                setFiles([...files, newFile]);

                // Initialize empty content
                const writable = await (fileHandle as any).createWritable();
                await writable.write("");
                await writable.close();

                toast({
                    title: "File created",
                    status: "success",
                    duration: 2000,
                });
                return true;
            } catch (error) {
                console.error("Error creating file:", error);
                toast({
                    title: "Error creating file",
                    description: "Failed to create new file",
                    status: "error",
                    duration: 3000,
                });
                return false;
            }
        },
        [workspaceHandle, files, setFiles, toast]
    );

    const handleRenameFile = useCallback(
        async (file: FileItem, newName: string) => {
            if (!workspaceHandle) return false;

            try {
                // Get the new file handle
                const newFileHandle = await workspaceHandle.getFileHandle(
                    newName,
                    { create: true }
                );

                // Copy content from old file to new file
                const oldFile = await file.handle.getFile();
                const content = await oldFile.text();

                const writable = await (newFileHandle as any).createWritable();
                await writable.write(content);
                await writable.close();

                // Handle version files
                try {
                    const versionsHandle =
                        await workspaceHandle.getDirectoryHandle("versions");
                    const oldNameWithoutExt = file.name.replace(".md", "");
                    const newNameWithoutExt = newName.replace(".md", "");

                    // Rename all version files
                    for await (const entry of versionsHandle.values()) {
                        if (
                            entry.kind === "file" &&
                            entry.name.startsWith(oldNameWithoutExt + "-")
                        ) {
                            // Get version name and timestamp from old filename
                            const parts = entry.name.slice(0, -3).split("-"); // Remove .md and split
                            const versionParts = parts.slice(
                                oldNameWithoutExt.split("-").length
                            );

                            // Create new version filename
                            const newVersionName = `${newNameWithoutExt}-${versionParts.join(
                                "-"
                            )}.md`;

                            // Copy version file content
                            const versionFile = await (
                                entry as FileSystemFileHandle
                            ).getFile();
                            const versionContent = await versionFile.text();

                            // Create new version file
                            const newVersionHandle =
                                await versionsHandle.getFileHandle(
                                    newVersionName,
                                    { create: true }
                                );
                            const versionWritable =
                                await (newVersionHandle as any).createWritable();
                            await versionWritable.write(versionContent);
                            await versionWritable.close();

                            // Remove old version file
                            await versionsHandle.removeEntry(entry.name);
                        }
                    }
                } catch (error) {
                    console.error("Error renaming version files:", error);
                }

                // Remove the old file
                await workspaceHandle.removeEntry(file.name);

                // Update files list
                const newFile: FileItem = {
                    ...file,
                    name: newName,
                    path: newName,
                    handle: newFileHandle,
                };

                setFiles(files.map((f) => (f.id === file.id ? newFile : f)));

                toast({
                    title: "File renamed",
                    description: "All associated versions have been updated",
                    status: "success",
                    duration: 2000,
                });
                return true;
            } catch (error) {
                console.error("Error renaming file:", error);
                toast({
                    title: "Error renaming file",
                    status: "error",
                    duration: 3000,
                });
                return false;
            }
        },
        [workspaceHandle, files, setFiles, toast]
    );

    useEffect(() => {
        if (workspaceHandle && files.length === 0) {
            processDirectory(workspaceHandle).then((processedFiles) => {
                setFiles(processedFiles);
            });
        }
    }, [workspaceHandle, files.length, processDirectory, setFiles]);

    useEffect(() => {
        if (workspaceHandle && !directoryHandle) {
            setDirectoryHandle(workspaceHandle);
        }
    }, [workspaceHandle, directoryHandle]);

    return {
        files,
        selectedFileId,
        directoryHandle,
        unsavedFileIds,
        handleFolderSelect,
        handleFileClick,
        handleDelete,
        getGroupedFiles,
        handleCreateFile,
        handleRenameFile,
    };
};
