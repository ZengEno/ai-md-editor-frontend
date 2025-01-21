import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APIClient } from "../services/APIClient";
import { Assistant } from "../types/assistant";

interface CreateAssistantParams {
    assistant_name: string;
    llm_provider: string;
}

export function useAssistants() {
    const queryClient = useQueryClient();

    const {
        data: assistants = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["assistants"],
        queryFn: async () => {
            const data = await APIClient.getAssistants();
            return data;
        },
        retry: false,
        onError: (error) => {
            console.error("Failed to fetch assistants:", error);
        },
    });

    const createAssistant = useMutation<any, Error, CreateAssistantParams>({
        mutationFn: (newAssistant) => APIClient.createAssistant(newAssistant),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assistants"] });
        },
    });

    const deleteAssistant = useMutation({
        mutationFn: (assistant_id: string) =>
            APIClient.deleteAssistant(assistant_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assistants"] });
        },
    });

    const updateAssistant = useMutation<
        any,
        Error,
        {
            assistant_id: string;
            assistant_name: string;
            reflections: {
                style_guidelines: string[];
                general_facts: string[];
            };
            user_defined_rules: string[];
        }
    >({
        mutationFn: (data) => APIClient.updateAssistant(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assistants"] });
        },
    });

    return {
        assistants,
        isLoading,
        createAssistant,
        deleteAssistant,
        updateAssistant,
        refetch,
    };
}
