import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAssistantStore } from "./assistantStore";

interface User {
    id: string;
    email: string;
    nickname: string;
    created_at?: string;
    last_login?: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiration: number | null;
    refreshTokenExpiration: number | null;
    isAuthenticated: boolean;
    sessionExpired: boolean;
    setAuth: (
        user: User,
        accessToken: string,
        refreshToken: string,
        accessExpiration: number,
        refreshExpiration: number
    ) => void;
    updateAccessToken: (token: string, expiration: number) => void;
    updateUser: (userData: Partial<User>) => void;
    logout: () => void;
    setSessionExpired: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            accessTokenExpiration: null,
            refreshTokenExpiration: null,
            isAuthenticated: false,
            sessionExpired: false,
            setAuth: (
                user,
                accessToken,
                refreshToken,
                accessExpiration,
                refreshExpiration
            ) =>
                set({
                    user,
                    accessToken,
                    refreshToken,
                    accessTokenExpiration: accessExpiration,
                    refreshTokenExpiration: refreshExpiration,
                    isAuthenticated: true,
                    sessionExpired: false,
                }),
            updateAccessToken: (token, expiration) =>
                set({ accessToken: token, accessTokenExpiration: expiration }),
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
            logout: () => {
                // Clear user's data
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    accessTokenExpiration: null,
                    refreshTokenExpiration: null,
                    isAuthenticated: false,
                    sessionExpired: false,
                });
                // Clear selected assistant
                const { clearSelectedAssistant } = useAssistantStore.getState();
                clearSelectedAssistant();
            },
            setSessionExpired: (value) => set({ sessionExpired: value }),
        }),
        {
            name: "auth-storage",
        }
    )
);
