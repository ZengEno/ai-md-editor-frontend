import {
    VStack,
    Input,
    Button,
    Box,
    Text,
    Spinner,
    Flex,
    Heading,
    IconButton,
    Textarea,
    Tooltip,
} from "@chakra-ui/react";
import { useAIChat } from "../hooks/useAIChat";
import { useState, useEffect, useRef, useCallback } from "react";
import { Settings, InfoIcon } from "lucide-react";
import { AssistantSettingsModal } from "./AssistantSettingsModal";
import { useAssistants } from "../hooks/useAssistants";
import { useAssistantStore } from "../stores/assistantStore";
import { AssistantDetailModal } from "./AssistantDetailModal";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useFileStore } from "../stores/fileStore";
import { useEditedArticleStore } from "../stores/editedArticleStore";
import { ContextBoard } from "./ContextBoard";
import { ConversationControls } from "./ConversationControls";
import { useConversationStore } from "../stores/conversationStore";
import { formatDistance } from "date-fns";
import { ArticleReference } from "../types/chat";
import { SuggestedChangeViewer } from "./SuggestedChangeViewer";
import DiffViewer from "./DiffViewer";
import { ConversationManager } from "../services/ConversationManager";

const ThinkContent = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const maxCollapsedHeight = 100; // Using number for comparison

    useEffect(() => {
        if (contentRef.current) {
            setNeedsExpansion(
                contentRef.current.scrollHeight > maxCollapsedHeight
            );
        }
    }, [content]);

    return (
        <Box
            bg="gray.100"
            p={2}
            borderRadius="md"
            borderLeft="4px solid"
            borderColor="gray.200"
        >
            <Text fontSize="sm" color="gray.600" fontStyle="italic" mb={1}>
                Thinking process:
            </Text>
            <Box
                ref={contentRef}
                fontSize="sm"
                color="gray.700"
                maxH={isExpanded ? "none" : `${maxCollapsedHeight}px`}
                overflowY="auto"
                transition="max-height 0.2s ease-in-out"
                mb={needsExpansion ? 2 : 0}
                css={{
                    "&::-webkit-scrollbar": {
                        width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                        width: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "gray.200",
                        borderRadius: "24px",
                    },
                }}
            >
                <Text whiteSpace="pre-wrap">{content}</Text>
            </Box>
            {needsExpansion && (
                <Button
                    variant="ghost"
                    size="xs"
                    width="100%"
                    height="20px"
                    onClick={() => setIsExpanded(!isExpanded)}
                    rightIcon={
                        isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />
                    }
                    _hover={{ bg: "gray.100" }}
                >
                    {isExpanded ? "Show less" : "Show more"}
                </Button>
            )}
        </Box>
    );
};

const MessageContent = ({
    content,
    getCurrentContent,
    currentFileName,
    edited_article,
    edited_article_related_to,
}: {
    content: string;
    getCurrentContent: () => string;
    currentFileName?: string;
    edited_article?: string;
    edited_article_related_to?: string;
}) => {
    // Parse content for <edited_content> tags
    const parts = content.split(/<edited_content>|<\/edited_content>/);

    return (
        <>
            {parts.map((part, index) => {
                if (index % 2 === 0) {
                    // Regular text content
                    return <Text key={index}>{part}</Text>;
                } else {
                    // Edited content - render SuggestedChangeViewer
                    return (
                        <SuggestedChangeViewer
                            key={index}
                            originalContent={getCurrentContent()}
                            editedContent={edited_article || ""}
                            relatedFileName={edited_article_related_to || ""}
                            isHidden={
                                edited_article_related_to !== currentFileName
                            }
                        />
                    );
                }
            })}
        </>
    );
};

