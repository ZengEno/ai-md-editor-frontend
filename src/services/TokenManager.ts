import { useAuthStore } from "../stores/authStore";
import axios, { AxiosInstance } from "axios";

class TokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TokenError";
    }
}

export class TokenManager {
    private refreshPromise: Promise<string> | null = null;
    private pendingRequests: Array<{
        resolve: (token: string) => void;
        reject: (error: any) => void;
    }> = [];
    private client: AxiosInstance;
    private navigate: ((path: string) => void) | null = null;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            headers: {
                accept: "application/json",
            },
        });
    }

    setNavigate(navigate: (path: string) => void) {
        this.navigate = navigate;
    }

    isTokenExpired(tokenExpiration: number | null): boolean {
        if (!tokenExpiration) {
            throw new TokenError("No token expiration time provided");
        }
        const now = Date.now() / 1000;
        return now >= tokenExpiration - 5;
    }

    async refreshAccessToken(): Promise<string> {
        if (this.refreshPromise) {
            return new Promise((resolve, reject) => {
                this.pendingRequests.push({ resolve, reject });
            });
        }

        try {
            if (!this.canRefresh()) {
                throw new TokenError("Cannot refresh: No valid refresh token");
            }

            const refreshToken = useAuthStore.getState().refreshToken;

            this.refreshPromise = this.client
                .get("/refresh", {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`
                    }
                })
                .then(response => {
                    const { access_token, access_expiration_time } = response.data;
                    useAuthStore.getState().updateAccessToken(
                        access_token,
                        access_expiration_time
                    );
                    return access_token;
                });

            const newToken = await this.refreshPromise;

            this.pendingRequests.forEach(request => request.resolve(newToken));

            return newToken;
        } catch (error) {
            this.pendingRequests.forEach(request => request.reject(error));
            throw error;
        } finally {
            this.refreshPromise = null;
            this.pendingRequests = [];
        }
    }

    canRefresh(): boolean {
        const refreshToken = useAuthStore.getState().refreshToken;
        const refreshExpiration =
            useAuthStore.getState().refreshTokenExpiration;
        return !!refreshToken && !this.isTokenExpired(refreshExpiration);
    }

    isRefreshTokenExpired(): boolean {
        const refreshExpiration = useAuthStore.getState().refreshTokenExpiration;
        if (!refreshExpiration) return true;
        try {
            return this.isTokenExpired(refreshExpiration);
        } catch {
            return true;
        }
    }

    handleSessionExpired() {
        useAuthStore.getState().setSessionExpired(true);
    }

    canMakeRequest(): boolean {
        if (this.isRefreshTokenExpired()) {
            this.handleSessionExpired();
            return false;
        }
        return true;
    }

    getAccessToken(): string | null {
        if (!this.canMakeRequest()) {
            return null;
        }

        const { accessToken, accessTokenExpiration } = useAuthStore.getState();
        if (accessToken && !this.isTokenExpired(accessTokenExpiration)) {
            return accessToken;
        }
        return null;
    }

    shouldRefresh(error: any): boolean {
        const is401 = error.response?.status === 401;
        const refreshTokenValid = !this.isTokenExpired(
            useAuthStore.getState().refreshTokenExpiration
        );
        return is401 && refreshTokenValid;
    }
}
