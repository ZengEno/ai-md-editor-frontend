
export const validateEnv = () => {
    if (!import.meta.env.VITE_ENV) {
        throw new Error("Missing required environment variable: VITE_ENV");
    }

    if (
        import.meta.env.VITE_API_PATH === undefined ||
        import.meta.env.VITE_API_PATH === null
    ) {
        throw new Error("Missing required environment variable: VITE_API_PATH");
    }

    if (import.meta.env.VITE_ENV === "development") {
        if (!import.meta.env.VITE_DEV_API_URL) {
            throw new Error(
                "Missing required environment variable: VITE_DEV_API_URL"
            );
        }
    }
};