export function AIChatPanel() {
    const {
        messages,
        input,
        isLoading,
        setInput,
        sendMessage,
        otherArticles,
        setOtherArticles,
        referenceArticles,
        setReferenceArticles,
    } = useAIChat();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { assistants, isLoading: isLoadingAssistants } = useAssistants();
    const { selectedAssistant, setSelectedAssistant } = useAssistantStore();
    const {
        hasWorkspace,
        handleContentChange,
        currentFile,
        editorRef,
        getCurrentContent,
    } = useFileStore();
    const { currentConversation, showLatestConversation } =
        useConversationStore();
    const [editingMessageId, setEditingMessageId] = useState<string | null>(
        null
    );
    const { setEditedContent, setIsShowingEdit } = useEditedArticleStore();
    const [highlightedText, setHighlightedText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
        }
    }, []);

    // Scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [currentConversation?.messages, scrollToBottom]);

    useEffect(() => {
        const editor = editorRef?.current;
        if (!editor) return;

        const updateHighlight = () => {
            const selection = editor.getSelection();
            if (!selection) {
                setHighlightedText("");
                return;
            }

            const model = editor.getModel();
            if (!model) return;

            const text = model.getValueInRange(selection);
            setHighlightedText(text);
        };

        editor.onDidChangeCursorSelection(updateHighlight);
        return () => {
            editor.dispose();
        };
    }, [editorRef]);

    useEffect(() => {
        if (selectedAssistant) {
            showLatestConversation(selectedAssistant.assistant_id);
        }
    }, [selectedAssistant?.assistant_id]);

    const handleSendMessage = () => {
        if (!selectedAssistant) {
            console.log("No assistant selected");
            return;
        }
        sendMessage(selectedAssistant.assistant_id);
    };

    const handleAcceptChanges = (editedContent: string) => {
        handleContentChange(editedContent);
        setEditingMessageId(null);
    };

    const handleCloseEdit = () => {
        setEditingMessageId(null);
    };

    const handleShowEdit = (editedArticle: string) => {
        setEditedContent(editedArticle);
        setIsShowingEdit(true);
    };

    const formatTime = (timestamp: number) => {
        return formatDistance(timestamp, new Date(), { addSuffix: true });
    };

    // Convert currentFile to ArticleReference
    const currentFileReference = currentFile
        ? {
              file_name: currentFile.name,
              file_category: currentFile.file_category,
              path: currentFile.path,
              id: currentFile.id,
          }
        : null;

    // Determine if input should be disabled
    const isInputDisabled =
        isLoading || !currentConversation || !currentFile || !hasWorkspace;

    // Add placeholder text based on state
    const getPlaceholderText = () => {
        if (!hasWorkspace) return "Please load a workspace first";
        if (!currentFile) return "Please select a file to edit";
        if (!currentConversation)
            return "Please select or create a conversation";
        return "Ask AI for help...";
    };

    return (
        <Flex direction="column" h="100%">
            <Box flexShrink={0}>
                <Flex
                    p={4}
                    borderBottomWidth={1}
                    direction="column"
                    gap={2}
                    bg="gray.50"
                >
                    <Flex alignItems="center" justifyContent="space-between">
                        <Flex
                            flex={1}
                            cursor="pointer"
                            onClick={() => setIsSettingsOpen(true)}
                            alignItems="center"
                            gap={2}
                            _hover={{ color: "blue.500" }}
                            transition="color 0.2s"
                        >
                            <ChevronDownIcon />
                            {selectedAssistant ? (
                                <Text fontWeight="medium">
                                    {selectedAssistant.assistant_name}
                                </Text>
                            ) : (
                                <Text color="gray.500">
                                    Select an Assistant
                                </Text>
                            )}
                        </Flex>
                        {selectedAssistant && (
                            <Tooltip
                                label="View Assistant Details"
                                aria-label="A tooltip"
                            >
                                <IconButton
                                    aria-label="Assistant details"
                                    icon={<InfoIcon />}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsDetailOpen(true)}
                                />
                            </Tooltip>
                        )}
                    </Flex>

                    {/* conversation control toolbar */}
                    {selectedAssistant && (
                        <ConversationControls
                            assistantId={selectedAssistant.assistant_id}
                        />
                    )}
                </Flex>
            </Box>

            {!selectedAssistant ? (
                <Flex
                    p={4}
                    justify="center"
                    align="center"
                    flex={1}
                    color="gray.500"
                >
                    Please select an assistant
                </Flex>
            ) : (
                <Flex direction="column" flex={1} minH={0}>
                    {/* conversation messages */}
                    <Box
                        ref={messagesContainerRef}
                        flex={1}
                        overflowY="auto"
                        p={4}
                    >
                        {currentConversation?.messages.map((message) => (
                            <Box
                                key={message.id}
                                bg={
                                    message.role === "assistant"
                                        ? "gray.50"
                                        : "blue.50"
                                }
                                p={2}
                                mb={2}
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                {message.role === "assistant" &&
                                    message.think_content && (
                                        <ThinkContent
                                            content={message.think_content}
                                        />
                                    )}

                                <MessageContent
                                    content={message.content}
                                    getCurrentContent={getCurrentContent}
                                    currentFileName={currentFile?.name}
                                    edited_article={message.edited_article}
                                    edited_article_related_to={
                                        message.edited_article_related_to
                                    }
                                />
                            </Box>
                        ))}
                        {isLoading && (
                            <Box textAlign="center" py={2}>
                                <Spinner size="sm" color="blue.500" />
                            </Box>
                        )}
                        <Box ref={messagesEndRef} />
                    </Box>

                    {/* context board and input */}
                    <Box
                        p={4}
                        borderTop="1px"
                        borderColor="gray.200"
                        bg="white"
                        flexShrink={0}
                    >
                        <ContextBoard
                            currentFile={currentFileReference}
                            highlightedText={highlightedText}
                            otherArticles={otherArticles}
                            referenceArticles={referenceArticles}
                            onUpdateOtherArticles={setOtherArticles}
                            onUpdateReferenceArticles={setReferenceArticles}
                        />
                        <Textarea
                            value={input}
                            onChange={(e) => {
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                                setInput(e.target.value);
                            }}
                            placeholder={getPlaceholderText()}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            isDisabled={isInputDisabled}
                            minHeight="50px"
                            maxHeight="200px"
                            resize="none"
                            overflow="auto"
                        />
                        <Button
                            mt={2}
                            w="100%"
                            colorScheme="blue"
                            onClick={handleSendMessage}
                            isLoading={isLoading}
                            isDisabled={isInputDisabled}
                        >
                            Send
                        </Button>
                    </Box>
                </Flex>
            )}

            <AssistantSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                assistants={assistants}
                loading={isLoadingAssistants}
                selectedAssistant={selectedAssistant}
                onSelectAssistant={setSelectedAssistant}
            />

            {selectedAssistant && (
                <AssistantDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    assistant={selectedAssistant}
                />
            )}
        </Flex>
    );
}
