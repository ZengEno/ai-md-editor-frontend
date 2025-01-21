export interface Assistant {
    user_id: string;
    assistant_id: string;
    assistant_name: string;
    llm_provider: string;
    reflections: {
        style_guidelines: string[];
        general_facts: string[];
    };
    user_defined_rules: string[];
} 