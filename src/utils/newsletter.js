import { reactive } from 'vue'

export const newsletterState = reactive({
  open: false,
})

export function openNewsletter() { newsletterState.open = true }
export function closeNewsletter() { newsletterState.open = false }
