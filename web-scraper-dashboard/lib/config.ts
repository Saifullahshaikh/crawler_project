// Server-side environment variables (secure, not exposed to client)
export const serverConfig = {
  djangoApiUrl: process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://127.0.0.1:8000/api",
  djangoApiKey: process.env.DJANGO_API_KEY || "",
  pythonApiUrl: process.env.PYTHON_API_URL || "http://localhost:5000",
  pythonApiKey: process.env.PYTHON_API_KEY || "",
  databaseUrl: process.env.DATABASE_URL || "",
  externalApiKey: process.env.EXTERNAL_API_KEY || "",
  externalApiUrl: process.env.EXTERNAL_API_URL || "",
}

// Client-side environment variables (exposed to browser, must start with NEXT_PUBLIC_)
export const clientConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
}

// Combined config for server-side usage
export const config = {
  ...serverConfig,
  ...clientConfig,
}
