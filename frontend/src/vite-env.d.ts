/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly MAILCATCHER_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
