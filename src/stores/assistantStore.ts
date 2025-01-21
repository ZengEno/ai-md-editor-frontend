import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Assistant } from "../types/assistant";

interface AssistantStore {
    selectedAssistant: Assistant | null;
    setSelectedAssistant: (assistant: Assistant | null) => void;
    clearSelectedAssistant: () => void;
}

export const useAssistantStore = create<AssistantStore>()(
    persist(
        (set) => ({
            selectedAssistant: null,
            setSelectedAssistant: (assistant) =>
                set({ selectedAssistant: assistant }),
            clearSelectedAssistant: () => set({ selectedAssistant: null }),
        }),
        {
            name: "assistant-storage",
        }
    )
);
