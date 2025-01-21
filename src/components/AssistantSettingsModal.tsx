import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Button,
    VStack,
    Text,
    Spinner,
    Box,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    IconButton,
    useToast,
    Flex,
    ModalFooter,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { CreateAssistantModal } from "./CreateAssistantModal";
import { AssistantDetailModal } from "./AssistantDetailModal";
import { useAssistants } from "../hooks/useAssistants";
import { DeleteIcon } from "@chakra-ui/icons";
import { useAssistantStore } from "../stores/assistantStore";
import { Assistant } from "../types/assistant";

interface AssistantSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assistants: Assistant[];
    loading: boolean;
    selectedAssistant: Assistant | null;
    onSelectAssistant: (assistant: Assistant) => void;
}

export function AssistantSettingsModal({
    isOpen,
    onClose,
    assistants,
    loading,
    selectedAssistant,
    onSelectAssistant,
}: AssistantSettingsModalProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteAssistantId, setDeleteAssistantId] = useState<string | null>(
        null
    );
    const { refetch, deleteAssistant } = useAssistants();
    const toast = useToast();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const { selectedAssistant: currentAssistant, clearSelectedAssistant } =
        useAssistantStore();

    const handleCreateSuccess = () => {
        refetch();
    };

    const handleDelete = async () => {
        try {
            await deleteAssistant.mutateAsync(deleteAssistantId!);
            if (currentAssistant?.assistant_id === deleteAssistantId) {
                clearSelectedAssistant();
            }
            toast({
                title: "Assistant deleted",
                status: "success",
                duration: 3000,
            });
        } catch (error: any) {
            toast({
                title: "Failed to delete assistant",
                description:
                    error.response?.data?.detail || "An error occurred",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setDeleteAssistantId(null);
        }
    };

    const handleSelectAssistant = (assistant: Assistant) => {
        onSelectAssistant(assistant);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Select Assistant</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            {loading ? (
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    p={4}
                                >
                                    <Spinner />
                                </Box>
                            ) : (
                                <>
                                    {assistants.map((assistant) => (
                                        <Box
                                            key={assistant.assistant_id}
                                            p={4}
                                            borderWidth="1px"
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() =>
                                                handleSelectAssistant(assistant)
                                            }
                                            bg={
                                                selectedAssistant?.assistant_id ===
                                                assistant.assistant_id
                                                    ? "blue.50"
                                                    : "white"
                                            }
                                            _hover={{
                                                bg:
                                                    selectedAssistant?.assistant_id ===
                                                    assistant.assistant_id
                                                        ? "blue.100"
                                                        : "gray.50",
                                            }}
                                            position="relative"
                                        >
                                            <IconButton
                                                aria-label="Delete assistant"
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                position="absolute"
                                                top={2}
                                                right={2}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteAssistantId(
                                                        assistant.assistant_id
                                                    );
                                                }}
                                            />
                                            <Text fontWeight="medium">
                                                {assistant.assistant_name}
                                            </Text>
                                            <Text
                                                fontSize="sm"
                                                color="gray.500"
                                            >
                                                Provider:{" "}
                                                {assistant.llm_provider}
                                            </Text>
                                        </Box>
                                    ))}
                                    <Button
                                        width="100%"
                                        onClick={() =>
                                            setIsCreateModalOpen(true)
                                        }
                                    >
                                        Create New Assistant
                                    </Button>
                                </>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <CreateAssistantModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <AlertDialog
                isOpen={!!deleteAssistantId}
                leastDestructiveRef={cancelRef}
                onClose={() => setDeleteAssistantId(null)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>Delete Assistant</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                ref={cancelRef}
                                onClick={() => setDeleteAssistantId(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleDelete}
                                ml={3}
                            >
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}
