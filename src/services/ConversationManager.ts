import { Conversation } from "../types/conversation";
import { useFileStore } from "../stores/fileStore";

class ConversationManagerClass {
    private readonly fileName = "assistant_cache";

    private async getFileHandle(): Promise<FileSystemFileHandle | null> {
        const workspaceHandle = useFileStore.getState().workspaceHandle;
        if (!workspaceHandle) {
            return null;
        }

        try {
            return await workspaceHandle.getFileHandle(this.fileName, {
                create: true,
            });
        } catch (error) {
            console.error("Error getting file handle:", error);
            return null;
        }
    }

    async loadConversations(): Promise<Conversation[]> {
        const fileHandle = await this.getFileHandle();
        if (!fileHandle) return [];

        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            return content ? JSON.parse(content) : [];
        } catch (error) {
            console.error("Error loading conversations:", error);
            return [];
        }
    }

    // TODO: improve performance of this function
    // writable.close() takes a long time! It is fast when use VPN, slow when not.
    // And it's very fast when no internet! So wired!
    async saveConversations(conversations: Conversation[]): Promise<void> {
        const fileHandle = await this.getFileHandle();
        if (!fileHandle) return;

        try {
            const writable = await (fileHandle as any).createWritable();
            // Use TextEncoder for faster writing
            const encoder = new TextEncoder();
            const encodedContent = encoder.encode(
                JSON.stringify(conversations, null, 2)
            );

            await writable.write(encodedContent);
            await writable.close(); // this is the slow part
        } catch (error) {
            console.error("Error saving conversations:", error);
        }
    }

    async getConversationsByAssistant(
        assistantId: string
    ): Promise<Conversation[]> {
        const conversations = await this.loadConversations();
        return conversations
            .filter((conv) => conv.assistant_id === assistantId)
            .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
    }

    async getLatestConversation(
        assistantId: string
    ): Promise<Conversation | null> {
        const conversations = await this.getConversationsByAssistant(
            assistantId
        );
        if (conversations.length === 0) return null;

        // Sort by lastUpdateTime in descending order and take the first one
        return conversations.sort(
            (a, b) => b.lastUpdateTime - a.lastUpdateTime
        )[0];
    }
}

export const ConversationManager = new ConversationManagerClass();
