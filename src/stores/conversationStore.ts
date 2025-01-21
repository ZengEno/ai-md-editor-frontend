import { create } from "zustand";
import { Conversation, ConversationMessage } from "../types/conversation";
import { ConversationManager } from "../services/ConversationManager";

interface ConversationStore {
    currentConversation: Conversation | null;
    createNewConversation: (assistantId: string) => Promise<void>;
    showConversation: (conversation: Conversation) => void;
    showLatestConversation: (assistantId: string) => Promise<void>;
    deleteConversation: (id: string) => Promise<void>;
    addMessage: (message: ConversationMessage) => Promise<void>;
    clearCurrentConversation: () => void;
    saveCurrentConversation: () => Promise<void>;
    deleteAllConversations: (assistantId: string) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
    currentConversation: null,

    showConversation: (conversation: Conversation) => {
        set({ currentConversation: conversation });
    },

    showLatestConversation: async (assistantId: string) => {
        const latestConversation =
            await ConversationManager.getLatestConversation(assistantId);
        if (latestConversation) {
            get().showConversation(latestConversation);
        } else {
            await get().createNewConversation(assistantId);
        }
    },

    createNewConversation: async (assistantId: string) => {
        const newConversation: Conversation = {
            id: crypto.randomUUID(),
            assistant_id: assistantId,
            messages: [],
            startTime: Date.now(),
            lastUpdateTime: Date.now(),
        };

        // Save to file first
        const conversations = await ConversationManager.loadConversations();
        await ConversationManager.saveConversations([
            ...conversations,
            newConversation,
        ]);

        set({ currentConversation: newConversation });
    },

    saveCurrentConversation: async () => {
        const current = get().currentConversation;
        if (!current) return;

        const conversations = await ConversationManager.loadConversations();
        const updatedConversations = conversations.map((conv) =>
            conv.id === current.id ? current : conv
        );

        if (!conversations.find((conv) => conv.id === current.id)) {
            updatedConversations.push(current);
        }

        await ConversationManager.saveConversations(updatedConversations);
    },

    clearCurrentConversation: () => {
        set({ currentConversation: null });
    },

    deleteConversation: async (id: string) => {
        const conversations = await ConversationManager.loadConversations();
        const updatedConversations = conversations.filter(
            (conv) => conv.id !== id
        );
        await ConversationManager.saveConversations(updatedConversations);

        if (get().currentConversation?.id === id) {
            set({ currentConversation: null });
        }
    },

    addMessage: async (message: ConversationMessage) => {
        const current = get().currentConversation;
        if (!current) return;

        const updatedConversation: Conversation = {
            ...current,
            messages: [...current.messages, message],
            lastUpdateTime: Date.now(),
        };

        const conversations = await ConversationManager.loadConversations();
        const updatedConversations = conversations.map((conv) =>
            conv.id === current.id ? updatedConversation : conv
        );

        await ConversationManager.saveConversations(updatedConversations);
        set({ currentConversation: updatedConversation });
    },

    deleteAllConversations: async (assistantId: string) => {
        const conversations = await ConversationManager.loadConversations();
        const remainingConversations = conversations.filter(
            (conv) => conv.assistant_id !== assistantId
        );
        await ConversationManager.saveConversations(remainingConversations);
        if (get().currentConversation?.assistant_id === assistantId) {
            set({ currentConversation: null });
        }
    },
}));
