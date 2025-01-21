import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    Checkbox,
    Text,
    Box,
    HStack,
    Tooltip,
} from "@chakra-ui/react";
import { useFileStore } from "../stores/fileStore";
import { ArticleReference } from "../types/chat";
import { useState, useEffect } from "react";

interface ContextFileSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (files: ArticleReference[]) => void;
    currentSelectedFiles: ArticleReference[];
    currentFileId: string | null;
    currentFile: ArticleReference | null;
}

export function ContextFileSelector({
    isOpen,
    onClose,
    onSelect,
    currentSelectedFiles,
    currentFileId,
    currentFile,
}: ContextFileSelectorProps) {
    const { files } = useFileStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(currentSelectedFiles.map((f) => f.id))
    );

    // Update selected files when currentSelectedFiles changes
    useEffect(() => {
        setSelectedIds(new Set(currentSelectedFiles.map((f) => f.id)));
    }, [currentSelectedFiles]);

    // Group files by category (including current file)
    const editableFiles = files.filter((f) => f.file_category === "editable");
    const referenceFiles = files.filter((f) => f.file_category === "reference");

    const handleToggleFile = (fileId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedIds(newSelected);
    };

    const handleCheckAllWorkspace = () => {
        const newSelected = new Set(selectedIds);
        editableFiles.forEach((file) => newSelected.add(file.id));
        setSelectedIds(newSelected);
    };

    const handleUncheckAllWorkspace = () => {
        const newSelected = new Set(selectedIds);
        editableFiles.forEach((file) => newSelected.delete(file.id));
        setSelectedIds(newSelected);
    };

    const handleCheckAllReferences = () => {
        const newSelected = new Set(selectedIds);
        referenceFiles.forEach((file) => newSelected.add(file.id));
        setSelectedIds(newSelected);
    };

    const handleUncheckAllReferences = () => {
        const newSelected = new Set(selectedIds);
        referenceFiles.forEach((file) => newSelected.delete(file.id));
        setSelectedIds(newSelected);
    };

    const handleConfirm = () => {
        const selectedFiles: ArticleReference[] = files
            .filter((file) => selectedIds.has(file.id))
            .map((file) => ({
                file_name: file.name,
                file_category: file.file_category,
                path: file.path,
                id: file.id,
            }));
        onSelect(selectedFiles);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select Context Files</ModalHeader>
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        {/* Current File Section */}
                        {currentFile && (
                            <Box>
                                <Text fontWeight="medium" mb={2}>
                                    Current File
                                </Text>
                                <Checkbox
                                    isChecked={selectedIds.has(currentFile.id)}
                                    onChange={() =>
                                        handleToggleFile(currentFile.id)
                                    }
                                >
                                    <Tooltip label={currentFile.path}>
                                        <Text>{currentFile.file_name}</Text>
                                    </Tooltip>
                                </Checkbox>
                            </Box>
                        )}

                        {/* Editable Files Section */}
                        <Box>
                            <HStack justify="space-between" mb={2}>
                                <Text fontWeight="medium">Workspace Files</Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="xs"
                                        onClick={handleCheckAllWorkspace}
                                    >
                                        Check All
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={handleUncheckAllWorkspace}
                                    >
                                        Uncheck All
                                    </Button>
                                </HStack>
                            </HStack>
                            {editableFiles.length === 0 ? (
                                <Text color="gray.500" fontSize="sm">
                                    No workspace files available
                                </Text>
                            ) : (
                                <VStack align="stretch">
                                    {editableFiles.map((file) => (
                                        <Checkbox
                                            key={file.id}
                                            isChecked={selectedIds.has(file.id)}
                                            onChange={() =>
                                                handleToggleFile(file.id)
                                            }
                                        >
                                            <Tooltip label={file.path}>
                                                <Text>{file.name}</Text>
                                            </Tooltip>
                                        </Checkbox>
                                    ))}
                                </VStack>
                            )}
                        </Box>

                        {/* Reference Files Section */}
                        <Box>
                            <HStack justify="space-between" mb={2}>
                                <Text fontWeight="medium">Reference Files</Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="xs"
                                        onClick={handleCheckAllReferences}
                                    >
                                        Check All
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={handleUncheckAllReferences}
                                    >
                                        Uncheck All
                                    </Button>
                                </HStack>
                            </HStack>
                            {referenceFiles.length === 0 ? (
                                <Text color="gray.500" fontSize="sm">
                                    No reference files available
                                </Text>
                            ) : (
                                <VStack align="stretch">
                                    {referenceFiles.map((file) => (
                                        <Checkbox
                                            key={file.id}
                                            isChecked={selectedIds.has(file.id)}
                                            onChange={() =>
                                                handleToggleFile(file.id)
                                            }
                                        >
                                            <Tooltip label={file.path}>
                                                <Text>{file.name}</Text>
                                            </Tooltip>
                                        </Checkbox>
                                    ))}
                                </VStack>
                            )}
                        </Box>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleConfirm}>
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
