import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    Button,
    Input,
    FormControl,
    FormLabel,
    Box,
    Text,
    Flex,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "../utils/dateUtils";
import { useVersion } from "../hooks/useVersion";

interface VersionModalProps {
    currentFile: {
        name: string;
        handle: FileSystemFileHandle;
        id: string;
        path: string;
    } | null;
    workspaceHandle: FileSystemDirectoryHandle | null;
    currentContent: string;
    onContentChange: (content: string) => void;
}

export const VersionModal = ({
    currentFile,
    workspaceHandle,
    currentContent,
    onContentChange,
}: VersionModalProps) => {
    const [newVersionName, setNewVersionName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        versions,
        isModalOpen,
        setModalOpen,
        handleCreateVersion,
        handleLoadVersions,
        handleDeleteVersion,
        handleVersionSelect,
    } = useVersion(currentFile, workspaceHandle, currentContent, onContentChange);

    // Load versions when modal opens
    useEffect(() => {
        if (isModalOpen) {
            handleLoadVersions();
        }
    }, [isModalOpen, handleLoadVersions]);

    const handleCreate = async () => {
        if (!newVersionName.trim()) return;

        const validName = /^[a-zA-Z0-9_-]+$/;
        if (!validName.test(newVersionName)) {
            return;
        }

        setIsLoading(true);
        const success = await handleCreateVersion(newVersionName);
        if (success) {
            setNewVersionName("");
        }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Version History</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <FormControl>
                        <FormLabel>Create New Version</FormLabel>
                        <Input
                            placeholder="Version name"
                            value={newVersionName}
                            onChange={(e) => setNewVersionName(e.target.value)}
                        />
                        <Button
                            mt={2}
                            colorScheme="blue"
                            onClick={handleCreate}
                            isLoading={isLoading}
                            isDisabled={!newVersionName.trim() || !/^[a-zA-Z0-9_-]+$/.test(newVersionName)}
                        >
                            Create Version
                        </Button>
                    </FormControl>

                    <VStack mt={6} align="stretch" spacing={2}>
                        <Text fontWeight="bold">Version History</Text>
                        {versions.map((version) => (
                            <Box
                                key={version.filePath}
                                p={3}
                                borderWidth={1}
                                borderRadius="md"
                                _hover={{ bg: "gray.50" }}
                                cursor="pointer"
                                onClick={() => handleVersionSelect(version)}
                            >
                                <Flex justify="space-between" align="center">
                                    <Box>
                                        <Text fontWeight="medium">
                                            {version.name}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            {formatRelativeTime(version.timestamp)}
                                        </Text>
                                    </Box>
                                    <Button
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteVersion(version);
                                        }}
                                        leftIcon={<DeleteIcon />}
                                    >
                                        Delete
                                    </Button>
                                </Flex>
                            </Box>
                        ))}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
