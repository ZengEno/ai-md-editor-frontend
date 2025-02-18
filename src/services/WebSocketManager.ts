import { TokenManager } from "./TokenManager";
import Logger from "../utils/logger";

type StreamUpdateHandler = (data: any) => void;

export class WebSocketManager {
    private socket: WebSocket | null = null;
    private tokenManager: TokenManager;
    private wsUrl: string;
    private streamHandlers: Set<StreamUpdateHandler> = new Set();
    private pingInterval: NodeJS.Timeout | null = null;
    private readonly PING_INTERVAL = 30000; // 30 seconds

    constructor(wsUrl: string, tokenManager: TokenManager) {
        this.wsUrl = wsUrl;
        this.tokenManager = tokenManager;
    }

    private startPingInterval() {
        this.stopPingInterval(); // Clear any existing interval first
        
        this.pingInterval = setInterval(() => {
            if (this.isConnected()) {
                const pingMessage = JSON.stringify({ type: "ping" });
                this.socket?.send(pingMessage);
                Logger.debug("Sent ping message");
            } else {
                this.stopPingInterval();
            }
        }, this.PING_INTERVAL);
    }

    private stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.wsUrl);

                this.socket.onopen = () => {
                    Logger.info("WebSocket connected");
                    this.authenticate()
                        .then(() => {
                            this.startPingInterval(); // Start ping interval after successful authentication
                            resolve();
                        })
                        .catch(reject);
                };

                this.socket.onclose = (event) => {
                    Logger.info(
                        `WebSocket disconnected: ${event.reason} (${event.code})`
                    );
                    this.stopPingInterval(); // Stop ping interval on connection close
                };

                this.socket.onerror = (error) => {
                    Logger.error("WebSocket error:", error);
                    this.stopPingInterval(); // Stop ping interval on error
                    reject(error);
                };

                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        Logger.debug("WebSocket message received:", message);
                        
                        if (message.type === "pong") {
                            Logger.debug("Received pong message");
                        } else if (message.type === "stream" || message.type === "stream_end") {
                            this.handleStreamMessage(message);
                        }
                    } catch (error) {
                        Logger.error("Error parsing WebSocket message:", error);
                    }
                };
            } catch (error) {
                Logger.error("Error creating WebSocket connection:", error);
                reject(error);
            }
        });
    }

    private authenticate(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
                reject(new Error("WebSocket is not connected"));
                return;
            }

            const token = this.tokenManager.getAccessToken();
            if (!token) {
                reject(new Error("No access token available"));
                return;
            }

            const authMessage = JSON.stringify({
                type: "auth",
                token: token,
            });

            this.socket.send(authMessage);
            Logger.debug("Sent authentication message");

            // For now, we'll resolve immediately
            // In a production environment, you might want to wait for an auth confirmation message
            resolve();
        });
    }

    disconnect() {
        this.stopPingInterval(); // Stop ping interval before disconnecting
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            // Send quit message before closing
            const quitMessage = JSON.stringify({ type: "quit" });
            this.socket.send(quitMessage);
            Logger.debug("Sent quit message");

            // Close the connection
            this.socket.close();
            this.socket = null;
        } else if (this.socket) {
            // If socket exists but not in OPEN state, just close it
            this.socket.close();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return (
            this.socket !== null && this.socket.readyState === WebSocket.OPEN
        );
    }

    subscribeToStream(handler: StreamUpdateHandler) {
        this.streamHandlers.add(handler);
    }

    unsubscribeFromStream(handler: StreamUpdateHandler) {
        this.streamHandlers.delete(handler);
    }

    sendStreamRequest(request: any) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }

        this.socket.send(JSON.stringify(request));
    }

    private handleStreamMessage(message: any) {
        // Notify all subscribers
        this.streamHandlers.forEach(handler => handler(message));
    }
}
