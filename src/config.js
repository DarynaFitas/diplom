export const API_BASE_URL =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3001/api'

// Real GA4 Measurement ID comes from the environment; empty by default so
// no measurement fires until consent is granted and a valid ID is configured.
export const GA4_MEASUREMENT_ID =
  (import.meta && import.meta.env && import.meta.env.VITE_GA4_MEASUREMENT_ID) || ''
