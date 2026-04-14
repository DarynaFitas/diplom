import { reactive, watchEffect } from 'vue'
import { GA4_MEASUREMENT_ID } from '../config'

const STORAGE_KEY = 'ga_consent'

function readInitial() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export const consentState = reactive({
  status: readInitial(), // '', 'granted', 'denied'
})

watchEffect(() => {
  if (consentState.status === 'granted' && GA4_MEASUREMENT_ID && typeof window !== 'undefined') {
    window.__loadGa4 && window.__loadGa4(GA4_MEASUREMENT_ID)
  }
})

export function grantConsent() {
  consentState.status = 'granted'
  try { localStorage.setItem(STORAGE_KEY, 'granted') } catch { /* ignore */ }
}

export function declineConsent() {
  consentState.status = 'denied'
  try { localStorage.setItem(STORAGE_KEY, 'denied') } catch { /* ignore */ }
}
