let observer = null

function getObserver() {
  if (observer || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return observer
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  )
  return observer
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const vReveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value && typeof binding.value.delay === 'number') {
      el.style.transitionDelay = `${binding.value.delay}ms`
    }
    if (prefersReducedMotion()) {
      el.classList.add('is-visible')
      return
    }
    const io = getObserver()
    if (io) io.observe(el)
    else el.classList.add('is-visible')
  },
  unmounted(el) {
    if (observer) observer.unobserve(el)
  },
}
