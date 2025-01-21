import { Button, HStack, Tooltip } from "@chakra-ui/react";
import { AddIcon, TimeIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { ConversationListModal } from "./ConversationListModal";
import { useConversationStore } from "../stores/conversationStore";
import { ConversationManager } from "../services/ConversationManager";
import { Conversation } from "../types/conversation";

interface ConversationControlsProps {
    assistantId: string;
}

export function ConversationControls({
    assistantId,
}: ConversationControlsProps) {
    const [isListOpen, setIsListOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { createNewConversation } = useConversationStore();

    const handleShowPrevious = async () => {
        const assistantConversations =
            await ConversationManager.getConversationsByAssistant(assistantId);
        setConversations(assistantConversations);
        setIsListOpen(true);
    };

    return (
        <>
            <HStack spacing={2}>
                <Tooltip label="Create a new conversation">
                    <Button
                        size="sm"
                        onClick={() => createNewConversation(assistantId)}
                        justifyContent="center"
                    >
                        <AddIcon />
                    </Button>
                </Tooltip>
                <Tooltip label="Show previous conversations">
                    <Button
                        size="sm"
                        onClick={handleShowPrevious}
                        justifyContent="center"
                    >
                        <TimeIcon />
                    </Button>
                </Tooltip>
            </HStack>

            <ConversationListModal
                isOpen={isListOpen}
                onClose={() => setIsListOpen(false)}
                conversations={conversations}
            />
        </>
    );
}
