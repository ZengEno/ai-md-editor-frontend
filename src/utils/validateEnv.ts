export const validateEnv = () => {
    const requiredEnvVars = ["VITE_ENV", "VITE_API_PATH"];

    for (const envVar of requiredEnvVars) {
        if (!import.meta.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    if (import.meta.env.VITE_ENV === "development") {
        if (!import.meta.env.VITE_DEV_API_URL) {
            throw new Error(
                "Missing required environment variable: VITE_DEV_API_URL"
            );
        }
    }
};
