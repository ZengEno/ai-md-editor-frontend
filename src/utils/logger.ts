const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
    private static formatMessage(message: string, data?: any): string {
        return data ? `${message}\nData: ${JSON.stringify(data, null, 2)}` : message;
    }

    static debug(message: string, data?: any) {
        if (isDevelopment) {
            console.debug(this.formatMessage(`🔍 [DEBUG] ${message}`, data));
        }
    }

    static info(message: string, data?: any) {
        if (isDevelopment) {
            console.info(this.formatMessage(`ℹ️ [INFO] ${message}`, data));
        }
    }

    static warn(message: string, data?: any) {
        // Always log warnings, but with development details
        const formattedMessage = isDevelopment 
            ? this.formatMessage(`⚠️ [WARN] ${message}`, data)
            : message;
        console.warn(formattedMessage);
    }

    static error(message: string, error?: any) {
        // Always log errors, but with development details
        const formattedMessage = isDevelopment 
            ? this.formatMessage(`❌ [ERROR] ${message}`, error)
            : message;
        console.error(formattedMessage);
    }

    static api(method: string, url: string, data?: any) {
        if (isDevelopment) {
            console.info(`🌐 [API ${method}] ${url}`, data || '');
        }
    }
}

export default Logger; 