// Motion for the showroom: sections slide in as they scroll into view, and the hero has a light parallax.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' })
  : null;

export function reveal(els) {
  for (const el of els) io ? io.observe(el) : el.classList.add('in');
}

// Hero parallax: layers marked data-speed drift at their own pace and the
// hero copy eases out as the page scrolls past it.
export function parallax(hero) {
  if (!hero || reducedMotion) return;
  const layers = [...hero.querySelectorAll('[data-speed]')];
  const inner = hero.querySelector('.hero-inner');
  let queued = false;
  const paint = () => {
    queued = false;
    const y = scrollY, h = hero.offsetHeight;
    if (y > h * 1.2) return;
    for (const el of layers) el.style.transform = `translate3d(0, ${(y * el.dataset.speed).toFixed(1)}px, 0)`;
    if (inner) {
      const p = Math.min(y / h, 1);
      inner.style.transform = `translate3d(0, ${(y * .28).toFixed(1)}px, 0)`;
      inner.style.opacity = (1 - p * 1.25).toFixed(3);
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();
}
