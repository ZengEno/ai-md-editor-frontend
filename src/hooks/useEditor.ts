import { useCallback, useRef, useState, useEffect } from 'react';
import { useFileStore } from '../stores/fileStore';
import { useVersionStore } from '../stores/versionStore';

interface ImageMap {
    [key: string]: string; // Maps image paths to object URLs
}

export const useEditor = (
    content: string,
    onChange: (value: string) => void,
    currentFile: {
        name: string;
        handle: FileSystemFileHandle;
        id: string;
        path: string;
        isReadOnly?: boolean;
    } | null,
    onSave: () => void
) => {
    const [showPreview, setShowPreview] = useState(true);
    const [imageUrls, setImageUrls] = useState<ImageMap>({});
    const [imagesLoading, setImagesLoading] = useState(false);
    const editorRef = useRef<any>(null);
    
    const { workspaceHandle, setFileComparison, getFileComparison } = useFileStore();
    const { comparison, setComparison, setModalOpen } = useVersionStore();

    // Handle image loading
    useEffect(() => {
        const loadImages = async () => {
            if (!currentFile?.handle || !workspaceHandle) return;
            setImagesLoading(true);

            try {
                let imagesHandle;
                if (currentFile.isReadOnly) {
                    const refFolderName = currentFile.path.split("/")[1];
                    try {
                        const refHandle = await workspaceHandle.getDirectoryHandle("references");
                        const refFolderHandle = await refHandle.getDirectoryHandle(refFolderName);
                        imagesHandle = await refFolderHandle.getDirectoryHandle("images");
                    } catch (error) {
                        console.log("No specific images folder found for reference:", refFolderName);
                    }
                }

                if (!imagesHandle) {
                    try {
                        imagesHandle = await workspaceHandle.getDirectoryHandle("images");
                    } catch (error) {
                        console.log("No root images folder found");
                        return;
                    }
                }

                const imageRegex = /!\[\]\((images\/[^)]+)\)/g;
                const matches = [...content.matchAll(imageRegex)];
                const newImageUrls: ImageMap = {};

                for (const match of matches) {
                    const imagePath = match[1];
                    const imageName = imagePath.split("/")[1];

                    try {
                        const imageHandle = await imagesHandle.getFileHandle(imageName);
                        const imageFile = await imageHandle.getFile();
                        const objectUrl = URL.createObjectURL(imageFile);
                        newImageUrls[imagePath] = objectUrl;
                    } catch (error) {
                        console.log("Failed to load image:", imageName);
                    }
                }

                Object.values(imageUrls).forEach(URL.revokeObjectURL);
                setImageUrls(newImageUrls);
            } catch (error) {
                console.error("Error loading images:", error);
            } finally {
                setImagesLoading(false);
            }
        };

        loadImages();

        return () => {
            Object.values(imageUrls).forEach(URL.revokeObjectURL);
        };
    }, [content, currentFile, workspaceHandle]);

    // Handle version comparison
    useEffect(() => {
        if (currentFile) {
            const savedComparison = getFileComparison(currentFile.id);
            setComparison(savedComparison);
        } else {
            setComparison(null);
        }
    }, [currentFile, getFileComparison, setComparison]);

    useEffect(() => {
        if (currentFile) {
            setFileComparison(currentFile.id, comparison);
        }
    }, [comparison, currentFile, setFileComparison]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        onChange(value || "");
    }, [onChange]);

    const handleEditorMount = useCallback((editor: any) => {
        editorRef.current = editor;
    }, []);

    const handlePreviewSelect = useCallback(() => {
        const selection = window.getSelection()?.toString().trim();
        if (!selection || !editorRef.current) return;

        const model = editorRef.current.getModel();
        if (!model) return;

        const text = model.getValue();
        const index = text.indexOf(selection);

        if (index !== -1) {
            const startPos = model.getPositionAt(index);
            const endPos = model.getPositionAt(index + selection.length);

            editorRef.current.setSelection({
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column,
            });
            editorRef.current.revealLineInCenter(startPos.lineNumber);
        }
    }, []);

    const handleAcceptChanges = useCallback(async () => {
        if (!comparison) return;
        onChange(comparison.content);
        setComparison(null);
    }, [comparison, onChange, setComparison]);

    return {
        showPreview,
        setShowPreview,
        imageUrls,
        imagesLoading,
        editorRef,
        comparison,
        workspaceHandle,
        setModalOpen,
        setComparison,
        handleEditorMount,
        handleEditorChange,
        handlePreviewSelect,
        handleAcceptChanges,
    };
}; 