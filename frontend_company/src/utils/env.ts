// Environment variables utility
export const env = {
  VITE_API_URL: (import.meta.env as any).VITE_API_URL || 'http://localhost:8000',
  VITE_GOOGLE_MAPS_API_KEY: (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBxyMs4arEP8ocKAbWID8sRutKk6rrSJOA',
  MAILCATCHER_HOST: (import.meta.env as any).MAILCATCHER_HOST || 'http://localhost:1080'
}
