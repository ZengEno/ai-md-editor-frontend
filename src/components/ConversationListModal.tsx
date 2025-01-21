import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Box,
    Text,
    Button,
    VStack,
    Flex,
    IconButton,
    useToast,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { Conversation } from "../types/conversation";
import { useConversationStore } from "../stores/conversationStore";
import formatDistance from "date-fns/formatDistance";
import { useState, useEffect, useRef } from "react";

interface ConversationListModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
}

export function ConversationListModal({
    isOpen,
    onClose,
    conversations: initialConversations,
}: ConversationListModalProps) {
    const [conversations, setConversations] = useState(initialConversations);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const {
        showConversation,
        deleteConversation,
        deleteAllConversations,
    } = useConversationStore();
    const toast = useToast();
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setConversations(initialConversations);
    }, [initialConversations]);

    const handleDelete = async (id: string) => {
        try {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((conv) => conv.id !== id));
            toast({
                title: "Conversation deleted",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Failed to delete conversation",
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleDeleteAll = async () => {
        try {
            if (conversations.length === 0 || !conversations[0]?.assistant_id)
                return;

            await deleteAllConversations(conversations[0].assistant_id);
            setConversations([]);
            setIsDeleteAllOpen(false);
            toast({
                title: "All conversations deleted",
                status: "success",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Failed to delete conversations",
                status: "error",
                duration: 3000,
            });
        }
    };

    const formatTime = (timestamp: number) => {
        return formatDistance(timestamp, new Date(), { addSuffix: true });
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Flex justify="space-between" align="center">
                            <Text>Previous Conversations</Text>
                            {conversations.length > 0 && (
                                <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => setIsDeleteAllOpen(true)}
                                    leftIcon={<DeleteIcon />}
                                >
                                    Delete All
                                </Button>
                            )}
                        </Flex>
                    </ModalHeader>
                    <ModalBody>
                        <VStack spacing={2} align="stretch" mb={4}>
                            {conversations.map((conversation) => (
                                <Box
                                    key={conversation.id}
                                    p={3}
                                    borderWidth="1px"
                                    borderRadius="md"
                                    cursor="pointer"
                                    onClick={() => {
                                        showConversation(conversation);
                                        onClose();
                                    }}
                                    _hover={{ bg: "gray.50" }}
                                >
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        gap={4}
                                    >
                                        <Box flex={1}>
                                            <Flex
                                                justify="space-between"
                                                align="center"
                                                color="gray.500"
                                                fontSize="xs"
                                            >
                                                <Text>
                                                    Started{" "}
                                                    {formatTime(
                                                        conversation.startTime
                                                    )}
                                                </Text>
                                                <Text>
                                                    Last message{" "}
                                                    {formatTime(
                                                        conversation.lastUpdateTime
                                                    )}
                                                </Text>
                                            </Flex>
                                            <Text
                                                mt={1}
                                                noOfLines={2}
                                                fontSize="sm"
                                            >
                                                <Text
                                                    as="span"
                                                    color="gray.500"
                                                >
                                                    Last user message:
                                                </Text>{" "}
                                                {conversation.messages
                                                    .filter(
                                                        (message) =>
                                                            message.role ===
                                                            "user"
                                                    )
                                                    .slice(-1)[0]?.content ||
                                                    "Empty conversation"}
                                            </Text>
                                        </Box>
                                        <IconButton
                                            aria-label="Delete conversation"
                                            icon={<DeleteIcon />}
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(conversation.id);
                                            }}
                                        />
                                    </Flex>
                                </Box>
                            ))}
                            {conversations.length === 0 && (
                                <Text color="gray.500" textAlign="center">
                                    No previous conversations
                                </Text>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <AlertDialog
                isOpen={isDeleteAllOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteAllOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            Delete All Conversations
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure? This will delete all conversations for
                            this assistant. This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                ref={cancelRef}
                                onClick={() => setIsDeleteAllOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={handleDeleteAll}
                                ml={3}
                            >
                                Delete All
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
}
