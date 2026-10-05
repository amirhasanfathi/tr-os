/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API, e.g. http://localhost:4000 */
  readonly VITE_API_URL?: string
  /** Which data source the frontend services use. Defaults to "mock". */
  readonly VITE_DATA_SOURCE?: 'mock' | 'http'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
