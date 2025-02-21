/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENV: "development" | "production";
    readonly VITE_API_PATH: string;
    readonly VITE_DEV_API_URL: string | undefined;
    // Add other env variables here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
