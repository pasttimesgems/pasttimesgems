// Motion for the showroom: gentle fade-ins as sections scroll into view.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' })
  : null;

export function reveal(els) {
  for (const el of els) io ? io.observe(el) : el.classList.add('in');
}
