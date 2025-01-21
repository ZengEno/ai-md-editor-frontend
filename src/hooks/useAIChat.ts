import { useState, useCallback } from "react";
import { APIClient } from "../services/APIClient";
import { useFileStore } from "../stores/fileStore";
import { useToast } from "@chakra-ui/react";
import { useEditor } from "../hooks/useEditor";
import { ChatMessage, ChatRequest, HighlightData } from "../types/chat";
import { useConversationStore } from "../stores/conversationStore";
import { ConversationMessage } from "../types/conversation";
import { ArticleReference } from "../types/chat";
import Logger from "../utils/logger";

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

            try {
                setIsLoading(true);
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

                const requestData: ChatRequest = {
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

                const response = await APIClient.chatWithAssistant(requestData);

                const assistantMessage: ConversationMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: response.content,
                    edited_article: response.edited_article,
                    edited_article_related_to:
                        response.edited_article_related_to,
                    other_data: response.other_data,
                    timestamp: Date.now(),
                };

                await addMessage(assistantMessage);
            } catch (error: unknown) {
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
            } finally {
                setIsLoading(false);
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
    };
};
