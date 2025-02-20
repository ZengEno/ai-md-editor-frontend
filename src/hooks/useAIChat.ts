import { useState, useCallback, useEffect } from "react";
import { APIClient } from "../services/APIClient";
import { useFileStore } from "../stores/fileStore";
import { useToast } from "@chakra-ui/react";
import { useEditor } from "../hooks/useEditor";
import { ChatMessage, ChatRequest, HighlightData } from "../types/chat";
import { useConversationStore } from "../stores/conversationStore";
import { ConversationMessage } from "../types/conversation";
import { ArticleReference } from "../types/chat";
import Logger from "../utils/logger";
import { EditParser } from "../utils/editParser";

export const useAIChat = () => {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const { currentConversation, addMessage } = useConversationStore();

    const { currentFile, getCurrentContent, editorRef } = useFileStore();
    const fileStore = useFileStore();

    const [otherArticles, setOtherArticles] = useState<ArticleReference[]>([]);
    const [referenceArticles, setReferenceArticles] = useState<
        ArticleReference[]
    >([]);

    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] =
        useState<ConversationMessage | null>(null);

    const getHighlightData = useCallback((): HighlightData => {
        const editor = editorRef?.current;
        if (!editor) return { text: "", start_line: 0, end_line: 0 };

        const selection = editor.getSelection();
        if (!selection) return { text: "", start_line: 0, end_line: 0 };

        const model = editor.getModel();
        if (!model) return { text: "", start_line: 0, end_line: 0 };

        return {
            text: model.getValueInRange(selection),
            start_line: selection.startLineNumber,
            end_line: selection.endLineNumber,
        };
    }, [editorRef]);

    const sendMessage = useCallback(
        async (assistantId: string) => {
            if (!input.trim() || !currentFile) {
                Logger.debug("Missing input or file", { input, currentFile });
                return;
            }

            const userMessage: ConversationMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: input,
                timestamp: Date.now(),
            };

            const assistantMessage: ConversationMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
                think_content: "",
                edited_article: "",
                timestamp: Date.now(),
            };

            // Store original content before streaming
            const originalContent = getCurrentContent();

            const handleStreamUpdate = (data: any) => {
                if (data.type === "stream") {
                    const updatedMessage = {
                        ...assistantMessage,
                        content:
                            assistantMessage.content +
                            (data.content_chunk || ""),
                        think_content:
                            assistantMessage.think_content +
                            (data.think_content_chunk || ""),
                        edited_article:
                            assistantMessage.edited_article +
                            (data.edited_article_chunk || ""),
                    };

                    setStreamingMessage(updatedMessage);
                    assistantMessage.content = updatedMessage.content;
                    assistantMessage.think_content =
                        updatedMessage.think_content;
                    assistantMessage.edited_article =
                        updatedMessage.edited_article;
                } else if (data.type === "stream_end") {
                    let finalMessage = {
                        ...assistantMessage,
                        edited_article_related_to:
                            data.edited_article_related_to,
                        other_data: data.other_data,
                    };

                    // Process line edits if they exist
                    if (
                        assistantMessage.edited_article &&
                        assistantMessage.edited_article.trim()
                    ) {
                        try {
                            const lineEdits = EditParser.parseLineEdits(
                                assistantMessage.edited_article
                            );
                            const processedContent = EditParser.applyEdits(
                                originalContent,
                                lineEdits
                            );
                            finalMessage.edited_article = processedContent;
                        } catch (error) {
                            Logger.error("Error processing line edits:", error);
                            // Keep the original edited_article if processing fails
                        }
                    }

                    // Cleanup and add final message
                    setStreamingMessage(null);
                    addMessage(finalMessage);
                    APIClient.unsubscribeFromStream(handleStreamUpdate);
                    setIsStreaming(false);
                    setIsLoading(false);
                }
            };

            try {
                setIsLoading(true);
                setIsStreaming(true);
                await addMessage(userMessage);
                setInput("");

                // Load content for other articles
                const loadedOtherArticles = await Promise.all(
                    otherArticles
                        .filter((ref) => ref.id !== currentFile.id)
                        .map(async (ref) => ({
                            file_name: ref.file_name,
                            content: await fileStore.getFileContent(ref.id),
                            file_category: ref.file_category,
                        }))
                );

                // Load content for reference articles
                const loadedReferenceArticles = await Promise.all(
                    referenceArticles
                        .filter((ref) => ref.id !== currentFile.id)
                        .map(async (ref) => ({
                            file_name: ref.file_name,
                            content: await fileStore.getFileContent(ref.id),
                            file_category: ref.file_category,
                        }))
                );

                const messages = currentConversation?.messages || [];

                // Create stream request
                const streamRequest = {
                    type: "stream",
                    assistant_id: assistantId,
                    messages: messages.concat(userMessage).map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    article: {
                        file_name: currentFile.name,
                        content: getCurrentContent(),
                        file_category: currentFile.file_category,
                    },
                    highlight_data: getHighlightData(),
                    other_articles: loadedOtherArticles,
                    reference_articles: loadedReferenceArticles,
                    config: {},
                };

                // Connect WebSocket if not connected
                if (!APIClient.isWebSocketConnected()) {
                    await APIClient.connectWebSocket();
                }

                // Subscribe to stream updates
                APIClient.subscribeToStream(handleStreamUpdate);

                // Send the stream request
                await APIClient.sendStreamRequest(streamRequest);
            } catch (error: unknown) {
                setStreamingMessage(null);
                Logger.error("Error sending message", error);
                toast({
                    title: "Error",
                    description:
                        error instanceof Error
                            ? error.message
                            : "Failed to send message",
                    status: "error",
                    duration: 5000,
                });
                setInput(userMessage.content);
                APIClient.unsubscribeFromStream(handleStreamUpdate);
            }
        },
        [
            input,
            currentFile,
            getCurrentContent,
            getHighlightData,
            toast,
            addMessage,
            currentConversation,
            otherArticles,
            referenceArticles,
            fileStore,
        ]
    );

    // Cleanup WebSocket connection on unmount
    useEffect(() => {
        return () => {
            // Cleanup any active WebSocket connection
            if (APIClient.isWebSocketConnected()) {
                APIClient.disconnectWebSocket();
            }
        };
    }, []);

    return {
        messages: currentConversation?.messages || [],
        input,
        isLoading,
        setInput,
        sendMessage,
        otherArticles,
        setOtherArticles,
        referenceArticles,
        setReferenceArticles,
        isStreaming,
        streamingMessage,
    };
};
