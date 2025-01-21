export const validateEnv = () => {
  const requiredEnvVars = ['VITE_API_URL']
  
  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }
} 