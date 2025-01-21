export interface ArticleReference {
    file_name: string;
    file_category: "editable" | "reference";
    path: string;
    id: string;
}

export interface ArticleData {
    file_name: string;
    content: string;
    file_category: "editable" | "reference";
}

export interface HighlightData {
    text: string;
    start_line: number;
    end_line: number;
}

export interface ChatRequest {
    assistant_id: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
    highlight_data: HighlightData;
    article: ArticleData;
    other_articles: ArticleData[];
    reference_articles: ArticleData[];
    config?: Record<string, any>;
}

export interface ChatResponse {
    assistant_id: string;
    role: "assistant";
    content: string;
    edited_article?: string;
    edited_article_related_to?: string;
    other_data?: Record<string, any>;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    edited_article?: string;
    edited_article_related_to?: string;
    other_data?: Record<string, any>;
}

export interface StreamResponse {
    assistant_id: string;
    assistant_status: string;
    role: string;
    content_chunk: string;
    edited_article_chunk: string;
    edited_article_related_to: string;
    other_data: Record<string, any>;
}
