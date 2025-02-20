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

    // Add reconnection properties
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isReconnecting = false;

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

    private getReconnectDelay(): number {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    }

    private async attemptReconnect() {
        if (
            this.isReconnecting ||
            this.reconnectAttempts >= this.maxReconnectAttempts
        ) {
            return;
        }

        this.isReconnecting = true;
        this.reconnectAttempts++;

        const delay = this.getReconnectDelay();
        Logger.info(
            `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
        );

        this.reconnectTimeout = setTimeout(async () => {
            try {
                await this.connect();
                this.reconnectAttempts = 0;
                this.isReconnecting = false;
                Logger.info("Reconnection successful");
            } catch (error) {
                this.isReconnecting = false;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.attemptReconnect();
                } else {
                    Logger.error("Max reconnection attempts reached");
                }
            }
        }, delay);
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.wsUrl);

                this.socket.onopen = () => {
                    Logger.info("WebSocket connected");
                    this.authenticate()
                        .then(() => {
                            this.startPingInterval();
                            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                            resolve();
                        })
                        .catch(reject);
                };

                this.socket.onclose = (event) => {
                    Logger.info(
                        `WebSocket disconnected: ${event.reason} (${event.code})`
                    );
                    this.stopPingInterval();

                    // Attempt to reconnect if it wasn't a normal closure
                    if (event.code !== 1000 && event.code !== 1001) {
                        this.attemptReconnect();
                    }
                };

                this.socket.onerror = (error) => {
                    Logger.error("WebSocket error:", error);
                    this.stopPingInterval(); // Stop ping interval on error
                    reject(error);
                };

                this.socket.onmessage = (event) => {
                    try {
                        // Check if event.data is empty or not a string
                        if (!event.data || typeof event.data !== "string") {
                            Logger.warn(
                                "Received invalid WebSocket message:",
                                event.data
                            );
                            return;
                        }

                        let message;
                        try {
                            message = JSON.parse(event.data);
                        } catch (parseError) {
                            Logger.error("Failed to parse WebSocket message:", {
                                data: event.data,
                                error:
                                    parseError instanceof Error
                                        ? parseError.message
                                        : String(parseError),
                            });
                            return;
                        }

                        // Check if message is empty object
                        if (!message || typeof message !== "object") {
                            Logger.warn("Invalid message format:", message);
                            return;
                        }

                        Logger.debug("WebSocket message received:", message);

                        if (message.type === "pong") {
                            Logger.debug("Received pong message");
                        } else if (
                            message.type === "stream" ||
                            message.type === "stream_end"
                        ) {
                            this.handleStreamMessage(message);
                        }
                    } catch (error) {
                        Logger.error("Error handling WebSocket message:", {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        });
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
        // Clear reconnection state
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts = 0;
        this.isReconnecting = false;

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
        this.streamHandlers.forEach((handler) => handler(message));
    }
}
