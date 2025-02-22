import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "../stores/authStore";
import { TokenManager } from "./TokenManager";
import { ChatRequest, ChatResponse, StreamResponse } from "../types/chat";
import Logger from "../utils/logger";
import { WebSocketManager } from "./WebSocketManager";

interface LoginResponse {
    messages: string;
    access_token: string;
    access_expiration_time: number;
    refresh_token: string;
    refresh_expiration_time: number;
    token_type: string;
    user: {
        user_id: string;
        user_nickname: string;
    };
}

interface RegisterResponse {
    user_id: string;
    email: string;
    user_nickname: string;
}

interface RegisterRequest {
    email: string;
    user_nickname: string;
    password: string;
}

class APIClientClass {
    private client: AxiosInstance;
    private tokenManager: TokenManager;
    private wsManager: WebSocketManager;
    private maxRefreshAttempts = 3;
    private refreshAttempts = 0;

    constructor() {
        const isProduction = import.meta.env.VITE_ENV === "production";
        const hostname = window.location.hostname;
        const apiPath = import.meta.env.VITE_API_PATH;

        Logger.info(
            `isProduction: ${isProduction}, hostname: ${hostname}, apiPath: ${apiPath}`
        );
        const apiUrl = isProduction
            ? `https://${hostname}${apiPath}`
            : `http://${import.meta.env.VITE_DEV_API_URL}${apiPath}`;

        const wsUrl = isProduction
            ? `wss://${hostname}${apiPath}/chat/stream`
            : `ws://${import.meta.env.VITE_DEV_API_URL}${apiPath}/chat/stream`;

        this.tokenManager = new TokenManager(apiUrl);
        this.wsManager = new WebSocketManager(wsUrl, this.tokenManager);
        this.client = axios.create({
            baseURL: apiUrl,
            withCredentials: true,
            headers: {
                accept: "application/json",
            },
        });

        this.client.interceptors.request.use(async (config) => {
            if (config.url === "/login" || config.url === "/register") {
                return config;
            }

            if (!this.tokenManager.canMakeRequest()) {
                return Promise.reject(new Error("Session expired"));
            }

            try {
                let token = this.tokenManager.getAccessToken();

                if (!token && this.tokenManager.canRefresh()) {
                    token = await this.tokenManager.refreshAccessToken();
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            } catch (error) {
                useAuthStore.getState().logout();
                return Promise.reject(new Error("Authentication required"));
            }
        });

        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                const originalRequest = error.config;

                if (
                    !originalRequest._retry &&
                    this.tokenManager.shouldRefresh(error) &&
                    this.refreshAttempts < this.maxRefreshAttempts
                ) {
                    this.refreshAttempts++;
                    try {
                        const newToken =
                            await this.tokenManager.refreshAccessToken();
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        useAuthStore.getState().logout();
                        throw refreshError;
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    setNavigate(navigate: (path: string) => void) {
        this.tokenManager.setNavigate(navigate);
    }

    async login(credentials: { email: string; password: string }) {
        const formData = new URLSearchParams({
            grant_type: "password",
            username: credentials.email,
            password: credentials.password,
            scope: "",
            client_id: "string",
            client_secret: "string",
        });

        const response = await this.client.post<LoginResponse>(
            "/login",
            formData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    accept: "application/json",
                    Authorization: undefined,
                },
            }
        );

        return {
            user: {
                id: response.data.user.user_id,
                email: credentials.email,
                nickname: response.data.user.user_nickname,
            },
            accessToken: response.data.access_token,
            accessExpiration: response.data.access_expiration_time,
            refreshToken: response.data.refresh_token,
            refreshExpiration: response.data.refresh_expiration_time,
        };
    }

    async logout() {
        try {
            await this.client.post("/logout");
        } catch {
            // Ignore error, proceed with local logout
        }
    }

    async getUserInfo() {
        const response = await this.client.get("/user/my_info", {
            headers: {
                accept: "application/json",
            },
        });
        return response.data;
    }

    async register(data: RegisterRequest) {
        const response = await this.client.post<RegisterResponse>(
            "/register",
            data
        );
        return response.data;
    }

    async getAssistants() {
        const response = await this.client.get("/agent/list");
        return response.data;
    }

    async createAssistant(newAssistant: {
        assistant_name: string;
        llm_provider: string;
    }) {
        const response = await this.client.post("/agent/create", null, {
            params: {
                assistant_name: newAssistant.assistant_name,
                llm_provider: newAssistant.llm_provider,
            },
        });
        return response.data;
    }

    async deleteAssistant(assistant_id: string) {
        const response = await this.client.post("/agent/delete", null, {
            params: { assistant_id },
        });
        return response.data;
    }

    async updateAssistant(data: {
        assistant_id: string;
        assistant_name: string;
        reflections: {
            style_guidelines: string[];
            general_facts: string[];
        };
        user_defined_rules: string[];
    }) {
        try {
            const response = await this.client.post("/agent/update", {
                user_id: useAuthStore.getState().user?.id,
                assistant_id: data.assistant_id,
                assistant_name: data.assistant_name,
                llm_provider: "qwen",
                reflections: data.reflections,
                user_defined_rules: data.user_defined_rules,
            });
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail || "Failed to update assistant";
            throw new Error(errorMessage);
        }
    }

    async chatWithAssistant(requestData: ChatRequest): Promise<ChatResponse> {
        try {
            const response = await this.client.post(
                `/chat/completion`,
                requestData
            );

            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.detail || "Failed to send message";
            throw new Error(errorMessage);
        }
    }

    async streamChatWithAssistant() {}

    async connectWebSocket() {
        try {
            await this.wsManager.connect();
            Logger.info("WebSocket connected successfully");
        } catch (error) {
            Logger.error("Failed to connect WebSocket:", error);
            throw error;
        }
    }

    disconnectWebSocket() {
        this.wsManager.disconnect();
    }

    async sendStreamRequest(request: any) {
        if (!this.wsManager.isConnected()) {
            throw new Error("WebSocket is not connected");
        }
        this.wsManager.sendStreamRequest(request);
    }

    subscribeToStream(handler: (data: any) => void) {
        this.wsManager.subscribeToStream(handler);
    }

    unsubscribeFromStream(handler: (data: any) => void) {
        this.wsManager.unsubscribeFromStream(handler);
    }

    isWebSocketConnected(): boolean {
        return this.wsManager.isConnected();
    }
}

export const APIClient = new APIClientClass();
