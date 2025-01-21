import { create } from 'zustand';

interface EditedArticleStore {
    editedContent: string | null;
    isShowingEdit: boolean;
    setEditedContent: (content: string | null) => void;
    setIsShowingEdit: (showing: boolean) => void;
    clearEdit: () => void;
}

export const useEditedArticleStore = create<EditedArticleStore>((set) => ({
    editedContent: null,
    isShowingEdit: false,
    setEditedContent: (content) => set({ editedContent: content }),
    setIsShowingEdit: (showing) => set({ isShowingEdit: showing }),
    clearEdit: () => set({ editedContent: null, isShowingEdit: false }),
}));