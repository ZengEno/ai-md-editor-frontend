import { ChatMessage } from './chat';

export interface ConversationMessage extends ChatMessage {
    timestamp: number;  // Unix timestamp
}

export interface Conversation {
    id: string;
    assistant_id: string;
    messages: ConversationMessage[];
    startTime: number;
    lastUpdateTime: number;
} 